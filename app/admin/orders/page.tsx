import type { Metadata } from "next";
import OrderFeed from "@/components/admin/OrderFeed";

/**
 * Sipariş takibi.
 *
 * Sayfanın kendisi veri çekmez: liste sürekli tazelendiği için tamamı istemci
 * tarafındaki `OrderFeed` içinde yaşar. Sunucuda bir kez render edilip
 * beş saniye sonra eskiyecek bir liste üretmenin anlamı yok.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Siparişler // Panel",
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="tag text-flame">Sipariş takibi</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-bone">Siparişler</h1>
        <p className="mt-2 max-w-2xl text-sm text-smoke">
          Ödemesi tamamlanan siparişler burada belirir. Sesli uyarı, siparişe
          &quot;Görüldü&quot; denene kadar devam eder.
        </p>
      </header>

      <OrderFeed />
    </div>
  );
}
