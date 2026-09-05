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
    id: "doener-tasche",
    code: "Döner-Tasche",
    name: "Döner-Tasche (gr.)",
    nameDe: "Döner-Tasche (gr.)",
    desc: "Dönerfleisch im Fladenbrot mit Salat und Sauce.",
    descDe: "Dönerfleisch im Fladenbrot mit Salat und Sauce.",
    price: 11.5,
    image: "/assets/menu-klasik.webp",
    alt: "Döner-Tasche: Dönerfleisch im Fladenbrot mit Salat und Sauce",
  },
  {
    id: "doener-duerum",
    code: "Döner-Dürüm",
    name: "Döner-Dürüm",
    nameDe: "Döner-Dürüm",
    desc: "Dönerfleisch im Blätterteig mit Salat und Sauce.",
    descDe: "Dönerfleisch im Blätterteig mit Salat und Sauce.",
    price: 9,
    image: "/assets/menu-ateshane.webp",
    alt: "Döner-Dürüm: gerollte Yufka mit Dönerfleisch, Salat und Sauce",
  },
  {
    id: "doener-teller",
    code: "Döner-Teller",
    name: "Döner-Teller",
    nameDe: "Döner-Teller",
    desc: "Dönerfleisch mit Salat und Pommes oder Reis.",
    descDe: "Dönerfleisch mit Salat und Pommes oder Reis.",
    price: 14,
    image: "/assets/menu-iki-dunya.webp",
    alt: "Döner-Teller mit Dönerfleisch, Salat und Pommes",
  },
];

/* --------------------------------------------------------------------------
 * Sami´s Döner – vollständige Speisekarte
 * Quelle: offizielle Menüseite des Betriebs (samis-döner.de/menue/).
 * Preise in Euro, exakt wie in der Quelle angegeben. Keine Ergänzungen.
 * ------------------------------------------------------------------------ */

export type MenuVariant = {
  /** z.B. "kl.", "gr.", "0,5 l", "Rolle" – leer, wenn es nur einen Preis gibt */
  size: string;
  /** Preis als Text, exakt wie in der Quelle (z.B. "7,00 €") */
  price: string;
};

export type MenuItem = {
  id: string;
  name: string;
  /** Beschreibung aus der Quelle; leer, wenn keine angegeben ist */
  desc: string;
  variants: MenuVariant[];
  image?: string;
};

