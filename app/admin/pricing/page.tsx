import PricingManager from "@/components/admin/PricingManager";
import { getCatalog } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const catalog = await getCatalog();
  const products = catalog.products
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => ({ id: p.id, name: p.name, price: p.discountPrice ?? p.price }));

  return (
    <PricingManager
      initialSettings={catalog.settings}
      initialBuilder={catalog.builder}
      products={products}
    />
  );
}
