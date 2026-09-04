"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BUSINESS_INFO } from "@/data/businessInfo";

export default function Locations() {
  const { lang, t } = useLanguage();
  const isDe = lang === "de";

  return (
    <section id="filialen" className="relative overflow-hidden bg-char py-24 md:py-32 border-t border-line">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,194,71,0.12),transparent_40%)]" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        
        {/* Header */}
        <div className="mb-14 max-w-3xl">
          <p className="tag text-amber mb-3">{t.locations.tag}</p>
          <h2 className="font-display font-extrabold text-[8vw] md:text-[3vw] leading-[1.05] text-bone mb-4">
            {BUSINESS_INFO.name}
          </h2>
          <p className="text-smoke text-base leading-relaxed mb-6">
            {t.locations.description}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={BUSINESS_INFO.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring bg-flame-gradient text-void font-display font-extrabold px-6 py-3.5 hover:brightness-110 transition-[filter,transform] active:translate-y-px inline-flex items-center gap-2 text-sm"
            >
              📍 {t.locations.routeBtn}
            </a>
            <a
              href={BUSINESS_INFO.phoneTel}
              className="focus-ring border border-amber text-amber font-display font-bold px-6 py-3.5 hover:bg-amber hover:text-void transition-colors inline-flex items-center gap-2 text-sm"
            >
              📞 {t.locations.callBtn}: {BUSINESS_INFO.phone}
            </a>
            <span className="tag border border-line px-4 py-3.5 text-amber bg-void/60">
              ⭐ {BUSINESS_INFO.rating} / 5.0 ({BUSINESS_INFO.reviewCount} {isDe ? "Bewertungen" : "Yorum"})
            </span>
          </div>
        </div>

        {/* Business Details Cards */}
        <div className="space-y-6">
          
          {/* Address & Contact Cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="kinetic-card border border-line bg-void/80 p-8 flex flex-col justify-between">
              <div>
                <p className="tag text-flame mb-3">📍 {t.locations.addressLabel}</p>
                <p className="font-display font-bold text-xl text-bone mb-2">{BUSINESS_INFO.name}</p>
                <p className="text-smoke text-base leading-relaxed">
                  {BUSINESS_INFO.address.street}
                  <br />
                  {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.city}
                  <br />
                  {BUSINESS_INFO.address.state}, {isDe ? BUSINESS_INFO.address.country : BUSINESS_INFO.address.countryTr}
                </p>
              </div>
              <a
                href={BUSINESS_INFO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tag text-amber hover:underline mt-6 inline-block text-sm"
              >
                Google Maps & Route →
              </a>
            </div>

            <div className="kinetic-card border border-line bg-void/80 p-8 flex flex-col justify-between">
              <div>
                <p className="tag text-flame mb-3">📞 {t.locations.phoneLabel}</p>
                <p className="font-display font-bold text-2xl text-bone mb-2">{BUSINESS_INFO.phone}</p>
                <p className="text-smoke text-sm leading-relaxed mb-6">
                  {isDe ? "Telefonische Bestellungen & Fragen" : "Telefonla sipariş ve sorularınız için"}
                </p>
              </div>
              <a
                href={BUSINESS_INFO.phoneTel}
                className="focus-ring tag border border-amber text-amber text-center py-3 px-4 hover:bg-amber hover:text-void transition-colors inline-block text-sm"
              >
                {BUSINESS_INFO.phone}
              </a>
            </div>
          </div>

          {/* Opening Hours Table */}
          <div className="border border-line bg-void/80 p-8 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-line">
              <h3 className="font-display font-bold text-2xl text-bone flex items-center gap-2">
                🕒 {t.locations.hoursLabel}
              </h3>
              <span className="tag text-herb bg-herb/10 border border-herb/30 px-4 py-1.5">
                ● {isDe ? "Heute geöffnet" : "Bugün Açık"} (11:00 – 21:00)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {BUSINESS_INFO.openingHours.map((item) => (
                <div
                  key={item.dayDe}
                  className="flex items-center justify-between p-3 border-b border-line/40 font-mono bg-char/40"
                >
                  <span className="text-bone font-medium">{isDe ? item.dayDe : item.dayTr}</span>
                  <span className="text-amber font-bold">{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Service Features Badges */}
          <div className="border border-line bg-panel p-8 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <p className="tag text-smoke mb-2">{t.locations.servicesLabel}</p>
              <div className="flex flex-wrap gap-3">
                <span className="tag border border-herb/50 text-herb bg-herb/10 px-4 py-2 text-xs">
                  ✓ {t.locations.dineIn}
                </span>
                <span className="tag border border-herb/50 text-herb bg-herb/10 px-4 py-2 text-xs">
                  ✓ {t.locations.takeaway}
                </span>
                <span className="tag border border-line text-smoke/70 bg-void px-4 py-2 text-xs">
                  ✗ {t.locations.noDelivery}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
