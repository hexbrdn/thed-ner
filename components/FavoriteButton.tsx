"use client";

import { useFavorites } from "@/lib/account/FavoritesContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Menüdeki kalp düğmesi.
 *
 * Oturum yoksa hiç çizilmez: misafire "önce giriş yapın" demek, menüde
 * gezinmeyi kesmek olurdu. Kalp dolduğunda ürün `/konto/favoriten` listesine
 * girer ve oradan tek dokunuşla sepete eklenebilir.
 */
export function FavoriteButton({ productId, name }: { productId: string; name: string }) {
  const { enabled, ids, toggle } = useFavorites();
  const { lang } = useLanguage();
  const de = lang !== "tr";

  if (!enabled) return null;

  const active = ids.has(productId);
  const label = active
    ? de
      ? `${name} aus Favoriten entfernen`
      : `${name} favorilerden çıkar`
    : de
      ? `${name} zu Favoriten hinzufügen`
      : `${name} favorilere ekle`;

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`focus-ring shrink-0 border px-2 py-1 text-sm leading-none transition-colors ${
        active
          ? "border-flame/60 bg-flame/10 text-flame"
          : "border-line text-smoke hover:border-flame hover:text-flame"
      }`}
    >
      <span aria-hidden>{active ? "♥" : "♡"}</span>
    </button>
  );
}
