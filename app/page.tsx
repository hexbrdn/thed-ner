import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import OrderBuilder from "@/components/OrderBuilder";
import Locations from "@/components/Locations";
import Footer from "@/components/Footer";
import { getFeaturedProducts } from "@/lib/admin/store";

/**
 * Ana sayfa.
 *
 * Dört bölüm: tanıtım, öne çıkanlar, kendi dönerini kur, konum. Eskiden burada
 * on bir bölüm vardı ve menüye giden yol bu yığının içinde kayboluyordu.
 *
 * Hikâye, hazırlık, kalite, yorumlar ve duyuru bölümleri **silinmedi**,
 * `/ueber-uns` sayfasına taşındı; navigasyondan ve altbilgiden erişilebilir.
 * Böylece ana sayfa sipariş vermeye odaklanır, okumak isteyen ayrı sayfaya
 * geçer.
 *
 * Tam menü burada değildir: menü kendi sayfasında (`/speisekarte`) yaşar,
 * buradaki vitrin oraya açılan kapıdır.
 *
 * Vitrin katalogtan geldiği için sayfa her istekte yeniden üretilir: panelde
 * "Öne çıkar" işaretlendiği anda burada da değişir.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const featured = await getFeaturedProducts(3);

  return (
    <main className="bg-void">
      <Navbar />
      <Hero />
      <Products products={featured} />
      <OrderBuilder />
      <Locations />
      <Footer />
    </main>
  );
}
