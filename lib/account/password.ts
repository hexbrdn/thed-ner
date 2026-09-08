/**
 * Müşteri parolalarının saklanması.
 *
 * Kural: parola **hiçbir zaman** geri döndürülebilir biçimde saklanmaz ve
 * düz SHA-256 ile özetlenmez. Düz özet, GPU ile saniyede milyarlarca deneme
 * yapılmasına izin verir; parola özeti bilerek **yavaş** olmalıdır.
 *
 * Neden PBKDF2 ve bcrypt/argon2 değil:
 *  - Web Crypto'nun parçası; ek bağımlılık, yerel derleme (node-gyp) ve
 *    dağıtım ortamına göre değişen ikili dosya yok.
 *  - Hem Node route handler'ında hem Edge middleware'inde aynı kod çalışır —
 *    projedeki admin oturumu da aynı sebeple Web Crypto kullanıyor.
 * Bedeli: argon2id kadar bellek-sert değildir. Yeterli yineleme sayısıyla
 * (OWASP 2023+ tavsiyesi: PBKDF2-HMAC-SHA256 için 600.000) bir döner
 * dükkânının tehdit modeli için fazlasıyla yeterlidir.
 *
 * Saklanan biçim tek bir metindir:
 *   pbkdf2$sha256$<yineleme>$<tuz-b64url>$<özet-b64url>
 * Yineleme sayısı özetin İÇİNDE durur; ileride artırıldığında eski kayıtlar
 * doğrulanmaya devam eder ve girişte sessizce yükseltilebilir.
 */

const ALGORITHM = "pbkdf2";
const HASH = "sha256";
const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

export const MIN_PASSWORD_LENGTH = 8;
/** Uzun girdi ile CPU tüketmeyi (DoS) engeller; 200 karakter fazlasıyla yeter. */
export const MAX_PASSWORD_LENGTH = 200;

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      // BufferSource beklenir; Uint8Array'in tamponu doğrudan verilir.
      salt: salt as unknown as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    key,
    KEY_BITS
  );
  return base64url(bits);
}

/** Yeni parola özeti üretir. Her çağrıda tuz yeniden rastgele seçilir. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const digest = await derive(password, salt, ITERATIONS);
  return `${ALGORITHM}$${HASH}$${ITERATIONS}$${base64url(salt)}$${digest}`;
}

/** Uzunluk sızdırmayan, erken çıkışsız karşılaştırma. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Parolayı saklanan özete karşı doğrular.
 *
 * Bozuk/tanınmayan biçimde `false` döner, fırlatmaz: veritabanındaki tek bir
 * bozuk satır giriş ucunu 500'e düşürmemeli.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 5) return false;

  const [algorithm, hash, iterationsRaw, saltRaw, digest] = parts;
  if (algorithm !== ALGORITHM || hash !== HASH) return false;

  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 1 || iterations > 5_000_000) return false;

  try {
    const computed = await derive(password, fromBase64url(saltRaw), iterations);
    return safeEqual(computed, digest);
  } catch {
    return false;
  }
}

/**
 * Bu özet güncel maliyetin altında mı — girişte sessiz yükseltme için.
 *
 * Yineleme sayısı zamanla artırılacak; kullanıcı doğru parolayla giriş yaptığı
 * anda elimizde düz parola vardır ve özeti yeniden üretmek bedavadır. Kullanıcı
 * bunu hiç fark etmez.
 */
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 5) return true;
  const iterations = Number(parts[2]);
  return !Number.isInteger(iterations) || iterations < ITERATIONS;
}

/**
 * Parola politikası.
 *
 * Bilinçli olarak sade: uzunluk dışında karmaşıklık kuralı yok. NIST SP
 * 800-63B, zorunlu karakter sınıflarının parolayı güçlendirmediğini,
 * kullanıcıyı "Parola1!" gibi tahmin edilebilir kalıplara ittiğini söylüyor.
 * Uzunluk asıl belirleyicidir.
 */
export function passwordProblem(password: string): "too_short" | "too_long" | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "too_short";
  if (password.length > MAX_PASSWORD_LENGTH) return "too_long";
  return null;
}
