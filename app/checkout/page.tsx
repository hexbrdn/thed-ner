import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import { CheckoutView } from "@/components/checkout/CheckoutView";

/**
 * Ödeme sayfası kabuğu.
 *
 * Sayfa sunucuda hiçbir şey çekmez: sepet tarayıcıda (localStorage), tutarlar
 * `/api/menu/quote` ucunda. Sunucuda önceden çekilecek bir şey yok, çekilseydi
 * de her ziyarette değişirdi.
 *
 * `noindex`: ödeme adımı bir arama sonucu değil. Ayrıca indekslenen boş bir
 * sepet sayfası, siteyi arayan müşteriye menü yerine "sepetiniz boş" gösterirdi.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kasse — Sami´s Döner",
  description: "Bestellung abschließen: Lieferadresse, Übersicht und Zahlung.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main className="min-h-dvh bg-void text-bone">
      <Navbar />
      {/*
        `useSearchParams` (iptal dönüşü için) Suspense sınırı ister; sınır
        olmadan sayfanın tamamı istemci tarafında oluşturulmaya zorlanır.
      */}
      <div className="pt-[var(--nav-h)]">
        <Suspense fallback={<CheckoutFallback />}>
          <CheckoutView />
        </Suspense>
      </div>
    </main>
  );
}

/** Yükleme iskeleti: yükseklik korunur ki içerik gelince sayfa zıplamasın. */
function CheckoutFallback() {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-16">
      <div className="h-8 w-52 animate-pulse bg-panel" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse bg-panel" />
          ))}
        </div>
        <div className="h-72 animate-pulse bg-panel" />
      </div>
    </div>
  );
}
