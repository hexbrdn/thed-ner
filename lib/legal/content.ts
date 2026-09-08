import { DATA_PROCESSORS, LEGAL, missingLegalFields, type LegalField } from "@/data/legal";
import { BUSINESS_INFO } from "@/data/businessInfo";

/**
 * Yasal sayfaların içeriği.
 *
 * Metinler JSX değil **veri** olarak tutulur. Üç sebep:
 *  1. Sayfalar sunucuda üretilir (ortam değişkenlerini okurlar), gösterim ise
 *     istemcide dil seçimine göre yapılır. Arada taşınan şey sade veri olursa
 *     sunucu/istemci sınırı sorunsuz geçilir.
 *  2. Aynı metin birden çok yerde kullanılabilir (AGB özeti sepette de çıkar).
 *  3. Metnin varlığı test edilebilir: "Impressum'da denetim makamı yazıyor mu"
 *     sorusu bir DOM taraması değil, bir veri kontrolü olur.
 *
 * Almanca metin **bağlayıcı olandır**. Türkçe karşılık müşteri kolaylığıdır ve
 * her belgede bu açıkça yazar; aksi hâlde iki dil arasındaki bir kayma
 * yorum tartışmasına açık kalır.
 */

export type LegalBlock =
  /** Düz paragraf. */
  | { kind: "p"; de: string; tr: string }
  /** Madde listesi. */
  | { kind: "ul"; items: { de: string; tr: string }[] }
  /** Etiket → değer tablosu; değeri eksik alan uyarıyla gösterilir. */
  | { kind: "kv"; rows: { label: string; field: LegalField }[] }
  /** Vurgulu kutu — hukuki olarak öne çıkması gereken bilgi. */
  | { kind: "note"; de: string; tr: string };

export type LegalSection = {
  heading: { de: string; tr: string };
  blocks: LegalBlock[];
};

export type LegalDocumentData = {
  title: { de: string; tr: string };
  /** Belgenin son güncellendiği tarih — DSGVO aydınlatmasında beklenir. */
  updated: string;
  /** Eksik ortam değişkenleri; sayfanın başında toplu uyarı olarak çıkar. */
  missing: LegalField[];
  sections: LegalSection[];
};

const UPDATED = "08.09.2026";

const ADDRESS = `${LEGAL.address.street}, ${LEGAL.address.postalCode} ${LEGAL.address.city}`;

/* ════════════════════════════════════════════════════════════════ Impressum */

