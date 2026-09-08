"use client";

import type { MenuSection } from "@/data/speisekarte";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { additiveLegend, allergenLegend } from "@/lib/legal/allergens";

/**
 * Ürün bazında alerjen tablosu.
 *
 * Kartadaki kısa kodun karşılığı burada tam metinle durur. Tablo, bilgisi
 * girilmemiş ürünleri **gizlemez**: eksikliği görünür kılmak, işletmecinin
 * paneli tamamlaması için tek gerçek baskıdır. Müşteri açısından da "listede
 * yok" ile "alerjen yok" karışmaz.
 */
export default function AllergenTable({ sections }: { sections: MenuSection[] }) {
  const { lang } = useLanguage();
  const de = lang === "de";

  const allergens = allergenLegend(lang);
  const additives = additiveLegend(lang);

  const missingCount = sections.reduce(
    (sum, section) =>
      sum + section.items.filter((item) => (item.allergens?.kind ?? "missing") === "missing").length,
    0
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-[calc(var(--nav-h)+3rem)]">
      <header className="mb-8 border-b border-line pb-6">
        <h1 className="font-display text-3xl font-extrabold text-bone">
          {de ? "Allergene & Zusatzstoffe" : "Alerjenler ve katkı maddeleri"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-smoke">
          {de
            ? "Angaben nach Anhang II der LMIV (VO (EU) Nr. 1169/2011) und nach der Zusatzstoff-Zulassungsverordnung (ZZulV). Diese Informationen erhalten Sie kostenlos, bevor Ihre Bestellung verbindlich wird."
            : "LMIV (AB 1169/2011) Ek II ve Katkı Maddeleri Yönetmeliği (ZZulV) uyarınca bilgilendirme. Bu bilgiler, siparişiniz bağlayıcı hâle gelmeden önce ve ücretsiz olarak sunulur."}
        </p>
      </header>

      {missingCount > 0 && (
        <p
          role="alert"
          className="mb-8 border border-flame bg-flame/10 px-4 py-3 text-sm leading-relaxed text-flame"
        >
          {de
            ? `Für ${missingCount} Artikel liegen noch keine Angaben vor. Bitte rufen Sie uns vor der Bestellung an: diese Artikel sind unten mit „bitte erfragen“ gekennzeichnet.`
            : `${missingCount} ürün için bilgi henüz girilmemiştir. Lütfen sipariş öncesinde bizi arayın: bu ürünler aşağıda "lütfen sorunuz" olarak işaretlidir.`}
        </p>
      )}

      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.id}>
            <h2 className="mb-3 font-display text-lg font-bold text-amber">
              {lang === "tr" ? (section.titleTr ?? section.title) : section.title}
            </h2>
            <ul className="divide-y divide-line border-y border-line">
              {section.items.map((item) => {
                const notice = item.allergens ?? { kind: "missing" as const };
                const name = lang === "tr" ? (item.nameTr ?? item.name) : item.name;
                return (
                  <li key={`${item.no ?? ""}-${item.name}`} className="flex gap-4 py-3">
                    <span className="w-9 shrink-0 font-mono text-xs text-flame tabular-nums">
                      {item.no ?? ""}
                    </span>
                    <span className="flex-1 text-sm text-bone">{name}</span>
                    <span className="w-40 shrink-0 text-right font-mono text-xs">
                      {notice.kind === "codes" ? (
                        <span className="text-smoke">{notice.codes.join(", ")}</span>
                      ) : notice.kind === "none" ? (
                        <span className="text-smoke/60">{de ? "keine" : "yok"}</span>
                      ) : (
                        <span className="text-flame">
                          {de ? "bitte erfragen" : "lütfen sorunuz"}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-14 border-t border-line pt-8">
        <h2 className="font-display text-lg font-bold text-amber">
          {de ? "Zeichenerklärung" : "Kod açıklamaları"}
        </h2>
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <div>
            <p className="tag text-smoke">{de ? "Allergene" : "Alerjenler"}</p>
            <dl className="mt-3 space-y-1.5">
              {allergens.map((entry) => (
                <div key={entry.code} className="flex gap-3 text-sm">
                  <dt className="w-6 shrink-0 font-mono text-amber">{entry.code}</dt>
                  <dd className="text-smoke">{entry.label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <p className="tag text-smoke">{de ? "Zusatzstoffe" : "Katkı maddeleri"}</p>
            <dl className="mt-3 space-y-1.5">
              {additives.map((entry) => (
                <div key={entry.code} className="flex gap-3 text-sm">
                  <dt className="w-6 shrink-0 font-mono text-amber">{entry.code}</dt>
                  <dd className="text-smoke">{entry.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
