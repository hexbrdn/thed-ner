import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { ACTIVE_STATUSES } from "@/lib/orders/status";

/**
 * Panelin sipariş akışı.
 *
 * Panel bu ucu birkaç saniyede bir yoklar. Uzun ömürlü bağlantı (SSE/WebSocket)
 * yerine yoklama seçildi: her barındırma ortamında dertsiz çalışır, ara sunucu
 * zaman aşımlarından etkilenmez ve sessizce ölmez. Bir siparişin kaçırılması,
 * birkaç saniyelik gecikmeden çok daha pahalıdır.
 *
 * Ödenmemiş (PENDING_PAYMENT) siparişler listeye **girmez**: müşteri henüz
 * ödemedi, mutfak boşuna hazırlık yapmasın.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Kapanmış siparişlerin panelde ne kadar geriye kadar görüneceği. */
const HISTORY_HOURS = 24;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const since = new Date(Date.now() - HISTORY_HOURS * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        // Akıştaki siparişler her zaman görünür, ne kadar eski olursa olsun.
        { status: { in: [...ACTIVE_STATUSES] } },
        // Kapanmışlar yalnızca son 24 saat — vardiya sonu kontrolü için.
        { status: { in: ["DELIVERED", "PICKED_UP", "CANCELLED", "REJECTED"] }, createdAt: { gte: since } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { lines: { orderBy: { id: "asc" } } },
    take: 100,
  });

  return NextResponse.json({
    // Sunucu saati: panel "12 dakika önce" gibi göreli süreleri buna göre
    // hesaplar, istemcinin saati yanlış ayarlıysa yanıltmasın.
    now: new Date().toISOString(),
    orders: orders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      status: order.status,
      fulfillment: order.fulfillment,
      customerName: order.customerName,
      phone: order.phone,
      street: order.street,
      houseNo: order.houseNo,
      // Kat ve zil ismi kuryenin kapıyı bulmasını sağlar; panelde ve fişte
      // görünmezse toplandıkları anlamsız kalır.
      floor: order.floor,
      bellName: order.bellName,
      zip: order.zip,
      city: order.city,
      note: order.note,
      totalCents: order.totalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      serviceFeeCents: order.serviceFeeCents,
      subtotalCents: order.subtotalCents,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      email: order.email,
      lang: order.lang,
      createdAt: order.createdAt.toISOString(),
      acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
      // İptal sebebi panelde de görünür: müşteri arayıp "neden iptal oldu?"
      // dediğinde cevabın kayıtta durması yetmez, ekranda olması gerekir.
      cancelReason: order.cancelReason,
      requestedAt: order.requestedAt?.toISOString() ?? null,
      // Müşteriye söz verilen teslim saati. Mutfak geciktiğinde bunu panelden
      // öteler; müşteri takip sayfasında aynı saati görür.
      promisedAt: order.promisedAt?.toISOString() ?? null,
      /**
       * Sipariş anında dondurulmuş KDV dökümü.
       *
       * Fiş bunu yeniden hesaplamaz, olduğu gibi basar: § 33 UStDV uyarınca
       * 250 €'ya kadar olan belgede brüt tutar ve KDV oranı bulunmak zorunda,
       * ve o tutar siparişin kesildiği andaki tutardır — bugünkü fiyatlarla
       * yeniden hesaplanmış bir değer değil.
       */
      vatBreakdown: order.vatBreakdown,
      lines: order.lines.map((line) => ({
        id: line.id,
        label: line.label,
        detail: line.detail,
        qty: line.qty,
        unitCents: line.unitCents,
        lineCents: line.lineCents,
        vatRate: line.vatRate,
      })),
    })),
  });
}
