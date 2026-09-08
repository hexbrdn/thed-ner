import { NextResponse } from "next/server";
import { getOrderSettings, isOpenNow } from "@/lib/orders/availability";
import { withDatabase } from "@/lib/security/dbGuard";

/**
 * İşletmenin sipariş durumu.
 *
 * Sepet boşken de gerekli: müşteri yarım saat menü gezip sepet doldurduktan
 * sonra "şu an kapalıyız" duvarına toslamamalı. Bu uç, çekmece açılır açılmaz
 * (sepet boş olsa bile) durumu söyler ve teslimat/gel-al seçeneklerinden
 * hangilerinin açık olduğunu bildirir.
 *
 * Karar burada verilmez, yalnızca okunur: siparişin kabul edilip edilmeyeceğine
 * her zaman sunucudaki `checkOrderability` karar verir. Buradaki bilgi arayüzün
 * önden uyarı verebilmesi içindir.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type MenuStatus = {
  orderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  open: boolean;
  prepMinutes: number;
};

export async function GET() {
  return withDatabase(async () => {
    const [settings, open] = await Promise.all([getOrderSettings(), isOpenNow()]);

    const status: MenuStatus = {
      orderingEnabled: settings.orderingEnabled,
      deliveryEnabled: settings.deliveryEnabled,
      pickupEnabled: settings.pickupEnabled,
      open,
      prepMinutes: settings.prepMinutes,
    };

    return NextResponse.json(status);
  });
}
