import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "./auth";
import { Prisma } from "@prisma/client";

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
 * Veri katmanı artık PostgreSQL: beklenen tek "geçici" arıza veritabanına
 * ulaşılamamasıdır. O durumda isteği ham 500 ile düşürmek yerine, arayüzün
 * gösterebileceği açıklayıcı bir 503 döneriz. Benzersizlik ihlali gibi
 * kullanıcı hatasından doğan durumlar 409 ile ayrılır; beklenmedik hatalar
 * olduğu gibi yukarı fırlatılır.
 *
 * `T` hiçbir zaman `NextResponse` olmadığı için çağıran taraf `instanceof` ile
 * iki durumu güvenle ayırabilir.
 */
export async function storeWrite<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (error) {
    // Veritabanına hiç bağlanılamadı (yanlış DATABASE_URL, kapalı sunucu…).
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: "Veritabanına ulaşılamıyor. Değişiklik kaydedilmedi." },
        { status: 503 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P1001/P1002: sunucu erişilemez veya zaman aşımı — geçici arıza.
      if (error.code === "P1001" || error.code === "P1002") {
        return NextResponse.json(
          { error: "Veritabanına ulaşılamıyor. Değişiklik kaydedilmedi." },
          { status: 503 }
        );
      }
      // P2002: benzersizlik ihlali — aynı kimlikte kayıt zaten var.
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Bu kayıt zaten var." },
          { status: 409 }
        );
      }
      // P2003: ilişki kısıtı — ör. var olmayan kategoriye ürün bağlanması.
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "İlişkili kayıt bulunamadı." },
          { status: 400 }
        );
      }
    }

    throw error;
  }
}
