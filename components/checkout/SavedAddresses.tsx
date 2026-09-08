"use client";

import Link from "next/link";
import type { AddressRecord } from "@/lib/account/addresses";
import type { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Hesaba kayıtlı adreslerin ödeme sayfasındaki seçicisi.
 *
 * Bir müşteri aynı sokağı üçüncü kez yazdığında hesabın anlamı kalmıyor. Bu
 * şerit, kayıtlı adreslerden birini tek dokunuşla forma taşır — form silinip
 * kilitlenmez, seçimden sonra düzeltilebilir (kat numarası değişmiş olabilir).
 *
 * Teslimat verilmeyen posta kodundaki adres **gizlenmez**, işaretlenir ve
 * seçilemez: listeden bir adresin sessizce kaybolması, müşteriye "kaydım
 * silinmiş" diye okunur. Sebebini söylemek daha dürüst.
 *
 * Misafir akışı bundan hiç etkilenmez: oturum yoksa `addresses` boş gelir ve
 * bileşen hiç görünmez.
 */
export function SavedAddresses({
  addresses,
  deliverableZips,
  selectedId,
  onSelect,
  onClear,
  t,
}: {
  addresses: AddressRecord[];
  /** Teslimat yapılan posta kodları; boş küme = bölgeler henüz yüklenmedi. */
  deliverableZips: Set<string>;
  selectedId: string | null;
  onSelect: (address: AddressRecord) => void;
  onClear: () => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  if (addresses.length === 0) return null;

  return (
    <div className="border border-line bg-void/40 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="tag text-smoke">{t.checkout.savedTitle}</p>
        <Link
          href="/konto/adressen"
          className="focus-ring tag text-smoke transition-colors hover:text-amber"
        >
          {t.checkout.savedManage} →
        </Link>
      </div>

      <ul className="flex flex-wrap gap-2">
        {addresses.map((address) => {
          // Bölgeler yüklenene kadar hiçbir adres "teslimat yok" diye
          // işaretlenmez: bilinmeyen, olumsuz demek değildir.
          const deliverable = deliverableZips.size === 0 || deliverableZips.has(address.zip);
          const selected = selectedId === address.id;

          return (
            <li key={address.id}>
              <button
                type="button"
                onClick={() => onSelect(address)}
                disabled={!deliverable}
                aria-pressed={selected}
                className={`focus-ring min-w-[180px] border px-3.5 py-2.5 text-left transition-colors ${
                  selected
                    ? "border-amber bg-amber/10"
                    : "border-line hover:border-smoke disabled:hover:border-line"
                } disabled:opacity-50`}
              >
                <span className={`tag block ${selected ? "text-amber" : "text-smoke"}`}>
                  {address.label || address.city}
                  {address.isDefault && " ★"}
                </span>
                <span className="mt-1 block text-sm text-bone">
                  {address.street} {address.houseNo}
                </span>
                <span className="block text-xs text-smoke">
                  {address.zip} {address.city}
                </span>
                {!deliverable && (
                  <span className="mt-1 block font-mono text-[11px] text-flame">
                    {t.checkout.savedOutOfArea}
                  </span>
                )}
              </button>
            </li>
          );
        })}

        {selectedId && (
          <li>
            <button
              type="button"
              onClick={onClear}
              className="focus-ring h-full min-w-[140px] border border-dashed border-line px-3.5 py-2.5 text-left text-sm text-smoke transition-colors hover:border-amber hover:text-amber"
            >
              {t.checkout.savedUseNew}
            </button>
          </li>
        )}
      </ul>

      <p className="mt-3 text-xs text-smoke/70">{t.checkout.savedHint}</p>
    </div>
  );
}
