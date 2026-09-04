"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Locations() {
  const { t } = useLanguage();

  return (
    <section id="filialen" className="relative overflow-hidden bg-char py-24 md:py-32 border-t border-line">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,194,71,0.12),transparent_40%)]" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="tag text-amber mb-3">{t.locations.tag}</p>
            <h2 className="font-display font-extrabold text-[8vw] md:text-[3vw] leading-[1.05] text-bone mb-6">
              {t.locations.title}
            </h2>
            <p className="text-smoke text-base leading-relaxed mb-8 max-w-xl">
              {t.locations.description}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#builder"
                className="focus-ring bg-flame-gradient text-void font-display font-extrabold px-6 py-3.5 hover:brightness-110 transition-[filter,transform] active:translate-y-px inline-block"
              >
                {t.locations.cta}
              </a>
              <span className="tag border border-line px-4 py-3 text-smoke">
                {t.locations.branchesCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { country: "Deutschland", count: "140+ Filialen", highlight: true },
              { country: "Niederlande", count: "15+ Filialen" },
              { country: "London & UK", count: "10+ Filialen" },
              { country: "Istanbul & SA", count: "15+ Filialen" },
            ].map((loc, i) => (
              <div
                key={i}
                className={`kinetic-card border p-6 flex flex-col justify-between ${
                  loc.highlight ? "border-amber ember-surface" : "border-line bg-void/60"
                }`}
              >
                <p className="tag text-amber mb-2">Region {i + 1}</p>
                <h3 className="font-display font-bold text-xl text-bone mb-1">{loc.country}</h3>
                <p className="font-mono text-sm text-smoke">{loc.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
