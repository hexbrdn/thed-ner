import Link from "next/link";
import { getCatalog, getStats, isVisible } from "@/lib/admin/store";
import { getOrderStats } from "@/lib/orders/stats";
import { formatCents } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, catalog, orders] = await Promise.all([
    getStats(),
    getCatalog(),
    getOrderStats(),
  ]);

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

      {/*
        Sipariş metrikleri.

        "Bugün" işletmenin yerel günüdür (Europe/Berlin) ve ciroya yalnızca
        ödemesi alınmış siparişler girer — bkz. lib/orders/stats.ts.
      */}
      <section className="mb-10">
        <h2 className="font-display font-extrabold text-xl text-bone mb-4">Bugün</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
          <div className="bg-char p-6">
            <p className="font-display font-extrabold text-4xl tabular-nums text-bone">
              {orders.todayOrders}
            </p>
            <p className="tag text-smoke mt-2">Sipariş</p>
          </div>
          <div className="bg-char p-6">
            <p className="font-display font-extrabold text-4xl tabular-nums text-herb">
              {formatCents(orders.todayRevenueCents)}
            </p>
            <p className="tag text-smoke mt-2">Ciro</p>
          </div>
          <div className="bg-char p-6">
            <p className="font-display font-extrabold text-4xl tabular-nums text-amber">
              {formatCents(orders.todayAverageCents)}
            </p>
            <p className="tag text-smoke mt-2">Ortalama sepet</p>
          </div>
          <div className="bg-char p-6">
            <p
              className={`font-display font-extrabold text-4xl tabular-nums ${
                orders.unacknowledged > 0 ? "text-flame" : "text-smoke"
              }`}
            >
              {orders.activeOrders}
            </p>
            <p className="tag text-smoke mt-2">
              Akışta
              {orders.unacknowledged > 0 && (
                <span className="text-flame"> · {orders.unacknowledged} yeni</span>
              )}
            </p>
          </div>
        </div>

        <p className="tag text-smoke/70 mt-3">
          Son 7 gün: {orders.weekOrders} sipariş · {formatCents(orders.weekRevenueCents)}
        </p>

        {/* Ayrıntılı ciro, KDV dökümü ve Stripe bağlantıları ayrı ekranda:
            dashboard "şu an ne oluyor" sorusunu cevaplar, o ekran "ay nasıl
            gitti" sorusunu. */}
        <Link
          href="/admin/finanzen"
          className="focus-ring tag mt-3 inline-block border border-line px-4 py-2.5 text-smoke transition-colors hover:border-amber hover:text-amber"
        >
          CİRO VE ÖDEMELER →
        </Link>

        {orders.unacknowledged > 0 && (
          <Link
            href="/admin/orders"
            className="focus-ring tag mt-4 inline-block border border-flame bg-flame/10 px-5 py-3 text-flame transition-colors hover:bg-flame hover:text-void"
          >
            {orders.unacknowledged} YENİ SİPARİŞ BEKLİYOR →
          </Link>
        )}
      </section>

      <h2 className="font-display font-extrabold text-xl text-bone mb-4">Katalog</h2>

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
