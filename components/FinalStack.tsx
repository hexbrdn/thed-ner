"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const START_REVEAL = 50;

export default function FinalStack() {
  const { t } = useLanguage();
  const section = useRef<HTMLDivElement>(null);
  const imgWrap = useRef<HTMLDivElement>(null);
  const revealLayer = useRef<HTMLDivElement>(null);
  const revealTo = useRef<((v: number) => void) | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(
        imgWrap.current,
        { clipPath: "inset(18% 18% 18% 18% round 12px)", scale: 0.92 },
        {
          clipPath: "inset(0% 0% 0% 0% round 0px)",
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top 80%",
            end: "top 20%",
            scrub: 0.6,
          },
        }
      );

      gsap.from(".stat-item", {
        opacity: 0,
        y: 24,
        stagger: 0.12,
        scrollTrigger: {
          trigger: ".stat-row",
          start: "top 85%",
        },
      });
    }, section);

    const proxy = { v: START_REVEAL };
    revealTo.current = gsap.quickTo(proxy, "v", {
      duration: 0.45,
      ease: "power3.out",
      onUpdate: () => {
        if (revealLayer.current) {
          revealLayer.current.style.clipPath = `inset(0 ${100 - proxy.v}% 0 0)`;
        }
      },
    });

    return () => {
      ctx.revert();
      revealTo.current = null;
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = imgWrap.current;
    if (!el || !revealTo.current) return;
    const rect = el.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    revealTo.current(gsap.utils.clamp(0, 100, pct));
  };

  const handlePointerLeave = () => revealTo.current?.(START_REVEAL);

  return (
    <section ref={section} id="stack" className="relative overflow-hidden bg-void py-28 md:py-36">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_20%_28%,rgba(123,214,111,0.12),transparent_34%),radial-gradient(ellipse_at_80%_20%,rgba(229,84,138,0.12),transparent_32%)]" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="tag text-flame mb-3">{t.stack.tag}</p>
            <h2 className="font-display font-extrabold text-[9vw] md:text-[3.2vw] leading-[0.95] text-bone">
              {t.stack.title1}
              <br />
              <span className="text-flame">{t.stack.title2}</span>
            </h2>
          </div>
          <p className="tag text-smoke max-w-[280px]">
            {t.stack.subText}
          </p>
        </div>

        <div
          ref={imgWrap}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="relative w-full aspect-[16/9] overflow-hidden bg-void border border-line cursor-ew-resize select-none touch-pan-y shadow-ember-card"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#7BD66F,#FFC247,#E5548A)] z-20 pointer-events-none" />
          <Image
            src="/assets/ingredients-board.webp"
            alt={t.stack.rawTag}
            fill
            sizes="(max-width: 768px) 100vw, 1400px"
            className="object-cover"
          />

          <div
            ref={revealLayer}
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - START_REVEAL}% 0 0)` }}
          >
            <Image
              src="/assets/cross-section.webp"
              alt={t.stack.builtTag}
              fill
              sizes="(max-width: 768px) 100vw, 1400px"
              className="object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-void/40 via-transparent to-transparent pointer-events-none" />

          <p className="tag text-herb absolute top-4 left-4 z-10 pointer-events-none">{t.stack.builtTag}</p>
          <p className="tag text-sumac absolute top-4 right-4 z-10 pointer-events-none">{t.stack.rawTag}</p>
          <p className="tag text-amber absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            {t.stack.hint}
          </p>
        </div>

        <div className="stat-row grid grid-cols-2 md:grid-cols-4 gap-px bg-line mt-px border border-line">
          {/* Değerler değişken uzunlukta (sayı, "4.9 / 5", uzun şehir adı):
              yazı boyutu kutu genişliğine göre ölçeklenir ve uzun tek kelimeler
              kırılabilir; böylece komşu kutunun üstüne taşmaz. */}
          {t.stack.stats.map((s) => (
            <div key={s.k} className="stat-item bg-char p-5 md:p-6 min-w-0">
              <p className="tag text-smoke mb-2 [overflow-wrap:anywhere]">{s.k}</p>
              <p className="font-display font-extrabold text-[clamp(0.95rem,2.1vw,1.5rem)] leading-tight text-bone tabular-nums [overflow-wrap:anywhere] hyphens-auto">
                {s.v}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
