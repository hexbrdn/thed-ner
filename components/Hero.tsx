"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Kıvılcımlar SSR ile istemcide aynı çıksın diye tohumlanmış üreteçle kuruluyor.
function seeded(n: number) {
  let t = n + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const SPARKS = Array.from({ length: 28 }, (_, i) => {
  const r = (k: number) => seeded(i * 11 + k);
  return {
    left: 18 + r(1) * 64,
    bottom: -8 - r(2) * 16,
    size: 1.4 + r(3) * 4.2,
    duration: 5.5 + r(4) * 8,
    delay: -r(5) * 12,
    drift: (r(6) - 0.5) * 210,
    rise: 48 + r(7) * 45,
    peak: 0.58 + r(8) * 0.42,
  };
});

export default function Hero() {
  const { t } = useLanguage();
  const root = useRef<HTMLDivElement>(null);
  const bgWrap = useRef<HTMLDivElement>(null);
  const spitWrap = useRef<HTMLDivElement>(null);
  const gridLayer = useRef<HTMLDivElement>(null);
  const titleBack = useRef<HTMLDivElement>(null);
  const titleFront = useRef<HTMLDivElement>(null);
  const titleGroup = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      // giriş
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-eyebrow", { opacity: 0, y: 14, duration: 0.6 })
        .from(".hero-title-line", { opacity: 0, y: 60, stagger: 0.08, duration: 0.9 }, "-=0.2")
        .from(spitWrap.current, { opacity: 0, scale: 1.12, duration: 1.2, ease: "power4.out" }, "-=0.8")
        .from(".hero-note", { opacity: 0, y: 8, stagger: 0.06, duration: 0.5 }, "-=0.6")
        .from(".hero-sub", { opacity: 0, y: 14, duration: 0.6 }, "-=0.3");

      // scroll: başlık büyüyerek dağılır, şiş sonraki bölüme doğru yaklaşır
      gsap.to([titleGroup.current, titleFront.current], {
        scale: 1.45,
        opacity: 0,
        yPercent: -12,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "70% top", scrub: 1 },
      });
      gsap.to(spitWrap.current, {
        scale: 1.35,
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 1 },
      });
    }, root);

    // Fare parallaksı
    let movers: { set: (v: number) => void; axis: "x" | "y"; amp: number }[] = [];
    if (!reduced) {
      const mk = (el: HTMLElement | null, amp: number) => {
        if (!el) return;
        movers.push({ set: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }), axis: "x", amp });
        movers.push({ set: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }), axis: "y", amp });
      };
      mk(gridLayer.current, 0.02);
      mk(titleGroup.current, 0.04);
      mk(titleFront.current, 0.04);
      mk(spitWrap.current, 0.08);
    }

    const el = root.current;
    const onMove = (e: PointerEvent) => {
      if (!el || !movers.length) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      for (const m of movers) {
        const n = m.axis === "x" ? nx : ny;
        m.set(-n * r[m.axis === "x" ? "width" : "height"] * m.amp);
      }
    };
    const onLeave = () => movers.forEach((m) => m.set(0));
    el?.addEventListener("pointermove", onMove);
    el?.addEventListener("pointerleave", onLeave);

    return () => {
      el?.removeEventListener("pointermove", onMove);
      el?.removeEventListener("pointerleave", onLeave);
      ctx.revert();
    };
  }, []);

  const leftNotes = [
    { text: t.hero.notes.left1, live: true },
    { text: t.hero.notes.left2 },
    { text: t.hero.notes.left3 },
    { text: t.hero.notes.left4 },
  ];

  const rightNotes = [
    t.hero.notes.right1,
    t.hero.notes.right2,
    t.hero.notes.right3,
    t.hero.notes.right4,
  ];

  return (
    <section
      ref={root}
      id="top"
      className="relative min-h-[100svh] w-full overflow-hidden bg-void flex items-center justify-center pt-16 md:pt-0"
    >
      {/* arka plan sahnesi */}
      <div ref={bgWrap} className="absolute inset-0">
        <Image
          src="/assets/hero-fire.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover scale-110 blur-[6px] brightness-[0.58] saturate-[1.45] contrast-[1.12]"
        />
      </div>

      {/* alev & haze */}
      <div className="hero-flame-field absolute inset-x-[-10%] bottom-[-12%] h-[58vh] pointer-events-none" aria-hidden />
      <div className="hero-heat-haze absolute inset-x-0 bottom-0 h-[72vh] pointer-events-none" aria-hidden />

      {/* merkezden dışa köz parıltısı */}
      <div
        className="hero-fire-pulse absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 58% 62% at 50% 54%, rgba(255,70,18,0.48) 0%, rgba(255,194,71,0.22) 32%, rgba(255,61,18,0.10) 52%, transparent 76%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, #070604 0%, rgba(7,6,4,0.58) 22%, transparent 45%, transparent 55%, rgba(7,6,4,0.58) 78%, #070604 100%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(7,6,4,0.88) 0%, transparent 30%, transparent 55%, #070604 100%)" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-36 pointer-events-none bg-[linear-gradient(90deg,#FF3D12,#FFC247,#FF7A1A,#FF3D12)] opacity-45 blur-2xl" />

      {/* teknik grid */}
      <div
        ref={gridLayer}
        className="absolute inset-[-4%] opacity-[0.07] pointer-events-none [background-image:linear-gradient(#FFF6E8_1px,transparent_1px),linear-gradient(90deg,#FFF6E8_1px,transparent_1px)] [background-size:48px_48px]"
      />

      {/* köz kıvılcımları */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className="ember absolute rounded-full bg-amber"
            style={
              {
                left: `${s.left}%`,
                bottom: `${s.bottom}%`,
                width: s.size,
                height: s.size,
                animationDuration: `${s.duration}s`,
                animationDelay: `${s.delay}s`,
                boxShadow: "0 0 10px rgba(255,194,71,0.95), 0 0 22px rgba(255,61,18,0.55)",
                "--drift": `${s.drift}px`,
                "--rise": `${s.rise}vh`,
                "--peak": s.peak,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="scanline pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-flame/10 to-transparent" />

      {/* Katmanlama: arka başlık */}
      <div ref={titleGroup} className="absolute inset-0 z-10 pointer-events-none">
        {/* Bu satır dile göre boş olabilir; boşken hiç basılmaz ki
            şişin arkasında ölçü kaplayan boş bir başlık kalmasın. */}
        {t.hero.titleLine1 ? (
          <div ref={titleBack} className="absolute inset-x-0 top-[28%] text-center px-6">
            <h1 className="font-display font-black leading-[0.9] text-[11vw] md:text-[7.5vw] text-bone">
              <span className="hero-title-line block">{t.hero.titleLine1}</span>
            </h1>
          </div>
        ) : null}
      </div>

      {/* öndeki şiş */}
      <div ref={spitWrap} className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[64vh] max-h-[700px] aspect-[440/1188]">
          <div className="absolute -inset-x-28 -inset-y-8 bg-flame/20 blur-[90px] rounded-full" />
          <Image
            src="/assets/hero-spit-cut.webp"
            alt="Haus des Döners"
            fill
            priority
            sizes="(max-width: 768px) 55vw, 26vw"
            className="object-contain drop-shadow-[0_30px_70px_rgba(0,0,0,0.8)] contrast-[1.08] saturate-[1.12] brightness-[1.06]"
          />
        </div>
      </div>

      {/* ön başlık & alt metinler */}
      <div ref={titleFront} className="absolute inset-0 z-30 pointer-events-none">
        <p className="hero-eyebrow absolute inset-x-0 top-[14%] md:top-[12%] text-center px-6 font-mono text-xs tracking-widest uppercase text-amber">
          {t.hero.eyebrowTag}
        </p>
        <div className="absolute inset-x-0 top-[52%] text-center px-6">
          <h2 className="font-display font-black leading-[0.9] text-[18vw] md:text-[13vw] text-bone drop-shadow-[0_18px_40px_rgba(0,0,0,0.8)] mb-2">
            <span className="hero-title-line block">{t.hero.titleLine2}</span>
          </h2>
          <p className="font-display font-semibold text-lg md:text-2xl text-amber drop-shadow-md">
            {t.hero.subTitle}
          </p>
        </div>
      </div>

      {/* side notes */}
      <div className="relative z-40 max-w-[1400px] w-full mx-auto px-6 md:px-10 grid md:grid-cols-[1fr_auto_1fr] items-center gap-8 pointer-events-none">
        <div className="hidden md:flex flex-col gap-3.5">
          {leftNotes.map((n) => (
            <div key={n.text} className="hero-note flex items-center gap-2.5 font-mono text-xs tracking-widest uppercase text-smoke/80">
              {n.live ? (
                <span className="relative flex w-1.5 h-1.5 shrink-0">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-flame opacity-70 animate-ping" />
                  <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-flame" />
                </span>
              ) : (
                <span className="w-1.5 h-1.5 shrink-0 bg-smoke/40" />
              )}
              {n.text}
            </div>
          ))}
        </div>

        <div className="hidden md:block w-[300px]" aria-hidden />

        <div className="hidden md:flex flex-col gap-3.5 text-right items-end">
          {rightNotes.map((text, i) => (
            <div key={text} className={`hero-note font-mono text-xs tracking-widest uppercase ${i === 2 ? "text-amber" : "text-smoke/80"}`}>
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Hero CTA & sub text */}
      <div className="absolute inset-x-0 bottom-6 z-40 px-6 text-center space-y-3 pointer-events-auto">
        <p className="max-w-xl mx-auto text-xs md:text-sm text-smoke/90 leading-relaxed font-body">
          {t.hero.description}
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="#filialen"
            className="focus-ring inline-block bg-flame-gradient text-void font-display font-extrabold px-6 py-2.5 text-xs tracking-wider uppercase hover:brightness-110 transition-all"
          >
            {t.hero.findBranchBtn}
          </a>
        </div>
        <p className="hero-sub font-mono text-[10px] tracking-widest uppercase text-smoke/60 pt-2">
          {t.hero.notes.footerNote}
        </p>
      </div>
    </section>
  );
}
