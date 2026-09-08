import { formatEuro } from "@/lib/money";

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
  /**
   * "Öne çıkanlar" vitrinine alınmış mı.
   *
   * Ana sayfadaki kısa liste ve karta sayfasının en üstü buna bakar. Ürünün
   * menüde görünmesiyle ilgisi yoktur: `showOnHome` ürünü menüde tutar,
   * `featured` onu vitrine çıkarır.
   */
  featured: boolean;
  variants: Variant[];
  /** Menüdeki sıra; küçük olan üstte. */
  sortOrder: number;

  /**
   * KDV oranı (7 veya 19) — sabit değil, **ürün başına**.
   * Steueränderungsgesetz 2025 (§ 12 Abs. 2 Nr. 15 UStG) ile 01.01.2026'dan
   * beri tüm yemekler %7, tüm içecekler %19.
   */
  vatRate: number;
  /** LMIV Ek II — bildirimi zorunlu alerjenler. */
  allergens: Allergen[];
  /** ZZulV — yazılı bildirimi zorunlu katkı maddesi sınıfları. */
  additives: Additive[];
  /**
   * Boş liste "bilgi girilmedi" ile "madde yok" arasında ayrım yapamaz;
   * bu bayrak işletmecinin bilinçli "yok" beyanını kaydeder. False ise ürün
   * eksik bilgiyle yayında sayılır.
   */
  allergenInfoConfirmed: boolean;
  /**
   * § 312g Abs. 2 BGB — cayma hakkı istisnası yalnızca çabuk bozulan malda.
   * Kapalı şişe içecek bozulmaz; istisnaya girmez.
   */
  isPerishable: boolean;
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

/* ------------------------------------------------------- döner yapılandırıcı */

/**
 * "Kendin Seç" bölümündeki tek bir seçenek (ekmek türü, ekstra et, sos …).
 *
 * `price` bir **ek ücrettir** (Euro), taban fiyatın üstüne biner. 0 = dahil.
 * Fiyat burada, yani katalogda durur; arayüzde sabit fiyat tutulmaz.
 */
export type BuilderOption = {
  id: string;
  label: string;
  labelDe: string;
  desc: string;
  descDe: string;
  /** Taban fiyata eklenen ücret (€). */
  price: number;
  kcal: number;
  image: string | null;
};

export type BuilderGroupId = "bread" | "protein" | "veggies" | "sauce";

export type BuilderGroup = {
  id: BuilderGroupId;
  /** "single" = tek seçim zorunlu, "multi" = istediğin kadar. */
  mode: "single" | "multi";
  options: BuilderOption[];
};

export type BuilderConfig = {
  /**
   * Taban fiyatın okunacağı katalog ürünü. Ürün silinir/bulunamazsa
   * `fallbackBasePrice` kullanılır — yapılandırıcı fiyatsız kalmasın.
   */
  baseProductId: string | null;
  fallbackBasePrice: number;
  groups: BuilderGroup[];
};

/** Sipariş toplamına eklenen ücretler. Admin panelinden yönetilir. */
export type Settings = {
  /** Paket/servis ücreti (€). 0 = ücret alınmıyor. */
  serviceFee: number;
  /**
   * Bu tutarın üstündeki siparişlerde servis ücreti alınmaz.
   * 0 = eşik yok (ücret her zaman uygulanır).
   */
  freeServiceOver: number;
};

export type Catalog = {
  /** Şema sürümü. Artarsa depo göç ettirilir (bkz. store/migrate). */
  version: number;
  categories: Category[];
  products: Product[];
  settings: Settings;
  builder: BuilderConfig;
};

/**
 * Depodaki şema sürümü.
 *
 * 1 → eski demo menüsü (`data/menu.ts`).
 * 2 → gerçek karta (`data/speisekarte.ts`) + no/TR alanları + showOnHome.
 * 3 → fiyat tek kaynağa taşındı: `settings` (servis ücreti) ve `builder`
 *     (kendin seç seçenekleri + ek ücretleri) katalogun parçası oldu.
 *     Göç sırasında ürün/kategori kayıtları korunur.
 */
export const CATALOG_VERSION = 3;

/** Müşteri tarafına gönderilen, kategorileriyle gruplanmış görünüm. */
export type PublicCategory = Category & { products: Product[] };

/** Katalogdaki Euro değerini "7,50 €" biçiminde gösterir. */
export function formatPrice(value: number): string {
  return formatEuro(value);
}

