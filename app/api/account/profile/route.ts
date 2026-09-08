import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/account/guard";
import { toPublicCustomer, updateCustomerProfile } from "@/lib/account/repository";
import { profileSchema } from "@/lib/account/schema";
import { withDatabase } from "@/lib/security/dbGuard";

/**
 * Profil okuma ve güncelleme.
 *
 * Hangi hesabın okunacağı **istek gövdesinden gelmez**, oturumdan gelir. Bir
 * `customerId` parametresi kabul etseydik, onu değiştiren herkes başkasının
 * profilini okur ve değiştirirdi (IDOR). Bu yüzden bu uçta kimlik parametresi
 * hiç yoktur.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withDatabase(async () => {
    const customer = await requireCustomer();
    if (customer instanceof NextResponse) return customer;

    return NextResponse.json({ customer: toPublicCustomer(customer) });
  });
}

export async function PATCH(request: Request) {
  return withDatabase(async () => {
    const customer = await requireCustomer();
    if (customer instanceof NextResponse) return customer;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? "Ungültige Eingabe.", field: issue?.path.join(".") },
        { status: 400 }
      );
    }

    const updated = await updateCustomerProfile(customer.id, parsed.data);
    return NextResponse.json({ ok: true, customer: toPublicCustomer(updated) });
  });
}
