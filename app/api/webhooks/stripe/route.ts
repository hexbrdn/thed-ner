import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { WebhookSignatureError, type PaymentEvent } from "@/lib/payments/provider";
import { paymentProvider } from "@/lib/payments/stripe";
import { transitionOrder } from "@/lib/orders/repository";
import { settleOrderPayment } from "@/lib/orders/settle";

/**
 * Stripe webhook'u — ödemenin birincil kaynağı.
 *
 * Müşterinin tarayıcısının başarı sayfasına dönmesi bir ödeme kanıtı değildir:
 * tarayıcı kapanabilir, ağ kopabilir, adres elle yazılabilir. Sipariş bu yüzden
 * istemcinin sözüyle değil, ya burada imzası doğrulanmış bir olayla ya da
 * doğrudan Stripe'a sorularak (bkz. `lib/orders/reconcile.ts`) PAID'e geçer.
 *
 * Mutabakat yolu webhook'un yerini almaz, güvenlik ağıdır: webhook müşteri
 * sayfaya hiç dönmese de çalışır, mutabakat ise webhook hiç gelmediğinde
 * (yerel geliştirme, yanlış yapılandırılmış uç, kaybolan olay) devreye girer.
 *
 * Üç şey kritik:
 *  1. **Ham gövde.** İmza, baytların birebir kendisi üzerinden hesaplanır;
 *     `request.json()` ile ayrıştırılıp yeniden serileştirilmiş bir gövdenin
 *     imzası tutmaz. Bu yüzden `request.text()` kullanılır.
 *  2. **İdempotency.** Stripe aynı olayı 72 saate kadar yeniden gönderir.
 *     `WebhookEvent` üzerindeki UNIQUE kısıt, ikinci işlemeyi veritabanı
 *     seviyesinde imkânsız kılar — uygulama içi bir kontrolün yarışması mümkün
 *     değildir.
 *  3. **Doğru HTTP kodu.** İşleyemediğimiz bir olayda 500 dönmek gerekir ki
 *     Stripe tekrar denesin; başarıyla işlenen veya bizi ilgilendirmeyen
 *     olaylarda 200 dönmek gerekir ki boşuna tekrar gönderilmesin.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = await paymentProvider.parseWebhook(rawBody, signature);
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      // İmzası geçersiz istek Stripe'tan gelmiş olamaz; tekrar denenmesini
      // istemeyiz, bu yüzden 400.
      console.warn("[webhook] imza doğrulanamadı");
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }
    // Eksik yapılandırma (STRIPE_WEBHOOK_SECRET yok) — bizim hatamız, tekrar
    // denenmesi işe yarar.
    console.error("[webhook] işlenemedi", error);
    return NextResponse.json({ error: "webhook_error" }, { status: 500 });
  }

  if (event.kind === "ignored") {
    return NextResponse.json({ received: true, ignored: event.eventType });
  }

  // Olayı "sahiplen": satır oluşturulabildiyse bu olayı ilk kez işliyoruz.
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: paymentProvider.name,
        providerEventId: event.eventId,
        type: event.eventType,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Aynı olay daha önce işlendi. Bu bir hata değil, beklenen durum.
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  try {
    await handle(event);
  } catch (error) {
    // İşleme düştü: sahiplenme kaydını geri al ki Stripe tekrar gönderdiğinde
    // olay yeniden işlenebilsin. Aksi hâlde ödeme alınmış ama siparişi PAID'e
    // taşınmamış bir kayıt kalıcı olarak öksüz kalırdı.
    await prisma.webhookEvent
      .delete({
        where: {
          provider_providerEventId: {
            provider: paymentProvider.name,
            providerEventId: event.eventId,
          },
        },
      })
      .catch(() => undefined);

    console.error(`[webhook] ${event.eventType} işlenemedi`, error);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }

  await prisma.webhookEvent.update({
    where: {
      provider_providerEventId: {
        provider: paymentProvider.name,
        providerEventId: event.eventId,
      },
    },
    data: { processedAt: new Date() },
  });

  return NextResponse.json({ received: true });
}

/** Bizi ilgilendiren olaylar; "ignored" yukarıda ayıklanır. */
type Handled = Exclude<PaymentEvent, { kind: "ignored" }>;

async function handle(event: Handled): Promise<void> {
  switch (event.kind) {
    case "payment_succeeded": {
      // Siparişi kapatan yol, müşteri ödeme sayfasından döndüğünde çalışan
      // mutabakatla ortaktır; bildirimler ve idempotency orada çözülür.
      await settleOrderPayment({
        orderNo: event.orderNo,
        provider: paymentProvider.name,
        providerRef: event.providerRef,
        amountCents: event.amountCents,
        method: event.method,
        email: event.email ?? undefined,
        raw: event.raw as Prisma.InputJsonValue,
        source: "webhook",
      });
      return;
    }

    case "session_expired": {
      if (!event.orderNo) return;
      const order = await prisma.order.findUnique({
        where: { orderNo: event.orderNo },
        select: { id: true, status: true },
      });
      // Yalnızca hâlâ ödeme bekleyen sipariş kapatılır: müşteri araya başka
      // bir oturumla ödeme yaptıysa siparişi düşürmeyiz.
      if (order?.status === "PENDING_PAYMENT") {
        await transitionOrder(order.id, "EXPIRED", "stripe");
      }
      return;
    }

    case "payment_failed": {
      // Sipariş PENDING_PAYMENT'ta bırakılır: müşteri yeniden deneyebilir,
      // denemezse süresi dolunca kendiliğinden kapanır.
      console.warn(`[webhook] ödeme başarısız — sipariş ${event.orderNo ?? "bilinmiyor"}`);
      return;
    }
  }
}