export function impressumData(): LegalDocumentData {
  return {
    title: { de: "Impressum", tr: "Künye (Impressum)" },
    updated: UPDATED,
    missing: missingLegalFields(),
    sections: [
      {
        heading: { de: "Angaben gemäß § 5 DDG", tr: "§ 5 DDG uyarınca bilgiler" },
        blocks: [
          {
            kind: "kv",
            rows: [
              { label: "Firma", field: LEGAL.legalName },
              { label: "Vertreten durch", field: LEGAL.representative },
              { label: "USt-IdNr. (§ 27a UStG)", field: LEGAL.vatId },
            ],
          },
          {
            kind: "p",
            de: `Anschrift: ${ADDRESS}, ${LEGAL.address.country}`,
            tr: `Adres: ${ADDRESS}, ${LEGAL.address.countryTr}`,
          },
          {
            kind: "p",
            de: `Telefon: ${LEGAL.phone}`,
            tr: `Telefon: ${LEGAL.phone}`,
          },
          {
            kind: "kv",
            rows: [{ label: "E-Mail", field: LEGAL.email }],
          },
          ...(LEGAL.registerEntry
            ? [
                {
                  kind: "p" as const,
                  de: `Registereintrag: ${LEGAL.registerEntry}`,
                  tr: `Sicil kaydı: ${LEGAL.registerEntry}`,
                },
              ]
            : []),
        ],
      },
      {
        heading: {
          de: "Zuständige Aufsichtsbehörde",
          tr: "Yetkili denetim makamı",
        },
        blocks: [
          {
            kind: "p",
            de: "Für die Lebensmittelüberwachung dieses Betriebs ist zuständig:",
            tr: "Bu işletmenin gıda denetiminden sorumlu makam:",
          },
          {
            kind: "kv",
            rows: [{ label: "Behörde", field: LEGAL.supervisoryAuthority }],
          },
        ],
      },
      {
        heading: {
          de: "Verbraucherstreitbeilegung",
          tr: "Tüketici uyuşmazlık çözümü",
        },
        blocks: [
          {
            // § 36 VSBG: bildirim yükümlülüğü, katılım yükümlülüğü değildir.
            // Küçük işletme katılmama beyanını açıkça yazmak zorundadır.
            kind: "p",
            de: "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 Abs. 1 Nr. 1 VSBG).",
            tr: "Bir tüketici hakem heyeti önünde uyuşmazlık çözüm sürecine katılmaya hazır değiliz ve katılmakla yükümlü de değiliz (§ 36 Abs. 1 Nr. 1 VSBG).",
          },
          {
            // Eski "OS-Plattform" bağlantısı bilinçli olarak YOKTUR. AB'nin
            // çevrimiçi uyuşmazlık çözüm platformu 2025'te kapatıldı; artık
            // çalışmayan bir bağlantıyı Impressum'da tutmak, eksik bilgi
            // vermekle aynı kapıya çıkar ve kendisi uyarı sebebidir.
            kind: "note",
            de: "Die frühere OS-Plattform der Europäischen Kommission wurde eingestellt; ein Verweis darauf erfolgt daher bewusst nicht.",
            tr: "Avrupa Komisyonu'nun eski çevrimiçi uyuşmazlık çözüm platformu kapatılmıştır; bu nedenle bilinçli olarak bağlantı verilmemiştir.",
          },
        ],
      },
      {
        heading: { de: "Haftung für Inhalte und Links", tr: "İçerik ve bağlantı sorumluluğu" },
        blocks: [
          {
            kind: "p",
            de: "Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Für Inhalte externer Links ist stets der jeweilige Anbieter verantwortlich; zum Zeitpunkt der Verlinkung waren keine Rechtsverstöße erkennbar.",
            tr: "Hizmet sağlayıcı olarak bu sayfalardaki kendi içeriklerimizden genel yasalar uyarınca sorumluyuz. Dış bağlantıların içeriğinden ilgili sağlayıcı sorumludur; bağlantı verildiği anda hukuka aykırılık tespit edilmemiştir.",
          },
          {
            kind: "p",
            de: "Die auf dieser Website erstellten Inhalte unterliegen dem deutschen Urheberrecht. Speisenfotos dienen der Illustration; maßgeblich ist die jeweilige Produktbeschreibung.",
            tr: "Bu web sitesinde oluşturulan içerikler Alman telif hakkı yasasına tabidir. Yemek fotoğrafları tanıtım amaçlıdır; bağlayıcı olan ürün açıklamasıdır.",
          },
        ],
      },
    ],
  };
}

/* ═══════════════════════════════════════════════════════════ Datenschutz */

