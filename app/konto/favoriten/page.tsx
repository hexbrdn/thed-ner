import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountFrame from "@/components/account/AccountFrame";
import FavoritesPanel from "@/components/account/FavoritesPanel";
import { getCurrentCustomer } from "@/lib/account/guard";
import { getFavoriteItems } from "@/lib/account/view";

/**
 * Favoriler.
 *
 * Liste katalogtan beslenir: fiyat ve satılabilirlik ürünün bugünkü hâlidir,
 * favoriye eklendiği günün değil.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meine Favoriten — Sami´s Döner",
  robots: { index: false, follow: false },
};

export default async function FavoritesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/konto/anmelden?next=/konto/favoriten");

  const items = await getFavoriteItems(customer.id, customer.lang);

  return (
    <AccountFrame
      active="favorites"
      customerId={customer.id}
      name={customer.name}
      email={customer.email}
    >
      <FavoritesPanel items={items} />
    </AccountFrame>
  );
}
