import { PrismaClient } from "@prisma/client";

/**
 * Prisma istemcisi.
 *
 * Next.js geliştirme modunda modüller sıcak yeniden yüklenir; her yüklemede
 * yeni bir PrismaClient kurulursa veritabanı bağlantı havuzu kısa sürede
 * tükenir. Bu yüzden istemci global nesnede saklanır ve yalnızca bir kez
 * kurulur. Üretimde global kullanılmaz, modül zaten tek kez yüklenir.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Havuz sınırı.
 *
 * Prisma, URL'de `connection_limit` yoksa **çekirdek sayısı × 2 + 1** kadar
 * bağlantı açar. 12 çekirdekli bir makinede bu 25 eder — Supabase'in paylaşımlı
 * havuzlayıcısının kabul ettiğinden fazlası. Sınır aşılınca sorgu şu hatayla
 * düşer:
 *
 *   FATAL: (EMAXCONNSESSION) max clients reached in session mode -
 *   max clients are limited to pool_size: 15
 *
 * Bu yüzden sınır her iki ortamda da açıkça verilir. Ortamdan
 * `DATABASE_CONNECTION_LIMIT` ile ezilebilir.
 */
const DEV_CONNECTION_LIMIT = 5;
const PROD_CONNECTION_LIMIT = 3;

/** Sorgu dizesinde olmayan parametreyi ekler; varsa dokunmaz. */
function withParam(url: string, key: string, value: string): string {
  if (new RegExp(`[?&]${key}=`).test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${key}=${value}`;
}

/**
 * Geliştirmede **session-mode** bağlantı kullanılır.
 *
 * DATABASE_URL, Supabase'in işlem havuzlayıcısını (Supavisor, 6543) gösterir.
 * Havuzlayıcı sunucusuz üretim için doğru seçimdir: her isteğin kendi kısa
 * ömürlü bağlantısını açtığı bir ortamda veritabanının bağlantı sınırını korur.
 * Ama işlem başına birkaç ek gidiş-geliş ekler ve hazırlanmış sorguları devre
 * dışı bırakır. Uygulama sunucusu veritabanına uzaksa bu ek maliyet gecikmeyle
 * çarpılır: ölçümde havuzlayıcı üzerinden sorgu başına ~450 ms, doğrudan
 * bağlantıda ~87 ms.
 *
 * Geliştirmede tek ve uzun ömürlü bir süreç vardır; havuzlayıcının işlem
 * modunda çözdüğü sorun yoktur, bedeli ise her sayfa açılışında hissedilir.
 * Bu yüzden `DIRECT_URL` varsa yerelde o kullanılır.
 *
 * DİKKAT: `DIRECT_URL` de bir havuzlayıcı adresidir (pooler.supabase.com:5432,
 * session mode) — adı "direct" olsa da doğrudan Postgres değildir ve paylaşımlı
 * havuzu 15 istemcide biter. Sınırı bu yüzden yukarıda kısıyoruz.
 */
function datasourceUrl(): string | undefined {
  const isProduction = process.env.NODE_ENV === "production";
  const override = process.env.DATABASE_CONNECTION_LIMIT;

  const raw = isProduction
    ? process.env.DATABASE_URL
    : process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!raw) return undefined;

  const limit =
    override || String(isProduction ? PROD_CONNECTION_LIMIT : DEV_CONNECTION_LIMIT);

  // Havuz doluyken kuyrukta bekleme süresi. Varsayılan 10 sn; sınır kısıldığı
  // için kuyruk daha sık oluşuyor, biraz genişletiyoruz.
  return withParam(withParam(raw, "connection_limit", limit), "pool_timeout", "20");
}

const url = datasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
