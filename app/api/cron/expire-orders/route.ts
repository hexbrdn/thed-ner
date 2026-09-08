import { NextResponse } from "next/server";
import { expireStaleOrders } from "@/lib/orders/repository";
import { reconcileStalePendingOrders } from "@/lib/orders/reconcile";

/**
 * Ödenmeden bekleyen siparişleri kapatan bakım görevi.
 *
 * `expireStaleOrders` yazıldı ama hiçbir yerden çağrılmıyordu; sonuç olarak
 * müşteri Stripe sayfasını kapatıp geri dönmediğinde sipariş sonsuza kadar
 * "ödeme bekleniyor" durumunda kalıyordu. Bunun iki bedeli var: panelde çöp
 * birikiyor ve sipariş numarası tüketilmiş oluyor.
 *
 * Neden ayrı bir uç: bu işin bir isteğin içine iliştirilmesi (ör. sipariş
 * oluştururken yan etki olarak) yanlış olurdu — müşterinin isteği, ilgisiz bir
 * temizlik işi yüzünden yavaşlamamalı ve o iş başarısız olursa sipariş
 * düşmemeli.
 *
 * Koruma **zorunludur**: `CRON_SECRET` tanımlı değilse uç hiç çalışmaz. Açık
 * bırakılan bir yönetim ucu, herkesin sipariş kapatabildiği bir düğmedir.
 *
 * Zamanlama `vercel.json` dosyasında tanımlıdır (15 dakikada bir). Vercel
 * isteğe `Authorization: Bearer $CRON_SECRET` başlığını kendisi ekler; aynı
 * başlıkla elle de çağrılabilir:
 *   curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/expire-orders
 *
 * Aralık, ödeme penceresinden (31 dk) belirgin biçimde kısa olmalı: aksi hâlde
 * süresi dolan bir sipariş bir sonraki taramaya kadar panelde asılı kalır.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";

  // Sabit zamanlı karşılaştırma: uzunluk ve içerik farkı zamanlamadan okunmasın.
  if (provided.length !== secret.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ secret.charCodeAt(i);
  return diff === 0;
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET tanımlı değil; bu uç korumasız çalışmaz." },
      { status: 503 }
    );
  }

  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Önce mutabakat: ödemesi alınmış ama webhook'u ulaşmamış bir siparişi
  // EXPIRED'a taşımak, karşılığı teslim edilmeyen bir tahsilat bırakırdı.
  const settled = await reconcileStalePendingOrders();
  const expired = await expireStaleOrders();
  return NextResponse.json({ ok: true, settled, expired });
}
