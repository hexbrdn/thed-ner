import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountFrame from "@/components/account/AccountFrame";
import OrdersPanel from "@/components/account/OrdersPanel";
import { getCurrentCustomer } from "@/lib/account/guard";
import { getAccountOrders } from "@/lib/account/view";

/** Sipariş geçmişi. Yalnızca oturumdaki hesabın siparişleri — filtre sunucuda. */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meine Bestellungen — Sami´s Döner",
  robots: { index: false, follow: false },
};

export default async function OrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/konto/anmelden?next=/konto/bestellungen");

  const orders = await getAccountOrders(customer.id, customer.lang);

  return (
    <AccountFrame
      active="orders"
      customerId={customer.id}
      name={customer.name}
      email={customer.email}
    >
      <OrdersPanel orders={orders} />
    </AccountFrame>
  );
}
