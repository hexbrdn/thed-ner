export type Option = {
  id: string;
  label: string;
  labelDe: string;
  desc: string;
  descDe: string;
  price: number;
  kcal: number;
  image?: string;
};

export const BREADS: Option[] = [
  { id: "kalin", label: "Kalın Pide", labelDe: "Dickes Fladenbrot", desc: "Dolgun, yoğun iç", descDe: "Artisan Pita, saftig", price: 0, kcal: 320, image: "/assets/ing-bun-thick.webp" },
  { id: "ince", label: "İnce Pide", labelDe: "Dünnes Fladenbrot", desc: "Hafif, gevrek kabuk", descDe: "Leicht und knusprig", price: 6, kcal: 240, image: "/assets/ing-bun-bottom.webp" },
];

export const PROTEIN: Option[] = [
  { id: "et-tek", label: "Tek Porsiyon Et", labelDe: "Einzelne Portion Fleisch", desc: "180g, şişten taze kesim", descDe: "180g, frisch vom Spieß", price: 0, kcal: 340, image: "/assets/ing-meat.webp" },
  { id: "et-cift", label: "Çift Porsiyon Et", labelDe: "Doppelte Portion Fleisch", desc: "320g, doyurucu seçim", descDe: "320g, extra Fleisch", price: 45, kcal: 610 },
];

export const VEGGIES: Option[] = [
  { id: "domates", label: "Domates", labelDe: "Tomaten", desc: "Dilim dilim taze", descDe: "Sonnengereift & frisch", price: 0, kcal: 18, image: "/assets/ing-tomato.webp" },
  { id: "sogan", label: "Kırmızı Soğan", labelDe: "Rote Zwiebeln", desc: "İnce halka kesim", descDe: "Feine Zwiebelringe", price: 0, kcal: 12, image: "/assets/ing-onion.webp" },
  { id: "marul", label: "Marul", labelDe: "Kopfsalat", desc: "Buz gibi taze", descDe: "Knackig & frisch", price: 0, kcal: 8, image: "/assets/ing-lettuce.webp" },
];

export const SAUCES: Option[] = [
  { id: "sarimsak", label: "Sarımsak Sos", labelDe: "Knoblauchsoße", desc: "Yoğurt bazlı, otlu", descDe: "Mit Kräutern & Joghurt", price: 0, kcal: 90, image: "/assets/ing-sauce.webp" },
  { id: "acili", label: "Acı Sos", labelDe: "Scharfe Soße", desc: "Köz biber, ateşli", descDe: "Chili & Paprika", price: 0, kcal: 45, image: "/assets/ing-ketchup.webp" },
  { id: "ikisi", label: "İkisi Birden", labelDe: "Beides zusammen", desc: "Kararsız kalanlar için", descDe: "Für Unentschlossene", price: 4, kcal: 120, image: "/assets/ing-sauce-mix.webp" },
];

export const MENU_COMBOS = [
  {
    id: "klasik",
    code: "Menü 01",
    name: "Klasik Döner",
    nameDe: "HDD Sandwich Klasik",
    desc: "Somun ekmek, tek porsiyon et, tam malzeme, sarımsak sos.",
    descDe: "Frisches Fladenbrot, knuspriges Fleisch, frischer Salat & hausgemachte Knoblauchsoße.",
    price: 165,
    image: "/assets/menu-klasik.webp",
    alt: "Susamlı somun ekmekte, sarımsak ve acı soslu, domates-marul-soğanlı klasik döner sandviç",
  },
  {
    id: "ateshane",
    code: "Menü 02",
    name: "Ateşhane Özel",
    nameDe: "HDD Spezial Grill",
    desc: "Izgara pide, çift porsiyon et, acı sos, közlenmiş biber.",
    descDe: "Gegrillte Pita, doppeltes Fleisch, scharfe Soße und gegrillte Paprika.",
    price: 215,
    image: "/assets/menu-ateshane.webp",
    alt: "Izgara pide içinde acı soslu çift porsiyon et, yanında közlenmiş biber",
  },
  {
    id: "iki-dunya",
    code: "Menü 03",
    name: "İki Dünya Menü",
    nameDe: "Zwei-Welten Menü",
    desc: "Klasik döner, yanında ayran ve patates.",
    descDe: "HDD Sandwich mit knusprigen Pommes und Erfrischungsgetränk.",
    price: 195,
    image: "/assets/menu-iki-dunya.webp",
    alt: "Tepside döner sandviç, patates kızartması ve ayran",
  },
];
