import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withDatabase } from "@/lib/security/dbGuard";

/**
 * Teslimat bölgeleri — şehre göre gruplanmış posta kodu listesi.
 *
 * Bu uç, sipariş formundaki "önce şehir, sonra posta kodu" akışını besler.
 * Öncesinde müşteri posta kodunu **elle yazıyor** ve ancak beşinci haneden
 * sonra "bu bölgeye teslimat yapılmıyor" cevabını alıyordu; teslimat alanının
 * neresi olduğunu sipariş vermeden öğrenmesinin hiçbir yolu yoktu. Artık
 * seçilebilecek kodların tamamı önden geliyor: bölge dışı bir adres
 * yazılamıyor, dolayısıyla o hata hiç doğmuyor.
 *
 * Yalnızca **açık** bölgeler döner: panelde kapatılan posta kodu listede hiç
 * görünmez, sipariş akışındaki `findDeliveryZone` ile aynı kural.
 *
 * Buradaki tutarlar **gösterim içindir** (müşteri seçmeden önce "min. 15 €"
 * görebilsin diye). Tahsil edilecek gerçek teslimat ücreti her zaman
 * `/api/menu/quote` yanıtından gelir; sepet tutarına göre ücretsiz eşiği
 * orada uygulanır.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type DeliveryZoneOption = {
  zip: string;
  minOrderCents: number;
  feeCents: number;
  freeOverCents: number;
  etaMinutes: number;
};

export type DeliveryCity = {
  city: string;
  zips: DeliveryZoneOption[];
};

export async function GET() {
  return withDatabase(async () => {
    const zones = await prisma.deliveryZone.findMany({
      where: { active: true },
      orderBy: [{ city: "asc" }, { postalCode: "asc" }],
    });

    // Şehir adı girilmemiş bölgeler tek bir "diğer" grubunda toplanmak yerine
    // posta kodlarıyla anılır; boş başlıklı bir seçenek kutusu kullanılamaz.
    const byCity = new Map<string, DeliveryZoneOption[]>();
    for (const zone of zones) {
      const city = zone.city.trim() || zone.postalCode;
      const list = byCity.get(city) ?? [];
      list.push({
        zip: zone.postalCode,
        minOrderCents: zone.minOrderCents,
        feeCents: zone.feeCents,
        freeOverCents: zone.freeOverCents,
        etaMinutes: zone.etaMinutes,
      });
      byCity.set(city, list);
    }

    const cities: DeliveryCity[] = [...byCity.entries()]
      .map(([city, zips]) => ({ city, zips }))
      .sort((a, b) => a.city.localeCompare(b.city, "de"));

    return NextResponse.json({ cities });
  });
}
