import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/account/guard";
import {
  MAX_ADDRESSES,
  addressSchema,
  createAddress,
  listAddresses,
} from "@/lib/account/addresses";
import { withDatabase } from "@/lib/security/dbGuard";

/**
 * Adres defteri: listeleme ve ekleme.
 *
 * Hangi hesabın adresleri olduğu **oturumdan** gelir; istekte `customerId`
 * diye bir alan yoktur ve olmayacaktır. Profil ucundaki kuralın aynısı: kimlik
 * parametresi kabul eden bir uç, o parametreyi değiştiren herkese başkasının
 * adres defterini açar.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withDatabase(async () => {
    const customer = await requireCustomer();
    if (customer instanceof NextResponse) return customer;

    return NextResponse.json({
      addresses: await listAddresses(customer.id),
      max: MAX_ADDRESSES,
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

    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? "Ungültige Eingabe.", field: issue?.path.join(".") },
        { status: 400 }
      );
    }

    const result = await createAddress(customer.id, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: `Sie können höchstens ${MAX_ADDRESSES} Adressen speichern. Bitte löschen Sie zuerst eine.`,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, address: result.address }, { status: 201 });
  });
}
