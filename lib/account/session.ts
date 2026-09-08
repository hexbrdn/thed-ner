/**
 * Müşteri oturumu.
 *
 * Admin oturumundan **ayrı** bir çerez ve **ayrı** bir gizli anahtar kullanır.
 * Sebep tek cümleyle: müşteri jetonu binlerce kişinin tarayıcısında dolaşır,
 * admin jetonu bir kişinin. İkisini aynı anahtarla imzalamak, müşteri
 * tarafındaki bir zafiyeti panele taşıyan bir köprü kurmak olurdu.
 *
 * Jeton biçimi: "<customerId>.<tokenVersion>.<sonaErme>.<HMAC>"
 *
 * `tokenVersion` neden içeride: sunucuda oturum tablosu tutmuyoruz (durum
 * yok, ölçeklenir). Bunun bedeli, verilmiş bir jetonu tek tek iptal
 * edememektir. Parola değişimi ya da "her yerden çıkış" gibi durumlarda
 * kullanıcının TÜM oturumlarının düşmesi gerekir — `Customer.tokenVersion`
 * artırılınca eski jetonların hepsi bir anda geçersiz olur.
 */

export const CUSTOMER_SESSION_COOKIE = "samis_customer_session";

/** 30 gün: yemek siparişinde sık sık yeniden giriş istemek terk ettirir. */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const CUSTOMER_SESSION_MAX_AGE = SESSION_TTL_MS / 1000;

function secret(): string {
  const value = process.env.CUSTOMER_SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "CUSTOMER_SESSION_SECRET tanımlı değil veya çok kısa (en az 16 karakter). .env.local dosyasına ekleyin."
    );
  }
  return value;
}

function base64url(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
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
  return base64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type CustomerSession = {
  customerId: string;
  tokenVersion: number;
};

export async function createCustomerToken(session: CustomerSession): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${session.customerId}.${session.tokenVersion}.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

/**
 * Jetonun imzasını ve süresini doğrular.
 *
 * `tokenVersion`'ın veritabanındakiyle eşleşip eşleşmediğine **burada
 * bakılmaz** — bu saf, veritabanısız bir işlevdir ve Edge middleware'inde de
 * çalışır. Sürüm kontrolü `getCurrentCustomer` içinde, kaydı okurken yapılır.
 */
export async function verifyCustomerToken(
  token: string | undefined
): Promise<CustomerSession | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [customerId, versionRaw, expiresRaw, signature] = parts;
  if (!customerId) return null;

  const tokenVersion = Number(versionRaw);
  const expiresAt = Number(expiresRaw);
  if (!Number.isInteger(tokenVersion) || tokenVersion < 0) return null;
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  try {
    const expected = await sign(`${customerId}.${versionRaw}.${expiresRaw}`);
    return safeEqual(signature, expected) ? { customerId, tokenVersion } : null;
  } catch {
    return null;
  }
}

/**
 * Çerez ayarları.
 *
 * `sameSite: "lax"` — admin çerezindeki "strict" burada **kullanılamaz**:
 * müşteri Stripe'ın barındırdığı ödeme sayfasından siteye geri döner ve bu bir
 * çapraz site gezinmesidir. "strict" olsaydı çerez o istekte gönderilmez,
 * müşteri ödeme sonrası kendini çıkış yapmış bulurdu.
 *
 * "lax" ile GET gezinmeleri çerezi taşır, çapraz site POST'ları taşımaz;
 * durum değiştiren tüm uçlarımız POST olduğu için CSRF yüzeyi açılmaz.
 */
export function customerCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
