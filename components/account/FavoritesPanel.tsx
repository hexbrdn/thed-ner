"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { accountTexts } from "./texts";
import { PanelHeader } from "./fields";

/**
 * Favori ürünler.
 *
 * Liste **katalogtan** beslenir: ad, fiyat ve satılabilirlik ürünün bugünkü
 * hâlidir, favoriye eklendiği günün değil. Bu yüzden fiyatı değişen bir ürün
 * burada güncel fiyatıyla, menüden kalkan bir ürün ise "şu anda mevcut değil"
 * diye görünür — sepete atılamaz ama listede kalır: yarın geri gelebilir ve
 * müşterinin işaretini sessizce silmek doğru olmaz.
 */

export type FavoriteItem = {
  productId: string;
  name: string;
  description: string;
  /** Katalogtan gelen biçimlenmiş fiyat; burada aritmetik yapılmaz. */
  price: string;
  oldPrice: string | null;
  image: string | null;
  available: boolean;
  variants: { size: string; price: string }[];
};

export default function FavoritesPanel({ items }: { items: FavoriteItem[] }) {
  const { lang } = useLanguage();
  const t = accountTexts(lang !== "tr");

  return (
    <section>
      <PanelHeader title={t.favoritesTitle} lead={t.favoritesLead} />

      {items.length === 0 ? (
        <div className="border border-dashed border-line px-4 py-10 text-center">
          <p className="text-sm text-smoke">{t.favoritesEmpty}</p>
          <Link
            href="/speisekarte"
            className="focus-ring tag mt-5 inline-block border border-amber px-4 py-2.5 text-amber transition-colors hover:bg-amber hover:text-void"
          >
            {t.toMenu} →
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <FavoriteRow key={item.productId} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FavoriteRow({ item }: { item: FavoriteItem }) {
  const { lang } = useLanguage();
  const t = accountTexts(lang !== "tr");
  const router = useRouter();
  const { add } = useCart();

  const [sizeIndex, setSizeIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [busy, setBusy] = useState(false);

  const selected = item.variants[sizeIndex] ?? item.variants[0];
  const shownPrice = selected ? selected.price : item.price;

  function addToCart() {
    add({
      kind: "product",
      productId: item.productId,
      ...(selected ? { variantSize: selected.size } : {}),
    });
    setAdded(true);
    // Sepet çekmecesi bilerek açılmaz: müşteri listeden eklemeye devam etsin.
    setTimeout(() => setAdded(false), 1600);
  }

  async function removeFavorite() {
    setBusy(true);
    try {
      await fetch("/api/account/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId }),
      });
      router.refresh();
    } catch {
      // Ağ hatası: satır listede kalır, müşteri tekrar deneyebilir. Favori
      // silmek için hata bandı göstermeye değmez.
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="flex flex-wrap items-start gap-4 border border-line bg-char p-4">
      {item.image && (
        <span className="relative h-16 w-16 shrink-0 overflow-hidden border border-line bg-panel">
          <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
        </span>
      )}

      <div className="min-w-[180px] flex-1">
        <p className="font-display font-bold text-bone [overflow-wrap:anywhere]">{item.name}</p>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-sm text-smoke">{item.description}</p>
        )}

        {item.variants.length > 1 && item.available && (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.variants.map((variant, index) => (
              <button
                key={variant.size}
                type="button"
                onClick={() => setSizeIndex(index)}
                aria-pressed={index === sizeIndex}
                className={`focus-ring border px-3 py-1.5 text-left transition-colors ${
                  index === sizeIndex
                    ? "border-amber bg-amber/10 text-amber"
                    : "border-line text-smoke hover:border-smoke hover:text-bone"
                }`}
              >
                <span className="tag block">{variant.size}</span>
                <span className="font-display text-sm font-bold tabular-nums">
                  {variant.price}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex flex-col items-end gap-2">
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          {item.oldPrice && (
            <span className="text-sm text-smoke line-through tabular-nums">{item.oldPrice}</span>
          )}
          <span className="font-display text-lg font-extrabold tabular-nums text-amber">
            {shownPrice}
          </span>
        </span>

        {item.available ? (
          <button
            type="button"
            onClick={addToCart}
            className={`focus-ring tag border px-3 py-2 transition-colors ${
              added
                ? "border-herb bg-herb/15 text-herb"
                : "border-amber text-amber hover:bg-amber hover:text-void"
            }`}
          >
            {added ? t.addedToCart : t.addToCart}
          </button>
        ) : (
          <span className="tag border border-line px-3 py-2 text-smoke">
            {t.favoriteUnavailable}
          </span>
        )}

        <button
          type="button"
          onClick={removeFavorite}
          disabled={busy}
          className="focus-ring tag px-1 text-smoke transition-colors hover:text-flame disabled:opacity-40"
        >
          ♥ {t.removeFavorite}
        </button>
      </div>
    </li>
  );
}
