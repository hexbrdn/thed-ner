import { promises as fs } from "node:fs";
import path from "node:path";
import { MENU_CATEGORIES } from "@/data/menu";
import {
  parsePrice,
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
 * NOT: Serverless platformlarda (Vercel, Netlify) dosya sistemi geçicidir.
 * Kalıcı yazma için Node sunucusu (next start) veya gerçek bir veritabanı gerekir.
 */

const STORE_DIR = path.join(process.cwd(), "data", "store");
const STORE_FILE = path.join(STORE_DIR, "catalog.json");

/** Eşzamanlı isteklerde read-modify-write kaybını önleyen basit kuyruk. */
let writeChain: Promise<unknown> = Promise.resolve();

function seed(): Catalog {
  const categories: Category[] = MENU_CATEGORIES.map((cat, i) => ({
    id: cat.id,
    name: cat.title,
    sortOrder: i,
  }));

  const products: Product[] = MENU_CATEGORIES.flatMap((cat, ci) =>
    cat.items.map((item, ii) => {
      const variants = item.variants
        .map((v) => ({ size: v.size, price: parsePrice(v.price) }))
        .filter((v): v is { size: string; price: number } => v.price !== null);

      return {
        // aynı ürün id'si iki kategoride geçebiliyor (ör. lahmacun) → kategoriyle nitele
        id: `${cat.id}--${item.id}`,
        name: item.name,
        description: item.desc,
        categoryId: cat.id,
        price: variants[0]?.price ?? 0,
        discountPrice: null,
        image: item.image ?? null,
        active: true,
        inStock: true,
        variants,
        sortOrder: ci * 100 + ii,
      };
    })
  );

  return { categories, products };
}

async function readCatalog(): Promise<Catalog> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Catalog>;
    if (Array.isArray(parsed.categories) && Array.isArray(parsed.products)) {
      return { categories: parsed.categories, products: parsed.products };
    }
    throw new Error("catalog.json beklenen şekilde değil");
  } catch {
    // dosya yok veya bozuk: mevcut menü verisinden yeniden kur
    const fresh = seed();
    await writeCatalog(fresh);
    return fresh;
  }
}

async function writeCatalog(catalog: Catalog): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(catalog, null, 2), "utf8");
  // atomik değiştirme: yazma yarıda kalırsa mevcut dosya bozulmaz
  await fs.rename(tmp, STORE_FILE);
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

/** Müşteri tarafı: yalnızca aktif ürünler, kategori sırasına göre gruplanmış. */
export async function getPublicMenu(): Promise<PublicCategory[]> {
  const { categories, products } = await readCatalog();
  return categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((cat) => ({
      ...cat,
      products: products
        .filter((p) => p.categoryId === cat.id && p.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter((cat) => cat.products.length > 0);
}

export async function getStats() {
  const { categories, products } = await readCatalog();
  return {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.active).length,
    passiveProducts: products.filter((p) => !p.active).length,
    outOfStock: products.filter((p) => !p.inStock).length,
    discounted: products.filter((p) => p.discountPrice !== null).length,
    categories: categories.length,
  };
}

/* ------------------------------------------------------------------ yazma */

export type ProductInput = Omit<Product, "id" | "sortOrder">;

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
  patch: Partial<ProductInput>
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
    const category: Category = { id: unique, name, sortOrder: maxSort + 1 };
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
