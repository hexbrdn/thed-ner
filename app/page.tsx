import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Locations from "@/components/Locations";
import AboutUs from "@/components/AboutUs";
import AssemblyLog from "@/components/AssemblyLog";
import FinalStack from "@/components/FinalStack";
import Products from "@/components/Products";
import OrderBuilder from "@/components/OrderBuilder";
import MenuGrid from "@/components/MenuGrid";
import Franchise from "@/components/Franchise";
import Reviews from "@/components/Reviews";
import News from "@/components/News";
import SocialMedia from "@/components/SocialMedia";
import Footer from "@/components/Footer";
import { getPublicMenu } from "@/lib/admin/store";

// Katalog admin panelinden değiştirilebildiği için sayfa her istekte
// yeniden oluşturulur; yönetici bir ürünü değiştirdiğinde sayfa yenilenince
// müşteri tarafına yansır.
export const dynamic = "force-dynamic";

export default async function Home() {
  const menu = await getPublicMenu();

  return (
    <main className="bg-void">
      <Navbar />
      <Hero />
      <Locations />
      <AboutUs />
      <AssemblyLog />
      <FinalStack />
      <Products />
      <OrderBuilder />
      <MenuGrid menu={menu} />
      <Franchise />
      <Reviews />
      <News />
      <SocialMedia />
      <Footer />
    </main>
  );
}
