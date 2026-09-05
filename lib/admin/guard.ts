import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

/**
 * Route handler'lar için ikinci savunma hattı.
 *
 * Middleware'e güvenilmez: yetki her yazma ucunda burada yeniden doğrulanır.
 * Yetkisizse hazır 401 yanıtı döner, yetkiliyse null döner.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) return null;
  return NextResponse.json(
    { error: "Bu işlem için admin oturumu gerekli." },
    { status: 401 }
  );
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Kayıt bulunamadı.") {
  return NextResponse.json({ error: message }, { status: 404 });
}
