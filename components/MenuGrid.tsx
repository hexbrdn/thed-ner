"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MENU_COMBOS } from "@/data/menu";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function MenuGrid() {
  const { lang, t } = useLanguage();
  const isDe = lang === "de";
  const section = useRef<HTMLDivElement>(null);
  const { add, openCart } = useCart();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".menu-card");
      ScrollTrigger.create({
        trigger: section.current,
        start: "top 78%",
        once: true,
        onEnter: () => {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.08,
              duration: 0.55,
              ease: "power3.out",
              clearProps: "opacity,transform",
            }
          );
        },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={section} id="menu" className="relative overflow-hidden bg-char py-28 md:py-36 border-t border-line">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#FF3D12,#FFC247,#7BD66F,transparent)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_16%_10%,rgba(255,61,18,0.16),transparent_36%),radial-gradient(ellipse_at_86%_20%,rgba(98,213,255,0.10),transparent_34%)]" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="tag text-flame mb-3">{t.menuGrid.tag}</p>
            <h2 className="font-display font-extrabold text-[9vw] md:text-[3.2vw] leading-[0.95] text-bone">
              {t.menuGrid.title1}
              <br />
              <span className="text-flame">{t.menuGrid.title2}</span>
            </h2>
          </div>
          <p className="tag text-smoke max-w-[280px]">
            {t.menuGrid.subText}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 md:gap-px md:bg-line md:border md:border-line">
          {MENU_COMBOS.map((c, i) => {
            const name = isDe ? c.nameDe : c.name;
            const desc = isDe ? c.descDe : c.desc;
            return (
              <button
                key={c.id}
                onClick={() => {
                  add({ id: `combo-${c.id}`, label: name, detail: desc, price: c.price });
                  openCart();
                }}
                className="menu-card kinetic-card focus-ring bg-void border border-line md:border-0 flex flex-col text-left hover:bg-panel hover:shadow-ember-card transition-all duration-300 group"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-panel border-b border-line">
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover saturate-[0.95] contrast-[1.05] group-hover:saturate-[1.22] group-hover:scale-[1.04] transition-[transform,filter] duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/10 to-transparent" />
                  <p className={`tag absolute bottom-3 left-4 ${i === 1 ? "text-steel" : i === 2 ? "text-sumac" : "text-amber"}`}>{c.code}</p>
                </div>

                <div className="accent-rail p-8 flex flex-col flex-1">
                  <h3 className="font-display font-extrabold text-2xl text-bone mb-3">{name}</h3>
                  <p className="text-smoke text-sm leading-relaxed mb-8 flex-1">{desc}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-line">
                    <span className="font-display font-extrabold text-2xl text-bone">{c.price}₺</span>
                    <span className="tag text-smoke group-hover:text-amber transition-colors">{t.menuGrid.addToCart}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
