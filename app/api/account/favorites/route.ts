import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomer } from "@/lib/account/guard";
import {
  MAX_FAVORITES,
  addFavorite,
  listFavoriteProductIds,
  removeFavorite,
} from "@/lib/account/favorites";
import { withDatabase } from "@/lib/security/dbGuard";

/**
 * Favori ürünler.
 *
 * GET, menüdeki kalp düğmelerinin hangi ürünlerde dolu görüneceğini söyler ve
 * oturum yoksa **401 döner** — bu bir hata değil, misafir hâlidir; arayüz o
 * durumda düğmeyi hiç göstermez.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ productId: z.string().trim().min(1).max(120) });

export async function GET() {
  return withDatabase(async () => {
    const customer = await requireCustomer();
    if (customer instanceof NextResponse) return customer;

    return NextResponse.json({
      productIds: await listFavoriteProductIds(customer.id),
      max: MAX_FAVORITES,
    });
  });
}

export async function POST(request: Request) {
  return withDatabase(async () => {
    const customer = await requireCustomer();
    if (customer instanceof NextResponse) return customer;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
    }

    const result = await addFavorite(customer.id, parsed.data.productId);
    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.reason === "limit_reached"
              ? `Sie können höchstens ${MAX_FAVORITES} Favoriten speichern.`
              : "Artikel nicht gefunden.",
        },
        { status: result.reason === "limit_reached" ? 409 : 404 }
      );
    }

    return NextResponse.json({ ok: true, favorite: true });
  });
}

export async function DELETE(request: Request) {
  return withDatabase(async () => {
    const customer = await requireCustomer();
    if (customer instanceof NextResponse) return customer;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
    }

    await removeFavorite(customer.id, parsed.data.productId);
    return NextResponse.json({ ok: true, favorite: false });
  });
}
