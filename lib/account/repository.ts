import { Prisma, type Customer } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, needsRehash, verifyPassword } from "./password";
import type { ProfileInput, RegisterInput } from "./schema";

/**
 * Müşteri hesaplarının veri katmanı.
 *
 * İki kural burada uygulanır:
 *  - E-posta her zaman küçük harfle saklanır ve aranır. Büyük/küçük harf
 *    farkıyla iki ayrı hesap açılabilmesi, kullanıcının kendi hesabını
 *    bulamamasının en sık sebebidir.
 *  - Hesap **silinmez, anonimleştirilir**. Siparişler ticaret ve vergi hukuku
 *    gereği duruyor olmak zorunda (§ 147 AO); hesabı silmek onları da
 *    götürürdü. DSGVO Art. 17'nin istediği şey kişisel verinin ortadan
 *    kalkmasıdır, satırın kaybolması değil.
 */

/** Arayüze taşınan güvenli görünüm — parola özeti asla dışarı çıkmaz. */
export type PublicCustomer = {
  id: string;
  email: string;
  name: string;
  phone: string;
  street: string;
  houseNo: string;
  zip: string;
  city: string;
  lang: string;
  createdAt: Date;
};

export function toPublicCustomer(customer: Customer): PublicCustomer {
  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    street: customer.street,
    houseNo: customer.houseNo,
    zip: customer.zip,
    city: customer.city,
    lang: customer.lang,
    createdAt: customer.createdAt,
  };
}

/* ------------------------------------------------------------------ kayıt */

export type RegisterResult =
  | { ok: true; customer: Customer }
  | { ok: false; reason: "email_taken" };

/**
 * Yeni hesap açar.
 *
 * Benzersizlik kontrolü **veritabanına bırakılır** (P2002), önce "var mı" diye
 * bakılıp sonra yazılmaz: iki istek aynı anda gelirse o kontrol yarışır ve
 * ikisi de "yok" görüp yazmaya çalışır. UNIQUE kısıt yarışamaz.
 */
export async function registerCustomer(input: RegisterInput): Promise<RegisterResult> {
  const passwordHash = await hashPassword(input.password);

  try {
    const customer = await prisma.customer.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        street: input.street ?? "",
        houseNo: input.houseNo ?? "",
        zip: input.zip ?? "",
        city: input.city ?? "",
        lang: input.lang,
      },
    });
    return { ok: true, customer };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, reason: "email_taken" };
    }
    throw error;
  }
}

/* --------------------------------------------------------------- doğrulama */

/**
 * E-posta + parola doğrulaması.
 *
 * Hesap bulunamasa bile parola doğrulaması **yine de çalıştırılır**. Aksi
 * hâlde var olmayan bir e-posta anında, var olan bir e-posta ~300 ms sonra
 * yanıt dönerdi; bu zamanlama farkı, hangi adreslerin kayıtlı olduğunu
 * saymaya yeter. Sahte özet gerçek bir özetle aynı maliyeti üretir.
 */
const DUMMY_HASH =
  "pbkdf2$sha256$600000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

export async function authenticateCustomer(
  email: string,
  password: string
): Promise<Customer | null> {
  const customer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });

  const matches = await verifyPassword(password, customer?.passwordHash ?? DUMMY_HASH);
  if (!customer || !matches) return null;

  // Pasifleştirilmiş ya da anonimleştirilmiş hesapla giriş yapılamaz.
  if (!customer.active || customer.anonymizedAt !== null) return null;

  // Parola maliyeti artırıldıysa, elimizde düz parola varken sessizce yükselt.
  const passwordHash = needsRehash(customer.passwordHash)
    ? await hashPassword(password)
    : undefined;

  return prisma.customer.update({
    where: { id: customer.id },
    data: { lastLoginAt: new Date(), ...(passwordHash ? { passwordHash } : {}) },
  });
}

/* ---------------------------------------------------------------- profil */

export async function updateCustomerProfile(
  customerId: string,
  input: ProfileInput
): Promise<Customer> {
  // Verilmeyen alan DEĞİŞMEZ: adres alanları artık adres defterinden
  // eşitleniyor, telefon güncelleyen bir istek onları silmemeli.
  return prisma.customer.update({
    where: { id: customerId },
    data: {
      name: input.name,
      phone: input.phone,
      ...(input.street !== undefined ? { street: input.street } : {}),
      ...(input.houseNo !== undefined ? { houseNo: input.houseNo } : {}),
      ...(input.zip !== undefined ? { zip: input.zip } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.lang ? { lang: input.lang } : {}),
    },
  });
}

export type PasswordChangeResult = { ok: true } | { ok: false; reason: "wrong_password" };

/**
 * Parola değiştirir ve **tüm oturumları düşürür**.
 *
 * `tokenVersion` artırıldığı anda daha önce verilmiş bütün jetonlar geçersiz
 * olur. Parola değiştirmenin asıl sebebi çoğu zaman "birileri hesabıma
 * girdi"dir; eski oturumların açık kalması bu işlemi anlamsız kılardı.
 * Kullanıcının kendi tarayıcısına çağıran taraf yeni jeton yazar.
 */
