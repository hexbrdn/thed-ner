"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { MenuItem, MenuSection } from "@/data/speisekarte";
import { useLanguage, type Language } from "@/lib/i18n/LanguageContext";

/**
 * Karta (Speisekarte) gövdesi.
 *
 * Ana sayfada değil, kendi sayfasında (`/speisekarte`) yaşar. Ürünler admin
 * panelinin yazdığı katalog deposundan sunucu tarafında gelir (`sections`);
 * burada yalnızca gösterim vardır, fiyat hesabı ya da dönüşümü yoktur.
 * Pasif / tükenmiş / menüden gizlenmiş ürünler bu listeye hiç girmez.
 *
 * Kategoriler arası geçiş için üstte yapışkan bir şerit bulunur: mobilde yatay
 * kaydırılır, masaüstünde tek satıra sığar.
 */
export default function MenuGrid({ sections }: { sections: MenuSection[] }) {
  const { t, lang } = useLanguage();
  const section = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(sections[0]?.id ?? "");

  // Kartların görünüre girerken yumuşak açılışı — sitenin geri kalanıyla aynı ritim.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      sections.forEach((cat) => {
        ScrollTrigger.create({
          trigger: `#kat-${cat.id}`,
          start: "top 85%",
          once: true,
          onEnter: () => {
            gsap.fromTo(
              `#kat-${cat.id} .menu-card`,
              { opacity: 0, y: 18 },
              {
                opacity: 1,
                y: 0,
                stagger: 0.03,
                duration: 0.45,
                ease: "power3.out",
                clearProps: "opacity,transform",
              }
            );
          },
        });
      });
    }, section);
    return () => ctx.revert();
  }, [sections]);

  // Yapışkan şeritteki aktif kategoriyi okunan bölüme göre işaretle.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id.replace("kat-", ""));
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    sections.forEach((cat) => {
      const el = document.getElementById(`kat-${cat.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <section
      ref={section}
      id="menu"
      className="relative overflow-hidden bg-char pt-[calc(var(--nav-h)+3rem)] pb-28 md:pb-36"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#FF3D12,#FFC247,#7BD66F,transparent)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_16%_10%,rgba(255,61,18,0.16),transparent_36%),radial-gradient(ellipse_at_86%_20%,rgba(98,213,255,0.10),transparent_34%)]" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="tag text-flame mb-3">{t.menuGrid.tag}</p>
            <h1 className="font-display font-extrabold text-[11vw] md:text-[4vw] leading-[0.95] text-bone">
              {t.menuGrid.title1}
              <br />
              <span className="text-flame">{t.menuGrid.title2}</span>
            </h1>
          </div>
          <p className="tag text-smoke max-w-[280px]">{t.menuGrid.subText}</p>
        </div>
      </div>

      {/* Kategori şeridi: mobilde yatay kaydırılır, kenarlarda kırpılmaz.
          Navbar sayfanın üstüne sabitlendiği için şerit onun altına yapışır;
          `--nav-h` header yüksekliğini taşır (globals.css). */}
      <nav
        aria-label={t.menuGrid.categoryNavLabel}
        className="sticky top-[var(--nav-h)] z-30 bg-void/95 backdrop-blur-md border-y border-line mb-14"
      >
        <div className="max-w-[1400px] mx-auto overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex items-stretch gap-px w-max min-w-full px-6 md:px-10">
            {sections.map((cat) => (
              <li key={cat.id}>
                <a
                  href={`#kat-${cat.id}`}
                  className={`focus-ring block whitespace-nowrap tag px-4 py-4 border-b-2 transition-colors ${
                    active === cat.id
                      ? "border-flame text-amber"
                      : "border-transparent text-smoke hover:text-bone"
                  }`}
                  aria-current={active === cat.id ? "true" : undefined}
                >
                  {lang === "tr" ? cat.titleTr ?? cat.title : cat.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10">
        {sections.length === 0 && (
          <p className="border border-line bg-void px-5 py-8 text-center text-smoke">
            {t.menuGrid.empty}
          </p>
        )}
        <div className="space-y-16 md:space-y-20">
          {sections.map((category) => (
            <div
              key={category.id}
              id={`kat-${category.id}`}
              // hedef başlık, sabit navbar + kategori şeridinin altında kalmasın
              className="scroll-mt-[calc(var(--nav-h)+3.5rem)]"
            >
              <div className="flex items-center gap-5 mb-8">
                <h2 className="font-display font-extrabold text-2xl md:text-3xl text-bone whitespace-nowrap">
                  {lang === "tr" ? category.titleTr ?? category.title : category.title}
                </h2>
                <span className="h-px flex-1 bg-line" />
              </div>

              <ul className="grid md:grid-cols-2 gap-px bg-line border border-line">
                {category.items.map((item, i) => (
                  <MenuRow
                    key={`${category.id}-${item.no ?? item.name}-${i}`}
                    item={item}
                    lang={lang}
                  />
                ))}
              </ul>

              {category.note && (
                <p className="tag text-amber mt-5 border border-line bg-void px-4 py-3">
                  {lang === "tr" ? category.noteTr ?? category.note : category.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Tek ürün satırı.
 *
 * Numara ve fiyat kenarlarda sabit kalır, ad ve içerik ortada esner; böylece
 * dar ekranda uzun içerik listeleri fiyatı aşağı itmez ya da taşırmaz.
 */
function MenuRow({ item, lang }: { item: MenuItem; lang: Language }) {
  // Türkçe karşılığı olmayan alanlarda (pizza adları, markalar) Almanca aslı kalır.
  const name = lang === "tr" ? item.nameTr ?? item.name : item.name;
  const desc = lang === "tr" ? item.descTr ?? item.desc : item.desc;

  return (
    <li className="menu-card bg-void hover:bg-panel transition-colors duration-300 p-5 md:p-6 flex gap-4">
      {item.no && (
        <span className="font-mono text-sm text-flame shrink-0 tabular-nums pt-0.5 w-9">
          {item.no}
        </span>
      )}

      {item.image && (
        <span className="relative w-16 h-16 shrink-0 overflow-hidden border border-line bg-panel">
          <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
        </span>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display font-bold text-base md:text-lg text-bone leading-tight">
            {name}
          </h3>
          {item.price && (
            <span className="flex items-baseline gap-2 whitespace-nowrap">
              {item.oldPrice && (
                <span className="text-sm text-smoke line-through tabular-nums">
                  {item.oldPrice}
                </span>
              )}
              <span className="font-display font-extrabold text-lg md:text-xl text-amber tabular-nums">
                {item.price}
              </span>
            </span>
          )}
        </div>

        {desc && <p className="text-smoke text-sm leading-relaxed mt-1.5">{desc}</p>}

        {item.variants && (
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-3 pt-3 border-t border-line">
            {item.variants.map((variant) => (
              <span key={variant.size} className="flex items-baseline gap-2">
                <span className="tag text-smoke">{variant.size}</span>
                <span className="font-display font-bold text-base text-amber tabular-nums">
                  {variant.price}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
