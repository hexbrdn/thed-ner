/**
 * Katalog veri modeli.
 *
 * Mevcut `data/menu.ts` yapısı (isim, açıklama, boyut varyasyonları) korunur;
 * üzerine admin panelinin ihtiyaç duyduğu alanlar eklenir: indirimli fiyat,
 * aktif/pasif ve stok durumu.
 *
 * Fiyatlar burada **sayı** olarak (Euro) tutulur; gösterimdeki "7,00 €"
 * biçimlendirmesi `formatPrice` ile yapılır. Kaynak dosyadaki string fiyatlar
 * seed sırasında bir kez parse edilir.
 */

export type Variant = {
  /** "kl.", "gr.", "0,5 l", "Rolle" – tek fiyatlı üründe boş string */
  size: string;
  price: number;
};

export type Product = {
  id: string;
  /** Menüdeki sipariş numarası ("01", "80"). İçeceklerde yoktur. */
  no: string;
  name: string;
  /** Türkçe ad; boşsa müşteri tarafında Almanca `name` kullanılır. */
  nameTr: string;
  description: string;
  /** Türkçe açıklama; boşsa `description` kullanılır. */
  descriptionTr: string;
  categoryId: string;
  /** Varyasyonlu üründe ilk varyasyonun fiyatı; liste/sıralama için taban */
  price: number;
  /** null = indirim yok. Set edilmişse müşteri tarafında üstü çizili fiyat gösterilir. */
  discountPrice: number | null;
  image: string | null;
  /** Ürünün kaydı yayında mı. Pasifse müşteri tarafında hiç görünmez. */
  active: boolean;
  /** Gün içi stok durumu. Tükendiyse menüden düşer. */
  inStock: boolean;
  /** Aktif olsa bile menü/ana sayfa listesinde gösterilsin mi. */
  showOnHome: boolean;
  variants: Variant[];
  /** Menüdeki sıra; küçük olan üstte. */
  sortOrder: number;
};

export type Category = {
  id: string;
  name: string;
  /** Türkçe kategori başlığı; boşsa `name` kullanılır. */
  nameTr: string;
  /** Kategorinin tamamı için geçerli not (ekstra malzeme, depozito …). */
  note: string;
  noteTr: string;
  sortOrder: number;
};

export type Catalog = {
  /** Şema sürümü. Artarsa depo kaynak menüden yeniden kurulur. */
  version: number;
  categories: Category[];
  products: Product[];
};

/**
 * Depodaki şema sürümü.
 *
 * 1 → eski demo menüsü (`data/menu.ts`).
 * 2 → gerçek karta (`data/speisekarte.ts`) + no/TR alanları + showOnHome.
 */
export const CATALOG_VERSION = 2;

/** Müşteri tarafına gönderilen, kategorileriyle gruplanmış görünüm. */
export type PublicCategory = Category & { products: Product[] };

export function formatPrice(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

/** "7,00 €" / "+ 1,00 €" → 7 / 1. Parse edilemezse null. */
export function parsePrice(raw: string): number | null {
  const match = raw.replace(/\s/g, "").match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

/** İsimden URL/id dostu slug üretir; çakışmayı çağıran taraf çözer. */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    ä: "ae", ö: "oe", ü: "ue", ß: "ss",
    ı: "i", İ: "i", ş: "s", ğ: "g", ç: "c",
  };
  return input
    .toLowerCase()
    .replace(/[äöüßıİşğç]/g, (c) => map[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
