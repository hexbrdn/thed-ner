"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BREADS, PROTEIN, VEGGIES, SAUCES, type Option } from "@/data/menu";
import { playToggle, unlockAudio } from "@/lib/kitchenAudio";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function OptionCard({
  option,
  selected,
  onClick,
  isDe,
}: {
  option: Option;
  selected: boolean;
  onClick: () => void;
  isDe: boolean;
}) {
  const label = isDe ? option.labelDe : option.label;
  const desc = isDe ? option.descDe : option.desc;

  return (
    <button
      onClick={onClick}
      className={`focus-ring kinetic-card group relative flex items-center gap-4 border p-3 text-left transition-all duration-300 ${
        selected ? "border-amber ember-surface shadow-ember-card" : "border-line bg-char/50 hover:border-smoke hover:bg-panel"
      }`}
    >
      {option.image ? (
        <div className="relative w-14 h-14 shrink-0">
          <Image src={option.image} alt={label} fill className="object-contain" sizes="56px" />
        </div>
      ) : (
        <div className="w-14 h-14 shrink-0 border border-line flex items-center justify-center tag text-smoke">
          +
        </div>
      )}
      <div className="min-w-0">
        <p className="font-display font-semibold text-bone truncate">{label}</p>
        <p className="text-xs text-smoke truncate">{desc}</p>
      </div>
      <div className={`ml-auto tag shrink-0 ${selected ? "text-amber" : "text-flame"}`}>
        {option.price > 0 ? `+${option.price}€` : (isDe ? "INKL." : "DAHİL")}
      </div>
      <span
        className={`absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 transition-colors ${
          selected ? "border-amber" : "border-transparent"
        }`}
      />
      {selected && <span className="absolute right-3 top-3 h-2 w-2 bg-herb shadow-[0_0_18px_rgba(123,214,111,0.9)]" />}
    </button>
  );
}

