import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Teslimat bölgelerinin veri katmanı — panel tarafı.
 *
 * Sipariş akışının okuduğu tek fonksiyon `availability.ts` içindeki
 * `findDeliveryZone`; burada yalnızca panelin ihtiyaç duyduğu liste ve yazma
 * işlemleri var. İkisi de aynı tabloya bakar, kural tek yerde kalır: tabloda
 * satırı olmayan ya da `active: false` olan posta koduna teslimat yapılmaz.
 *
 * Tutarlar **cent** olarak taşınır. Sipariş toplamları da cent üzerinden
 * hesaplandığı için bu katmanda Euro'ya çevrim yapılmaz; çevrim istek
 * doğrulamasında (`lib/admin/validate.ts`) bir kez yapılır.
 */

export type DeliveryZoneRecord = {
  id: string;
  postalCode: string;
  city: string;
  minOrderCents: number;
  feeCents: number;
  freeOverCents: number;
  etaMinutes: number;
  active: boolean;
};

export type DeliveryZoneInput = Omit<DeliveryZoneRecord, "id">;

/** Panelde gösterilen liste; posta koduna göre sıralı. */
export async function listDeliveryZones(): Promise<DeliveryZoneRecord[]> {
  return prisma.deliveryZone.findMany({ orderBy: { postalCode: "asc" } });
}

export async function createDeliveryZone(input: DeliveryZoneInput): Promise<DeliveryZoneRecord> {
  return prisma.deliveryZone.create({ data: input });
}

/** Kayıt yoksa `null` — çağıran taraf bunu 404'e çevirir. */
export async function updateDeliveryZone(
  id: string,
  patch: Partial<DeliveryZoneInput>
): Promise<DeliveryZoneRecord | null> {
  try {
    return await prisma.deliveryZone.update({ where: { id }, data: patch });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return null;
    }
    throw error;
  }
}

export async function deleteDeliveryZone(id: string): Promise<boolean> {
  try {
    await prisma.deliveryZone.delete({ where: { id } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return false;
    }
    throw error;
  }
}
