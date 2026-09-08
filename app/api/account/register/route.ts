import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/account/repository";
import { registerSchema } from "@/lib/account/schema";
import {
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_MAX_AGE,
  createCustomerToken,
  customerCookieOptions,
} from "@/lib/account/session";
import { checkThrottle, clientIp, recordFailure, throttleKeys } from "@/lib/security/throttle";
import { withDatabase } from "@/lib/security/dbGuard";

/**
 * Hesap açma.
 *
 * Kayıt başarılı olur olmaz oturum da açılır: kullanıcıyı "kaydınız oluştu,
 * şimdi giriş yapın" diye ikinci bir forma göndermek, sepetini bekleten biri
 * için gereksiz bir engeldir.
 *
 * Hesap açmak sipariş vermenin **önkoşulu değildir**; bu uç yalnızca isteyen
 * için vardır. Misafir akışı olduğu gibi durur.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return withDatabase(async () => {
    const ip = clientIp(request);

    // Kayıt ucu da kısıtlanır: aksi hâlde tek bir kaynak binlerce sahte hesap
    // açıp hem tabloyu hem de parola özetleme maliyetiyle CPU'yu doldurabilir.
    const throttle = await checkThrottle([throttleKeys.customerIp(ip)]);
    if (throttle.blocked) {
      return NextResponse.json(
        { error: "Zu viele Versuche. Bitte später erneut versuchen." },
        { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { error: issue?.message ?? "Ungültige Eingabe.", field: issue?.path.join(".") },
        { status: 400 }
      );
    }

    const result = await registerCustomer(parsed.data);

    if (!result.ok) {
      // Bu yanıt, adresin kayıtlı olduğunu ele verir. Kaçınılmaz: benzersiz bir
      // e-posta ile hesap açmaya çalışan kullanıcıya "olmadı" deyip sebebini
      // söylememek, kendi hesabını olduğunu bilmeyen kişiyi çıkmaza sokar.
      // Ölçülü karşılık: başarısız kayıt da sayaca yazılır, böylece bu uç
      // üzerinden adres listesi taranamaz.
      await recordFailure([throttleKeys.customerIp(ip)]);
      return NextResponse.json(
        {
          error: "Für diese E-Mail-Adresse besteht bereits ein Konto. Bitte melden Sie sich an.",
          field: "email",
          code: "email_taken",
        },
        { status: 409 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      customer: { name: result.customer.name, email: result.customer.email },
    });

    response.cookies.set(
      CUSTOMER_SESSION_COOKIE,
      await createCustomerToken({
        customerId: result.customer.id,
        tokenVersion: result.customer.tokenVersion,
      }),
      customerCookieOptions(CUSTOMER_SESSION_MAX_AGE)
    );

    return response;
  });
}
