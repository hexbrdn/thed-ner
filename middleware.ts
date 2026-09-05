import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";

/**
 * Admin sayfalarının ve admin API'sinin ilk savunma hattı.
 *
 * Bu yalnızca kaba bir filtre: her admin route handler'ı kendi içinde de
 * `requireAdmin` ile oturumu ayrıca doğrular, böylece middleware atlansa bile
 * yazma uçları korunmasız kalmaz.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // giriş sayfası ve giriş/çıkış uçları herkese açık olmak zorunda
  if (pathname === "/admin/login" || pathname.startsWith("/api/admin/login") || pathname.startsWith("/api/admin/logout")) {
    return NextResponse.next();
  }

  const authorized = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (authorized) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Bu işlem için admin oturumu gerekli." },
      { status: 401 }
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
