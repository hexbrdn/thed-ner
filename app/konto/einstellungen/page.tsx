import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountFrame from "@/components/account/AccountFrame";
import ProfilePanel from "@/components/account/ProfilePanel";
import { getCurrentCustomer } from "@/lib/account/guard";

/** İletişim bilgileri, parola ve DSGVO işlemleri. */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kontoeinstellungen — Sami´s Döner",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/konto/anmelden?next=/konto/einstellungen");

  return (
    <AccountFrame
      active="settings"
      customerId={customer.id}
      name={customer.name}
      email={customer.email}
    >
      <ProfilePanel
        profile={{ email: customer.email, name: customer.name, phone: customer.phone }}
      />
    </AccountFrame>
  );
}
