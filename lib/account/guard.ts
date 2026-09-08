import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CUSTOMER_SESSION_COOKIE, verifyCustomerToken } from "./session";

/**
 * Müşteri oturumunun sunucu tarafındaki tek okuma noktası.
 *
 * Middleware'e güvenilmez: yetki her uçta burada yeniden doğrulanır.
 * Middleware yalnızca gezinmeyi yönlendirmek içindir, koruma değildir —
 * matcher'daki bir yazım hatası tüm hesap uçlarını açık bırakabilirdi.
 */

/**
 * Oturumdaki müşteri, yoksa null.
 *
 * Jetonun imzası geçerli olsa bile kayıt tekrar okunur ve üç şey kontrol
 * edilir: hesap hâlâ var mı, aktif mi, jetonun `tokenVersion`'ı güncel mi.
 * Sonuncusu, parola değişiminden sonra eski jetonların ölmesini sağlar —
 * imza tek başına bunu bilemez, çünkü imzalandığı an geçerliydi.
 */
export async function getCurrentCustomer(): Promise<Customer | null> {
  const token = cookies().get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = await verifyCustomerToken(token);
  if (!session) return null;

  const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
  if (!customer) return null;
  if (!customer.active || customer.anonymizedAt !== null) return null;
  if (customer.tokenVersion !== session.tokenVersion) return null;

  return customer;
}

/**
 * Route handler'lar için: müşteri ya da hazır 401 yanıtı.
 *
 * `NextResponse` hiçbir zaman bir `Customer` olamayacağı için çağıran taraf
 * `instanceof` ile iki durumu güvenle ayırabilir.
 */
export async function requireCustomer(): Promise<Customer | NextResponse> {
  const customer = await getCurrentCustomer();
  if (customer) return customer;
  return NextResponse.json({ error: "Bitte melden Sie sich an." }, { status: 401 });
}