/** Ürünün geçerli satış fiyatı: indirim varsa indirimli olan. */
export function effectivePrice(product: Pick<Product, "price" | "discountPrice">): number {
  return product.discountPrice ?? product.price;
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

/* ------------------------------------------- alerjen ve katkı maddesi (yasal) */

/**
 * LMIV (AB 1169/2011) Ek II — bildirimi zorunlu 14 alerjen.
 *
 * Art. 14/44 uyarınca bu bilgi, sipariş **bağlayıcı hale gelmeden önce**
 * verilmek zorundadır; yalnızca sipariş onayında göstermek yeterli değildir.
 * Açık satılan üründe (döner tam olarak budur) de geçerlidir.
 */
export const ALLERGENS = [
  "GLUTEN",
  "CRUSTACEANS",
  "EGGS",
  "FISH",
  "PEANUTS",
  "SOYBEANS",
  "MILK",
  "NUTS",
  "CELERY",
  "MUSTARD",
  "SESAME",
  "SULPHITES",
  "LUPIN",
  "MOLLUSCS",
] as const;

export type Allergen = (typeof ALLERGENS)[number];

export const ALLERGEN_LABELS: Record<Allergen, { de: string; tr: string }> = {
  GLUTEN: { de: "Glutenhaltiges Getreide", tr: "Glüten içeren tahıllar" },
  CRUSTACEANS: { de: "Krebstiere", tr: "Kabuklu deniz ürünleri" },
  EGGS: { de: "Eier", tr: "Yumurta" },
  FISH: { de: "Fisch", tr: "Balık" },
  PEANUTS: { de: "Erdnüsse", tr: "Yer fıstığı" },
  SOYBEANS: { de: "Soja", tr: "Soya" },
  MILK: { de: "Milch (inkl. Laktose)", tr: "Süt (laktoz dahil)" },
  NUTS: { de: "Schalenfrüchte (Nüsse)", tr: "Sert kabuklu yemişler" },
  CELERY: { de: "Sellerie", tr: "Kereviz" },
  MUSTARD: { de: "Senf", tr: "Hardal" },
  SESAME: { de: "Sesamsamen", tr: "Susam" },
  SULPHITES: { de: "Schwefeldioxid und Sulphite", tr: "Kükürt dioksit ve sülfitler" },
  LUPIN: { de: "Lupinen", tr: "Acı bakla" },
  MOLLUSCS: { de: "Weichtiere", tr: "Yumuşakçalar" },
};

/**
 * ZZulV — kenntlichmachungspflichtige katkı maddesi sınıfları.
 *
 * LMIV alerjenlerinden **ayrı** bir Alman yükümlülüğü. İşlevsel sınıf adı
 * yeterlidir ("mit Farbstoff"), tek tek E-numarası gerekmez; ama bildirimin
 * **yazılı** olması şarttır — "personele sorunuz" katkı maddelerinde geçerli
 * bir bildirim değildir.
 */
export const ADDITIVES = [
  "FARBSTOFF",
  "KONSERVIERUNGSSTOFF",
  "ANTIOXIDATIONSMITTEL",
  "GESCHMACKSVERSTAERKER",
  "GESCHWEFELT",
  "GESCHWAERZT",
  "GEWACHST",
  "PHOSPHAT",
  "SUESSUNGSMITTEL",
  "PHENYLALANINQUELLE",
  "ABFUEHREND",
  "KOFFEINHALTIG",
  "CHININHALTIG",
  "TAURINHALTIG",
] as const;

export type Additive = (typeof ADDITIVES)[number];

/** Almanca metinler yasal ifadelerdir; serbestçe değiştirilmemeli. */
export const ADDITIVE_LABELS: Record<Additive, { de: string; tr: string }> = {
  FARBSTOFF: { de: "mit Farbstoff", tr: "renklendirici içerir" },
  KONSERVIERUNGSSTOFF: { de: "mit Konservierungsstoff", tr: "koruyucu içerir" },
  ANTIOXIDATIONSMITTEL: { de: "mit Antioxidationsmittel", tr: "antioksidan içerir" },
  GESCHMACKSVERSTAERKER: { de: "mit Geschmacksverstärker", tr: "aroma güçlendirici içerir" },
  GESCHWEFELT: { de: "geschwefelt", tr: "kükürtlenmiş" },
  GESCHWAERZT: { de: "geschwärzt", tr: "siyahlaştırılmış" },
  GEWACHST: { de: "gewachst", tr: "mumlanmış" },
  PHOSPHAT: { de: "mit Phosphat", tr: "fosfat içerir" },
  SUESSUNGSMITTEL: { de: "mit Süßungsmittel", tr: "tatlandırıcı içerir" },
  PHENYLALANINQUELLE: { de: "enthält eine Phenylalaninquelle", tr: "fenilalanin kaynağı içerir" },
  ABFUEHREND: { de: "kann bei übermäßigem Verzehr abführend wirken", tr: "aşırı tüketimde laksatif etki" },
  KOFFEINHALTIG: { de: "koffeinhaltig", tr: "kafein içerir" },
  CHININHALTIG: { de: "chininhaltig", tr: "kinin içerir" },
  TAURINHALTIG: { de: "taurinhaltig", tr: "taurin içerir" },
};

/** Geçerli KDV oranları. Başka bir değer kabul edilmez. */
export const VAT_RATES = [7, 19] as const;

/**
 * Bir ürünün yasal bilgi bakımından yayına hazır olup olmadığı.
 *
 * Alerjen listesi boş bırakılabilir — ama bu ancak işletmeci "bu üründe
 * bildirimi zorunlu alerjen yok" beyanını onayladıysa geçerlidir.
 */
export function hasLegalInfo(
  product: Pick<Product, "allergens" | "allergenInfoConfirmed">
): boolean {
  return product.allergens.length > 0 || product.allergenInfoConfirmed;
}
