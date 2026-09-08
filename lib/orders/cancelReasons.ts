/**
 * Sipariş iptal/ret sebepleri.
 *
 * İptal, müşterinin parasının iade edileceği ve akşam yemeğinin gelmeyeceği
 * andır; "Bu sipariş gerçekleştirilmedi" gibi sebepsiz bir cümle, telefonun
 * çalmasıyla biter. Bu yüzden panelde iptal **sebepsiz yapılamaz**: mutfak
 * listeden birini seçer, müşteri takip sayfasında aynı cümleyi kendi dilinde
 * okur.
 *
 * Sebep serbest metin olarak DEĞİL, bir **kimlik** olarak saklanır
 * (`Order.cancelReason`). İki nedeni var:
 *  - Müşterinin dili sipariş anında belli (order.lang); Almanca sipariş veren
 *    müşteriye mutfakta Türkçe yazılmış bir not gösterilemez.
 *  - Aynı kimlik daha sonra sayılabilir: "bu ay kaç sipariş stok yüzünden
 *    iptal edildi" sorusunun cevabı serbest metinden çıkarılamaz.
 *
 * Tek istisna `OTHER`: listede karşılığı olmayan bir durumda mutfak kendi
 * cümlesini yazar ve o cümle müşteriye **olduğu gibi** gider. Bu yüzden kayıt
 * biçimi `OTHER: <metin>` olur.
 *
 * Bu dosyadan önce yazılmış kayıtlarda `cancelReason` düz metindi; `describe`
 * tanımadığı bir değeri olduğu gibi döndürerek onları da gösterir.
 */

export type CancelReasonId =
  | "OUT_OF_STOCK"
  | "TOO_BUSY"
  | "CLOSED"
  | "OUT_OF_AREA"
  | "CUSTOMER_UNREACHABLE"
  | "CUSTOMER_REQUEST"
  | "DUPLICATE"
  | "PAYMENT_ISSUE"
  | "TECHNICAL"
  | "OTHER";

export type CancelReason = {
  id: CancelReasonId;
  /** Panelde görünen kısa etiket (işletme dili: Türkçe). */
  admin: string;
  /** Müşteriye gösterilecek cümle. */
  de: string;
  tr: string;
};

export const CANCEL_REASONS: readonly CancelReason[] = [
  {
    id: "OUT_OF_STOCK",
    admin: "Ürün tükendi",
    de: "Ein Artikel Ihrer Bestellung ist leider ausverkauft. Der Betrag wird vollständig erstattet.",
    tr: "Siparişinizdeki bir ürün maalesef tükendi. Ödediğiniz tutarın tamamı iade edilecek.",
  },
  {
    id: "TOO_BUSY",
    admin: "Mutfak çok yoğun",
    de: "Unsere Küche ist gerade so ausgelastet, dass wir Ihre Bestellung nicht in vertretbarer Zeit zubereiten können. Der Betrag wird vollständig erstattet.",
    tr: "Mutfağımız şu anda o kadar yoğun ki siparişinizi makul bir sürede hazırlayamıyoruz. Ödediğiniz tutarın tamamı iade edilecek.",
  },
  {
    id: "CLOSED",
    admin: "Kapanış saati / bugün kapalıyız",
    de: "Wir haben für heute bereits geschlossen und können Ihre Bestellung nicht mehr zubereiten. Der Betrag wird vollständig erstattet.",
    tr: "Bugünlük kapandığımız için siparişinizi hazırlayamıyoruz. Ödediğiniz tutarın tamamı iade edilecek.",
  },
  {
    id: "OUT_OF_AREA",
    admin: "Adres teslimat bölgesi dışında",
    de: "Ihre Adresse liegt außerhalb unseres Liefergebiets. Der Betrag wird vollständig erstattet — als Abholung können wir die Bestellung gerne zubereiten.",
    tr: "Adresiniz teslimat bölgemizin dışında kalıyor. Ödediğiniz tutarın tamamı iade edilecek — gel-al olarak siparişinizi memnuniyetle hazırlarız.",
  },
  {
    id: "CUSTOMER_UNREACHABLE",
    admin: "Müşteriye ulaşılamadı",
    de: "Wir konnten Sie unter der angegebenen Telefonnummer nicht erreichen und mussten die Bestellung deshalb stornieren. Der Betrag wird vollständig erstattet.",
    tr: "Verdiğiniz telefon numarasından size ulaşamadığımız için siparişi iptal etmek zorunda kaldık. Ödediğiniz tutarın tamamı iade edilecek.",
  },
  {
    id: "CUSTOMER_REQUEST",
    admin: "Müşteri iptal istedi",
    de: "Die Bestellung wurde auf Ihren Wunsch storniert. Der Betrag wird vollständig erstattet.",
    tr: "Sipariş, talebiniz üzerine iptal edildi. Ödediğiniz tutarın tamamı iade edilecek.",
  },
  {
    id: "DUPLICATE",
    admin: "Mükerrer sipariş",
    de: "Diese Bestellung wurde doppelt aufgegeben; wir bereiten nur eine davon zu. Der Betrag dieser Bestellung wird vollständig erstattet.",
    tr: "Bu sipariş iki kez verilmiş; yalnızca birini hazırlıyoruz. Bu siparişin tutarı tamamen iade edilecek.",
  },
  {
    id: "PAYMENT_ISSUE",
    admin: "Ödeme sorunu",
    de: "Bei der Zahlung ist ein Problem aufgetreten, deshalb konnten wir die Bestellung nicht ausführen. Bereits abgebuchte Beträge werden erstattet.",
    tr: "Ödemede bir sorun oluştuğu için siparişi gerçekleştiremedik. Hesabınızdan çekilen tutar iade edilecek.",
  },
  {
    id: "TECHNICAL",
    admin: "Teknik arıza",
    de: "Wegen einer technischen Störung in unserem Betrieb können wir die Bestellung nicht zubereiten. Der Betrag wird vollständig erstattet.",
    tr: "İşletmemizdeki teknik bir arıza nedeniyle siparişi hazırlayamıyoruz. Ödediğiniz tutarın tamamı iade edilecek.",
  },
  {
    id: "OTHER",
    admin: "Diğer (kendim yazacağım)",
    de: "Die Bestellung wurde storniert. Der Betrag wird vollständig erstattet.",
    tr: "Sipariş iptal edildi. Ödediğiniz tutarın tamamı iade edilecek.",
  },
] as const;

