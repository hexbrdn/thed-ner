import type { Metadata } from "next";
import { Unbounded, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CartDrawer from "@/components/CartDrawer";
import { CartProvider } from "@/lib/cart";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { BUSINESS_INFO } from "@/data/businessInfo";

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
  title: "Sami´s Döner // Straßkirchen — Dein Döner, dein Genuss",
  description:
    "Sami´s Döner in Straßkirchen: Frische Zutaten, 4.9 Google Bewertung, leckerer Döner & Spezialsoßen. Straubinger Str. 3, 94342 Straßkirchen.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: BUSINESS_INFO.name,
  telephone: BUSINESS_INFO.phone,
  url: BUSINESS_INFO.mapsUrl,
  priceRange: BUSINESS_INFO.priceRange,
  servesCuisine: ["Döner", "Fast Food", "Imbiss"],
  address: {
    "@type": "PostalAddress",
    streetAddress: BUSINESS_INFO.address.street,
    addressLocality: BUSINESS_INFO.address.city,
    postalCode: BUSINESS_INFO.address.postalCode,
    addressRegion: BUSINESS_INFO.address.state,
    addressCountry: "DE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: BUSINESS_INFO.coordinates.lat,
    longitude: BUSINESS_INFO.coordinates.lng,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "11:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "12:00",
      closes: "21:00",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: String(BUSINESS_INFO.rating),
    reviewCount: String(BUSINESS_INFO.reviewCount),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