export default function OrderBuilder() {
  const { lang, t } = useLanguage();
  const isDe = lang === "de";

  const section = useRef<HTMLDivElement>(null);
  const previewFlash = useRef<HTMLDivElement>(null);
  const revealTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [bread, setBread] = useState(BREADS[0].id);
  const [protein, setProtein] = useState(PROTEIN[0].id);
  const [veg, setVeg] = useState<string[]>(VEGGIES.map((v) => v.id));
  const [sauce, setSauce] = useState(SAUCES[0].id);
  const [qty, setQty] = useState(1);
  const [showReveal, setShowReveal] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const { add, openCart, count: cartCount, total: cartTotal } = useCart();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(".builder-in", {
        opacity: 0,
        y: 24,
        stagger: 0.06,
        scrollTrigger: { trigger: section.current, start: "top 78%" },
      });
    }, section);
    return () => ctx.revert();
  }, []);

  const toggleVeg = (id: string) => {
    setVeg((prev) => {
      const on = !prev.includes(id);
      if (soundOn) playToggle(on);
      return on ? [...prev, id] : prev.filter((v) => v !== id);
    });
  };

  const breakdown = useMemo(() => {
    const b = BREADS.find((x) => x.id === bread)!;
    const p = PROTEIN.find((x) => x.id === protein)!;
    const s = SAUCES.find((x) => x.id === sauce)!;
    const vgs = VEGGIES.filter((x) => veg.includes(x.id));
    const base = 145;
    const total = base + b.price + p.price + s.price;
    const kcal = b.kcal + p.kcal + s.kcal + vgs.reduce((n, v) => n + v.kcal, 0);
    return { b, p, s, vgs, base, total, kcal };
  }, [bread, protein, sauce, veg]);

  const lineLabel = `${isDe ? breakdown.b.labelDe : breakdown.b.label} • ${isDe ? breakdown.p.labelDe : breakdown.p.label} • ${isDe ? breakdown.s.labelDe : breakdown.s.label}`;

  const chips = useMemo(() => {
    const sauceImage = breakdown.s.image ?? (sauce === "acili" ? "/assets/ing-ketchup.webp" : "/assets/ing-sauce.webp");
    const proteinImage = breakdown.p.image ?? "/assets/ing-meat.webp";
    return [
      { id: "bread", label: isDe ? breakdown.b.labelDe : breakdown.b.label, image: breakdown.b.image, active: true },
      { id: "protein", label: isDe ? breakdown.p.labelDe : breakdown.p.label, image: proteinImage, active: true },
      ...VEGGIES.map((v) => ({ id: v.id, label: isDe ? v.labelDe : v.label, image: v.image, active: veg.includes(v.id) })),
      { id: "sauce", label: isDe ? breakdown.s.labelDe : breakdown.s.label, image: sauceImage, active: true },
    ];
  }, [breakdown, sauce, veg, isDe]);

  const addToCart = () => {
    const key = `${bread}-${protein}-${sauce}-${veg.slice().sort().join(",")}`;
    add(
      {
        id: key,
        label: isDe ? "HDD Sandwich nach Wunsch" : "Kendin Hazırla Döner",
        detail: `${lineLabel}${breakdown.vgs.length ? " • " + breakdown.vgs.map((v) => isDe ? v.labelDe : v.label).join(", ") : (isDe ? " • ohne Gemüse" : " • sebzesiz")}`,
        price: breakdown.total,
        kcal: breakdown.kcal,
      },
      qty
    );
    setQty(1);

    setShowReveal(true);
    gsap.fromTo(
      previewFlash.current,
      { opacity: 0.85 },
      { opacity: 0, duration: 0.9, ease: "power2.out" }
    );
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    revealTimeout.current = setTimeout(() => setShowReveal(false), 1900);
  };

  useEffect(() => {
    return () => {
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
    };
  }, []);

  return (
    <section ref={section} id="builder" className="relative overflow-hidden bg-void py-28 md:py-36">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,rgba(255,194,71,0.08),transparent_26%),radial-gradient(ellipse_at_78%_20%,rgba(255,61,18,0.14),transparent_34%)]" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="builder-in flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="tag text-flame mb-3">{t.builder.tag}</p>
            <h2 className="font-display font-extrabold text-[9vw] md:text-[3.2vw] leading-[0.95] text-bone">
              {t.builder.title1}
              <br />
              <span className="text-flame">{t.builder.title2}</span>
            </h2>
          </div>
          <p className="tag text-smoke max-w-[280px]">
            {t.builder.subText}
          </p>
        </div>

        <div className="grid md:grid-cols-[1.3fr_0.9fr] gap-10 items-start">
          {/* options */}
          <div className="space-y-10">
            <div className="builder-in">
              <p className="tag text-smoke mb-3">{t.builder.bread}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {BREADS.map((o) => (
                  <OptionCard key={o.id} option={o} selected={bread === o.id} onClick={() => setBread(o.id)} isDe={isDe} />
                ))}
              </div>
            </div>

            <div className="builder-in">
              <p className="tag text-smoke mb-3">{t.builder.protein}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {PROTEIN.map((o) => (
                  <OptionCard key={o.id} option={o} selected={protein === o.id} onClick={() => setProtein(o.id)} isDe={isDe} />
                ))}
              </div>
            </div>

            <div className="builder-in">
              <p className="tag text-smoke mb-3">{t.builder.veggies}</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {VEGGIES.map((o) => (
                  <OptionCard key={o.id} option={o} selected={veg.includes(o.id)} onClick={() => toggleVeg(o.id)} isDe={isDe} />
                ))}
              </div>
            </div>

            <div className="builder-in">
              <p className="tag text-smoke mb-3">{t.builder.sauces}</p>
              <div className="grid sm:grid-cols-3 gap-3">
                {SAUCES.map((o) => (
                  <OptionCard key={o.id} option={o} selected={sauce === o.id} onClick={() => setSauce(o.id)} isDe={isDe} />
                ))}
              </div>
            </div>
          </div>

          {/* summary panel */}
          <div className="builder-in md:sticky md:top-28 border border-line ember-surface p-6 shadow-ember-card">
            <div className="flex items-center justify-between mb-4">
              <p className="tag text-flame">{t.builder.orderTitle}</p>
              <button
                onClick={() => {
                  unlockAudio();
                  setSoundOn((v) => !v);
                }}
                aria-pressed={soundOn}
                className={`focus-ring tag border px-2 py-1 transition-colors ${
                  soundOn ? "border-amber text-amber bg-amber/10" : "border-line text-smoke hover:border-smoke"
                }`}
              >
                {soundOn ? "◼ Sound" : "▶ Sound"}
              </button>
            </div>

            <div className="relative aspect-square w-full mb-6 border border-line bg-void/60 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#FF3D12,#FFC247,#7BD66F,#62D5FF)] z-10" />
              <div
                ref={previewFlash}
                className="absolute inset-0 z-20 pointer-events-none opacity-0"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(255,180,90,0.9), rgba(255,77,0,0.35) 45%, transparent 75%)",
                }}
              />

              <div
                className={`absolute inset-0 p-3 grid grid-cols-3 auto-rows-[1fr] gap-2 transition-opacity duration-500 ${
                  showReveal ? "opacity-0" : "opacity-100"
                }`}
              >
                {chips.map((chip) => (
                  <div
                    key={chip.id}
                    className={`relative border bg-panel transition-all duration-500 ease-out ${
                      chip.active
                        ? "border-line opacity-100 translate-x-0 rotate-0 scale-100"
                        : "border-line/30 opacity-0 translate-x-8 -rotate-12 scale-75"
                    }`}
                  >
                    {chip.image ? (
                      <Image src={chip.image} alt={chip.label} fill className="object-contain p-2" sizes="140px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center tag text-smoke text-center px-1">
                        {chip.label}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div
                className={`absolute inset-0 transition-opacity duration-500 ${
                  showReveal ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                <Image
                  src="/assets/final-reveal-plate.webp"
                  alt="Döner"
                  fill
                  className="object-cover"
                  sizes="400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-transparent" />
                <p className="absolute bottom-3 inset-x-0 text-center tag text-bone">{t.builder.addedToCart}</p>
              </div>
            </div>

            <ul className="space-y-2 text-sm mb-4">
              <li className="flex justify-between text-smoke">
                <span>{t.builder.basePrice}</span> <span>{breakdown.base} €</span>
              </li>
              <li className="flex justify-between text-smoke">
                <span>{isDe ? breakdown.b.labelDe : breakdown.b.label}</span> <span>{breakdown.b.price > 0 ? `+${breakdown.b.price} €` : "—"}</span>
              </li>
              <li className="flex justify-between text-smoke">
                <span>{isDe ? breakdown.p.labelDe : breakdown.p.label}</span> <span>{breakdown.p.price > 0 ? `+${breakdown.p.price} €` : "—"}</span>
              </li>
              <li className="flex justify-between text-smoke">
                <span>{isDe ? breakdown.s.labelDe : breakdown.s.label}</span> <span>{breakdown.s.price > 0 ? `+${breakdown.s.price} €` : "—"}</span>
              </li>
            </ul>

            <div className="flex items-center justify-between border-t border-line pt-4 mb-2">
              <span className="tag text-smoke">{t.builder.total}</span>
              <span className="font-display font-extrabold text-3xl text-amber tabular-nums">{breakdown.total} €</span>
            </div>

            <div className="flex items-center justify-between mb-5">
              <span className="tag text-smoke">{t.builder.estEnergy}</span>
              <span className="font-mono text-sm text-flame tabular-nums">{breakdown.kcal} kcal</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-line">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="focus-ring w-10 h-10 text-bone hover:text-flame transition-colors"
                  aria-label="azalt"
                >
                  −
                </button>
                <span className="w-10 text-center font-mono text-bone">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="focus-ring w-10 h-10 text-bone hover:text-flame transition-colors"
                  aria-label="artır"
                >
                  +
                </button>
              </div>
              <button
                onClick={addToCart}
                className="focus-ring flex-1 bg-flame-gradient text-void font-display font-extrabold py-3 hover:brightness-110 transition-[filter,transform] active:translate-y-px text-xs tracking-wider"
              >
                {t.builder.addToCart}
              </button>
            </div>

            {cartCount > 0 && (
              <div className="border-t border-line pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="tag text-smoke">{t.builder.cartItemCount.replace("{count}", String(cartCount))}</span>
                  <span className="font-display font-extrabold text-xl text-flame tabular-nums">{cartTotal} €</span>
                </div>
                <button
                  onClick={openCart}
                  className="focus-ring w-full border border-amber text-amber font-display font-semibold py-3 hover:bg-amber hover:text-void transition-colors tag text-xs"
                >
                  {t.builder.viewCart}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
