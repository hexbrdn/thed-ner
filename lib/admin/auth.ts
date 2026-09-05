/**
 * Admin oturumu.
 *
 * Projede kullanıcı sistemi olmadığı için tek yöneticili, parola tabanlı bir
 * oturum kuruldu. Çerez içeriği HMAC-SHA256 ile imzalanır; imza sunucudaki
 * gizli anahtar olmadan üretilemez, dolayısıyla istemci çerezi kurcalayarak
 * yetki elde edemez.
 *
 * Web Crypto kullanılır: hem Node route handler'larında hem de Edge
 * middleware'inde aynı kod çalışır.
 */

export const SESSION_COOKIE = "samis_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 saat

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "ADMIN_SESSION_SECRET tanımlı değil veya çok kısa (en az 16 karakter). .env.local dosyasına ekleyin."
    );
  }
  return value;
}

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64url(mac);
}

/** Uzunluk sızdırmayan, erken çıkışsız karşılaştırma. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Süresi `SESSION_TTL_MS` sonra dolan imzalı oturum jetonu üretir. */
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [role, expiresRaw, signature] = parts;
  if (role !== "admin") return false;

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  try {
    return safeEqual(signature, await sign(`${role}.${expiresRaw}`));
  } catch {
    return false;
  }
}

/** Girilen parolayı `ADMIN_PASSWORD` ile sabit zamanlı karşılaştırır. */
export async function verifyPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  // Farklı uzunlukların erken dönmemesi için önce iki tarafın da özetini al.
  const digest = async (value: string) =>
    base64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));

  return safeEqual(await digest(input), await digest(expected));
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export const SESSION_MAX_AGE = SESSION_TTL_MS / 1000;