const BY_ID = new Map(CANCEL_REASONS.map((reason) => [reason.id, reason] as const));

export function isCancelReasonId(value: string): value is CancelReasonId {
  return BY_ID.has(value as CancelReasonId);
}

/**
 * Kayıttaki değeri müşterinin dilinde bir cümleye çevirir.
 *
 * Tanınmayan değer (bu dosyadan önce yazılmış serbest metin) olduğu gibi
 * döner: eski bir siparişin sebebini "bilinmiyor" diye göstermek, saklanmış
 * bilgiyi çöpe atmak olurdu. Değer boşsa `null` döner ve çağıran taraf kendi
 * genel cümlesini kullanır.
 */
export function describeCancelReason(
  raw: string | null | undefined,
  lang: string
): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  const separator = value.indexOf(":");
  const id = (separator === -1 ? value : value.slice(0, separator)).trim();
  const note = separator === -1 ? "" : value.slice(separator + 1).trim();

  if (!isCancelReasonId(id)) return value;

  // "Diğer"de mutfağın yazdığı cümle müşteriye olduğu gibi gider; dil
  // çevirisi yoktur, çünkü çevrilecek sabit bir metin de yoktur.
  if (id === "OTHER") return note || BY_ID.get("OTHER")![lang === "tr" ? "tr" : "de"];

  return BY_ID.get(id)![lang === "tr" ? "tr" : "de"];
}

/** Panelde görünen kısa etiket; geçmiş listesinde sebebi tek bakışta okumak için. */
export function adminCancelLabel(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  const separator = value.indexOf(":");
  const id = (separator === -1 ? value : value.slice(0, separator)).trim();
  const note = separator === -1 ? "" : value.slice(separator + 1).trim();

  if (!isCancelReasonId(id)) return value;
  if (id === "OTHER") return note || BY_ID.get("OTHER")!.admin;
  return BY_ID.get(id)!.admin;
}

/** Panelden gelen seçimi kayıt biçimine çevirir; geçersizse null. */
export function buildCancelReason(id: string, note: string): string | null {
  if (!isCancelReasonId(id)) return null;
  if (id !== "OTHER") return id;

  const text = note.trim();
  // "Diğer" seçilip hiçbir şey yazılmazsa sebep yok demektir; sessizce boş bir
  // cümle göstermektense çağıran taraf kullanıcıyı uyarsın.
  if (text.length < 3) return null;
  return `OTHER: ${text}`;
}
