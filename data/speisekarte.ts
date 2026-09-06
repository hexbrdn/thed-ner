/**
 * Sami´s Döner karta verisi.
 *
 * Bu liste dükkânın basılı menüsünün birebir karşılığıdır: numaralar, adlar,
 * içerikler ve fiyatlar menüde yazdığı gibi durur. Fiyatlar sayı değil metin
 * olarak tutulur ki hiçbir yerde yuvarlama ya da biçim kayması olmasın.
 *
 * `name`/`desc` menüdeki Almanca aslıdır; `nameTr`/`descTr` Türkçe karşılığıdır
 * ve yalnızca gerçekten değişen yerlerde bulunur. Ürünün kendi adı olan
 * sözcükler (Lahmacun, Pide, Calzone, pizza adları, içecek markaları) iki dilde
 * de aynı yazıldığı için onlarda Türkçe alan yoktur — dil TR iken de Almanca
 * alan kullanılır.
 *
 * İçeriği menüde belirtilmemiş ürünlerde `desc` alanı yoktur; boş bir açıklama
 * uydurmak yerine satır sadece numara, ad ve fiyattan oluşur.
 */

export type MenuVariant = {
  /** Porsiyon/boy etiketi: "28 CM", "0,33" gibi. */
  size: string;
  price: string;
};

export type MenuItem = {
  /** Menüdeki sipariş numarası. İçeceklerde numara yoktur. */
  no?: string;
  name: string;
  nameTr?: string;
  desc?: string;
  descTr?: string;
  /** Tek fiyatlı ürünler `price`, çok boylu ürünler `variants` kullanır. */
  price?: string;
  /** İndirim varsa üstü çizili gösterilecek eski fiyat. */
  oldPrice?: string;
  /** Admin panelinden atanan görsel (`/assets/...`); menüde küçük görsel olarak çıkar. */
  image?: string;
  variants?: MenuVariant[];
};

export type MenuSection = {
  id: string;
  title: string;
  titleTr?: string;
  /** Kategorinin tamamı için geçerli not (ekstra malzeme, depozito …). */
  note?: string;
  noteTr?: string;
  items: MenuItem[];
};

