import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import MenuGrid from "@/components/MenuGrid";
import Footer from "@/components/Footer";
import { getMenuSections } from "@/lib/admin/store";

/**
 * Karta artık sabit dosyadan değil, admin panelinin yazdığı katalog deposundan
 * beslenir. Bu yüzden sayfa her istekte yeniden üretilir: panelde bir ürün
 * "tükendi"/"pasif" yapıldığı anda burada da kaybolur, tekrar açıldığında döner.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Speisekarte — Sami´s Döner // Straßkirchen",
  description:
    "Die komplette Speisekarte von Sami´s Döner in Straßkirchen: Drehspieß, Pide, Lahmacun, Pizza, Salate und Getränke mit aktuellen Preisen.",
};

export default async function SpeisekartePage() {
  const sections = await getMenuSections();

  return (
    <main className="bg-void">
      <Navbar />
      <MenuGrid sections={sections} />
      <Footer />
    </main>
  );
}
