/**
 * Para birimi işlemleri.
 *
 * Fiyatlar katalogda Euro cinsinden ondalıklı sayı olarak durur, ama **tüm
 * toplama/çarpma işlemleri cent (tam sayı) üzerinde** yapılır. Kayan noktalı
 * toplama (0.1 + 0.2 = 0.30000000000000004) sipariş toplamında bir cent'lik
 * sapmalara yol açtığı için burada tek bir yerde toplanmıştır.
 *
 * Gösterim de tek yerden gelir: Almanya formatı, virgüllü ve iki basamaklı.
 */

/** 7.5 → 750. Geçersiz girdi 0 sayılır (fiyat asla NaN olarak yayılmasın). */
export function toCents(euro: number): number {
  if (typeof euro !== "number" || !Number.isFinite(euro)) return 0;
  return Math.round(euro * 100);
}

/** 750 → 7.5 */
export function toEuro(cents: number): number {
  return Math.round(cents) / 100;
}

/** 750 → "7,50 €" */
export function formatCents(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.round(cents) : 0;
  const sign = safe < 0 ? "-" : "";
  const abs = Math.abs(safe);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")} €`;
}

/** 7.5 → "7,50 €" — katalogdaki Euro değerleri için kısa yol. */
export function formatEuro(euro: number): string {
  return formatCents(toCents(euro));
}
