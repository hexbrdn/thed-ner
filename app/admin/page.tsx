import Link from "next/link";
import { getCatalog, getStats, isVisible } from "@/lib/admin/store";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, catalog] = await Promise.all([getStats(), getCatalog()]);

  const cards = [
    { label: "Toplam ürün", value: stats.totalProducts, tone: "text-bone" },
    { label: "Menüde görünen", value: stats.visibleProducts, tone: "text-herb" },
    { label: "Pasif ürün", value: stats.passiveProducts, tone: "text-smoke" },
    { label: "Tükenen ürün", value: stats.outOfStock, tone: "text-flame" },
    { label: "Menüde gizli", value: stats.hiddenFromMenu, tone: "text-amber" },
    { label: "Kategori", value: stats.categories, tone: "text-steel" },
  ];

  const byCategory = catalog.categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((cat) => {
      const products = catalog.products.filter((p) => p.categoryId === cat.id);
      return {
        ...cat,
        total: products.length,
        active: products.filter(isVisible).length,
      };
    });

  // Menüde çıkmayan her ürün: pasif, tükenmiş ya da elle gizlenmiş olabilir.
  const passive = catalog.products.filter((p) => !isVisible(p));

  return (
    <div className="max-w-[1100px]">
      <header className="mb-10">
        <p className="tag text-flame mb-2">Genel bakış</p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bone">Dashboard</h1>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line mb-10">
        {cards.map((card) => (
          <div key={card.label} className="bg-char p-6">
            <p className={`font-display font-extrabold text-4xl tabular-nums ${card.tone}`}>
              {card.value}
            </p>
            <p className="tag text-smoke mt-2">{card.label}</p>
          </div>
        ))}
      </section>

      {/* Sipariş sistemi projede mevcut olmadığı için sipariş metrikleri gösterilmiyor. */}
      <p className="text-xs text-smoke/70 border border-line bg-char px-4 py-3 mb-10">
        Projede sipariş kaydı tutan bir sistem bulunmadığı için sipariş metrikleri
        gösterilmiyor. Sepet yalnızca ziyaretçinin tarayıcısında saklanıyor.
      </p>

      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <h2 className="font-display font-extrabold text-xl text-bone mb-4">
            Kategori dağılımı
          </h2>
          <ul className="border border-line divide-y divide-line">
            {byCategory.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between gap-4 bg-char px-5 py-4">
                <span className="text-sm text-bone">{cat.name}</span>
                <span className="tag text-smoke tabular-nums whitespace-nowrap">
                  {cat.active} görünür / {cat.total}
                </span>
              </li>
            ))}
            {byCategory.length === 0 && (
              <li className="bg-char px-5 py-6 text-sm text-smoke">Henüz kategori yok.</li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="font-display font-extrabold text-xl text-bone mb-4">
            Sitede görünmeyen ürünler
          </h2>
          {passive.length === 0 ? (
            <p className="border border-line bg-char px-5 py-6 text-sm text-smoke">
              Tüm ürünler yayında.
            </p>
          ) : (
            <ul className="border border-line divide-y divide-line">
              {passive.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 bg-char px-5 py-4">
                  <span className="text-sm text-bone truncate">{p.name}</span>
                  <span className="tag text-smoke whitespace-nowrap">
                    {!p.active ? "pasif" : !p.inStock ? "tükendi" : "menüde gizli"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-3 mt-10">
        <Link
          href="/admin/products"
          className="focus-ring tag border border-amber text-amber px-5 py-3 hover:bg-amber hover:text-void transition-colors"
        >
          ÜRÜNLERİ YÖNET →
        </Link>
        <Link
          href="/admin/categories"
          className="focus-ring tag border border-line text-bone px-5 py-3 hover:border-amber hover:text-amber transition-colors"
        >
          KATEGORİLER →
        </Link>
      </div>
    </div>
  );
}
