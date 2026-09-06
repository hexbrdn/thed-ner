import { promises as fs } from "node:fs";
import path from "node:path";
import { SPEISEKARTE, type MenuSection } from "@/data/speisekarte";
import { BUILDER_BASE_PRODUCT_ID, BUILDER_GROUPS_SEED } from "@/data/menu";
import { toCents } from "@/lib/money";
import {
  CATALOG_VERSION,
  effectivePrice,
  formatPrice,
  parsePrice,
  slugify,
  type BuilderConfig,
  type BuilderGroup,
  type BuilderOption,
  type Catalog,
  type Category,
  type Product,
  type PublicCategory,
  type Settings,
} from "./types";

/**
 * Dosya tabanlı katalog deposu.
 *
 * Projede veritabanı yok; tüm okuma/yazma bu modülde toplanmıştır. Başka bir
 * kalıcı katmana (Postgres, SQLite, Supabase …) geçilecekse yalnızca bu dosya
 * değiştirilir — API route'ları ve UI aynı kalır.
 *
 * NOT: Serverless platformlarda (Vercel, Netlify) dosya sistemi salt okunurdur.
 * Bu yüzden `catalog.json` repoda tutulur ve okuma her zaman çalışır; yazma
 * denemesi ise `StoreWriteError` ile başarısız olur ve admin arayüzüne anlamlı
 * bir mesaj döner. Kalıcı yazma için Node sunucusu (next start) veya gerçek bir
 * veritabanı gerekir.
 */

const STORE_DIR = path.join(process.cwd(), "data", "store");
const STORE_FILE = path.join(STORE_DIR, "catalog.json");

/** Eşzamanlı isteklerde read-modify-write kaybını önleyen basit kuyruk. */
let writeChain: Promise<unknown> = Promise.resolve();

function seed(): Catalog {
  const categories: Category[] = SPEISEKARTE.map((section, i) => ({
    id: section.id,
    name: section.title,
    nameTr: section.titleTr ?? "",
    note: section.note ?? "",
    noteTr: section.noteTr ?? "",
    sortOrder: i,
  }));

  const products: Product[] = SPEISEKARTE.flatMap((section, ci) =>
    section.items.map((item, ii) => {
      // Tek fiyatlı üründe `price`, çok boylu üründe `variants` dolu gelir.
      const variants = (item.variants ?? [])
        .map((v) => ({ size: v.size, price: parsePrice(v.price) }))
        .filter((v): v is { size: string; price: number } => v.price !== null);

      const base = item.price ? parsePrice(item.price) : null;

      return {
        // Aynı ad birden çok kategoride/satırda geçebiliyor (Pide, Lahmacun) →
        // numara ve sırayla nitele ki id benzersiz kalsın.
        id: `${section.id}--${slugify(item.name) || "urun"}-${item.no ?? ii + 1}`,
        no: item.no ?? "",
        name: item.name,
        nameTr: item.nameTr ?? "",
        description: item.desc ?? "",
        descriptionTr: item.descTr ?? "",
        categoryId: section.id,
        price: base ?? variants[0]?.price ?? 0,
        discountPrice: null,
        image: null,
        active: true,
        inStock: true,
        showOnHome: true,
        variants,
        sortOrder: ci * 1000 + ii,
      } satisfies Product;
    })
  );

  return {
    version: CATALOG_VERSION,
    categories,
    products,
    settings: defaultSettings(),
    builder: defaultBuilder(),
  };
}

/**
 * Servis ücreti varsayılanı.
 *
 * İşletme kendi tanıtım metinlerinde "adrese teslimat yok, gel-al" diyor;
 * bu yüzden varsayılan ücret 0. Paket servis başlatılırsa panelden açılır.
 */
function defaultSettings(): Settings {
  return { serviceFee: 0, freeServiceOver: 0 };
}

function defaultBuilder(): BuilderConfig {
  return {
    baseProductId: BUILDER_BASE_PRODUCT_ID,
    fallbackBasePrice: 0,
    groups: BUILDER_GROUPS_SEED,
  };
}

/**
 * Diskten okunan kaydı güncel şemaya tamamlar.
 *
 * Elle düzenlenmiş ya da eski sürümden kalmış kayıtlarda eksik alan olabilir;
 * burada varsayılanları verilir, böylece UI hiçbir zaman `undefined` görmez.
 */
