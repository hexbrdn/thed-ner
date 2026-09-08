import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AllergenTable from "@/components/legal/AllergenTable";
import { getMenuSections } from "@/lib/admin/store";

/**
 * Ürün bazında alerjen ve katkı maddesi listesi.
 *
 * Kartadaki kısa kodların tam karşılığı burada, tek tabloda durur. LMIV Art. 14
 * mesafeli satışta bu bilginin sipariş bağlayıcı hâle gelmeden önce ve **ek
 * ücret olmadan** verilmesini ister; ayrı bir sayfa olması bu yüzden sorun
 * değildir, ama sepette de buraya bağlantı bulunur.
 *
 * Menü verisi panelden geldiği için sayfa her istekte tazelenir: bir üründe
 * alerjen güncellenince burada da anında görünür.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Allergene & Zusatzstoffe — Sami´s Döner",
  description:
    "Allergene nach LMIV Anhang II und kennzeichnungspflichtige Zusatzstoffe nach ZZulV für alle Speisen von Sami´s Döner.",
};

export default async function AllergenePage() {
  const sections = await getMenuSections();

  return (
    <main className="min-h-screen bg-void text-bone">
      <Navbar />
      <AllergenTable sections={sections} />
      <Footer />
    </main>
  );
}
