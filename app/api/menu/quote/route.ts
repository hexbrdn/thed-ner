import { NextResponse } from "next/server";
import { priceCart } from "@/lib/admin/store";
import { parseCartLines, parseLang } from "@/lib/cartLines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sepetin fiyat teklifi.
 *
 * İstemci yalnızca "ne seçtim" der; tutarlar burada, katalogtaki güncel
 * fiyatlardan hesaplanır. Sepet çekmecesi de ödeme adımı da bu yanıtı gösterir,
 * dolayısıyla ekrandaki tutar ile siparişe yazılan tutar aynı kaynaktan gelir.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const quote = await priceCart(parseCartLines(input.lines), parseLang(input.lang));
  return NextResponse.json(quote);
}
