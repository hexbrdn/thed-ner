import { NextResponse } from "next/server";
import { parseCartLines, parseLang } from "@/lib/cartLines";
import { buildCheckoutQuote } from "@/lib/orders/checkout";
import { withDatabase } from "@/lib/security/dbGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sepetin fiyat teklifi.
 *
 * İstemci yalnızca "ne seçtim, nereye, nasıl" der; **tüm tutarlar burada**
 * hesaplanır. Yanıt teslimat ücretini ve genel toplamı da içerir, dolayısıyla
 * sepet çekmecesinde toplanacak bir şey kalmaz — istemcide para aritmetiği
 * yoktur.
 *
 * Sipariş oluşturma ucu (`createOrderAction`) da aynı `buildCheckoutQuote`
 * fonksiyonunu çağırır; ekrandaki tutarla tahsil edilen tutar tek kaynaktan
 * gelir.
 *
 * Sipariş kabul edilemez durumdaysa (kapalıyız, bölge dışı, sepet eşiği) uç
 * yine 200 döner ve sebebi `rejection` alanında taşır: müşteri hem tutarları
 * hem engeli aynı anda görür.
 *
 * `withDatabase`: sepet her değişiklikte bu ucu çağırır ve yanıtı JSON olarak
 * ayrıştırır. Havuzlanmış bağlantı anlık düştüğünde sarmalayıcı olmadan Next
 * HTML hata sayfası döndürür ve sepet "Unexpected token '<'" ile kırılırdı.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;

  // Teslim biçimi tanınmayan bir değerse teslimata düşülür: varsayılanın
  // gel-al olması, teslimat ücretini sessizce sıfırlardı.
  const fulfillment = input.fulfillment === "PICKUP" ? "PICKUP" : "DELIVERY";

  // Posta kodu yalnızca beş haneli hâliyle anlamlı; yarım yazılmış bir kod
  // bölge sorgusuna hiç gitmez.
  const rawZip = typeof input.zip === "string" ? input.zip.trim() : "";
  const zip = /^\d{5}$/.test(rawZip) ? rawZip : undefined;

  return withDatabase(async () => {
    const quote = await buildCheckoutQuote({
      lines: parseCartLines(input.lines),
      lang: parseLang(input.lang),
      fulfillment,
      zip,
    });

    return NextResponse.json(quote);
  });
}
