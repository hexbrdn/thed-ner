import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountFrame from "@/components/account/AccountFrame";
import AddressBook from "@/components/account/AddressBook";
import { getCurrentCustomer } from "@/lib/account/guard";
import { MAX_ADDRESSES, listAddresses } from "@/lib/account/addresses";

/**
 * Adres defteri.
 *
 * Buradaki adresler ödeme sayfasında tek tıkla seçilebilir; varsayılan olan
 * formu kendiliğinden doldurur (bkz. components/checkout/SavedAddresses.tsx).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meine Adressen — Sami´s Döner",
  robots: { index: false, follow: false },
};

export default async function AddressesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/konto/anmelden?next=/konto/adressen");

  const addresses = await listAddresses(customer.id);

  return (
    <AccountFrame
      active="addresses"
      customerId={customer.id}
      name={customer.name}
      email={customer.email}
    >
      <AddressBook addresses={addresses} max={MAX_ADDRESSES} />
    </AccountFrame>
  );
}
