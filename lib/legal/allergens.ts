import {
  ADDITIVES,
  ADDITIVE_LABELS,
  ALLERGENS,
  ALLERGEN_LABELS,
  type Additive,
  type Allergen,
} from "@/lib/admin/types";

/**
 * Alerjen ve katkı maddesi kodlaması — LMIV Art. 21 Abs. 1 lit. b / ZZulV § 9.
 *
 * Yasa "yazılı bildirim" ister, biçimi serbest bırakır. Almanya'da yerleşik
 * kullanım harf (alerjen) + rakam (katkı maddesi) dipnotudur; menüde her ürünün
 * yanında kısa kod, sayfanın altında tam açıklamalı liste durur. Kodun tek
 * başına bir anlamı yoktur — **açıklama listesi aynı sayfada bulunmak
 * zorundadır**, bu yüzden `MenuGrid` ve `/allergene` aynı tablodan beslenir.
 *
 * Harf sırası LMIV Ek II'nin sırasıdır ve `ALLERGENS` dizisinden türetilir:
 * iki liste elle kopyalanmaz, tek kaynaktan üretilir. Ek II'ye yeni bir madde
 * eklenirse (2011'den beri olmadı) sıra kendiliğinden kayar.
 */

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** GLUTEN → "A", CRUSTACEANS → "B" … MOLLUSCS → "N". */
export const ALLERGEN_CODES: Record<Allergen, string> = Object.fromEntries(
  ALLERGENS.map((key, i) => [key, LETTERS[i]])
) as Record<Allergen, string>;

/** FARBSTOFF → "1", KONSERVIERUNGSSTOFF → "2" … TAURINHALTIG → "14". */
export const ADDITIVE_CODES: Record<Additive, string> = Object.fromEntries(
  ADDITIVES.map((key, i) => [key, String(i + 1)])
) as Record<Additive, string>;

export type LegendEntry = {
  code: string;
  label: string;
};

/** Sayfa altındaki açıklama listesi — alerjenler. */
export function allergenLegend(lang: "tr" | "de"): LegendEntry[] {
  return ALLERGENS.map((key) => ({
    code: ALLERGEN_CODES[key],
    label: ALLERGEN_LABELS[key][lang],
  }));
}

/** Sayfa altındaki açıklama listesi — katkı maddeleri. */
export function additiveLegend(lang: "tr" | "de"): LegendEntry[] {
  return ADDITIVES.map((key) => ({
    code: ADDITIVE_CODES[key],
    label: ADDITIVE_LABELS[key][lang],
  }));
}

/**
 * Bir ürünün yanında görünecek kod dizisi: "A, C, G, 1, 9".
 *
 * Sıra listedeki sıradır, girildiği sıra değil: aynı ürün her yerde aynı
 * biçimde görünsün. Tanınmayan değer (şema büyüyüp kod eskirse) sessizce
 * atılmaz, **atlanır ve loglanmaz** — burada yapılacak doğru şey `unknown`
 * göstermek değil, listeyi kirletmemektir; eksik bilgi zaten aşağıdaki
 * `allergenNotice` tarafından yakalanır.
 */
export function productCodes(input: {
  allergens: readonly Allergen[];
  additives: readonly Additive[];
}): string[] {
  const allergens = ALLERGENS.filter((key) => input.allergens.includes(key)).map(
    (key) => ALLERGEN_CODES[key]
  );
  const additives = ADDITIVES.filter((key) => input.additives.includes(key)).map(
    (key) => ADDITIVE_CODES[key]
  );
  return [...allergens, ...additives];
}

/**
 * Ürünün alerjen bilgisi durumunun üç hâli.
 *
 * Bu ayrım yasal olarak kritiktir. "Boş liste" iki farklı şey demek olabilir:
 * işletmeci "bu üründe bildirimi zorunlu alerjen yok" demiş olabilir, ya da
 * bilgiyi hiç girmemiş olabilir. İlkini "yok" diye göstermek doğrudur;
 * ikincisini "yok" diye göstermek **yanlış beyandır** ve alerjik bir müşteride
 * doğrudan sağlık riskidir. Bu yüzden `allergenInfoConfirmed` bayrağı ayrı
 * tutulur ve burada üç ayrı sonuca çevrilir.
 */
export type AllergenNotice =
  /** Kodlar var, gösterilecek. */
  | { kind: "codes"; codes: string[] }
  /** İşletmeci bilinçle "bildirimi zorunlu madde yok" beyan etti. */
  | { kind: "none" }
  /** Bilgi girilmemiş — müşteriye sorması söylenir, "yok" denmez. */
  | { kind: "missing" };

export function allergenNotice(input: {
  allergens: readonly Allergen[];
  additives: readonly Additive[];
  allergenInfoConfirmed: boolean;
}): AllergenNotice {
  const codes = productCodes(input);
  if (codes.length > 0) return { kind: "codes", codes };
  if (input.allergenInfoConfirmed) return { kind: "none" };
  return { kind: "missing" };
}
