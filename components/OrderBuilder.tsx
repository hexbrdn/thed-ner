"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { BuilderGroup, BuilderGroupId, BuilderOption } from "@/lib/admin/types";
import type { PublicBuilder } from "@/lib/admin/store";
import { formatCents, toCents } from "@/lib/money";
import { playToggle, unlockAudio } from "@/lib/kitchenAudio";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * "Kendin Seç" bölümü.
 *
 * Fiyatların tamamı katalogtan gelir (`/api/menu/builder`): taban fiyat
 * menüdeki gerçek ürünün güncel fiyatıdır, ek ücretler admin panelinden
 * yönetilir. Burada sabit fiyat yoktur; gösterilen tutar sepette ve sipariş
 * ucunda yeniden hesaplandığında aynı sonucu verir.
 */

function OptionCard({
  option,
  selected,
  onClick,
  isDe,
}: {
  option: BuilderOption;
  selected: boolean;
  onClick: () => void;
  isDe: boolean;
}) {
  const label = isDe ? option.labelDe || option.label : option.label;
  const desc = isDe ? option.descDe || option.desc : option.desc;

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`focus-ring kinetic-card group relative flex items-center gap-4 border p-3 text-left transition-all duration-300 ${
        selected ? "border-amber ember-surface shadow-ember-card" : "border-line bg-char/50 hover:border-smoke hover:bg-panel"
      }`}
    >
      {option.image ? (
        <div className="relative w-14 h-14 shrink-0">
          <Image src={option.image} alt="" fill className="object-contain" sizes="56px" />
        </div>
      ) : (
        <div className="w-14 h-14 shrink-0 border border-line flex items-center justify-center tag text-smoke">
          +
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-display font-semibold text-bone leading-tight [overflow-wrap:anywhere]">{label}</p>
        <p className="text-xs text-smoke leading-snug [overflow-wrap:anywhere]">{desc}</p>
      </div>
      <div className={`ml-auto tag shrink-0 ${selected ? "text-amber" : "text-flame"}`}>
        {option.price > 0 ? `+${formatCents(toCents(option.price))}` : isDe ? "INKL." : "DAHİL"}
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

const EMPTY_GROUP: BuilderGroup = { id: "bread", mode: "single", options: [] };

export default function OrderBuilder() {
  const { lang, t } = useLanguage();
  const isDe = lang === "de";

  const section = useRef<HTMLDivElement>(null);
  const previewFlash = useRef<HTMLDivElement>(null);
  const revealTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [config, setConfig] = useState<PublicBuilder | null>(null);
  const [bread, setBread] = useState("");
  const [protein, setProtein] = useState("");
  const [veg, setVeg] = useState<string[]>([]);
  const [sauce, setSauce] = useState("");
  const [qty, setQty] = useState(1);
  const [showReveal, setShowReveal] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const { add, openCart, count: cartCount, quote } = useCart();

  // Seçenekler ve taban fiyat katalogtan gelir; ilk seçimler yüklendiğinde kurulur.
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/menu/builder", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("builder"))))
      .then((data: PublicBuilder) => {
        setConfig(data);
        const group = (id: BuilderGroupId) => data.groups.find((g) => g.id === id);
        setBread(group("bread")?.options[0]?.id ?? "");
        setProtein(group("protein")?.options[0]?.id ?? "");
        setSauce(group("sauce")?.options[0]?.id ?? "");
        setVeg((group("veggies")?.options ?? []).map((o) => o.id));
      })
      .catch(() => setConfig(null));
    return () => controller.abort();
  }, []);

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

  const groups = useMemo(() => {
    const byId = new Map((config?.groups ?? []).map((g) => [g.id, g] as const));
    return {
      bread: byId.get("bread") ?? EMPTY_GROUP,
      protein: byId.get("protein") ?? EMPTY_GROUP,
      veggies: byId.get("veggies") ?? EMPTY_GROUP,
      sauce: byId.get("sauce") ?? EMPTY_GROUP,
    };
  }, [config]);

  const toggleVeg = (id: string) => {
    setVeg((prev) => {
      const on = !prev.includes(id);
      if (soundOn) playToggle(on);
      return on ? [...prev, id] : prev.filter((v) => v !== id);
    });
  };

  /**
   * Özet paneli.
   *
   * Sunucudaki `priceCart` ile **birebir aynı** kural: taban fiyat + seçili
   * seçeneklerin ek ücretleri, hepsi cent üzerinden. Bu yüzden burada görünen
   * tutar sepette de, siparişte de değişmez.
   */
  const breakdown = useMemo(() => {
    const find = (group: BuilderGroup, id: string) =>
      group.options.find((o) => o.id === id) ?? group.options[0] ?? null;

    const b = find(groups.bread, bread);
    const p = find(groups.protein, protein);
    const s = find(groups.sauce, sauce);
    const vgs = groups.veggies.options.filter((o) => veg.includes(o.id));
    const chosen = [b, p, s].filter((o): o is BuilderOption => o !== null);

    const baseCents = config?.basePriceCents ?? 0;
    const totalCents =
      baseCents + [...chosen, ...vgs].reduce((sum, o) => sum + toCents(o.price), 0);
    const kcal = [...chosen, ...vgs].reduce((sum, o) => sum + o.kcal, 0);

    return { b, p, s, vgs, baseCents, totalCents, kcal };
  }, [groups, bread, protein, sauce, veg, config]);

  const label = (option: BuilderOption | null) =>
    option ? (isDe ? option.labelDe || option.label : option.label) : "—";

  const chips = useMemo(() => {
    return [
      { id: "bread", label: label(breakdown.b), image: breakdown.b?.image ?? null, active: true },
      { id: "protein", label: label(breakdown.p), image: breakdown.p?.image ?? null, active: true },
      ...groups.veggies.options.map((v) => ({
        id: v.id,
        label: isDe ? v.labelDe || v.label : v.label,
        image: v.image,
        active: veg.includes(v.id),
      })),
      { id: "sauce", label: label(breakdown.s), image: breakdown.s?.image ?? null, active: true },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakdown, groups.veggies, veg, isDe]);

  const ready = config !== null && breakdown.b !== null && breakdown.p !== null && breakdown.s !== null;

  const addToCart = () => {
    if (!ready) return;
    add({
      kind: "builder",
      bread: breakdown.b!.id,
      protein: breakdown.p!.id,
      sauce: breakdown.s!.id,
      veggies: breakdown.vgs.map((v) => v.id),
      qty,
    });
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

  const surcharge = (option: BuilderOption | null) =>
    option && option.price > 0 ? `+${formatCents(toCents(option.price))}` : "—";

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
          <p className="tag text-smoke max-w-[280px]">{t.builder.subText}</p>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-10 items-start">
          {/* options */}
          <div className="space-y-10">
            <div className="builder-in">
              <p className="tag text-smoke mb-3">{t.builder.bread}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {groups.bread.options.map((o) => (
                  <OptionCard key={o.id} option={o} selected={bread === o.id} onClick={() => setBread(o.id)} isDe={isDe} />
                ))}
              </div>
            </div>

            <div className="builder-in">
              <p className="tag text-smoke mb-3">{t.builder.protein}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {groups.protein.options.map((o) => (
                  <OptionCard key={o.id} option={o} selected={protein === o.id} onClick={() => setProtein(o.id)} isDe={isDe} />
                ))}
              </div>
            </div>

            <div className="builder-in">
              <p className="tag text-smoke mb-3">{t.builder.veggies}</p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {groups.veggies.options.map((o) => (
                  <OptionCard key={o.id} option={o} selected={veg.includes(o.id)} onClick={() => toggleVeg(o.id)} isDe={isDe} />
                ))}
              </div>
            </div>

            <div className="builder-in">
              <p className="tag text-smoke mb-3">{t.builder.sauces}</p>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {groups.sauce.options.map((o) => (
                  <OptionCard key={o.id} option={o} selected={sauce === o.id} onClick={() => setSauce(o.id)} isDe={isDe} />
                ))}
              </div>
            </div>
          </div>

          {/* summary panel */}
          <div className="builder-in lg:sticky lg:top-28 border border-line ember-surface p-6 shadow-ember-card">
            <div className="flex items-center justify-between gap-3 mb-4">
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
                {soundOn ? t.builder.soundOn : t.builder.soundOff}
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
                      <Image src={chip.image} alt="" fill className="object-contain p-2" sizes="140px" />
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
                  alt=""
                  fill
                  className="object-cover"
                  sizes="400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-void/70 via-transparent to-transparent" />
                <p className="absolute bottom-3 inset-x-0 text-center tag text-bone">{t.builder.addedToCart}</p>
              </div>
            </div>

            {!config && (
              <p className="tag text-smoke mb-4" role="status">
                {t.builder.loading}
              </p>
            )}

            <ul className="space-y-2 text-sm mb-4">
              <li className="flex justify-between gap-3 text-smoke">
                <span>{t.builder.basePrice}</span>
                <span className="tabular-nums shrink-0">{formatCents(breakdown.baseCents)}</span>
              </li>
              <li className="flex justify-between gap-3 text-smoke">
                <span className="min-w-0 truncate">{label(breakdown.b)}</span>
                <span className="tabular-nums shrink-0">{surcharge(breakdown.b)}</span>
              </li>
              <li className="flex justify-between gap-3 text-smoke">
                <span className="min-w-0 truncate">{label(breakdown.p)}</span>
                <span className="tabular-nums shrink-0">{surcharge(breakdown.p)}</span>
              </li>
              <li className="flex justify-between gap-3 text-smoke">
                <span className="min-w-0 truncate">{label(breakdown.s)}</span>
                <span className="tabular-nums shrink-0">{surcharge(breakdown.s)}</span>
              </li>
            </ul>

            <div className="flex items-center justify-between gap-3 border-t border-line pt-4 mb-2">
              <span className="tag text-smoke">{t.builder.total}</span>
              <span className="font-display font-extrabold text-3xl text-amber tabular-nums">
                {formatCents(breakdown.totalCents)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 mb-5">
              <span className="tag text-smoke">{t.builder.estEnergy}</span>
              <span className="font-mono text-sm text-flame tabular-nums">{breakdown.kcal} kcal</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-line shrink-0">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="focus-ring w-10 h-10 text-bone hover:text-flame transition-colors"
                  aria-label={t.cart.decreaseQty}
                >
                  −
                </button>
                <span className="w-10 text-center font-mono text-bone tabular-nums">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  className="focus-ring w-10 h-10 text-bone hover:text-flame transition-colors"
                  aria-label={t.cart.increaseQty}
                >
                  +
                </button>
              </div>
              <button
                onClick={addToCart}
                disabled={!ready}
                className="focus-ring flex-1 bg-flame-gradient text-void font-display font-extrabold py-3 hover:brightness-110 transition-[filter,transform] active:translate-y-px text-xs tracking-wider disabled:opacity-40 disabled:pointer-events-none"
              >
                {t.builder.addToCart}
              </button>
            </div>

            {cartCount > 0 && (
              <div className="border-t border-line pt-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="tag text-smoke">
                    {t.builder.cartItemCount.replace("{count}", String(cartCount))}
                  </span>
                  <span className="font-display font-extrabold text-xl text-flame tabular-nums">
                    {quote ? formatCents(quote.totalCents) : "—"}
                  </span>
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