export function datenschutzData(): LegalDocumentData {
  return {
    title: { de: "Datenschutzerklärung", tr: "Gizlilik Politikası" },
    updated: UPDATED,
    missing: [LEGAL.privacyContact].filter((f) => f.missing),
    sections: [
      {
        heading: { de: "1. Verantwortlicher", tr: "1. Veri sorumlusu" },
        blocks: [
          {
            kind: "p",
            de: `Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der DSGVO ist ${LEGAL.legalName.value || "der Betreiber"}, ${ADDRESS}.`,
            tr: `Bu web sitesindeki veri işlemeden DSGVO anlamında sorumlu olan: ${LEGAL.legalName.value || "işletmeci"}, ${ADDRESS}.`,
          },
          { kind: "kv", rows: [{ label: "Datenschutz-Kontakt", field: LEGAL.privacyContact }] },
        ],
      },
      {
        heading: {
          de: "2. Welche Daten wir bei einer Bestellung verarbeiten",
          tr: "2. Sipariş sırasında işlediğimiz veriler",
        },
        blocks: [
          {
            kind: "ul",
            items: [
              { de: "Name", tr: "Ad soyad" },
              { de: "Telefonnummer", tr: "Telefon numarası" },
              {
                de: "Lieferadresse (Straße, Hausnummer, PLZ, Ort)",
                tr: "Teslimat adresi (sokak, bina no, posta kodu, şehir)",
              },
              {
                de: "E-Mail-Adresse (freiwillig; wird sonst von Stripe übernommen)",
                tr: "E-posta adresi (isteğe bağlı; verilmezse Stripe'tan alınır)",
              },
              {
                de: "Bestellinhalt, Beträge, Zeitpunkt und Bestellstatus",
                tr: "Sipariş içeriği, tutarlar, zaman ve sipariş durumu",
              },
              {
                de: "Freitext-Notiz zur Bestellung, sofern angegeben",
                tr: "Girildiyse siparişe ait serbest metin notu",
              },
            ],
          },
          {
            kind: "note",
            de: "Es wird kein Kundenkonto angelegt und es werden keine Zahlungsdaten (Kartennummer, IBAN) auf unseren Servern gespeichert oder verarbeitet.",
            tr: "Müşteri hesabı oluşturulmaz ve hiçbir ödeme verisi (kart numarası, IBAN) sunucularımızda saklanmaz veya işlenmez.",
          },
        ],
      },
      {
        heading: { de: "3. Zweck und Rechtsgrundlage", tr: "3. Amaç ve hukuki dayanak" },
        blocks: [
          {
            kind: "ul",
            items: [
              {
                de: "Durchführung der Bestellung und Lieferung — Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).",
                tr: "Siparişin ve teslimatın gerçekleştirilmesi — Art. 6 Abs. 1 lit. b DSGVO (sözleşmenin ifası).",
              },
              {
                de: "Aufbewahrung von Buchungsbelegen — Art. 6 Abs. 1 lit. c DSGVO i.V.m. § 147 AO, § 257 HGB (gesetzliche Pflicht).",
                tr: "Muhasebe belgelerinin saklanması — Art. 6 Abs. 1 lit. c DSGVO ve § 147 AO, § 257 HGB (yasal yükümlülük).",
              },
              {
                de: "Abwehr von Missbrauch und Betrug (z. B. Sperre nach zu vielen Fehlanmeldungen im Verwaltungsbereich) — Art. 6 Abs. 1 lit. f DSGVO.",
                tr: "Kötüye kullanım ve dolandırıcılığın önlenmesi (ör. yönetim panelinde çok sayıda hatalı girişten sonra engelleme) — Art. 6 Abs. 1 lit. f DSGVO.",
              },
            ],
          },
        ],
      },
      {
        heading: { de: "4. Empfänger der Daten", tr: "4. Verilerin alıcıları" },
        blocks: [
          {
            kind: "p",
            de: "Wir setzen die folgenden Auftragsverarbeiter ein. Eine darüber hinausgehende Weitergabe an Dritte findet nicht statt; die Daten werden nicht zu Werbezwecken verkauft oder überlassen.",
            tr: "Aşağıdaki veri işleyicilerle çalışıyoruz. Bunun ötesinde üçüncü kişilere aktarım yapılmaz; veriler reklam amacıyla satılmaz veya devredilmez.",
          },
          {
            kind: "ul",
            items: DATA_PROCESSORS.map((p) => ({
              de: `${p.name} (${p.location}) — ${p.purposeDe}`,
              tr: `${p.name} (${p.location}) — ${p.purposeTr}`,
            })),
          },
        ],
      },
      {
        heading: { de: "5. Speicherdauer", tr: "5. Saklama süresi" },
        blocks: [
          {
            kind: "p",
            de: "Bestellungen sind Buchungsbelege und werden nach den handels- und steuerrechtlichen Fristen aufbewahrt (§ 147 AO, § 257 HGB). Nach Ablauf der Aufbewahrungsfrist werden die personenbezogenen Bestandteile gelöscht oder anonymisiert.",
            tr: "Siparişler muhasebe belgesi niteliğindedir ve ticaret/vergi hukuku süreleri boyunca saklanır (§ 147 AO, § 257 HGB). Süre dolduğunda kişisel veri içeren kısımlar silinir veya anonimleştirilir.",
          },
          {
            kind: "note",
            de: "Ein Löschverlangen nach Art. 17 DSGVO kann während der gesetzlichen Aufbewahrungsfrist nur eingeschränkt erfüllt werden: die Verarbeitung wird dann nach Art. 18 DSGVO eingeschränkt statt gelöscht.",
            tr: "Art. 17 DSGVO uyarınca silme talebi, yasal saklama süresi boyunca ancak sınırlı ölçüde yerine getirilebilir: bu durumda veri silinmez, Art. 18 DSGVO uyarınca işlenmesi kısıtlanır.",
          },
        ],
      },
      {
        heading: {
          de: "6. Cookies und lokale Speicherung",
          tr: "6. Çerezler ve yerel depolama",
        },
        blocks: [
          {
            kind: "p",
            de: "Diese Website setzt keine Tracking- oder Werbe-Cookies und bindet keine Analysedienste ein. Im lokalen Speicher des Browsers werden ausschließlich der Warenkorb und die gewählte Sprache abgelegt; im Verwaltungsbereich zusätzlich ein Sitzungscookie für die Anmeldung.",
            tr: "Bu web sitesi izleme veya reklam çerezi kullanmaz ve hiçbir analiz servisi barındırmaz. Tarayıcının yerel deposunda yalnızca sepet ve seçilen dil tutulur; yönetim panelinde ek olarak oturum çerezi bulunur.",
          },
          {
            // TDDDG § 25 Abs. 2 Nr. 2: hizmetin sunulabilmesi için zorunlu
            // olan saklama rıza gerektirmez. Bu yüzden bu sitede çerez
            // bandı yoktur ve olmaması doğrudur.
            kind: "p",
            de: "Diese Speicherung ist für den vom Nutzer ausdrücklich gewünschten Dienst unbedingt erforderlich und daher nach § 25 Abs. 2 Nr. 2 TDDDG einwilligungsfrei. Ein Cookie-Banner ist deshalb nicht erforderlich.",
            tr: "Bu saklama, kullanıcının açıkça talep ettiği hizmet için kesinlikle gereklidir ve bu nedenle § 25 Abs. 2 Nr. 2 TDDDG uyarınca rıza gerektirmez. Bu yüzden çerez bandı bulunmamaktadır.",
          },
        ],
      },
      {
        heading: { de: "7. Ihre Rechte", tr: "7. Haklarınız" },
        blocks: [
          {
            kind: "ul",
            items: [
              { de: "Auskunft (Art. 15 DSGVO)", tr: "Bilgi edinme (Art. 15 DSGVO)" },
              { de: "Berichtigung (Art. 16 DSGVO)", tr: "Düzeltme (Art. 16 DSGVO)" },
              { de: "Löschung (Art. 17 DSGVO)", tr: "Silme (Art. 17 DSGVO)" },
              {
                de: "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
                tr: "İşlemenin kısıtlanması (Art. 18 DSGVO)",
              },
              {
                de: "Datenübertragbarkeit (Art. 20 DSGVO)",
                tr: "Veri taşınabilirliği (Art. 20 DSGVO)",
              },
              { de: "Widerspruch (Art. 21 DSGVO)", tr: "İtiraz (Art. 21 DSGVO)" },
            ],
          },
          {
            kind: "p",
            de: "Zuständige Aufsichtsbehörde für die Beschwerde nach Art. 77 DSGVO ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.",
            tr: "Art. 77 DSGVO uyarınca şikâyet için yetkili denetim makamı: Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Promenade 18, 91522 Ansbach.",
          },
          {
            kind: "p",
            de: "Eine automatisierte Entscheidungsfindung einschließlich Profiling nach Art. 22 DSGVO findet nicht statt.",
            tr: "Art. 22 DSGVO anlamında profilleme dahil otomatik karar verme uygulanmamaktadır.",
          },
        ],
      },
    ],
  };
}

