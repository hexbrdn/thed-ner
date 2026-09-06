import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Locations from "@/components/Locations";
import AboutUs from "@/components/AboutUs";
import AssemblyLog from "@/components/AssemblyLog";
import FinalStack from "@/components/FinalStack";
import OrderBuilder from "@/components/OrderBuilder";
import Franchise from "@/components/Franchise";
import Reviews from "@/components/Reviews";
import News from "@/components/News";
import SocialMedia from "@/components/SocialMedia";
import Footer from "@/components/Footer";

// Ürün listesi artık ana sayfada değil, kendi sayfasında (`/speisekarte`).
// Ana sayfa tanıtım bölümlerinden oluştuğu için istek başına veri okumaz.

export default function Home() {
  return (
    <main className="bg-void">
      <Navbar />
      <Hero />
      <Locations />
      <AboutUs />
      <AssemblyLog />
      <FinalStack />
      <OrderBuilder />
      <Franchise />
      <Reviews />
      <News />
      <SocialMedia />
      <Footer />
    </main>
  );
}
