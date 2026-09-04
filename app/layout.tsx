import type { Metadata } from "next";
import { Unbounded, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CartDrawer from "@/components/CartDrawer";
import { CartProvider } from "@/lib/cart";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const display = Unbounded({
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HAUS DES DÖNERS // Dein Döner, dein Genuss",
  description:
    "Frische Zutaten, authentischer Geschmack – dein Geschmackserlebnis wartet im Haus des Döners in deiner Nähe!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <body>
        <div className="grain-overlay" />
        <LanguageProvider>
          <CartProvider>
            <SmoothScroll>{children}</SmoothScroll>
            <CartDrawer />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
