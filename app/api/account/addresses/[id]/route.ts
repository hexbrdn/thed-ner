import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCustomer } from "@/lib/account/guard";
import {
  addressSchema,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/account/addresses";
import { withDatabase } from "@/lib/security/dbGuard";

/**
 * Tek bir adres: güncelleme, varsayılan yapma, silme.
 *
 * Kimlik adreste (URL) durur ama **yetki oturumdan** gelir: veri katmanındaki
 * her sorgu `customerId` ile eşleşir, dolayısıyla başkasının adres kimliği
 * gönderildiğinde "bulunamadı" alınır — var olup olmadığı da sızmaz.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: { id: string } };

/** Ya adresin tamamı güncellenir ya da yalnızca "bunu varsayılan yap" denir. */
const bodySchema = z.union([
  z.object({ action: z.literal("default") }),
  addressSchema,
]);

export async function PATCH(request: Request, { params }: Params) {
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
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? "Ungültige Eingabe.", field: issue?.path.join(".") },
        { status: 400 }
      );
    }

    if ("action" in parsed.data) {
      const done = await setDefaultAddress(customer.id, params.id);
      if (!done) return NextResponse.json({ error: "Adresse nicht gefunden." }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    const result = await updateAddress(customer.id, params.id, parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: "Adresse nicht gefunden." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, address: result.address });
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return withDatabase(async () => {
    const customer = await requireCustomer();
    if (customer instanceof NextResponse) return customer;

    const removed = await deleteAddress(customer.id, params.id);
    if (!removed) return NextResponse.json({ error: "Adresse nicht gefunden." }, { status: 404 });
    return NextResponse.json({ ok: true });
  });
}
