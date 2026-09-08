import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountFrame from "@/components/account/AccountFrame";
import OverviewPanel from "@/components/account/OverviewPanel";
import { getCurrentCustomer } from "@/lib/account/guard";
import { getDefaultAddress } from "@/lib/account/addresses";
import { getAccountOrders, getAccountSummary } from "@/lib/account/view";

/**
 * Hesabın genel bakışı.
 *
 * Koruma burada, sayfanın kendisinde: middleware'in yönlendirmesi kullanıcı
 * deneyimi içindir, yetki kontrolü değildir. Matcher'daki bir yazım hatası bu
 * sayfayı açık bırakmamalı.
 *
 * Veriler **oturumdaki kimlikle** çekilir; URL'de ya da sorguda hesap kimliği
 * taşınmaz, dolayısıyla başkasının hesabını isteyecek bir parametre yoktur.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mein Konto — Sami´s Döner",
  // Kişisel veri taşır; arama motorlarına girmemeli.
  robots: { index: false, follow: false },
};

export default async function KontoPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/konto/anmelden?next=/konto");

  const [summary, orders, defaultAddress] = await Promise.all([
    getAccountSummary(customer.id),
    // Genel bakışta tüm geçmiş gerekmez; devam eden siparişler ile son
    // sipariş için ilk birkaç kayıt yeter.
    getAccountOrders(customer.id, customer.lang, 5),
    getDefaultAddress(customer.id),
  ]);

  const activeOrders = orders.filter((order) => order.active);
  const lastOrder = orders.find((order) => !order.active) ?? null;

  return (
    <AccountFrame
      active="overview"
      customerId={customer.id}
      name={customer.name}
      email={customer.email}
    >
      <OverviewPanel
        name={customer.name}
        summary={summary}
        activeOrders={activeOrders}
        lastOrder={lastOrder}
        defaultAddress={defaultAddress}
      />
    </AccountFrame>
  );
}
