import { z } from "zod";
import { prisma } from "@/lib/db";

/**
 * Hesabın adres defteri.
 *
 * Neden ayrı bir tablo: müşterinin tek bir adresi yok. Ev, iş, annesinin evi —
 * ve her siparişte aynı sokağı yeniden yazmak, sepeti terk etmenin en sessiz
 * sebeplerinden biri. `Customer` üzerindeki tekil `street/zip/...` alanları
 * duruyor ve **varsayılan adresle eşitleniyor**: ödeme formunu önden dolduran
 * mevcut kod ve misafir akışı hiç değişmeden çalışmaya devam etsin.
 *
 * İki kural burada uygulanır:
 *  1. **Sahiplik her sorguda.** Hiçbir fonksiyon yalnızca `id` ile yazmaz;
 *     her yazma `customerId` ile birlikte eşleşir. Aksi hâlde başkasının adres
 *     kimliğini gönderen biri onu düzenleyebilirdi (IDOR).
 *  2. **En fazla bir varsayılan.** Kural tek bir işlemde (transaction)
 *     korunur: yeni varsayılan yazılmadan önce diğerleri düşürülür.
 */

/** Bir hesabın tutabileceği adres sayısı. */
export const MAX_ADDRESSES = 8;

export type AddressRecord = {
  id: string;
  label: string;
  street: string;
  houseNo: string;
  floor: string;
  bellName: string;
  zip: string;
  city: string;
  isDefault: boolean;
};

/**
 * Adres doğrulaması.
 *
 * Kalıplar sipariş şemasındaki (`lib/orders/schema.ts`) adres kurallarıyla
 * aynı: burada kabul edilen bir adresin sipariş anında reddedilmesi anlamsız
 * olurdu. Mesajlar Almanca, hesap uçlarının geri kalanıyla tutarlı.
 */
export const addressSchema = z.object({
  /** "Zuhause", "Arbeit" — listede tanımak için. Boşsa sokak adı gösterilir. */
  label: z.string().trim().max(40).default(""),
  street: z.string().trim().min(2, "Bitte Straße angeben.").max(120),
  houseNo: z.string().trim().min(1, "Bitte Hausnummer angeben.").max(12),
  floor: z.string().trim().max(60).default(""),
  bellName: z.string().trim().max(80).default(""),
  zip: z.string().trim().regex(/^\d{5}$/, "Bitte gültige PLZ angeben."),
  city: z.string().trim().min(2, "Bitte Ort angeben.").max(80),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

const selection = {
  id: true,
  label: true,
  street: true,
  houseNo: true,
  floor: true,
  bellName: true,
  zip: true,
  city: true,
  isDefault: true,
} as const;

/** Varsayılan önce, sonra en yeni: listenin başında en çok kullanılan durur. */
export async function listAddresses(customerId: string): Promise<AddressRecord[]> {
  return prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: selection,
  });
}

export async function getDefaultAddress(customerId: string): Promise<AddressRecord | null> {
  return prisma.customerAddress.findFirst({
    where: { customerId, isDefault: true },
    select: selection,
  });
}

/**
 * Varsayılan adresi hesabın profil alanlarına kopyalar.
 *
 * Kopya, referans değil: ödeme formu ve misafir akışı bu alanları okuyor,
 * onları adres defterine bağlamak tüm o kodu değiştirmek demekti. Adres
 * silinince alanlar boşalır — yanlış bir adresin profilde kalıp forma
 * dolmasındansa boş kalması yeğdir.
 */
async function syncProfileFromDefault(customerId: string): Promise<void> {
  const fallback = await prisma.customerAddress.findFirst({
    where: { customerId, isDefault: true },
    select: selection,
  });

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      street: fallback?.street ?? "",
      houseNo: fallback?.houseNo ?? "",
      zip: fallback?.zip ?? "",
      city: fallback?.city ?? "",
    },
  });
}

export type AddressResult =
  | { ok: true; address: AddressRecord }
  | { ok: false; reason: "limit_reached" | "not_found" };

export async function createAddress(
  customerId: string,
  input: AddressInput
): Promise<AddressResult> {
  const count = await prisma.customerAddress.count({ where: { customerId } });
  if (count >= MAX_ADDRESSES) return { ok: false, reason: "limit_reached" };

  // İlk adres her zaman varsayılandır: tek adresi olan bir hesapta "varsayılan
  // seç" diye bir adım olmamalı.
  const makeDefault = input.isDefault || count === 0;

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.customerAddress.updateMany({
        where: { customerId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.customerAddress.create({
      data: {
        customerId,
        label: input.label,
        street: input.street,
        houseNo: input.houseNo,
        floor: input.floor,
        bellName: input.bellName,
        zip: input.zip,
        city: input.city,
        isDefault: makeDefault,
      },
      select: selection,
    });
  });

  if (makeDefault) await syncProfileFromDefault(customerId);
  return { ok: true, address };
}

export async function updateAddress(
  customerId: string,
  addressId: string,
  input: AddressInput
): Promise<AddressResult> {
  // Sahiplik kontrolü ile güncelleme aynı sorguda: arada geçen sürede kaydın
  // el değiştirmesi mümkün olmasın.
  const owned = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerId },
    select: { id: true, isDefault: true },
  });
  if (!owned) return { ok: false, reason: "not_found" };

  const makeDefault = input.isDefault || owned.isDefault;

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.customerAddress.updateMany({
        where: { customerId, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      });
    }
    return tx.customerAddress.update({
      where: { id: addressId },
      data: {
        label: input.label,
        street: input.street,
        houseNo: input.houseNo,
        floor: input.floor,
        bellName: input.bellName,
        zip: input.zip,
        city: input.city,
        isDefault: makeDefault,
      },
      select: selection,
    });
  });

  await syncProfileFromDefault(customerId);
  return { ok: true, address };
}

export async function setDefaultAddress(
  customerId: string,
  addressId: string
): Promise<boolean> {
  const owned = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerId },
    select: { id: true },
  });
  if (!owned) return false;

  await prisma.$transaction(async (tx) => {
    await tx.customerAddress.updateMany({
      where: { customerId, isDefault: true },
      data: { isDefault: false },
    });
    await tx.customerAddress.update({ where: { id: addressId }, data: { isDefault: true } });
  });

  await syncProfileFromDefault(customerId);
  return true;
}

/**
 * Adresi siler.
 *
 * Silinen adres varsayılansa, kalanların en yenisi varsayılan olur: hesabın
 * adresi varken hiçbirinin varsayılan olmaması, ödeme formunun sebepsiz boş
 * gelmesi demektir. Verilmiş siparişler etkilenmez — onlar adresin kopyasını
 * taşır.
 */
export async function deleteAddress(customerId: string, addressId: string): Promise<boolean> {
  const owned = await prisma.customerAddress.findFirst({
    where: { id: addressId, customerId },
    select: { id: true, isDefault: true },
  });
  if (!owned) return false;

  await prisma.$transaction(async (tx) => {
    await tx.customerAddress.delete({ where: { id: addressId } });

    if (owned.isDefault) {
      const next = await tx.customerAddress.findFirst({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (next) {
        await tx.customerAddress.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  });

  await syncProfileFromDefault(customerId);
  return true;
}
