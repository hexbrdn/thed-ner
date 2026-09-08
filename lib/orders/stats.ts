import { prisma } from "@/lib/db";
import { ACTIVE_STATUSES } from "./status";

/**
 * Panelin sipariş metrikleri.
 *
 * "Bugün" işletmenin yerel gününü (Europe/Berlin) ifade eder, sunucununkini
 * değil: sunucu UTC'de çalıştığında gece yarısı ile 01:00 arasındaki siparişler
 * yanlış güne düşerdi.
 *
 * Ciroya yalnızca **ödemesi alınmış ve iptal edilmemiş** siparişler girer.
 * Ödeme bekleyen (PENDING_PAYMENT) ya da süresi dolan sipariş bir gelir değildir;
 * onları ciroya katmak panelde olmayan bir parayı göstermek olurdu.
 */

const COUNTED_STATUSES = [
  ...ACTIVE_STATUSES,
  "DELIVERED",
  "PICKED_UP",
] as const;

/**
 * İşletmenin yerel gününün başlangıcı, UTC anı olarak.
 *
 * Dışa açık: ciro ekranı da günleri aynı sınırdan bölmek zorunda. İki ayrı
 * "gün" tanımı, dashboard ile finans ekranının farklı ciro göstermesi demekti.
 */
export function berlinDayStart(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const isoDate = `${get("year")}-${get("month")}-${get("day")}`;

  /*
   * Berlin gün başlangıcının UTC karşılığı yaz saatine göre değişir (UTC+1 /
   * UTC+2). Sabit bir kaydırma yazmak yerine, o günün gerçek kaymasını ölçüp
   * çıkarıyoruz: yaz saati geçişinde de doğru kalır.
   */
  const naiveUtc = new Date(`${isoDate}T00:00:00.000Z`);
  const offsetMinutes =
    (new Date(naiveUtc.toLocaleString("en-US", { timeZone: "UTC" })).getTime() -
      new Date(naiveUtc.toLocaleString("en-US", { timeZone: "Europe/Berlin" })).getTime()) /
    60_000;

  return new Date(naiveUtc.getTime() + offsetMinutes * 60_000);
}

export type OrderStats = {
  /** Bugün ödemesi alınmış sipariş sayısı. */
  todayOrders: number;
  /** Bugünkü ciro (cent). */
  todayRevenueCents: number;
  /** Bugünkü ortalama sepet (cent); sipariş yoksa 0. */
  todayAverageCents: number;
  /** Şu an mutfakta akışta olan sipariş sayısı. */
  activeOrders: number;
  /** Henüz "görüldü" denmemiş yeni sipariş sayısı. */
  unacknowledged: number;
  /** Son 7 günün sipariş sayısı ve cirosu. */
  weekOrders: number;
  weekRevenueCents: number;
};

export async function getOrderStats(now: Date = new Date()): Promise<OrderStats> {
  const dayStart = berlinDayStart(now);
  const weekStart = new Date(dayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

  const [today, week, activeOrders, unacknowledged] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: [...COUNTED_STATUSES] }, createdAt: { gte: dayStart } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: { status: { in: [...COUNTED_STATUSES] }, createdAt: { gte: weekStart } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    prisma.order.count({ where: { status: { in: [...ACTIVE_STATUSES] } } }),
    prisma.order.count({ where: { status: "PAID", acknowledgedAt: null } }),
  ]);

  const todayOrders = today._count._all;
  const todayRevenueCents = today._sum.totalCents ?? 0;

  return {
    todayOrders,
    todayRevenueCents,
    todayAverageCents: todayOrders > 0 ? Math.round(todayRevenueCents / todayOrders) : 0,
    activeOrders,
    unacknowledged,
    weekOrders: week._count._all,
    weekRevenueCents: week._sum.totalCents ?? 0,
  };
}