function normalize(catalog: Catalog): Catalog {
  const categories = (catalog.categories as Partial<Category>[]).map((c) => ({
    id: String(c.id),
    name: c.name ?? "",
    nameTr: c.nameTr ?? "",
    note: c.note ?? "",
    noteTr: c.noteTr ?? "",
    sortOrder: c.sortOrder ?? 0,
  }));

  const products = (catalog.products as Partial<Product>[]).map((p) => ({
    id: String(p.id),
    no: p.no ?? "",
    name: p.name ?? "",
    nameTr: p.nameTr ?? "",
    description: p.description ?? "",
    descriptionTr: p.descriptionTr ?? "",
    categoryId: p.categoryId ?? "",
    price: p.price ?? 0,
    discountPrice: p.discountPrice ?? null,
    image: p.image ?? null,
    active: p.active ?? true,
    inStock: p.inStock ?? true,
    // Eski kayıtlarda alan yok: varsayılan görünür olsun ki ürün kaybolmasın.
    showOnHome: p.showOnHome ?? true,
    variants: p.variants ?? [],
    sortOrder: p.sortOrder ?? 0,
  }));

  return {
    version: CATALOG_VERSION,
    categories,
    products,
    settings: normalizeSettings(catalog.settings),
    builder: normalizeBuilder(catalog.builder),
  };
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeSettings(raw: Partial<Settings> | undefined): Settings {
  const base = defaultSettings();
  if (!raw || typeof raw !== "object") return base;
  return {
    serviceFee: num(raw.serviceFee, base.serviceFee),
    freeServiceOver: num(raw.freeServiceOver, base.freeServiceOver),
  };
}

/**
 * Yapılandırıcı ayarını tamamlar.
 *
 * Grup **kimlikleri ve sırası** kod tarafından belirlenir (arayüz onlara göre
 * kurulu); panelden değiştirilen şey seçeneklerin ek ücreti/metnidir. Depoda
 * eksik grup varsa tohumdaki hâli kullanılır, böylece bölüm hiç boş kalmaz.
 */
function normalizeBuilder(raw: Partial<BuilderConfig> | undefined): BuilderConfig {
  const base = defaultBuilder();
  if (!raw || typeof raw !== "object") return base;

  const stored = new Map(
    (Array.isArray(raw.groups) ? raw.groups : []).map((g) => [g?.id, g] as const)
  );

  const groups: BuilderGroup[] = base.groups.map((seedGroup) => {
    const found = stored.get(seedGroup.id);
    if (!found || !Array.isArray(found.options) || found.options.length === 0) return seedGroup;

    const options: BuilderOption[] = found.options
      .filter((o): o is BuilderOption => Boolean(o) && typeof o.id === "string")
      .map((o) => {
        const seedOption = seedGroup.options.find((x) => x.id === o.id);
        return {
          id: o.id,
          label: o.label ?? seedOption?.label ?? o.id,
          labelDe: o.labelDe ?? seedOption?.labelDe ?? o.label ?? o.id,
          desc: o.desc ?? seedOption?.desc ?? "",
          descDe: o.descDe ?? seedOption?.descDe ?? "",
          price: num(o.price, 0),
          kcal: num(o.kcal, seedOption?.kcal ?? 0),
          image: o.image ?? seedOption?.image ?? null,
        };
      });

    return { id: seedGroup.id, mode: seedGroup.mode, options };
  });

  return {
    baseProductId:
      typeof raw.baseProductId === "string" && raw.baseProductId
        ? raw.baseProductId
        : raw.baseProductId === null
          ? null
          : base.baseProductId,
    fallbackBasePrice: num(raw.fallbackBasePrice, base.fallbackBasePrice),
    groups,
  };
}

async function readCatalog(): Promise<Catalog> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Catalog>;
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.products)) {
      throw new Error("catalog.json beklenen şekilde değil");
    }
    // v1 gerçek karta öncesi demo menüsü: içeriği artık geçerli değil, yeniden kur.
    if ((parsed.version ?? 1) < 2) throw new Error("catalog.json eski sürüm");

    // v2 → v3 göçü: ürün ve kategoriler olduğu gibi korunur, yalnızca yeni
    // alanlar (settings/builder) varsayılanlarıyla tamamlanır. Admin panelinde
    // yapılmış fiyat/durum değişiklikleri sürüm yükseltmesinde kaybolmaz.
    return normalize(parsed as Catalog);
  } catch {
    // dosya yok veya bozuk: mevcut menü verisinden yeniden kur.
    // Kalıcılaştırma en iyi çaba: salt okunur ortamda yazma başarısız olsa da
    // katalog bellekte kullanılabilir olmalı, sayfa çökmemeli.
    const fresh = seed();
    try {
      await writeCatalog(fresh);
    } catch {
      // yoksay: okuma yolu yazmaya bağlı değil
    }
    return fresh;
  }
}

