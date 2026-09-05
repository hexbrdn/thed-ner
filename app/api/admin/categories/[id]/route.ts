import { NextResponse } from "next/server";
import { requireAdmin, badRequest, notFound, storeWrite } from "@/lib/admin/guard";
import { deleteCategory, updateCategory } from "@/lib/admin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let name = "";
  try {
    const body = (await request.json()) as { name?: unknown };
    if (typeof body.name === "string") name = body.name.trim();
  } catch {
    return badRequest("Geçersiz istek gövdesi.");
  }

  if (!name) return badRequest("Kategori adı boş olamaz.");
  if (name.length > 80) return badRequest("Kategori adı en fazla 80 karakter olabilir.");

  const updated = await storeWrite(() => updateCategory(params.id, { name }));
  if (updated instanceof NextResponse) return updated;
  if (!updated) return notFound("Kategori bulunamadı.");
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const result = await storeWrite(() => deleteCategory(params.id));
  if (result instanceof NextResponse) return result;
  if (result.ok) return NextResponse.json({ ok: true });
  if (result.reason === "not_found") return notFound("Kategori bulunamadı.");
  return badRequest(
    `Bu kategoride ${result.count} ürün var. Önce ürünleri başka kategoriye taşıyın veya silin.`
  );
}