export type MenuCategory = {
  id: string;
  /** Überschrift exakt wie in der Quelle */
  title: string;
  items: MenuItem[];
};

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "fuer-sie-das-beste",
    title: "Für Sie Das Beste",
    items: [
      {
        id: "doener-tasche",
        name: "Döner-Tasche",
        desc: "Dönerfleisch im Fladenbrot mit Salat und Sauce.",
        variants: [
          { size: "kl.", price: "7,00 €" },
          { size: "gr.", price: "11,50 €" },
        ],
        image: "/assets/menu-klasik.webp",
      },
      {
        id: "doener-duerum",
        name: "Döner-Dürüm",
        desc: "Dönerfleisch im Blätterteig mit Salat und Sauce.",
        variants: [{ size: "", price: "9,00 €" }],
        image: "/assets/menu-ateshane.webp",
      },
      {
        id: "pom-doener",
        name: "Pom-Döner ( in Döner-Box )",
        desc: "Dönerfleisch mit Pommes und Salat.",
        variants: [{ size: "", price: "9,00 €" }],
      },
      {
        id: "doener-teller",
        name: "Döner-Teller",
        desc: "Dönerfleisch mit Salat und Pommes oder Reis.",
        variants: [{ size: "", price: "14,00 €" }],
        image: "/assets/menu-iki-dunya.webp",
      },
      {
        id: "doenerfleisch",
        name: "Dönerfleisch",
        desc: "Dönerfleisch in Tellerbox.",
        variants: [
          { size: "kl.", price: "10,00 €" },
          { size: "gr.", price: "18,00 €" },
        ],
        image: "/assets/ing-meat.webp",
      },
      {
        id: "saucen-schale",
        name: "Mayo-, Ketchup-, Zaziki-, Curry Soße- Schale",
        desc: "",
        variants: [
          { size: "kl.", price: "0,70 €" },
          { size: "gr.", price: "1,50 €" },
        ],
        image: "/assets/ing-sauce.webp",
      },
      {
        id: "pommes",
        name: "Pommes",
        desc: "",
        variants: [
          { size: "kl.", price: "3,50 €" },
          { size: "gr.", price: "4,50 €" },
        ],
      },
      {
        id: "pommes-spezial",
        name: "Pommes Spezial",
        desc: "",
        variants: [{ size: "", price: "5,60 €" }],
      },
      {
        id: "sucuk-tasche",
        name: "Sucuk-Tasche",
        desc: "Knoblauchwurst im Fladenbrot mit Salat.",
        variants: [{ size: "", price: "8,00 €" }],
      },
      {
        id: "falafel-tasche",
        name: "Falafel-Tasche",
        desc: "Kichererbsenfrikadellen im Fladenbrot mit Salat.",
        variants: [{ size: "", price: "8,00 €" }],
      },
      {
        id: "falafel-teller",
        name: "Falafel-Teller",
        desc: "Kichererbsenfrikadellen mit Pommes und Salat.",
        variants: [{ size: "", price: "13,00 €" }],
      },
    ],
  },
  {
    id: "original-doener",
    title: "Original-DÖNER",
    items: [
      {
        id: "lahmacun-salat",
        name: "Türkische Pizza / Lahmacun",
        desc: "+ Salat.",
        variants: [{ size: "", price: "6,00 €" }],
      },
      {
        id: "lahmacun-doenerfleisch",
        name: "Türkische Pizza / Lahmacun",
        desc: "+ Dönerfleisch und Salat.",
        variants: [{ size: "", price: "9,00 €" }],
      },
      {
        id: "boerek",
        name: "Börek",
        desc: "türkische Teigspezialitäten.",
        variants: [
          { size: "Rolle", price: "1,50 €" },
          { size: "Dreieck", price: "2,00 €" },
          { size: "Schnecke", price: "3,00 €" },
        ],
      },
      {
        id: "gemischter-salat",
        name: "Gemischter Salat",
        desc: "",
        variants: [{ size: "", price: "5,00 €" }],
        image: "/assets/ing-lettuce.webp",
      },
      {
        id: "salat-tasche",
        name: "Salat-Tasche",
        desc: "Gemischter Salat im Fladenbrot mit Sauce.",
        variants: [{ size: "", price: "5,00 €" }],
      },
      {
        id: "iskender-doener",
        name: "Iskender-Döner",
        desc: "+ kleine Fladenbrotwürfel, Tomatensauce und Joguhrt.",
        variants: [{ size: "", price: "10,00 €" }],
      },
      {
        id: "suppe",
        name: "Suppe",
        desc: "Täglich wechselnden Suppen.",
        variants: [{ size: "", price: "3,50 €" }],
      },
    ],
  },
  {
    id: "schueler-menue",
    title: "Schüler-Menü",
    items: [
      {
        id: "schueler-menue",
        name: "Schüler-Menü",
        desc: "Döner Tasche (klein) + kleine Pommes und Durstlöscher.",
        variants: [{ size: "", price: "10,50 €" }],
      },
      {
        id: "menue-1",
        name: "Menü 1",
        desc: "Türk. Pizza mit Dönerfleisch und Salat + kleine Pommes und Ayran.",
        variants: [{ size: "", price: "13,00 €" }],
      },
      {
        id: "menue-2",
        name: "Menü 2",
        desc: "Döner Dürüm ( gerollt ) + kleine Pommes und Durstlöscher.",
        variants: [{ size: "", price: "13,00 €" }],
      },
      {
        id: "menue-3",
        name: "Menü 3",
        desc: "Falafel Tasche mit Salat + kleine Pommes und Ayran.",
        variants: [{ size: "", price: "14,00 €" }],
      },
      {
        id: "menues-mit-cola",
        name: "Alle Menüs mit Cola",
        desc: "",
        variants: [{ size: "", price: "+ 1,00 €" }],
      },
    ],
  },
  {
    id: "getraenke",
    // Hinweis: In der Quelle stehen die Getränke ohne eigene Überschrift am
    // Ende der Karte. Titel hier zur Gliederung ergänzt.
    title: "Getränke",
    items: [
      {
        id: "softdrinks",
        name: "Cola, Cola Light, Fanta, Sprite, Mexo Mix",
        desc: "",
        variants: [{ size: "0,5 l", price: "2,25 €" }],
      },
      {
        id: "wasser",
        name: "Wasser",
        desc: "",
        variants: [{ size: "0,5 l", price: "2,00 €" }],
      },
      {
        id: "ayran-durstloescher",
        name: "Ayran, Durstlöscher",
        desc: "",
        variants: [{ size: "", price: "1,50 €" }],
      },
      {
        id: "uludag-gazoz",
        name: "Uludag Gazoz",
        desc: "",
        variants: [{ size: "0,5 l", price: "2,50 €" }],
      },
      {
        id: "redbull",
        name: "Redbull",
        desc: "",
        variants: [{ size: "0,25 l", price: "2,60 €" }],
      },
      {
        id: "heissgetraenke",
        name: "Alle Heißgetränke",
        desc: "",
        variants: [{ size: "", price: "2,00 €" }],
      },
    ],
  },
];
