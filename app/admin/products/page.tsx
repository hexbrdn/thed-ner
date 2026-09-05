import { promises as fs } from "node:fs";
import path from "node:path";
import ProductManager from "@/components/admin/ProductManager";
import { getCatalog } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

/** public/assets içindeki hazır görseller: forma seçenek olarak sunulur. */
async function listImages(): Promise<string[]> {
  try {
    const dir = path.join(process.cwd(), "public", "assets");
    const files = await fs.readdir(dir);
    return files
      .filter((f) => /\.(webp|png|jpe?g|avif)$/i.test(f) && !f.includes(".backup."))
      .sort()
      .map((f) => `/assets/${f}`);
  } catch {
    return [];
  }
}

export default async function AdminProductsPage() {
  const [catalog, imageOptions] = await Promise.all([getCatalog(), listImages()]);

  const categories = catalog.categories.slice().sort((a, b) => a.sortOrder - b.sortOrder);
  const products = catalog.products.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <ProductManager
      initialProducts={products}
      categories={categories}
      imageOptions={imageOptions}
    />
  );
}