export async function changeCustomerPassword(
  customerId: string,
  currentPassword: string,
  newPassword: string
): Promise<PasswordChangeResult> {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { ok: false, reason: "wrong_password" };

  if (!(await verifyPassword(currentPassword, customer.passwordHash))) {
    return { ok: false, reason: "wrong_password" };
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      passwordHash: await hashPassword(newPassword),
      tokenVersion: { increment: 1 },
    },
  });
  return { ok: true };
}

/* ------------------------------------------------------------- DSGVO Art. 17 */

/**
 * Hesabı anonimleştirir.
 *
 * Siparişler silinmez — silinemez de: bunlar Buchungsbeleg'dir ve § 147 AO
 * uyarınca saklanmak zorundadır. Silinen şey hesabın kendisindeki kişisel
 * alanlardır. Siparişlerdeki ad/adres alanları da temizlenir, ama tutar,
 * tarih, KDV dökümü ve satırlar olduğu gibi kalır: vergi denetiminin ihtiyaç
 * duyduğu bilgi kişisel veri değildir.
 *
 * E-posta boş bırakılamaz (UNIQUE): geri döndürülemez bir takma değerle
 * değiştirilir, böylece hem kısıt korunur hem de adres kurtarılamaz.
 */
export async function anonymizeCustomer(customerId: string): Promise<void> {
  const now = new Date();
  const alias = `geloescht+${customerId}@invalid.local`;

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customerId },
      data: {
        email: alias,
        // Doğrulanması imkânsız bir değer: hesap bir daha açılamaz.
        passwordHash: "geloescht",
        name: "",
        phone: "",
        street: "",
        houseNo: "",
        zip: "",
        city: "",
        active: false,
        anonymizedAt: now,
        // Açık oturumlar anında düşsün.
        tokenVersion: { increment: 1 },
      },
    });

    // Bekleyen parola sıfırlama jetonları geçersiz kılınır.
    await tx.passwordReset.deleteMany({ where: { customerId } });

    /*
     * Adres defteri ve favoriler **silinir**, anonimleştirilmez: ikisi de
     * yalnızca kolaylık için tutulan kişisel veridir, saklanmasını gerektiren
     * hiçbir yasal sebep yok. Siparişlerdeki adres kopyaları yerinde kalır
     * (Buchungsbeleg) ve aşağıda kişisel alanları temizlenir.
     */
    await tx.customerAddress.deleteMany({ where: { customerId } });
    await tx.favorite.deleteMany({ where: { customerId } });

    // Siparişlerin kişisel alanları temizlenir; tutar ve satırlar kalır.
    await tx.order.updateMany({
      where: { customerId },
      data: {
        customerName: "Gelöschtes Konto",
        phone: "",
        email: "",
        street: "",
        houseNo: "",
        note: "",
      },
    });
  });
}

/* --------------------------------------------------------------- siparişler */

/** Hesabın sipariş geçmişi. Yalnızca kendi siparişleri — filtre sunucuda. */
export async function listCustomerOrders(customerId: string, take = 30) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take,
    include: { lines: { orderBy: { id: "asc" } } },
  });
}

/**
 * Hesabın verisinin dışa aktarımı — DSGVO Art. 20 (veri taşınabilirliği).
 *
 * "Yapılandırılmış, yaygın kullanılan ve makine tarafından okunabilir biçim"
 * şartı JSON ile karşılanır. Parola özeti dahil edilmez: kullanıcının kendi
 * verisi değil, güvenlik malzemesidir.
 */
export async function exportCustomerData(customerId: string) {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  const orders = await listCustomerOrders(customerId, 1000);
  // Adres defteri ve favoriler de hesabın verisidir; dışa aktarımda
  // bulunmazlarsa "taşınabilirlik" eksik kalır.
  const addresses = await prisma.customerAddress.findMany({
    where: { customerId },
    orderBy: { createdAt: "asc" },
  });
  const favorites = await prisma.favorite.findMany({
    where: { customerId },
    orderBy: { createdAt: "asc" },
    include: { product: { select: { id: true, name: true } } },
  });

  return {
    exportedAt: new Date().toISOString(),
    account: toPublicCustomer(customer),
    addresses: addresses.map((address) => ({
      label: address.label,
      street: address.street,
      houseNo: address.houseNo,
      floor: address.floor,
      bellName: address.bellName,
      zip: address.zip,
      city: address.city,
      isDefault: address.isDefault,
      createdAt: address.createdAt.toISOString(),
    })),
    favorites: favorites.map((favorite) => ({
      productId: favorite.product.id,
      name: favorite.product.name,
      createdAt: favorite.createdAt.toISOString(),
    })),
    orders: orders.map((order) => ({
      orderNo: order.orderNo,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      fulfillment: order.fulfillment,
      address: {
        street: order.street,
        houseNo: order.houseNo,
        zip: order.zip,
        city: order.city,
      },
      note: order.note,
      subtotalCents: order.subtotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      serviceFeeCents: order.serviceFeeCents,
      totalCents: order.totalCents,
      vatBreakdown: order.vatBreakdown,
      lines: order.lines.map((line) => ({
        label: line.label,
        detail: line.detail,
        qty: line.qty,
        unitCents: line.unitCents,
        lineCents: line.lineCents,
        vatRate: line.vatRate,
      })),
    })),
  };
}
