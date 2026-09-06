export const BUSINESS_INFO = {
  name: "Sami´s Döner",
  legalName: "Sami´s Döner",
  category: "Döner Restaurant / Fast Food Imbiss",
  categoryDe: "Döner Imbiss & Fast Food Restaurant",
  categoryTr: "Döner Restoranı & Hızlı Yemek",
  phone: "+49 9424 3909330",
  phoneTel: "tel:+4994243909330",
  formattedPhone: "+49 (0) 9424 3909330",
  website: "", // Google Maps üzerinde web sitesi bulunmamaktadır
  mapsUrl:
    "https://www.google.com/maps/place/Sami%C2%B4s+D%C3%B6ner/@48.8316947,12.7182835,17z/data=!4m7!3m6!1s0x47756d706f31c5ed:0xca129c517b0582ea!4b1!8m2!3d48.8315583!4d12.7207604!16s%2Fg%2F11qfh87769",
  address: {
    street: "Straubinger Str. 3",
    postalCode: "94342",
    city: "Straßkirchen",
    state: "Bayern",
    country: "Deutschland",
    countryTr: "Almanya",
    fullAddress: "Straubinger Str. 3, 94342 Straßkirchen, Deutschland",
  },
  coordinates: {
    lat: 48.8315583,
    lng: 12.7207604,
  },
  rating: 4.9,
  reviewCount: 106,
  priceRange: "€1–10",
  services: {
    dineIn: true,
    takeaway: true,
    delivery: false, // Google Maps: Kein Lieferdienst
  },
  /**
   * Sosyal medya adresleri. Boş bırakılan hesap sitede hiç gösterilmez —
   * doğrulanmamış/placeholder bağlantı yayına çıkmasın diye.
   */
  social: {
    instagram: "",
    facebook: "",
    youtube: "",
  },
  accessibility: {
    wheelchairParking: true,
  },
  openingHours: [
    { dayDe: "Montag", dayTr: "Pazartesi", hours: "11:00 – 21:00", open: "11:00", close: "21:00" },
    { dayDe: "Dienstag", dayTr: "Salı", hours: "11:00 – 21:00", open: "11:00", close: "21:00" },
    { dayDe: "Mittwoch", dayTr: "Çarşamba", hours: "11:00 – 21:00", open: "11:00", close: "21:00" },
    { dayDe: "Donnerstag", dayTr: "Perşembe", hours: "11:00 – 21:00", open: "11:00", close: "21:00" },
    { dayDe: "Freitag", dayTr: "Cuma", hours: "11:00 – 21:00", open: "11:00", close: "21:00" },
    { dayDe: "Samstag", dayTr: "Cumartesi", hours: "11:00 – 21:00", open: "11:00", close: "21:00" },
    { dayDe: "Sonntag", dayTr: "Pazar", hours: "12:00 – 21:00", open: "12:00", close: "21:00" },
  ],
};
