import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { paymentProvider } from "@/lib/payments/stripe";
import { settleOrderPayment } from "./settle";

/**
 * Ödeme mutabakatı — webhook'un güvenlik ağı.
 *
 * Webhook tek doğruluk kaynağıdır ama **tek yol olamaz**: yerel geliştirmede
 * Stripe localhost'a ulaşamaz, canlıda uç yanlış yapılandırılmış olabilir,
 * olay gecikebilir veya sunucu o an cevap veremeyebilir. Bu durumların hepsinde
 * müşteri parayı ödemiş olur ama sipariş PENDING_PAYMENT'ta kalır: takip
 * sayfası "ödeme bekleniyor" der ve sipariş panele hiç düşmez.
 *
 * Burada gerçeği **sorarak** öğreniriz: siparişin ödeme oturumu Stripe'ta
 * gerçekten ödenmiş mi? Ödenmişse sipariş, webhook'un kullandığı yolun
 * aynısından (`settleOrderPayment`) kapatılır. Bu bir "ödeme kabul etme" değil,
 * sağlayıcıdan okuma işlemidir; istemcinin söylediği hiçbir şeye güvenilmez.
 *
 * Dönen değer siparişin **mutabakat sonrası** durumudur; sipariş yoksa null.
 */
export async function reconcileOrderPayment(orderNo: string): Promise<OrderStatus | null> {
  const order = await prisma.order.findUnique({
    where: { orderNo },
    select: {
      id: true,
      status: true,
      payments: {
        where: { provider: paymentProvider.name },
        // En yeni oturum önce denenir: müşteri ödemeyi ikinci bir oturumda
        // tamamlamış olabilir.
        orderBy: { createdAt: "desc" },
        select: { providerRef: true },
        take: 3,
      },
    },
  });

  if (!order) return null;
  if (order.status !== "PENDING_PAYMENT") return order.status;

  for (const payment of order.payments) {
    let snapshot;
    try {
      snapshot = await paymentProvider.fetchPayment(payment.providerRef);
    } catch (error) {
      // Sağlayıcıya ulaşılamadı: sipariş beklemede kalır, webhook veya bir
      // sonraki yoklama işi bitirir. Müşteriye hata göstermeyiz.
      console.error(`[sync] ${orderNo} — ödeme durumu okunamadı`, error);
      continue;
    }

    if (!snapshot?.paid) continue;

    const { order: settled } = await settleOrderPayment({
      orderNo,
      provider: paymentProvider.name,
      providerRef: payment.providerRef,
      amountCents: snapshot.amountCents,
      method: snapshot.method,
      email: snapshot.email ?? undefined,
      raw: snapshot.raw as Prisma.InputJsonValue,
      source: `${paymentProvider.name}:sync`,
    });
    return settled.status;
  }

  return order.status;
}

/**
 * Süresi dolmak üzere olan ödenmemiş siparişleri kapatmadan önce son bir kez
 * sağlayıcıya sorar.
 *
 * Bakım görevi bu siparişleri EXPIRED'a taşır. Ödemesi alınmış ama webhook'u
 * ulaşmamış bir sipariş bu şekilde kapatılırsa ortada karşılığı gösterilmeyen
 * bir tahsilat kalır — müşteri parayı ödemiştir, yemeği gelmez. Bu yüzden
 * kapatmadan önce gerçek durum okunur.
 *
 * Dönen değer, mutabakat sonucu ödenmiş olduğu anlaşılan sipariş sayısıdır.
 */
export async function reconcileStalePendingOrders(now: Date = new Date()): Promise<number> {
  const stale = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", expiresAt: { lt: now } },
    select: { orderNo: true },
    take: 100,
  });

  let settled = 0;
  for (const { orderNo } of stale) {
    try {
      if ((await reconcileOrderPayment(orderNo)) === "PAID") settled++;
    } catch (error) {
      // Tek bir siparişin arızası süpürmeyi durdurmasın.
      console.error(`[sync] ${orderNo} mutabakatı başarısız`, error);
    }
  }
  return settled;
}
