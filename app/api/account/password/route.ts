import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/account/guard";
import { changeCustomerPassword } from "@/lib/account/repository";
import { changePasswordSchema } from "@/lib/account/schema";
import { prisma } from "@/lib/db";
import { withDatabase } from "@/lib/security/dbGuard";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
  createCustomerToken,
  customerCookieOptions,
} from "@/lib/account/session";

/**
 * Parola değiştirme.
 *
 * Mevcut parola tekrar sorulur. Oturum çerezi ele geçirilmiş bir tarayıcı,
 * parolayı değiştirip hesabın gerçek sahibini kilitleyememelidir.
 *
 * Başarılı değişimden sonra `tokenVersion` artar ve **bütün** oturumlar düşer;
 * bu isteği yapan tarayıcıya yeni bir jeton yazılır, böylece kullanıcı kendi
 * oturumundan atılmaz ama diğer cihazlar çıkış yapmış olur.
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

    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? "Ungültige Eingabe.", field: issue?.path.join(".") },
        { status: 400 }
      );
    }

    const result = await changeCustomerPassword(
      customer.id,
      parsed.data.currentPassword,
      parsed.data.newPassword
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: "Das aktuelle Passwort ist falsch.", field: "currentPassword" },
        { status: 400 }
      );
    }

    // Artmış sürümü okuyup bu tarayıcıya güncel jetonu yazıyoruz.
    const fresh = await prisma.customer.findUniqueOrThrow({
      where: { id: customer.id },
      select: { id: true, tokenVersion: true },
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      await createCustomerToken({ customerId: fresh.id, tokenVersion: fresh.tokenVersion }),
      customerCookieOptions(CUSTOMER_SESSION_MAX_AGE)
    );
    return response;
  });
}
