import { NextResponse } from "next/server";
import { priceCart } from "@/lib/admin/store";
import { parseCartLines, parseLang } from "@/lib/cartLines";
import { formatCents } from "@/lib/money";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sipariş oluşturma.
 *
 * Tutar istemciden **alınmaz**: gövdedeki satır tarifleri yeniden fiyatlanır ve
 * siparişin tutarı bu hesaptan doğar. İstemci bir "total" gönderse bile yok
 * sayılır. Bu yüzden istek gövdesini kurcalayarak ucuza sipariş vermek mümkün
 * değildir.
 *
 * NOT: Projede henüz kalıcı sipariş deposu veya bildirim (e-posta/POS) yok.
 * Sipariş numarası üretilir ve tutar doğrulanır; siparişin işletmeye iletilmesi
 * için bir entegrasyon eklenmelidir.
 */

type Customer = { name: string; phone: string; address: string; note: string };

function parseCustomer(input: Record<string, unknown>): Customer | { error: string } {
  const text = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : "";

  const name = text(input.name, 80);
  const phone = text(input.phone, 24);
  const address = text(input.address, 200);
  const note = text(input.note, 200);

  if (name.length < 2) return { error: "name" };
  if (!/^[0-9\s()+-]{8,17}$/.test(phone)) return { error: "phone" };
  if (address.length < 6) return { error: "address" };

  return { name, phone, address, note };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const lang = parseLang(input.lang);
  const lines = parseCartLines(input.lines);

  if (lines.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const customer = parseCustomer(
    (input.customer ?? {}) as Record<string, unknown>
  );
  if ("error" in customer) {
    return NextResponse.json({ error: "invalid_customer", field: customer.error }, { status: 400 });
  }

  // Tek doğruluk kaynağı: tutar burada, katalogtaki güncel fiyatlarla hesaplanır.
  const quote = await priceCart(lines, lang);

  const unavailable = quote.lines.filter((l) => l.unavailable);
  if (unavailable.length > 0) {
    return NextResponse.json(
      { error: "unavailable_items", items: unavailable.map((l) => l.label) },
      { status: 409 }
    );
  }
  if (quote.totalCents <= 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const orderNo = `SD-${String(Date.now()).slice(-6)}`;

  console.info(
    `[order] ${orderNo} — ${quote.lines.length} satır, toplam ${formatCents(quote.totalCents)}`
  );

  return NextResponse.json({
    orderNo,
    totalCents: quote.totalCents,
    subtotalCents: quote.subtotalCents,
    serviceFeeCents: quote.serviceFeeCents,
  });
}
