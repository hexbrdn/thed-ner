import { NextResponse } from "next/server";
import { notFound, requireAdmin, storeWrite } from "@/lib/admin/guard";
import { deleteClosure } from "@/lib/orders/business";

/**
 * Tatil gününü kaldırır.
 *
 * Ekleme ve güncelleme `PATCH /api/admin/business` içindeki "closure"
 * bölümünde; silme kaynağın kendi adresinde durur çünkü hedefi gövde değil
 * kimlik belirler.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await storeWrite(() => deleteClosure(params.id));
  if (result instanceof NextResponse) return result;
  if (!result) return notFound("Kapalı gün bulunamadı.");

  return NextResponse.json({ ok: true });
}
