import { promises as fs } from "node:fs";
import path from "node:path";
import { SPEISEKARTE, type MenuSection } from "@/data/speisekarte";
import {
  CATALOG_VERSION,
  formatPrice,
  parsePrice,
  slugify,
  type Catalog,
  type Category,
  type Product,
  type PublicCategory,
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

  return { version: CATALOG_VERSION, categories, products };
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

  return { version: CATALOG_VERSION, categories, products };
}

async function readCatalog(): Promise<Catalog> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Catalog>;
    if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.products)) {
      throw new Error("catalog.json beklenen şekilde değil");
    }
    // Eski şema (ör. demo menüsünden kurulmuş v1 deposu): kaynaktan yeniden kur.
    if ((parsed.version ?? 1) !== CATALOG_VERSION) {
      throw new Error("catalog.json eski sürüm");
    }
    return normalize({
      version: CATALOG_VERSION,
      categories: parsed.categories,
      products: parsed.products,
    });
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
