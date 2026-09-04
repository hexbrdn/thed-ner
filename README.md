# THE // DÖNER

Next.js (App Router) + TypeScript + Tailwind CSS + GSAP (ScrollTrigger) + Lenis
ile hazırlanmış, karanlık modda "cyberpunk × gurme gastronomi" temalı döner
restoran sitesi. Tüm görseller sizin verdiğiniz 3 fotoğraftan (şiş, patlamış
sandviç, malzeme flatlay'i) türetildi — kod içinde üretilmiş/placeholder görsel
yok.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç.

Production build:

```bash
npm run build
npm run start
```

> Not: `npm run build` sırasında Google Fonts'a (Unbounded, JetBrains Mono,
> Inter) internet üzerinden erişilir. İnternetsiz bir CI ortamında build
> alıyorsanız `app/layout.tsx` içindeki `next/font/google` importlarını
> self-hosted font dosyalarıyla değiştirin.

## Klasör yapısı

```
app/
  layout.tsx        Font yükleme, Lenis sarmalayıcı
  page.tsx           Tüm bölümleri sıralar
  globals.css         Tasarım token'ları, scanline/grain efektleri
components/
  Navbar.tsx           Sabit üst menü
  Hero.tsx             Şiş görseli + GSAP giriş animasyonu + HUD etiketleri
  AssemblyLog.tsx      Pinlenmiş scrollytelling: 8 malzeme sırayla "inşa" oluyor
  FinalStack.tsx       Patlamış sandviç görseli, clip-path reveal + istatistikler
  OrderBuilder.tsx     "Kendi Dönerini İnşa Et" — gerçek sipariş/sepet mantığı
  MenuGrid.tsx         Sabit menü kartları (her menünün kendi fotoğrafı)
  Footer.tsx           İletişim/konum
data/
  menu.ts              Ekmek/et/sebze/sos seçenekleri, fiyatlar, sabit menüler
public/assets/
  hero-fire.webp        Hero tam kaplama arka planı: ateş karşısında dönen şiş
  final-stack.webp       Patlamış sandviç fotoğrafınız (tam)
  ing-*.png              Malzeme flatlay'inden tek tek kesilip arka planı
                           şeffaflaştırılmış 8 malzeme sprite'ı
  menu-*.webp             3 sabit menünün kart fotoğrafları
  noise.png               İnce grain dokusu
```

## Neden bu görseller böyle kullanıldı

- **Malzeme flatlay fotoğrafı** (Gemini) 8 parçaya ayrıldı, beyaz arka planı
  piksel bazlı alfa geçişiyle şeffaflaştırıldı → `AssemblyLog` bölümünde her
  malzeme scroll'a bağlı olarak sahneye "uçarak" giriyor ve `OrderBuilder`
  panelinde seçimlerinizi canlı önizleme olarak katman katman gösteriyor.
- **Patlamış sandviç fotoğrafı** (ChatGPT) bütün halde `FinalStack`
  bölümünde clip-path ile scroll'a bağlı bir "kadraj açılıyor" efektiyle
  kullanılıyor.
- **Şiş fotoğrafı** (ChatGPT) zaten siyah zeminde olduğu için doğrudan
  `Hero` bölümünün merkez görseli oldu; glow ve scroll-linked scale/parallax
  eklendi.
- **Menü fotoğrafları** (Gemini) `MenuGrid` bölümünde her sabit menünün kart
  görseli olarak kullanılıyor; hover'da hafif zoom + doygunluk artışı var.

## Değiştirmek isteyebilecekleriniz

- `data/menu.ts` — fiyatlar, malzeme açıklamaları, sabit menüler
- `tailwind.config.ts` — renk paleti (`flame`, `amber`, `void`, `char`)
- `components/Footer.tsx` — adres/telefon/saatler
- Fontlar `app/layout.tsx` içinde `next/font/google` ile tanımlı; marka
  fontunuz varsa aynı yerden değiştirilir.
