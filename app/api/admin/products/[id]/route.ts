import { NextResponse } from "next/server";
import { requireAdmin, badRequest, notFound } from "@/lib/admin/guard";
import { deleteProduct, getCatalog, updateProduct } from "@/lib/admin/store";
import { parseProductBody } from "@/lib/admin/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Geçersiz istek gövdesi.");
  }

  const catalog = await getCatalog();
  const existing = catalog.products.find((p) => p.id === params.id);
  if (!existing) return notFound("Ürün bulunamadı.");

  const parsed = parseProductBody(body, catalog.categories.map((c) => c.id), true);
  if (!parsed.ok) return badRequest(parsed.error);

  // Kısmi güncellemede indirim/fiyat çaprazını mevcut değerlerle birlikte kontrol et.
  const nextPrice = parsed.value.price ?? existing.price;
  const nextDiscount =
    parsed.value.discountPrice !== undefined ? parsed.value.discountPrice : existing.discountPrice;
  if (nextDiscount !== null && nextDiscount >= nextPrice) {
    return badRequest("İndirimli fiyat, normal fiyattan düşük olmalı.");
  }

  const updated = await updateProduct(params.id, parsed.value);
  if (!updated) return notFound("Ürün bulunamadı.");
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const removed = await deleteProduct(params.id);
  if (!removed) return notFound("Ürün bulunamadı.");
  return NextResponse.json({ ok: true });
}
