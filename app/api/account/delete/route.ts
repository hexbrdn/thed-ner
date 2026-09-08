import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/account/guard";
import { anonymizeCustomer } from "@/lib/account/repository";
import { verifyPassword } from "@/lib/account/password";
import { deleteAccountSchema } from "@/lib/account/schema";
import { CUSTOMER_SESSION_COOKIE, customerCookieOptions } from "@/lib/account/session";
import { withDatabase } from "@/lib/security/dbGuard";

/**
 * Hesabın silinmesi — DSGVO Art. 17.
 *
 * "Silme" burada **anonimleştirmedir** ve bu bir kaçamak değil, iki yasanın
 * kesişimindeki tek doğru davranıştır: siparişler Buchungsbeleg olarak
 * saklanmak zorundadır (§ 147 AO), kişisel veri ise silinmek zorundadır. İkisi
 * ancak satır kalıp kişisel alanlar temizlenerek birlikte sağlanır. Kullanıcıya
 * da bu açıkça söylenir — "hepsi silindi" demek doğru olmazdı.
 *
 * Parola yeniden istenir: bu işlem geri alınamaz.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const parsed = deleteAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Bitte bestätigen Sie die Löschung und geben Sie Ihr Passwort ein." },
        { status: 400 }
      );
    }

    if (!(await verifyPassword(parsed.data.password, customer.passwordHash))) {
      return NextResponse.json(
        { error: "Das Passwort ist falsch.", field: "password" },
        { status: 400 }
      );
    }

    await anonymizeCustomer(customer.id);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, "", customerCookieOptions(0));
    return response;
  });
}
