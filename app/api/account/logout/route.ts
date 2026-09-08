import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE, customerCookieOptions } from "@/lib/account/session";

/**
 * Çıkış.
 *
 * POST'tur, GET değil: bir `<img src="/api/account/logout">` ile kullanıcıyı
 * habersizce çıkış yaptırabilmek küçük ama gereksiz bir açıktır. Durum
 * değiştiren hiçbir uç GET olmamalı.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  // maxAge 0: tarayıcı çerezi hemen siler.
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", customerCookieOptions(0));
  return response;
}
