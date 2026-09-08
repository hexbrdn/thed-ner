import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/admin/auth";
import {
  checkThrottle,
  clearAttempts,
  clientIp,
  recordFailure,
  throttleKeys,
} from "@/lib/security/throttle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * Kısıtlayıcı artık veritabanında (`lib/security/throttle.ts`).
 *
 * Buradaki eski sayaç bir `Map` idi, yani süreç belleğinde. Bu, tek örnekli
 * geliştirme sunucusunda çalışıyor gibi görünür ama canlıda hiçbir şey yapmaz:
 * her istek başka bir sunucusuz örneğe düşer ve hiçbiri diğerinin sayacını
 * görmez; sunucu yeniden başladığında da sayaç sıfırlanır. `LoginAttempt`
 * tablosu şemaya tam bu yüzden konmuştu ama kullanılmıyordu.
 */

export async function POST(request: Request) {
  const ip = clientIp(request);
  const keys = [throttleKeys.adminIp(ip)];

  const throttle = await checkThrottle(keys);
  if (throttle.blocked) {
    return NextResponse.json(
      { error: "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } }
    );
  }

  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { error: "Sunucuda ADMIN_PASSWORD / ADMIN_SESSION_SECRET tanımlı değil." },
      { status: 500 }
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!(await verifyPassword(password))) {
    await recordFailure(keys);
    // hangi alanın yanlış olduğunu sızdırmayan tek tip mesaj
    return NextResponse.json({ error: "Parola hatalı." }, { status: 401 });
  }

  await clearAttempts(keys);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken(),
    sessionCookieOptions(SESSION_MAX_AGE)
  );
  return response;
}
