import type { Metadata } from "next";
import ZoneManager from "@/components/admin/ZoneManager";
import { listDeliveryZones } from "@/lib/orders/zones";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teslimat bölgeleri // Panel",
  robots: { index: false, follow: false },
};

export default async function AdminZonesPage() {
  const zones = await listDeliveryZones();
  return <ZoneManager zones={zones} />;
}
