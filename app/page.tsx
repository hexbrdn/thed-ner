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

export default function Home() {
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
      <MenuGrid />
      <Franchise />
      <Reviews />
      <News />
      <SocialMedia />
      <Footer />
    </main>
  );
}
