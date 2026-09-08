"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { AddressRecord } from "@/lib/account/addresses";
import { accountTexts } from "./texts";
import { PanelHeader } from "./fields";
import { OrderCard, type AccountOrder } from "./OrdersPanel";
import type { AccountSummary } from "./AccountShell";

/**
 * Genel bakış.
 *
 * Hesabın giriş kapısı. Buradaki tek soru şu: müşteri hesabını açtığında ilk
 * anda ne görmek ister? Cevap neredeyse her zaman "siparişim nerede" — bu
 * yüzden devam eden sipariş en üstte ve tam kartıyla durur. Devam eden sipariş
 * yoksa yerini son sipariş alır (çoğu zaman "aynısından yine" demek için
 * açılır).
 *
 * Sayılar birer bağlantıdır: "3 adres" yazısı okunacak bir istatistik değil,
 * adres defterine giden kapıdır.
 */
export default function OverviewPanel({
  name,
  summary,
  activeOrders,
  lastOrder,
  defaultAddress,
}: {
  name: string;
  summary: AccountSummary;
  activeOrders: AccountOrder[];
  lastOrder: AccountOrder | null;
  defaultAddress: AddressRecord | null;
}) {
  const { lang } = useLanguage();
  const t = accountTexts(lang !== "tr");
  const { add, openCart } = useCart();

  function reorder(order: AccountOrder) {
    for (const line of order.reorder) add(line);
    openCart();
  }

  const stats = [
    {
      href: "/konto/bestellungen",
      value: summary.orderCount,
      label: t.statOrders,
      note: summary.activeOrderCount > 0 ? `${summary.activeOrderCount} ${t.statActive}` : null,
    },
    { href: "/konto/adressen", value: summary.addressCount, label: t.statAddresses, note: null },
    { href: "/konto/favoriten", value: summary.favoriteCount, label: t.statFavorites, note: null },
  ];

  return (
    <section>
      <PanelHeader title={`${t.greeting}${name ? `, ${name}` : ""}`} lead={t.overviewLead} />

      <div className="grid grid-cols-3 gap-px border border-line bg-line">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="focus-ring bg-char p-4 transition-colors hover:bg-panel"
          >
            <p className="font-display text-3xl font-extrabold tabular-nums text-bone">
              {stat.value}
            </p>
            <p className="tag mt-1 text-smoke">{stat.label}</p>
            {stat.note && <p className="tag mt-0.5 text-amber">{stat.note}</p>}
          </Link>
        ))}
      </div>

      {/* --- devam eden / son sipariş --- */}
      <div className="mt-10">
        <h3 className="tag mb-3 flex items-center gap-2 text-smoke">
          {activeOrders.length > 0 && (
            <span
              className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-flame"
              aria-hidden
            />
          )}
          {activeOrders.length > 0 ? t.runningOrder : t.lastOrder}
        </h3>

        {activeOrders.length > 0 ? (
          <ul className="space-y-4">
            {activeOrders.map((order) => (
              <OrderCard key={order.orderNo} order={order} live t={t} onReorder={reorder} />
            ))}
          </ul>
        ) : lastOrder ? (
          <ul>
            <OrderCard order={lastOrder} t={t} onReorder={reorder} />
          </ul>
        ) : (
          <div className="border border-dashed border-line px-4 py-8 text-center">
            <p className="text-sm text-smoke">{t.noOrdersYet}</p>
            <Link
              href="/speisekarte"
              className="focus-ring tag mt-5 inline-block border border-amber px-4 py-2.5 text-amber transition-colors hover:bg-amber hover:text-void"
            >
              {t.toMenu} →
            </Link>
          </div>
        )}

        {summary.orderCount > activeOrders.length && (
          <Link
            href="/konto/bestellungen"
            className="focus-ring tag mt-3 inline-block text-smoke transition-colors hover:text-amber"
          >
            {t.showAll} →
          </Link>
        )}
      </div>

      {/* --- varsayılan adres --- */}
      <div className="mt-10">
        <h3 className="tag mb-3 text-smoke">{t.defaultAddress}</h3>
        {defaultAddress ? (
          <div className="border border-line bg-char p-4">
            <p className="font-display font-bold text-bone">
              {defaultAddress.label || defaultAddress.street}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-smoke">
              {defaultAddress.street} {defaultAddress.houseNo}
              <br />
              {defaultAddress.zip} {defaultAddress.city}
            </p>
            <Link
              href="/konto/adressen"
              className="focus-ring tag mt-3 inline-block text-smoke transition-colors hover:text-amber"
            >
              {t.showAll} →
            </Link>
          </div>
        ) : (
          <div className="border border-dashed border-line px-4 py-6 text-center">
            <p className="text-sm text-smoke">{t.noDefaultAddress}</p>
            <Link
              href="/konto/adressen"
              className="focus-ring tag mt-4 inline-block border border-amber px-4 py-2.5 text-amber transition-colors hover:bg-amber hover:text-void"
            >
              + {t.addAddress}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