/** Yazma reddedildiğinde (ör. salt okunur serverless dosya sistemi) fırlatılır. */
export class StoreWriteError extends Error {
  constructor(cause: unknown) {
    super(
      "Katalog kaydedilemedi: bu ortamda dosya sistemi salt okunur. " +
        "Değişiklikleri kalıcı kılmak için kalıcı bir veri katmanı gerekiyor."
    );
    this.name = "StoreWriteError";
    this.cause = cause;
  }
}

async function writeCatalog(catalog: Catalog): Promise<void> {
  try {
    await fs.mkdir(STORE_DIR, { recursive: true });
    const tmp = `${STORE_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(catalog, null, 2), "utf8");
    // atomik değiştirme: yazma yarıda kalırsa mevcut dosya bozulmaz
    await fs.rename(tmp, STORE_FILE);
  } catch (error) {
    throw new StoreWriteError(error);
  }
}

/** Okuma-değiştirme-yazma işlemlerini sıraya alır. */
function transaction<T>(fn: (catalog: Catalog) => Promise<T> | T): Promise<T> {
  const next = writeChain.then(async () => {
    const catalog = await readCatalog();
    return fn(catalog);
  });
  writeChain = next.catch(() => undefined);
  return next;
}

/* ------------------------------------------------------------------ okuma */

export async function getCatalog(): Promise<Catalog> {
  return readCatalog();
}

/** Ürün müşteriye gösterilir mi: üç anahtarın da açık olması gerekir. */
export function isVisible(product: Product): boolean {
  return product.active && product.inStock && product.showOnHome;
}

/**
 * Müşteri tarafı: yalnızca gösterilebilir ürünler, kategori sırasına göre
 * gruplanmış. Hiç ürünü kalmayan kategori listeye girmez.
 */
export async function getPublicMenu(): Promise<PublicCategory[]> {
  const { categories, products } = await readCatalog();
  return categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((cat) => ({
      ...cat,
      products: products
        .filter((p) => p.categoryId === cat.id && isVisible(p))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter((cat) => cat.products.length > 0);
}

/**
 * Kartanın (`/speisekarte`) beklediği görünüm.
 *
 * `data/speisekarte.ts` ile aynı şekli üretir; böylece MenuGrid tarafında
 * gösterim mantığı değişmeden veri kaynağı depoya taşınmış olur.
 */
export async function getMenuSections(): Promise<MenuSection[]> {
  const categories = await getPublicMenu();
  return categories.map((cat) => ({
    id: cat.id,
    title: cat.name,
    titleTr: cat.nameTr || undefined,
    note: cat.note || undefined,
    noteTr: cat.noteTr || undefined,
    items: cat.products.map((p) => ({
      no: p.no || undefined,
      name: p.name,
      nameTr: p.nameTr || undefined,
      desc: p.description || undefined,
      descTr: p.descriptionTr || undefined,
      image: p.image ?? undefined,
      // Varyasyonlu üründe satırda tek fiyat değil, boy listesi gösterilir.
      price:
        p.variants.length > 0
          ? undefined
          : formatPrice(p.discountPrice ?? p.price),
      oldPrice:
        p.variants.length > 0 || p.discountPrice === null
          ? undefined
          : formatPrice(p.price),
      variants:
        p.variants.length > 0
          ? p.variants.map((v) => ({ size: v.size, price: formatPrice(v.price) }))
          : undefined,
    })),
  }));
}

export async function getStats() {
  const { categories, products } = await readCatalog();
  return {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.active).length,
    passiveProducts: products.filter((p) => !p.active).length,
    outOfStock: products.filter((p) => !p.inStock).length,
    hiddenFromMenu: products.filter((p) => p.active && !p.showOnHome).length,
    visibleProducts: products.filter(isVisible).length,
    discounted: products.filter((p) => p.discountPrice !== null).length,
    categories: categories.length,
  };
}

/* ------------------------------------------------------------------ yazma */

export type ProductInput = Omit<Product, "id" | "sortOrder">;

/** Güncellemede sıra da değiştirilebilir; oluşturmada sıra otomatik verilir. */
export type ProductPatch = Partial<ProductInput & Pick<Product, "sortOrder">>;

export async function createProduct(
  input: ProductInput & { id: string }
): Promise<Product> {
  return transaction(async (catalog) => {
    let id = input.id;
    let n = 2;
    while (catalog.products.some((p) => p.id === id)) id = `${input.id}-${n++}`;

    const maxSort = catalog.products.reduce((m, p) => Math.max(m, p.sortOrder), 0);
    const product: Product = { ...input, id, sortOrder: maxSort + 1 };
    catalog.products.push(product);
    await writeCatalog(catalog);
    return product;
  });
}

export async function updateProduct(
  id: string,
  patch: ProductPatch
): Promise<Product | null> {
  return transaction(async (catalog) => {
    const index = catalog.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const updated = { ...catalog.products[index], ...patch };
    catalog.products[index] = updated;
    await writeCatalog(catalog);
    return updated;
  });
}

export async function deleteProduct(id: string): Promise<boolean> {
  return transaction(async (catalog) => {
    const before = catalog.products.length;
    catalog.products = catalog.products.filter((p) => p.id !== id);
    if (catalog.products.length === before) return false;
    await writeCatalog(catalog);
    return true;
  });
}

export async function createCategory(name: string, id: string): Promise<Category> {
  return transaction(async (catalog) => {
    let unique = id;
    let n = 2;
    while (catalog.categories.some((c) => c.id === unique)) unique = `${id}-${n++}`;

    const maxSort = catalog.categories.reduce((m, c) => Math.max(m, c.sortOrder), 0);
    const category: Category = {
      id: unique,
      name,
      nameTr: "",
      note: "",
      noteTr: "",
      sortOrder: maxSort + 1,
    };
    catalog.categories.push(category);
    await writeCatalog(catalog);
    return category;
  });
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, "name" | "sortOrder">>
): Promise<Category | null> {
  return transaction(async (catalog) => {
    const index = catalog.categories.findIndex((c) => c.id === id);
    if (index === -1) return null;
    catalog.categories[index] = { ...catalog.categories[index], ...patch };
    await writeCatalog(catalog);
    return catalog.categories[index];
  });
}

export type DeleteCategoryResult =
  | { ok: true }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "has_products"; count: number };

/** Ürünü olan kategori silinmez — ürünler sahipsiz kalmasın. */
export async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  return transaction(async (catalog) => {
    if (!catalog.categories.some((c) => c.id === id)) {
      return { ok: false, reason: "not_found" } as const;
    }
    const used = catalog.products.filter((p) => p.categoryId === id).length;
    if (used > 0) {
      return { ok: false, reason: "has_products", count: used } as const;
    }
    catalog.categories = catalog.categories.filter((c) => c.id !== id);
    await writeCatalog(catalog);
    return { ok: true } as const;
  });
}

/* ---------------------------------------------------------------- ayarlar */

export async function getSettings(): Promise<Settings> {
  return (await readCatalog()).settings;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return transaction(async (catalog) => {
    catalog.settings = { ...catalog.settings, ...patch };
    await writeCatalog(catalog);
    return catalog.settings;
  });
}

/* --------------------------------------------------------- yapılandırıcı */

export async function getBuilderConfig(): Promise<BuilderConfig> {
  return (await readCatalog()).builder;
}

/**
 * Yapılandırıcının taban fiyatı.
 *
 * Katalogdaki gerçek ürünün (varsayılan: menüdeki döner) güncel satış fiyatı
 * kullanılır — indirim varsa indirimli olan. Ürün silinmiş/bulunamıyorsa
 * `fallbackBasePrice` devreye girer.
 */
function resolveBasePrice(catalog: Catalog): number {
  const { baseProductId, fallbackBasePrice } = catalog.builder;
  if (!baseProductId) return fallbackBasePrice;
  const product = catalog.products.find((p) => p.id === baseProductId);
  return product ? effectivePrice(product) : fallbackBasePrice;
}

/** Müşteri tarafına gönderilen yapılandırıcı görünümü (taban fiyat çözülmüş). */
export type PublicBuilder = {
  basePriceCents: number;
  baseProductName: string | null;
  groups: BuilderGroup[];
};

export async function getPublicBuilder(): Promise<PublicBuilder> {
  const catalog = await readCatalog();
  const product = catalog.builder.baseProductId
    ? catalog.products.find((p) => p.id === catalog.builder.baseProductId)
    : undefined;
  return {
    basePriceCents: toCents(resolveBasePrice(catalog)),
    baseProductName: product?.name ?? null,
    groups: catalog.builder.groups,
  };
}

export async function updateBuilder(patch: Partial<BuilderConfig>): Promise<BuilderConfig> {
  return transaction(async (catalog) => {
    catalog.builder = { ...catalog.builder, ...patch };
    await writeCatalog(catalog);
    return catalog.builder;
  });
}

/* -------------------------------------------------------------- fiyatlama */

/**
 * Sepet satırının **istemciden gelen tarifi**.
 *
 * Dikkat: burada fiyat yoktur ve olmamalıdır. İstemci yalnızca "hangi ürün,
 * hangi boy, hangi seçenekler, kaç adet" der; para hesabını her zaman sunucu
 * yapar. Böylece istek gövdesi kurcalanarak fiyat değiştirilemez.
 */
export type CartLineInput =
  | { kind: "product"; productId: string; variantSize?: string; qty: number }
  | {
      kind: "builder";
      bread: string;
      protein: string;
      sauce: string;
      veggies: string[];
      qty: number;
    };

export type PricedLine = {
  /** Sepette satırı benzersiz kılan anahtar (aynı yapılandırma = aynı satır). */
  key: string;
  input: CartLineInput;
  label: string;
  detail: string;
  unitCents: number;
  lineCents: number;
  kcal: number;
  qty: number;
  /** Ürün menüden kalktıysa/silindiyse true; toplama dahil edilmez. */
  unavailable: boolean;
};

export type Quote = {
  lines: PricedLine[];
  subtotalCents: number;
  serviceFeeCents: number;
  totalCents: number;
  /** Ücretsiz servise kalan tutar; eşik yoksa veya aşıldıysa 0. */
  remainingForFreeServiceCents: number;
  freeServiceOverCents: number;
  currency: "EUR";
};

const MAX_QTY = 99;

function clampQty(qty: unknown): number {
  const n = typeof qty === "number" ? Math.floor(qty) : Number.NaN;
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_QTY);
}

function optionLabel(option: BuilderOption, lang: "tr" | "de"): string {
  return lang === "de" ? option.labelDe || option.label : option.label;
}

export function builderKey(input: Extract<CartLineInput, { kind: "builder" }>): string {
  const veggies = Array.isArray(input.veggies) ? input.veggies.slice().sort().join(",") : "";
  return `builder:${input.bread}|${input.protein}|${input.sauce}|${veggies}`;
}

export function productKey(productId: string, variantSize?: string): string {
  return `product:${productId}|${variantSize ?? ""}`;
}

function priceBuilderLine(
  catalog: Catalog,
  input: Extract<CartLineInput, { kind: "builder" }>,
  lang: "tr" | "de"
): PricedLine {
  const groups = new Map(catalog.builder.groups.map((g) => [g.id, g] as const));

  /** Seçim bulunamazsa gruptaki ilk seçeneğe düşülür; satır fiyatsız kalmaz. */
  const pick = (groupId: "bread" | "protein" | "sauce", id: string): BuilderOption | null => {
    const group = groups.get(groupId);
    if (!group) return null;
    return group.options.find((o) => o.id === id) ?? group.options[0] ?? null;
  };

  const bread = pick("bread", input.bread);
  const protein = pick("protein", input.protein);
  const sauce = pick("sauce", input.sauce);
  const veggieGroup = groups.get("veggies");
  const veggies = (veggieGroup?.options ?? []).filter((o) =>
    Array.isArray(input.veggies) ? input.veggies.includes(o.id) : false
  );

  const chosen = [bread, protein, sauce].filter((o): o is BuilderOption => o !== null);
  const unitCents =
    toCents(resolveBasePrice(catalog)) +
    [...chosen, ...veggies].reduce((sum, o) => sum + toCents(o.price), 0);
  const kcal = [...chosen, ...veggies].reduce((sum, o) => sum + o.kcal, 0);

  const qty = clampQty(input.qty);
  const names = chosen.map((o) => optionLabel(o, lang)).join(" • ");
  const veggieNames = veggies.map((o) => optionLabel(o, lang)).join(", ");

  const resolved: Extract<CartLineInput, { kind: "builder" }> = {
    kind: "builder",
    bread: bread?.id ?? input.bread,
    protein: protein?.id ?? input.protein,
    sauce: sauce?.id ?? input.sauce,
    veggies: veggies.map((o) => o.id),
    qty,
  };

  return {
    key: builderKey(resolved),
    input: resolved,
    label: lang === "de" ? "Döner nach Wunsch" : "Kendin Hazırla Döner",
    detail: veggieNames
      ? `${names} • ${veggieNames}`
      : `${names} • ${lang === "de" ? "ohne Gemüse" : "sebzesiz"}`,
    unitCents,
    lineCents: unitCents * qty,
    kcal,
    qty,
    unavailable: chosen.length === 0,
  };
}

function priceProductLine(
  catalog: Catalog,
  input: Extract<CartLineInput, { kind: "product" }>,
  lang: "tr" | "de"
): PricedLine {
  const qty = clampQty(input.qty);
  const product = catalog.products.find((p) => p.id === input.productId);
  const key = productKey(input.productId, input.variantSize);

  if (!product || !isVisible(product)) {
    return {
      key,
      input: { ...input, qty },
      label: product?.name ?? input.productId,
      detail: "",
      unitCents: 0,
      lineCents: 0,
      kcal: 0,
      qty,
      unavailable: true,
    };
  }

  // Boy seçilmişse o boyun fiyatı geçerlidir; boy artık yoksa satır düşer.
  const variant = input.variantSize
    ? product.variants.find((v) => v.size === input.variantSize)
    : undefined;
  if (input.variantSize && !variant) {
    return {
      key,
      input: { ...input, qty },
      label: product.name,
      detail: input.variantSize,
      unitCents: 0,
      lineCents: 0,
      kcal: 0,
      qty,
      unavailable: true,
    };
  }

  const unitCents = toCents(variant ? variant.price : effectivePrice(product));
  const label = lang === "tr" ? product.nameTr || product.name : product.name;
  const desc = lang === "tr" ? product.descriptionTr || product.description : product.description;

  return {
    key,
    input: { ...input, qty },
    label,
    detail: variant ? [variant.size, desc].filter(Boolean).join(" — ") : desc,
    unitCents,
    lineCents: unitCents * qty,
    kcal: 0,
    qty,
    unavailable: false,
  };
}

/**
 * Sepetin **tek geçerli** fiyat hesabı.
 *
 * Yapılandırıcı, sepet çekmecesi, ödeme adımı ve sipariş ucu aynı bu fonksiyonu
 * kullanır; dolayısıyla ekranda görünen tutarla siparişe yazılan tutarın
 * ayrışması mümkün değildir.
 */
export async function priceCart(
  inputs: CartLineInput[],
  lang: "tr" | "de" = "tr"
): Promise<Quote> {
  const catalog = await readCatalog();

  const lines = inputs
    .slice(0, 60)
    .map((input) =>
      input.kind === "builder"
        ? priceBuilderLine(catalog, input, lang)
        : priceProductLine(catalog, input, lang)
    );

  const subtotalCents = lines
    .filter((l) => !l.unavailable)
    .reduce((sum, l) => sum + l.lineCents, 0);

  const { serviceFee, freeServiceOver } = catalog.settings;
  const feeCents = toCents(serviceFee);
  const thresholdCents = toCents(freeServiceOver);
  const waived = subtotalCents === 0 || (thresholdCents > 0 && subtotalCents >= thresholdCents);
  const serviceFeeCents = waived ? 0 : feeCents;

  return {
    lines,
    subtotalCents,
    serviceFeeCents,
    totalCents: subtotalCents + serviceFeeCents,
    remainingForFreeServiceCents:
      thresholdCents > 0 && subtotalCents > 0 && subtotalCents < thresholdCents
        ? thresholdCents - subtotalCents
        : 0,
    freeServiceOverCents: thresholdCents,
    currency: "EUR",
  };
}

/**
 * Ana sayfadaki "öne çıkan lezzetler" bölümü.
 *
 * Sabit liste yerine katalogdan gelir: fiyat, ad ve görünürlük admin panelinden
 * yönetilir. Görseli olan ürünler öne alınır, yoksa sıraya göre doldurulur.
 */
export async function getFeaturedProducts(limit = 3): Promise<Product[]> {
  const { products } = await readCatalog();
  const visible = products.filter(isVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  const withImage = visible.filter((p) => p.image);
  return [...withImage, ...visible.filter((p) => !p.image)].slice(0, limit);
}
