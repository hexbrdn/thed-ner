import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Locations from "@/components/Locations";
import AboutUs from "@/components/AboutUs";
import AssemblyLog from "@/components/AssemblyLog";
import FinalStack from "@/components/FinalStack";
import OrderBuilder from "@/components/OrderBuilder";
import Products from "@/components/Products";
import Franchise from "@/components/Franchise";
import Reviews from "@/components/Reviews";
import News from "@/components/News";
import SocialMedia from "@/components/SocialMedia";
import Footer from "@/components/Footer";
import { getFeaturedProducts } from "@/lib/admin/store";

/**
 * Ana sayfa.
 *
 * Öne çıkan ürünler katalogtan geldiği için sayfa her istekte yeniden üretilir:
 * panelde fiyat/durum değiştiği anda burada da güncellenir.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const featured = await getFeaturedProducts(3);

  return (
    <main className="bg-void">
      <Navbar />
      <Hero />
      <Locations />
      <AboutUs />
      <AssemblyLog />
      <FinalStack />
      <Products products={featured} />
      <OrderBuilder />
      <Franchise />
      <Reviews />
      <News />
      <SocialMedia />
      <Footer />
    </main>
  );
}
