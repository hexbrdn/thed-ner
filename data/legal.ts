import { BUSINESS_INFO } from "./businessInfo";

/**
 * Yasal sayfaların veri kaynağı.
 *
 * Impressum'daki alanların bir kısmı **işletmeye özeldir ve uydurulamaz**:
 * sorumlu kişinin adı, vergi numarası, denetim makamı. Bunlar koda gömülmez,
 * ortam değişkeninden gelir. Değer girilmemişse sayfa çökmez ama sessizce de
 * geçmez — eksik alan sayfada kırmızı bir uyarı olarak görünür.
 *
 * Neden sessiz geçilmiyor: eksik Impressum ile yayında olmak, Impressum'un hiç
 * olmamasıyla aynı hukuki sonucu doğurur (DDG § 5, eskiden TMG § 5). "Sonra
 * doldururuz" diye bırakılan bir alanın fark edilmesi için görünür olması
 * gerekir. Uyarı yalnızca eksik alanlarda ve yalnızca o alanın yerinde çıkar.
 */

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

export type LegalField = {
  /** Ortam değişkeninin adı — uyarı metninde gösterilir. */
  key: string;
  value: string;
  /** Değer girilmemiş: sayfada uyarı çıkar. */
  missing: boolean;
};

function field(key: string, fallback = ""): LegalField {
  const value = env(key) || fallback;
  return { key, value, missing: value === "" };
}

/**
 * İşletmenin yasal kimliği.
 *
 * Adres ve telefon zaten `BUSINESS_INFO` içinde doğrulanmış hâlde duruyor;
 * tekrar girilmesi istenmiyor. Yalnızca oradan türetilemeyen alanlar ortamdan
 * okunur.
 */
export const LEGAL = {
  /** § 5 Abs. 1 Nr. 1 DDG — işletmenin tam yasal adı. */
  legalName: field("LEGAL_COMPANY_NAME", BUSINESS_INFO.legalName),
  /** § 5 Abs. 1 Nr. 1 DDG — temsile yetkili kişi. Şahıs işletmesinde sahibin adı. */
  representative: field("LEGAL_REPRESENTATIVE"),
  /** § 5 Abs. 1 Nr. 2 DDG — e-posta adresi zorunlu, telefon zorunlu değil ama var. */
  email: field("LEGAL_CONTACT_EMAIL"),
  /** § 5 Abs. 1 Nr. 6 DDG — USt-IdNr (§ 27a UStG). Yoksa vergi numarası yazılmaz. */
  vatId: field("LEGAL_VAT_ID"),
  /** § 5 Abs. 1 Nr. 3 DDG — gıda işletmesinde yetkili Lebensmittelüberwachung. */
  supervisoryAuthority: field(
    "LEGAL_SUPERVISORY_AUTHORITY",
    "Landratsamt Straubing-Bogen, Lebensmittelüberwachung"
  ),
  /** DSGVO Art. 13 Abs. 1 lit. b — veri sorumlusuyla iletişim. */
  privacyContact: field("LEGAL_PRIVACY_CONTACT"),
  /** Ticaret sicili — şahıs işletmesinde yoktur, bu yüzden eksikliği uyarı değildir. */
  registerEntry: env("LEGAL_REGISTER_ENTRY"),

  address: BUSINESS_INFO.address,
  phone: BUSINESS_INFO.formattedPhone,
  phoneTel: BUSINESS_INFO.phoneTel,
} as const;

/** Uyarı gösterilecek alanlar; boşsa Impressum eksiksiz demektir. */
export function missingLegalFields(): LegalField[] {
  return [
    LEGAL.legalName,
    LEGAL.representative,
    LEGAL.email,
    LEGAL.vatId,
    LEGAL.supervisoryAuthority,
    LEGAL.privacyContact,
  ].filter((f) => f.missing);
}

/**
 * Verinin gittiği üçüncü taraflar — DSGVO Art. 13 Abs. 1 lit. e.
 *
 * Aydınlatma metninde "üçüncü taraflarla paylaşılabilir" demek yeterli
 * değildir; alıcı kategorileri ve AB dışına aktarım varsa dayanağı yazılır.
 * Bu liste kodun gerçekten kullandığı servislerdir — bir servis eklendiğinde
 * bu listeye de eklenmesi gerekir.
 */
export const DATA_PROCESSORS = [
  {
    name: "Stripe Payments Europe, Ltd.",
    location: "Dublin, İrlanda (AB)",
    purposeDe:
      "Zahlungsabwicklung. Übermittelt werden Bestellnummer, Betrag, E-Mail-Adresse und die vom Kunden bei Stripe eingegebenen Zahlungsdaten. Kartendaten erreichen unseren Server zu keinem Zeitpunkt.",
    purposeTr:
      "Ödeme işlemi. Sipariş numarası, tutar, e-posta adresi ve müşterinin Stripe'a girdiği ödeme bilgileri aktarılır. Kart bilgileri hiçbir zaman bizim sunucumuza ulaşmaz.",
  },
  {
    // DİKKAT: bu satır çalışan veritabanının GERÇEK bölgesini söylemek
    // zorundadır. Aydınlatma metninde yanlış sunucu konumu yazmak, DSGVO
    // Art. 13 açısından eksik bilgi vermekle aynı kapıya çıkar. Bölge
    // değiştirilirse (ör. Frankfurt'a taşınırsa) burası da değişmeli.
    name: "Supabase (PostgreSQL, AWS eu-west-1)",
    location: "Dublin, İrlanda (AB)",
    purposeDe:
      "Speicherung der Bestell- und Kundendaten. Der Serverstandort liegt innerhalb der Europäischen Union; eine Drittlandsübermittlung findet nicht statt.",
    purposeTr:
      "Sipariş ve müşteri verilerinin saklanması. Sunucu konumu Avrupa Birliği içindedir; üçüncü ülkeye aktarım yapılmaz.",
  },
  {
    name: "Resend",
    location: "AB / ABD — SCC + Angemessenheitsbeschluss (EU-US DPF)",
    purposeDe:
      "Versand der Bestellbestätigung. Übermittelt werden Name, E-Mail-Adresse und Bestellinhalt.",
    purposeTr:
      "Sipariş onay e-postasının gönderimi. Ad, e-posta adresi ve sipariş içeriği aktarılır.",
  },
] as const;
