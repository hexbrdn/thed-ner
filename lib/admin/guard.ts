import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { StoreWriteError } from "./store";

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

/**
 * Katalog yazma çağrılarını sarar.
 *
 * Salt okunur bir dosya sisteminde (Vercel gibi serverless ortamlar) yazma
 * `StoreWriteError` ile başarısız olur. O durumda isteği ham 500 ile düşürmek
 * yerine, arayüzün gösterebileceği açıklayıcı bir 503 döneriz. Beklenmedik
 * hatalar olduğu gibi yukarı fırlatılır.
 *
 * `T` hiçbir zaman `NextResponse` olmadığı için çağıran taraf `instanceof` ile
 * iki durumu güvenle ayırabilir.
 */
export async function storeWrite<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof StoreWriteError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    throw error;
  }
}
