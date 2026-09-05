import CategoryManager from "@/components/admin/CategoryManager";
import { getCatalog } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const { categories, products } = await getCatalog();

  const rows = categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const owned = products.filter((p) => p.categoryId === category.id);
      return {
        ...category,
        productCount: owned.length,
        activeCount: owned.filter((p) => p.active).length,
      };
    });

  return <CategoryManager categories={rows} />;
}
