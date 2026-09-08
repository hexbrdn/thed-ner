import { formatCents } from "@/lib/money";

/**
 * Temel fiyat (Grundpreis) — PAngV § 4.
 *
 * Hacme göre satılan üründe litre fiyatı, son fiyatın yanında ve aynı görsel
 * ağırlıkta gösterilmek zorunda. Menüde "0,33 → 2,50 €" yazmak yetmez;
 * "(7,58 €/l)" da yazmak gerekir.
 *
 * Neden ayrı bir modül: menüdeki boy etiketi serbest metindir ("0,33",
 * "28 CM", "Rolle"). Hangisinin hacim olduğuna karar vermek gösterim değil
 * **kural** işidir ve test edilebilir olmalıdır.
 *
 * PAngV § 9 Abs. 4 Nr. 1 istisnası: 250 ml altındaki içecekler muaftır —
 * ama muafiyet "gösterilemez" değil "gösterilmek zorunda değil" demektir,
 * göstermek hiçbir zaman hata olmaz. Bu yüzden alt sınır uygulanmaz.
 */

/** 5 litreden büyük bir "boy" etiketi hacim değil, ölçü hatasıdır. */
const MAX_PLAUSIBLE_LITERS = 5;

/**
 * Boy etiketinden litre değeri çıkarır; hacim değilse null.
 *
 * Kabul edilen biçimler:
 *   "0,33" · "0,5 l" · "0.5L" · "330 ml" · "33 cl"
 * Reddedilenler:
 *   "28 CM" (çap) · "Rolle" · "gr." · "" · "12" (birimsiz tam sayı — porsiyon
 *   sayısı mı litre mi belli değil, tahmin etmeyiz)
 */
export function parseLiters(size: string): number | null {
  const text = size.trim().toLowerCase().replace(",", ".");
  const match = /^(\d+(?:\.\d+)?)\s*(l|ltr|liter|ml|cl)?$/.exec(text);
  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  switch (match[2]) {
    case "ml":
      return value / 1000;
    case "cl":
      return value / 100;
    case "l":
    case "ltr":
    case "liter":
      return value <= MAX_PLAUSIBLE_LITERS ? value : null;
    default:
      // Birimsiz: yalnızca ondalıklı yazılmışsa litre sayılır. "0,33" litredir,
      // "12" değildir — menüde birimsiz tam sayı adet/parça anlamına gelir.
      return text.includes(".") && value <= MAX_PLAUSIBLE_LITERS ? value : null;
  }
}

/**
 * Litre başına fiyat, cent olarak.
 *
 * Yuvarlama yukarı değil, en yakına yapılır: temel fiyat bir bilgilendirmedir,
 * tahsil edilen tutar değildir; müşteri lehine/aleyhine sistematik sapma
 * yaratmaması için `Math.round`.
 */
export function pricePerLiterCents(unitCents: number, liters: number): number | null {
  if (!Number.isFinite(unitCents) || unitCents <= 0) return null;
  if (!Number.isFinite(liters) || liters <= 0) return null;
  return Math.round(unitCents / liters);
}

/**
 * Menüde gösterilecek hazır metin: "(7,58 €/l)".
 *
 * Hacim değilse null döner ve satırda hiçbir şey görünmez — boş parantez
 * ya da "—" göstermek, bilgiyi vermemekten daha kötüdür.
 */
export function grundpreisLabel(size: string, unitCents: number): string | null {
  const liters = parseLiters(size);
  if (liters === null) return null;

  const perLiter = pricePerLiterCents(unitCents, liters);
  if (perLiter === null) return null;

  return `${formatCents(perLiter)}/l`;
}