export const SPEISEKARTE: MenuSection[] = [
  {
    id: "drehspiess",
    title: "Drehspieß",
    titleTr: "Döner",
    items: [
      { no: "01", name: "Drehspieß", nameTr: "Döner", desc: "Putenfleisch, Salat und Soße", descTr: "Hindi eti, salata ve sos", price: "7,00 €" },
      { no: "02", name: "Cheese Drehspieß", nameTr: "Peynirli Döner", desc: "Putenfleisch, Salat, Käse und Soße", descTr: "Hindi eti, salata, peynir ve sos", price: "8,00 €" },
      { no: "03", name: "Drehspieß XL", nameTr: "Döner XL", desc: "Viel Putenfleisch, Salat und Soße", descTr: "Bol hindi eti, salata ve sos", price: "9,00 €" },
      { no: "04", name: "Dürüm Drehspieß", nameTr: "Dürüm Döner", desc: "Teigrolle mit Fleisch, Salat und Soße", descTr: "Etli dürüm, salata ve sos", price: "8,00 €" },
      { no: "05", name: "Cheese Dürüm", nameTr: "Peynirli Dürüm", desc: "Teigrolle mit Fleisch, Salat, Käse und Soße", descTr: "Etli dürüm, salata, peynir ve sos", price: "9,00 €" },
      { no: "06", name: "Drehspieß Box", nameTr: "Döner Box", desc: "Pommes / Reis, Salat, Putenfleisch und Soße", descTr: "Patates kızartması / pilav, salata, hindi eti ve sos", price: "7,00 €" },
      { no: "07", name: "Drehspieß Teller", nameTr: "Döner Tabağı", desc: "Salat und Soße", descTr: "Salata ve sos", price: "12,00 €" },
      { no: "08", name: "Drehspieß Teller", nameTr: "Döner Tabağı", desc: "Reis, Salat und Soße", descTr: "Pilav, salata ve sos", price: "12,00 €" },
      { no: "09", name: "Drehspieß Teller", nameTr: "Döner Tabağı", desc: "Pommes, Salat und Soße", descTr: "Patates kızartması, salata ve sos", price: "12,00 €" },
      { no: "10", name: "Drehspieß Teller überbacken", nameTr: "Fırınlanmış Döner Tabağı", desc: "Salat und Soße", descTr: "Salata ve sos", price: "13,00 €" },
      { no: "11", name: "Drehspieß Teller überbacken", nameTr: "Fırınlanmış Döner Tabağı", desc: "Reis, Salat und Soße", descTr: "Pilav, salata ve sos", price: "13,00 €" },
      { no: "12", name: "Vegetarisch", nameTr: "Vejetaryen", desc: "Im Fladenbrot, Salat, Käse und Soße", descTr: "Pide ekmeğinde, salata, peynir ve sos", price: "6,00 €" },
      { no: "13", name: "Dürüm Vegetarisch", nameTr: "Vejetaryen Dürüm", desc: "Salat und Käse", descTr: "Salata ve peynir", price: "7,00 €" },
      { no: "14", name: "Drehspießpfanne", nameTr: "Döner Sote", desc: "Drehspießfleisch und Gemüse", descTr: "Döner eti ve sebze", price: "8,00 €" },
      { no: "15", name: "Dürümpfanne", nameTr: "Dürüm Sote", desc: "Drehspießfleisch und Gemüse", descTr: "Döner eti ve sebze", price: "9,00 €" },
      { no: "16", name: "Fleischpfanne", nameTr: "Et Sote", desc: "Pommes und Salat", descTr: "Patates kızartması ve salata", price: "13,00 €" },
      { no: "17", name: "Frikadelle", nameTr: "Köfte", desc: "Im Fladenbrot, Salat und Soße", descTr: "Pide ekmeğinde, salata ve sos", price: "7,50 €" },
      { no: "18", name: "Dürümfrikadelle", nameTr: "Köfte Dürüm", desc: "Salat und Soße", descTr: "Salata ve sos", price: "8,50 €" },
      { no: "19", name: "Frikadellenbox", nameTr: "Köfte Box", desc: "Pommes, Salat und Soße", descTr: "Patates kızartması, salata ve sos", price: "8,50 €" },
      { no: "20", name: "Frikadellenteller", nameTr: "Köfte Tabağı", desc: "Pommes, Salat und Soße", descTr: "Patates kızartması, salata ve sos", price: "14,00 €" },
      { no: "21", name: "Falafel", desc: "Im Fladenbrot, Salat und Soße", descTr: "Pide ekmeğinde, salata ve sos", price: "7,00 €" },
      { no: "22", name: "Falafel Dürüm", desc: "Salat und Soße", descTr: "Salata ve sos", price: "8,00 €" },
      { no: "23", name: "Falafel Teller", nameTr: "Falafel Tabağı", desc: "6 Stück, Salat und Pommes", descTr: "6 adet, salata ve patates kızartması", price: "10,00 €" },
    ],
  },
  {
    id: "snacks",
    title: "Snack's",
    titleTr: "Atıştırmalıklar",
    items: [
      { no: "24", name: "Hamburger", desc: "Salat", descTr: "Salata", price: "6,00 €" },
      { no: "25", name: "Cheeseburger", desc: "Salat und Käse", descTr: "Salata ve peynir", price: "6,50 €" },
      { no: "26", name: "Hamburger Combo", desc: "Rindfleisch, Salat, Pommes und Getränk", descTr: "Dana eti, salata, patates kızartması ve içecek", price: "10,00 €" },
      { no: "27", name: "Kalamari Teller", nameTr: "Kalamar Tabağı", desc: "Pommes und Salat", descTr: "Patates kızartması ve salata", price: "12,00 €" },
      { no: "28", name: "Schrimps Teller", nameTr: "Karides Tabağı", desc: "8 Stück, Pommes und Salat", descTr: "8 adet, patates kızartması ve salata", price: "13,00 €" },
    ],
  },
  {
    id: "verschiedenes",
    title: "Verschiedenes",
    titleTr: "Çeşitli",
    items: [
      { no: "31", name: "Chicken Nuggets", nameTr: "Tavuk Nugget", desc: "5 Stück, Salat und Pommes", descTr: "5 adet, salata ve patates kızartması", price: "6,00 €" },
      { no: "32", name: "Chicken Nuggets Teller", nameTr: "Tavuk Nugget Tabağı", desc: "10 Stück, Salat und Pommes", descTr: "10 adet, salata ve patates kızartması", price: "10,00 €" },
      { no: "33", name: "Schnitzel Wiener Art", nameTr: "Viyana Usulü Şnitzel", desc: "Salat oder Pommes", descTr: "Salata veya patates kızartması", price: "8,00 €" },
      { no: "34", name: "Pommes", nameTr: "Patates Kızartması", price: "3,50 €" },
    ],
  },
  {
    id: "lahmacun",
    title: "Lahmacun",
    items: [
      { no: "40", name: "Lahmacun Solo", nameTr: "Lahmacun (Sade)", price: "5,00 €" },
      { no: "41", name: "Lahmacun", desc: "Salat und Soße", descTr: "Salata ve sos", price: "7,00 €" },
      { no: "42", name: "Lahmacun Drehspieß", nameTr: "Dönerli Lahmacun", desc: "Putenfleisch, Salat und Soße", descTr: "Hindi eti, salata ve sos", price: "9,00 €" },
    ],
  },
  {
    id: "pide",
    title: "Pide",
    items: [
      { no: "50", name: "Pide", desc: "Weichkäse", descTr: "Yumuşak peynir", price: "7,00 €" },
      { no: "51", name: "Pide", desc: "Weichkäse und Spinat", descTr: "Yumuşak peynir ve ıspanak", price: "8,00 €" },
      { no: "52", name: "Pide", desc: "Sucuk und Ei", descTr: "Sucuk ve yumurta", price: "8,50 €" },
      { no: "53", name: "Pide", desc: "Drehspießfleisch", descTr: "Döner eti", price: "8,50 €" },
      { no: "54", name: "Pide vegetarisch", nameTr: "Vejetaryen Pide", desc: "Spinat, Paprika, Zwiebeln, Champignons", descTr: "Ispanak, biber, soğan, mantar", price: "8,50 €" },
      { no: "55", name: "Pide", desc: "Hackfleisch", descTr: "Kıyma", price: "8,50 €" },
    ],
  },
  {
    id: "calzone",
    title: "Calzone",
    items: [
      { no: "57", name: "Calzone", desc: "Salami, Schinken und Käse", descTr: "Salam, jambon ve peynir", price: "8,00 €" },
      { no: "58", name: "Calzone", desc: "Champignons, Salami, Schinken und Käse", descTr: "Mantar, salam, jambon ve peynir", price: "8,50 €" },
      { no: "59", name: "Calzone Vegetarisch gefüllt", nameTr: "Vejetaryen Dolgulu Calzone", desc: "Champignons, frische Tomaten, Paprika und Zwiebeln", descTr: "Mantar, taze domates, biber ve soğan", price: "8,50 €" },
      { no: "60", name: "Calzone Drehspießfleisch gefüllt", nameTr: "Döner Etli Calzone", desc: "Drehspieß, frische Tomaten und Zwiebeln", descTr: "Döner, taze domates ve soğan", price: "9,00 €" },
    ],
  },
  {
    id: "pizza",
    title: "Pizza",
    note: "Pizza Extra Belag: +1,00 €",
    noteTr: "Pizza ekstra malzeme: +1,00 €",
    items: [
      { no: "80", name: "Pizza Margherita", variants: [{ size: "28 CM", price: "6,00 €" }, { size: "32 CM", price: "7,00 €" }] },
      { no: "81", name: "Pizza Salami", desc: "Salami", descTr: "Salam", variants: [{ size: "28 CM", price: "7,00 €" }, { size: "32 CM", price: "8,00 €" }] },
      { no: "82", name: "Pizza Prosciutto", desc: "Schinken", descTr: "Jambon", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "8,00 €" }] },
      { no: "83", name: "Pizza Funghi", desc: "Champignons", descTr: "Mantar", variants: [{ size: "28 CM", price: "7,00 €" }, { size: "32 CM", price: "8,00 €" }] },
      { no: "84", name: "Pizza Raffaele", desc: "Salami, Paprika, Zwiebeln", descTr: "Salam, biber, soğan", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "8,50 €" }] },
      { no: "85", name: "Pizza Milano", desc: "Schinken, Champignons", descTr: "Jambon, mantar", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "8,50 €" }] },
      { no: "86", name: "Pizza Tonno", desc: "Thunfisch, Zwiebeln", descTr: "Ton balığı, soğan", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "8,50 €" }] },
      { no: "87", name: "Pizza Hawaii", desc: "Schinken, Ananas", descTr: "Jambon, ananas", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "8,50 €" }] },
      { no: "88", name: "Pizza Hazal", desc: "Salami, Schinken", descTr: "Salam, jambon", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "9,00 €" }] },
      { no: "89", name: "Pizza Quattro Formaggi", desc: "Edamer, Mozzarella, Gorgonzola, Parmesan", descTr: "Edamer, mozzarella, gorgonzola, parmesan", variants: [{ size: "28 CM", price: "8,00 €" }, { size: "32 CM", price: "9,50 €" }] },
      { no: "90", name: "Pizza Speciale", desc: "Salami, Schinken, Champignons, Ei", descTr: "Salam, jambon, mantar, yumurta", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "9,00 €" }] },
      { no: "91", name: "Pizza Vegetaria", desc: "Champignons, Käse, Zwiebeln, Paprika, Oliven", descTr: "Mantar, peynir, soğan, biber, zeytin", variants: [{ size: "28 CM", price: "7,00 €" }, { size: "32 CM", price: "9,00 €" }] },
      { no: "92", name: "Pizza Diavolo", desc: "Peperoni, Sauce Hollandaise, Zwiebeln", descTr: "Acı biber, hollandez sos, soğan", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "9,00 €" }] },
      { no: "93", name: "Pizza Pikanta", desc: "Paprika, Peperoni, Zwiebeln", descTr: "Biber, acı biber, soğan", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "8,50 €" }] },
      { no: "94", name: "Pizza Fantasia", desc: "Käse, Champignons, Sauce Hollandaise, Zwiebeln", descTr: "Peynir, mantar, hollandez sos, soğan", variants: [{ size: "28 CM", price: "8,00 €" }, { size: "32 CM", price: "8,50 €" }] },
      { no: "95", name: "Pizza Mama Mia", desc: "Salami, Champignons, Käse, Peperoni", descTr: "Salam, mantar, peynir, acı biber", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "9,00 €" }] },
      { no: "96", name: "Pizza Taksim", desc: "Sucuk, Ei", descTr: "Sucuk, yumurta", variants: [{ size: "28 CM", price: "8,00 €" }, { size: "32 CM", price: "9,00 €" }] },
      { no: "97", name: "Pizza vier Jahreszeiten", nameTr: "Pizza Dört Mevsim", desc: "Champignons, Artischocken, Schinken, Salami", descTr: "Mantar, enginar, jambon, salam", variants: [{ size: "28 CM", price: "8,50 €" }, { size: "32 CM", price: "9,50 €" }] },
      { no: "98", name: "Pizza Kebap", desc: "Drehspießfleisch", descTr: "Döner eti", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "9,00 €" }] },
      { no: "99", name: "Pizza Americana", desc: "Pommes, Wurst, Käse", descTr: "Patates kızartması, sosis, peynir", variants: [{ size: "28 CM", price: "8,50 €" }, { size: "32 CM", price: "9,00 €" }] },
      { no: "100", name: "Pizza Chef", desc: "Champignons, frische Tomaten, Drehspießfleisch, Zwiebeln", descTr: "Mantar, taze domates, döner eti, soğan", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "9,50 €" }] },
      { no: "101", name: "Pizza Spezial", desc: "Champignons, Schinken, Artischocken, Peperoni, Knoblauch, Zwiebeln", descTr: "Mantar, jambon, enginar, acı biber, sarımsak, soğan", variants: [{ size: "28 CM", price: "8,00 €" }, { size: "32 CM", price: "9,50 €" }] },
      { no: "102", name: "Pizza Sucuk", desc: "Sucuk", descTr: "Sucuk", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "8,50 €" }] },
      { no: "103", name: "Pizza Mozzarella", desc: "Frische Tomaten", descTr: "Taze domates", variants: [{ size: "28 CM", price: "7,50 €" }, { size: "32 CM", price: "9,00 €" }] },
    ],
  },
  {
    id: "salat",
    title: "Salat",
    titleTr: "Salatalar",
    items: [
      { no: "110", name: "Gemischter Salat", nameTr: "Karışık Salata", desc: "Eisbergsalat, Weißkraut, Rotkraut, Tomaten, Zwiebeln, Mais und Soße", descTr: "Aysberg marul, beyaz lahana, kırmızı lahana, domates, soğan, mısır ve sos", price: "8,00 €" },
      { no: "111", name: "Bauern Salat", nameTr: "Köylü Salatası", desc: "Eisbergsalat, Weißkraut, Rotkraut, Tomaten, Zwiebeln, Gurken, Extra Käse und Soße", descTr: "Aysberg marul, beyaz lahana, kırmızı lahana, domates, soğan, salatalık, ekstra peynir ve sos", price: "8,50 €" },
      { no: "112", name: "Thunfisch Salat", nameTr: "Ton Balıklı Salata", desc: "Eisbergsalat, Weißkraut, Rotkraut, Tomaten, Zwiebeln, Gurken, Thunfisch und Soße", descTr: "Aysberg marul, beyaz lahana, kırmızı lahana, domates, soğan, salatalık, ton balığı ve sos", price: "8,50 €" },
      { no: "113", name: "Krautsalat", nameTr: "Lahana Salatası", desc: "Weißkraut, Rotkraut und Soße", descTr: "Beyaz lahana, kırmızı lahana ve sos", price: "7,00 €" },
      { no: "114", name: "Sami's Salat", nameTr: "Sami's Salatası", desc: "Drehspießfleisch, Eisbergsalat, Weißkraut, Rotkraut, Tomaten, Zwiebeln, Gurken und Soße", descTr: "Döner eti, aysberg marul, beyaz lahana, kırmızı lahana, domates, soğan, salatalık ve sos", price: "9,00 €" },
    ],
  },
  {
    id: "getraenke",
    title: "Getränke",
    titleTr: "İçecekler",
    note: "Alle Getränke zzgl. 0,25 € Pfand",
    noteTr: "Tüm içeceklere 0,25 € depozito eklenir",
    items: [
      { name: "Ayran", variants: [{ size: "0,25", price: "1,50 €" }] },
      { name: "Coca Cola", variants: [{ size: "0,33", price: "2,50 €" }, { size: "0,50", price: "3,00 €" }] },
      { name: "Cola light", variants: [{ size: "0,33", price: "2,50 €" }, { size: "0,50", price: "3,00 €" }] },
      { name: "Mezzo Mix", variants: [{ size: "0,33", price: "2,50 €" }, { size: "0,50", price: "3,00 €" }] },
      { name: "Fanta", variants: [{ size: "0,33", price: "2,50 €" }, { size: "0,50", price: "3,00 €" }] },
      { name: "Wasser", nameTr: "Su", variants: [{ size: "0,33", price: "2,50 €" }, { size: "0,50", price: "3,00 €" }] },
      { name: "Uludag", variants: [{ size: "0,33", price: "2,50 €" }, { size: "0,50", price: "3,00 €" }] },
      { name: "Sprite", variants: [{ size: "0,33", price: "2,50 €" }, { size: "0,50", price: "3,00 €" }] },
      { name: "Red Bull", variants: [{ size: "0,33", price: "3,00 €" }] },
    ],
  },
];
