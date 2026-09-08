import { NextResponse } from "next/server";
import { withDatabase } from "@/lib/security/dbGuard";
import { reconcileOrderPayment } from "@/lib/orders/reconcile";
import { verifyOrderToken } from "@/lib/orders/token";

/**
 * Takip sayfasının ödeme mutabakatı ucu.
 *
 * Müşteri Stripe'tan döndüğünde sayfa burayı çağırır; biz de siparişin ödeme
 * oturumunu **Stripe'a sorarak** durumu netleştiririz. Webhook gecikmiş,
 * kaybolmuş veya (yerelde olduğu gibi) hiç ulaşamıyor olsa bile sipariş
 * böylece PAID'e geçer ve panele düşer.
 *
 * Yetki, takip jetonunun imzasıdır: jetonu üretmek için sunucudaki gizli
 * anahtar gerekir, dolayısıyla sipariş numarasını bilen biri başkasının
 * siparişini yoklayamaz. İstemciden gelen hiçbir tutar veya durum bilgisi
 * kullanılmaz — yalnızca "şu siparişi kontrol et" denir.
 *
 * Jeton gövdede taşınır, adreste değil: takip bağlantısı kişisel veriye açılan
 * kapıdır, sunucu ve ara sunucu erişim günlüklerine düşmesin.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let token: unknown;
  try {
    token = (await request.json())?.token;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const orderNo = await verifyOrderToken(typeof token === "string" ? token : undefined);
  // Geçersiz imza ile var olmayan sipariş aynı cevabı alır; farkı söylemek
  // bilgi sızdırır.
  if (!orderNo) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return withDatabase(async () => {
    const status = await reconcileOrderPayment(orderNo);
    if (!status) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ status });
  });
}