/* ═══════════════════════════════════════════════════════════════════ AGB */

export function agbData(): LegalDocumentData {
  return {
    title: { de: "Allgemeine Geschäftsbedingungen", tr: "Genel İşlem Koşulları (AGB)" },
    updated: UPDATED,
    missing: [],
    sections: [
      {
        heading: { de: "§ 1 Geltungsbereich", tr: "§ 1 Kapsam" },
        blocks: [
          {
            kind: "p",
            de: `Diese Bedingungen gelten für alle Bestellungen, die über diese Website bei ${LEGAL.legalName.value || BUSINESS_INFO.name}, ${ADDRESS}, aufgegeben werden. Maßgeblich ist die deutsche Fassung dieser Bedingungen; die türkische Übersetzung dient allein dem Verständnis.`,
            tr: `Bu koşullar, bu web sitesi üzerinden ${LEGAL.legalName.value || BUSINESS_INFO.name}, ${ADDRESS} adresine verilen tüm siparişler için geçerlidir. Bağlayıcı olan bu koşulların Almanca metnidir; Türkçe çeviri yalnızca anlaşılırlık içindir.`,
          },
        ],
      },
      {
        heading: { de: "§ 2 Vertragsschluss", tr: "§ 2 Sözleşmenin kurulması" },
        blocks: [
          {
            kind: "p",
            de: "Die Darstellung der Speisen auf dieser Website ist kein bindendes Angebot, sondern eine unverbindliche Aufforderung zur Bestellung.",
            tr: "Bu web sitesindeki yemeklerin sunumu bağlayıcı bir icap değil, sipariş vermeye yönelik bağlayıcı olmayan bir davettir.",
          },
          {
            kind: "p",
            de: "Mit dem Klick auf die Schaltfläche „Zahlungspflichtig bestellen“ geben Sie ein verbindliches Angebot zum Kauf der im Warenkorb enthaltenen Speisen ab. Der Vertrag kommt zustande, sobald wir die Bestellung annehmen — spätestens mit der Bestätigungs-E-Mail bzw. mit dem Beginn der Zubereitung.",
            tr: "„Ödemeli sipariş ver“ düğmesine tıkladığınızda, sepetteki ürünlerin satın alınmasına yönelik bağlayıcı bir icapta bulunmuş olursunuz. Sözleşme, siparişi kabul ettiğimiz anda — en geç onay e-postası veya hazırlığın başlamasıyla — kurulur.",
          },
          {
            kind: "note",
            de: "Eine automatische Eingangsbestätigung stellt noch keine Annahme der Bestellung dar. Nehmen wir die Bestellung nicht an (z. B. weil ein Gericht ausverkauft ist oder die Lieferadresse außerhalb des Liefergebiets liegt), erstatten wir bereits gezahlte Beträge unverzüglich vollständig zurück.",
            tr: "Otomatik alındı bildirimi henüz siparişin kabulü anlamına gelmez. Siparişi kabul etmezsek (ör. bir ürün tükendiyse veya adres teslimat bölgesi dışındaysa) ödenmiş tutarı gecikmeksizin tamamen iade ederiz.",
          },
        ],
      },
      {
        heading: { de: "§ 3 Preise und Zahlung", tr: "§ 3 Fiyatlar ve ödeme" },
        blocks: [
          {
            kind: "p",
            de: "Alle Preise sind Endpreise in Euro und enthalten die gesetzliche Umsatzsteuer (§ 3 PAngV). Liefer- und Servicegebühren werden vor Abgabe der Bestellung gesondert ausgewiesen.",
            tr: "Tüm fiyatlar Euro cinsinden nihai fiyatlardır ve yasal katma değer vergisini içerir (§ 3 PAngV). Teslimat ve servis ücretleri sipariş verilmeden önce ayrıca gösterilir.",
          },
          {
            kind: "p",
            de: "Die Zahlung erfolgt im Voraus online über unseren Zahlungsdienstleister Stripe. Die Bestellung wird erst nach Zahlungseingang zubereitet.",
            tr: "Ödeme, ödeme hizmeti sağlayıcımız Stripe üzerinden peşin olarak çevrimiçi yapılır. Sipariş, ödeme ulaşmadan hazırlanmaya başlanmaz.",
          },
          {
            kind: "p",
            de: "Der Mindestbestellwert und die Liefergebühr richten sich nach der Postleitzahl der Lieferadresse und werden nach Eingabe der PLZ angezeigt, bevor die Bestellung abgegeben wird.",
            tr: "Minimum sepet tutarı ve teslimat ücreti, teslimat adresinin posta koduna göre belirlenir ve posta kodu girildikten sonra, sipariş verilmeden önce gösterilir.",
          },
        ],
      },
      {
        heading: { de: "§ 4 Lieferung", tr: "§ 4 Teslimat" },
        blocks: [
          {
            kind: "p",
            de: "Wir liefern ausschließlich innerhalb der auf der Website angegebenen Postleitzahlen und nur während der Öffnungszeiten. Angegebene Lieferzeiten sind Schätzwerte und keine verbindlich zugesagten Termine; sie können sich bei hohem Bestellaufkommen oder Wetterlage verschieben.",
            tr: "Yalnızca web sitesinde belirtilen posta kodlarına ve yalnızca açık olduğumuz saatlerde teslimat yaparız. Belirtilen teslim süreleri tahminidir, kesin taahhüt edilmiş tarihler değildir; yoğunluk veya hava koşullarında değişebilir.",
          },
          {
            kind: "p",
            de: "Bitte stellen Sie sicher, dass Sie unter der angegebenen Telefonnummer erreichbar sind. Kann die Lieferung aus Gründen, die Sie zu vertreten haben, nicht zugestellt werden, gilt die Leistung als erbracht.",
            tr: "Lütfen verdiğiniz telefon numarasından ulaşılabilir olduğunuzdan emin olun. Teslimat, sizden kaynaklanan sebeplerle yapılamazsa edim ifa edilmiş sayılır.",
          },
        ],
      },
      {
        heading: { de: "§ 5 Stornierung", tr: "§ 5 İptal" },
        blocks: [
          {
            kind: "p",
            de: "Solange die Zubereitung noch nicht begonnen hat, können Sie die Bestellung telefonisch stornieren; bereits gezahlte Beträge werden vollständig erstattet. Nach Beginn der Zubereitung ist eine Stornierung nicht mehr möglich.",
            tr: "Hazırlık başlamadığı sürece siparişinizi telefonla iptal edebilirsiniz; ödenen tutar tamamen iade edilir. Hazırlık başladıktan sonra iptal mümkün değildir.",
          },
        ],
      },
      {
        heading: { de: "§ 6 Widerrufsrecht", tr: "§ 6 Cayma hakkı" },
        blocks: [
          {
            kind: "p",
            de: "Für frisch zubereitete, schnell verderbliche Speisen besteht gemäß § 312g Abs. 2 Nr. 2 BGB kein Widerrufsrecht. Für versiegelt gelieferte, nicht schnell verderbliche Waren (z. B. Getränke in verschlossenen Flaschen) gilt die Widerrufsbelehrung.",
            tr: "Taze hazırlanan, çabuk bozulabilen yemeklerde § 312g Abs. 2 Nr. 2 BGB uyarınca cayma hakkı yoktur. Kapalı olarak teslim edilen ve çabuk bozulmayan ürünlerde (ör. kapalı şişe içecekler) cayma bildirimi geçerlidir.",
          },
        ],
      },
      {
        heading: { de: "§ 7 Mängel und Haftung", tr: "§ 7 Ayıp ve sorumluluk" },
        blocks: [
          {
            kind: "p",
            de: "Es gilt das gesetzliche Mängelhaftungsrecht. Bitte melden Sie Beanstandungen möglichst umgehend telefonisch, damit wir sie prüfen und beheben können.",
            tr: "Yasal ayıp sorumluluğu hükümleri geçerlidir. Şikâyetlerinizi mümkün olan en kısa sürede telefonla bildirin ki inceleyip giderebilelim.",
          },
          {
            kind: "p",
            de: "Die Haftung für leicht fahrlässige Pflichtverletzungen ist ausgeschlossen, soweit nicht wesentliche Vertragspflichten, Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit oder Ansprüche nach dem Produkthaftungsgesetz betroffen sind.",
            tr: "Hafif ihmalden kaynaklanan yükümlülük ihlallerinde sorumluluk, esaslı sözleşme yükümlülükleri, yaşam/vücut bütünlüğü/sağlık ihlalinden doğan zararlar ve Ürün Sorumluluğu Kanunu'ndan doğan talepler dışında kapsam dışıdır.",
          },
        ],
      },
      {
        heading: { de: "§ 8 Allergene und Zusatzstoffe", tr: "§ 8 Alerjenler ve katkı maddeleri" },
        blocks: [
          {
            kind: "p",
            de: "Die Kennzeichnung der 14 Hauptallergene nach LMIV (VO (EU) Nr. 1169/2011) und der kennzeichnungspflichtigen Zusatzstoffe erfolgt in der Speisekarte. Trotz sorgfältiger Zubereitung können in unserer Küche Spuren anderer allergener Zutaten nicht vollständig ausgeschlossen werden.",
            tr: "LMIV (AB 1169/2011) uyarınca 14 ana alerjen ve bildirimi zorunlu katkı maddeleri menüde belirtilmektedir. Özenli hazırlığa rağmen mutfağımızda diğer alerjenlerin eser miktarda bulunması tamamen dışlanamaz.",
          },
        ],
      },
      {
        heading: { de: "§ 9 Schlussbestimmungen", tr: "§ 9 Son hükümler" },
        blocks: [
          {
            kind: "p",
            de: "Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Ist eine Bestimmung unwirksam, bleibt der Vertrag im Übrigen wirksam.",
            tr: "Milletlerarası Mal Satımı Sözleşmeleri Hakkında BM Antlaşması hariç Alman hukuku uygulanır. Bir hüküm geçersiz olursa sözleşmenin geri kalanı geçerli kalır.",
          },
        ],
      },
    ],
  };
}

