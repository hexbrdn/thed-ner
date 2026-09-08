"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BUSINESS_INFO } from "@/data/businessInfo";

export default function Locations() {
  const { lang, t } = useLanguage();
  const isDe = lang === "de";

  return (
    <section id="filialen" className="relative overflow-hidden bg-char py-24 md:py-32 border-t border-line">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="mb-14 max-w-3xl">
          <p className="tag text-amber mb-3">{t.locations.tag}</p>
          <h2 className="section-title font-display font-extrabold text-bone mb-4">
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
              {t.locations.routeBtn}
            </a>
            <a
              href={BUSINESS_INFO.phoneTel}
              className="focus-ring border border-amber text-amber font-display font-bold px-6 py-3.5 hover:bg-amber hover:text-void transition-colors inline-flex items-center gap-2 text-sm"
            >
              {t.locations.callBtn}: {BUSINESS_INFO.phone}
            </a>
            <span className="tag border border-line px-4 py-3.5 text-amber bg-void/60">
              {BUSINESS_INFO.rating} / 5.0 ★ ({BUSINESS_INFO.reviewCount} {isDe ? "Bewertungen" : "Yorum"})
            </span>
          </div>
        </div>

        {/*
          Adres ve çalışma saatleri yan yana.

          Buradaki ayrı telefon kartı kaldırıldı: aynı numara hemen yukarıdaki
          eylem düğmesinde zaten tıklanabilir hâlde duruyordu, ikinci kez
          göstermek bir ekran boyu yer kaplıyordu.
        */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="kinetic-card border border-line bg-void/80 p-8 flex flex-col justify-between">
            <div>
              <p className="tag text-flame mb-3">{t.locations.addressLabel}</p>
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

          {/*
            Çalışma saatleri.

            Buradaki sabit "Bugün Açık (11:00 – 21:00)" rozeti kaldırıldı: değer
            koda gömülüydü ve dükkân kapalıyken bile "açık" diyordu. Gerçek bir
            açık/kapalı göstergesi sunucudaki OpeningHour tablosunu okumak
            zorunda; o gelene kadar yanlış bilgi göstermemek doğrusu.
          */}
          <div className="border border-line bg-void/80 p-8">
            <h3 className="font-display font-bold text-2xl text-bone mb-6 pb-4 border-b border-line">
              {t.locations.hoursLabel}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
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
        </div>

      </div>
    </section>
  );
}
