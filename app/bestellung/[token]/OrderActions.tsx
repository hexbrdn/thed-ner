"use client";

import { useState } from "react";
import type { CartLineDraft } from "@/lib/cart";
import { useCart } from "@/lib/cart";

/**
 * "Tekrar sipariş ver" düğmesi.
 *
 * Sayfadaki `ClearCart` sepeti bağlanma anında boşaltır; bu düğme ise tıklama
 * anında çalışır, dolayısıyla eklenen satırlar silinmez.
 *
 * Sepete koyup çekmeceyi açmakla yetinir — sipariş vermez. Ödeme akışının
 * tamamı sepetin kendi yolundan geçmeli: fiyat, uygunluk ve açık/kapalı
 * kararı orada bir kez veriliyor, burada ikinci bir kopyası olmamalı.
 */
export function ReorderButton({
  drafts,
  label,
  added,
}: {
  drafts: CartLineDraft[];
  label: string;
  added: string;
}) {
  const { add, openCart } = useCart();
  const [done, setDone] = useState(false);

  if (drafts.length === 0) return null;

  return (
    <button
      onClick={() => {
        for (const draft of drafts) add(draft);
        setDone(true);
        openCart();
      }}
      className="focus-ring border border-amber px-4 py-2.5 font-display text-xs font-extrabold tracking-wider text-amber transition-colors hover:bg-amber hover:text-void"
    >
      {done ? added : label}
    </button>
  );
}
