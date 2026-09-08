/**
 * Sipariş takip jetonu.
 *
 * Misafir siparişinde hesap yoktur; müşteri siparişini yalnızca kendisine
 * verilen bağlantıdan görebilir. Bağlantı bu yüzden **tahmin edilemez** olmak
 * zorunda: sipariş numarası (SD-260907-001) sıralı ve tahmin edilebilirdir, tek
 * başına yetki kanıtı olamaz.
 *
 * Jeton = "<siparişNo>.<HMAC-SHA256(siparişNo)>". İmza sunucudaki
 * ORDER_TOKEN_SECRET olmadan üretilemez; dolayısıyla bir numarayı bilen kişi
 * geçerli bir bağlantı uyduramaz.
 *
 * Neden veritabanında rastgele bir jeton değil: bu tasarımda jeton hiç
 * saklanmaz. Veritabanı sızsa bile jeton listesi diye bir şey yoktur, ve
 * bağlantı sipariş kaydından bağımsız olarak her zaman yeniden türetilebilir.
 * Bedeli, tek bir bağlantının iptal edilememesidir; gizli anahtar döndürülürse
 * tüm bağlantılar birden geçersizleşir.
 *
 * Admin oturumundan **ayrı** bir gizli anahtar kullanılır: takip bağlantısı
 * müşteriye gider, admin anahtarı hiçbir zaman dışarı çıkmaz.
 */

const SEPARATOR = ".";

function secret(): string {
  const value = process.env.ORDER_TOKEN_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "ORDER_TOKEN_SECRET tanımlı değil veya çok kısa (en az 16 karakter). .env.local dosyasına ekleyin."
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

/** Sipariş numarasından takip jetonu üretir. */
export async function createOrderToken(orderNo: string): Promise<string> {
  return `${orderNo}${SEPARATOR}${await sign(orderNo)}`;
}

/**
 * Jetonu doğrular ve içindeki sipariş numarasını döner.
 *
 * Geçersiz imza, bozuk biçim veya eksik gizli anahtar durumunda null döner —
 * çağıran taraf bunu "sipariş bulunamadı" olarak göstermelidir; hangi ihtimalin
 * gerçekleştiğini müşteriye söylemek bilgi sızdırır.
 */
export async function verifyOrderToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;

  // Sipariş numarası ayıracı içermez, dolayısıyla ilk parça baştan sona numaradır.
  const index = token.lastIndexOf(SEPARATOR);
  if (index <= 0 || index === token.length - 1) return null;

  const orderNo = token.slice(0, index);
  const signature = token.slice(index + 1);

  try {
    return safeEqual(signature, await sign(orderNo)) ? orderNo : null;
  } catch {
    return null;
  }
}

/** Müşteriye gösterilecek tam takip adresi. */
export async function orderTrackingUrl(orderNo: string): Promise<string> {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "http://localhost:3000";
  return `${base}/bestellung/${encodeURIComponent(await createOrderToken(orderNo))}`;
}