/* ═════════════════════════════════════════════════════════════ Widerruf */

export function widerrufData(): LegalDocumentData {
  return {
    title: { de: "Widerrufsbelehrung", tr: "Cayma Hakkı Bildirimi" },
    updated: UPDATED,
    missing: [LEGAL.email].filter((f) => f.missing),
    sections: [
      {
        heading: {
          de: "Ausschluss des Widerrufsrechts bei Speisen",
          tr: "Yemeklerde cayma hakkının bulunmaması",
        },
        blocks: [
          {
            kind: "note",
            de: "Bei der Lieferung frisch zubereiteter Speisen besteht kein Widerrufsrecht. Es handelt sich um Waren, die schnell verderben können — das Widerrufsrecht ist nach § 312g Abs. 2 Nr. 2 BGB ausgeschlossen.",
            tr: "Taze hazırlanan yemeklerin teslimatında cayma hakkı bulunmamaktadır. Bunlar çabuk bozulabilen ürünlerdir — cayma hakkı § 312g Abs. 2 Nr. 2 BGB uyarınca kapsam dışıdır.",
          },
          {
            kind: "p",
            de: "Dieser Ausschluss wird eng ausgelegt. Er gilt nicht für Waren, die nicht schnell verderben — insbesondere nicht für Getränke in original verschlossenen Flaschen oder Dosen. Für diese gilt die nachstehende Widerrufsbelehrung.",
            tr: "Bu istisna dar yorumlanır. Çabuk bozulmayan ürünler için geçerli değildir — özellikle orijinal kapalı şişe veya kutu içeceklerde. Bunlar için aşağıdaki cayma bildirimi geçerlidir.",
          },
        ],
      },
      {
        heading: {
          de: "Widerrufsrecht für nicht verderbliche Waren",
          tr: "Bozulmayan ürünler için cayma hakkı",
        },
        blocks: [
          {
            kind: "p",
            de: "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.",
            tr: "Bu sözleşmeden on dört gün içinde, gerekçe göstermeksizin cayma hakkına sahipsiniz. Cayma süresi, ürünleri sizin veya taşıyıcı olmayan ve tarafınızca belirlenen üçüncü kişinin teslim aldığı günden itibaren on dört gündür.",
          },
          {
            kind: "p",
            de: `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${LEGAL.legalName.value || BUSINESS_INFO.name}, ${ADDRESS}, Telefon ${LEGAL.phone}${LEGAL.email.value ? `, E-Mail ${LEGAL.email.value}` : ""}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.`,
            tr: `Cayma hakkınızı kullanmak için bize (${LEGAL.legalName.value || BUSINESS_INFO.name}, ${ADDRESS}, Telefon ${LEGAL.phone}${LEGAL.email.value ? `, E-posta ${LEGAL.email.value}` : ""}) açık bir beyanla (ör. posta ile gönderilen mektup veya e-posta) bu sözleşmeden cayma kararınızı bildirmeniz gerekir. Süreye uyulması için bildirimi süre dolmadan göndermeniz yeterlidir.`,
          },
        ],
      },
      {
        heading: { de: "Folgen des Widerrufs", tr: "Caymanın sonuçları" },
        blocks: [
          {
            kind: "p",
            de: "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.",
            tr: "Bu sözleşmeden caymanız hâlinde, sizden aldığımız tüm ödemeleri, teslimat masrafları dahil (sunduğumuz en uygun standart teslimat dışında bir teslimat türü seçmenizden doğan ek masraflar hariç), cayma bildiriminizin bize ulaştığı günden itibaren gecikmeksizin ve en geç on dört gün içinde geri ödemekle yükümlüyüz.",
          },
          {
            kind: "p",
            de: "Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.",
            tr: "Bu geri ödeme için, sizinle açıkça başka bir şey kararlaştırılmadıkça, ilk işlemde kullandığınız ödeme aracının aynısını kullanırız; bu geri ödeme nedeniyle sizden hiçbir ücret alınmaz.",
          },
          {
            kind: "p",
            de: "Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.",
            tr: "Ürünlerin iadesine ilişkin doğrudan masraflar size aittir. Ürünlerdeki değer kaybından yalnızca, bu kaybın ürünlerin niteliğinin, özelliklerinin ve işleyişinin denetlenmesi için gerekli olmayan bir kullanımdan kaynaklanması hâlinde sorumlu olursunuz.",
          },
        ],
      },
      {
        heading: { de: "Muster-Widerrufsformular", tr: "Örnek cayma formu" },
        blocks: [
          {
            kind: "p",
            de: "(Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück.)",
            tr: "(Sözleşmeden caymak istiyorsanız lütfen bu formu doldurup gönderin.)",
          },
          {
            kind: "ul",
            items: [
              {
                de: `An: ${LEGAL.legalName.value || BUSINESS_INFO.name}, ${ADDRESS}${LEGAL.email.value ? `, ${LEGAL.email.value}` : ""}`,
                tr: `Alıcı: ${LEGAL.legalName.value || BUSINESS_INFO.name}, ${ADDRESS}${LEGAL.email.value ? `, ${LEGAL.email.value}` : ""}`,
              },
              {
                de: "Hiermit widerrufe(n) ich/wir den von mir/uns abgeschlossenen Vertrag über den Kauf der folgenden Waren:",
                tr: "İşbu belgeyle, aşağıdaki ürünlerin satın alınmasına ilişkin tarafımdan/tarafımızdan kurulan sözleşmeden cayıyorum/cayıyoruz:",
              },
              { de: "Bestellt am / erhalten am:", tr: "Sipariş tarihi / teslim tarihi:" },
              { de: "Name des/der Verbraucher(s):", tr: "Tüketici(ler)in adı:" },
              { de: "Anschrift des/der Verbraucher(s):", tr: "Tüketici(ler)in adresi:" },
              {
                de: "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier), Datum",
                tr: "Tüketici(ler)in imzası (yalnızca kâğıt bildirimde), tarih",
              },
            ],
          },
        ],
      },
    ],
  };
}
