import { NextResponse } from "next/server";
import { requireAdmin, badRequest } from "@/lib/admin/guard";
import { createProduct, getCatalog } from "@/lib/admin/store";
import { parseProductBody } from "@/lib/admin/validate";
import { slugify } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const catalog = await getCatalog();
  return NextResponse.json(catalog);
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Geçersiz istek gövdesi.");
  }

  const { categories } = await getCatalog();
  const parsed = parseProductBody(body, categories.map((c) => c.id), false);
  if (!parsed.ok) return badRequest(parsed.error);

  const value = parsed.value as Required<
    Pick<typeof parsed.value, "name" | "description" | "categoryId" | "price">
  > &
    typeof parsed.value;

  const product = await createProduct({
    id: `${value.categoryId}--${slugify(value.name) || "urun"}`,
    name: value.name,
    description: value.description ?? "",
    categoryId: value.categoryId,
    price: value.price,
    discountPrice: value.discountPrice ?? null,
    image: value.image ?? null,
    active: value.active ?? true,
    inStock: value.inStock ?? true,
    variants: value.variants ?? [],
  });

  return NextResponse.json(product, { status: 201 });
}
