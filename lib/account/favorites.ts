import { prisma } from "@/lib/db";

/**
 * Favori ürünler.
 *
 * Sipariş satırının aksine favori bir **referanstır**: dondurulacak bir tutar
 * yok, müşteri her zaman ürünün bugünkü fiyatını ve bugün satılıp
 * satılmadığını görmek ister. Bu yüzden burada yalnızca kimlikler tutulur;
 * ad, fiyat ve görünürlük katalogtan (lib/admin/store.ts) okunur.
 *
 * Favori listesi, ürünü menüde arayıp bulmanın kısa yolu: müşterinin
 * %80'i her seferinde aynı üç şeyi ısmarlıyor.
 */

/** Bir hesabın işaretleyebileceği ürün sayısı — liste kullanışlı kalsın. */
export const MAX_FAVORITES = 60;

export async function listFavoriteProductIds(customerId: string): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: { productId: true },
  });
  return rows.map((row) => row.productId);
}

export async function countFavorites(customerId: string): Promise<number> {
  return prisma.favorite.count({ where: { customerId } });
}

export type FavoriteResult =
  | { ok: true; favorite: boolean }
  | { ok: false; reason: "unknown_product" | "limit_reached" };

/**
 * Favoriyi ekler.
 *
 * Ürünün var olduğu **yazmadan önce** doğrulanır: uydurma bir kimlikle
 * doldurulan favori listesi, sonradan hiçbir şeye çözülemeyen satırlar
 * bırakır. Aynı ürün ikinci kez eklenirse hata değil, "zaten favori" sayılır
 * (UNIQUE kısıt yarışmayı da engeller).
 */
export async function addFavorite(
  customerId: string,
  productId: string
): Promise<FavoriteResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return { ok: false, reason: "unknown_product" };

  const count = await prisma.favorite.count({ where: { customerId } });
  if (count >= MAX_FAVORITES) return { ok: false, reason: "limit_reached" };

  await prisma.favorite.upsert({
    where: { customerId_productId: { customerId, productId } },
    create: { customerId, productId },
    update: {},
  });
  return { ok: true, favorite: true };
}

export async function removeFavorite(
  customerId: string,
  productId: string
): Promise<FavoriteResult> {
  await prisma.favorite.deleteMany({ where: { customerId, productId } });
  return { ok: true, favorite: false };
}
