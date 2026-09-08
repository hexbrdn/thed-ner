import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/**
 * Veritabanı arızasını JSON'a çeviren sarmalayıcı.
 *
 * Neden var: Prisma bağlantı hatası fırlattığında Next, route handler'ı
 * çökmüş sayar ve **HTML hata sayfası** döner. JSON bekleyen istemci bunu
 * ayrıştıramaz ve "Unexpected token '<'" ile kırılır — kullanıcı da hiçbir şey
 * anlamayan bir ekranla kalır. Oysa doğru davranış, "veritabanına şu an
 * ulaşılamıyor, tekrar deneyin" demektir.
 *
 * Bu senaryo kuramsal değil: havuzlanmış bağlantı (Supabase pooler) boştaki
 * bağlantıları düşürür ve ilk istek `ConnectionReset` alabilir.
 *
 * Yalnızca **geçici altyapı arızaları** yakalanır. Programlama hatası olan her
 * şey olduğu gibi yukarı fırlatılır: onları 503'e çevirmek, gerçek bir hatayı
 * "veritabanı yoktu" diye gizlemek olurdu.
 */

/** Hatanın geçici bir bağlantı arızası olup olmadığı. */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: sunucuya ulaşılamıyor · P1002: zaman aşımı · P1017: bağlantı kapandı
    return error.code === "P1001" || error.code === "P1002" || error.code === "P1017";
  }

  return false;
}

/**
 * Route handler gövdesini sarar.
 *
 * `T` bir `NextResponse` olabileceği için çağıran taraf dönen değeri doğrudan
 * yanıt olarak kullanır; ayrıştırmaya gerek yoktur.
 */
export async function withDatabase(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      console.error("[db] geçici bağlantı arızası", error);
      return NextResponse.json(
        {
          error:
            "Der Dienst ist gerade nicht erreichbar. Bitte versuchen Sie es in einem Moment erneut.",
          code: "database_unavailable",
        },
        { status: 503, headers: { "Retry-After": "5" } }
      );
    }
    throw error;
  }
}
