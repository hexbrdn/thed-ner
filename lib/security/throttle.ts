import { prisma } from "@/lib/db";

/**
 * Kaba kuvvet kısıtlayıcısı — veritabanı destekli.
 *
 * Neden bellekte değil: bellekteki bir sayaç sunucu her yeniden başladığında
 * sıfırlanır ve çok örnekli (serverless) dağıtımda hiç çalışmaz — her istek
 * başka bir örneğe düşer, hiçbiri diğerinin sayacını görmez. Yani bellekteki
 * kısıtlayıcı yalnızca tek örnekli geliştirme ortamında bir şey yapar; canlıda
 * hiçbir şey yapmaz. `LoginAttempt` tablosu tam bu yüzden şemada duruyor.
 *
 * İki ayrı anahtar üzerinden sayılır:
 *  - IP: tek bir kaynaktan çok sayıda hesabın denenmesini (kullanıcı adı
 *    püskürtme) yakalar.
 *  - E-posta: dağıtık IP'lerden tek bir hesaba yüklenmeyi yakalar.
 * Yalnızca IP'ye bakmak ikincisini, yalnızca e-postaya bakmak birincisini
 * kaçırır.
 */

/** Sayacın sıfırlandığı süre. Bu kadar sessizlikten sonra defter temizlenir. */
const WINDOW_MS = 15 * 60 * 1000;
/** Bu sayıdan sonra engel devreye girer. */
const MAX_ATTEMPTS = 8;
/** Engelin süresi. */
const BLOCK_MS = 15 * 60 * 1000;

export type ThrottleState =
  | { blocked: false }
  | { blocked: true; retryAfterSeconds: number };

/** İstekten IP adresi. Ters vekil arkasında ilk değer gerçek istemcidir. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Anahtarların engelli olup olmadığını söyler; **sayacı artırmaz**.
 *
 * Ayrım bilinçli: başarılı bir giriş sayacı artırmamalı. Önce bakılır, işlem
 * yapılır, yalnızca başarısızsa `recordFailure` çağrılır.
 */
export async function checkThrottle(keys: string[]): Promise<ThrottleState> {
  const now = new Date();
  const rows = await prisma.loginAttempt.findMany({
    where: { key: { in: keys }, blockedUntil: { gt: now } },
    select: { blockedUntil: true },
  });

  if (rows.length === 0) return { blocked: false };

  const until = rows.reduce(
    (latest, row) => (row.blockedUntil! > latest ? row.blockedUntil! : latest),
    rows[0].blockedUntil!
  );
  return {
    blocked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1000)),
  };
}

/**
 * Başarısız denemeyi yazar; eşik aşılırsa engeli kurar.
 *
 * Pencere dolmuşsa sayaç sıfırlanır — bu yüzden `upsert` yerine önce okuma
 * yapılır. Yarış hâlinde en kötü ihtimalle bir deneme fazla sayılır, ki bu
 * güvenlik açısından zararsız yöndür.
 */
export async function recordFailure(keys: string[]): Promise<void> {
  const now = new Date();

  await Promise.all(
    keys.map(async (key) => {
      const existing = await prisma.loginAttempt.findUnique({ where: { key } });

      const expired = !existing || now.getTime() - existing.firstAt.getTime() > WINDOW_MS;
      const count = expired ? 1 : existing.count + 1;
      const blockedUntil = count >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null;

      await prisma.loginAttempt.upsert({
        where: { key },
        create: { key, count, firstAt: now, blockedUntil },
        update: {
          count,
          ...(expired ? { firstAt: now } : {}),
          blockedUntil,
        },
      });
    })
  );
}

/** Başarılı girişten sonra defteri temizler. */
export async function clearAttempts(keys: string[]): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key: { in: keys } } });
}

/** Anahtar biçimi tek yerde: farklı uçların sayaçları karışmasın. */
export const throttleKeys = {
  adminIp: (ip: string) => `admin:ip:${ip}`,
  customerIp: (ip: string) => `customer:ip:${ip}`,
  customerEmail: (email: string) => `customer:email:${email.toLowerCase()}`,
  passwordResetIp: (ip: string) => `reset:ip:${ip}`,
  /**
   * Sipariş oluşturma. Oturum gerektirmeyen tek para dokunan uç olduğu için
   * kendi anahtarı var: giriş sayacıyla aynı kovaya düşseydi, çok sipariş veren
   * bir müşteri kendini panele girişten de kilitlerdi.
   */
  orderIp: (ip: string) => `order:ip:${ip}`,
};
