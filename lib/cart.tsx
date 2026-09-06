"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartLineInput, Quote } from "@/lib/admin/store";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Sepet.
 *
 * Önemli kural: sepet **fiyat tutmaz**. Yalnızca "ne seçildi" bilgisini
 * (ürün kimliği / yapılandırıcı seçimleri ve adet) saklar; tutarların tamamı
 * `/api/menu/quote` ucundan, katalogtaki güncel fiyatlardan gelir.
 *
 * Bunun üç sonucu var:
 *  - Admin panelinde fiyat değiştiğinde açık sepetler de doğru tutarı gösterir.
 *  - localStorage'daki eski bir sepet, eski fiyatı geri getiremez.
 *  - İstemci tarafında fiyat üretilmediği için kurcalanacak bir alan da yoktur.
 */

export type CartLine = CartLineInput;

/** Satırı sepette benzersiz kılan anahtar; sunucudaki karşılığıyla aynı biçim. */
export function lineKey(line: CartLine): string {
  if (line.kind === "builder") {
    return `builder:${line.bread}|${line.protein}|${line.sauce}|${line.veggies
      .slice()
      .sort()
      .join(",")}`;
  }
  return `product:${line.productId}|${line.variantSize ?? ""}`;
}

type PricingState = "idle" | "loading" | "ready" | "error";

/** Birleşim tipinin her üyesinden ayrı ayrı alan siler (düz `Omit` birleşimi ezer). */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

/** Sepete eklerken adet isteğe bağlıdır; fiyat alanı hiç yoktur. */
export type CartLineDraft = DistributiveOmit<CartLine, "qty"> & { qty?: number };

type CartState = {
  lines: CartLine[];
  count: number;
  quote: Quote | null;
  pricing: PricingState;
  isOpen: boolean;
  add: (line: CartLineDraft) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartState | null>(null);

/** v2: eski kayıtlar fiyat içerdiği için bilinçli olarak yeni anahtar kullanılır. */
const STORAGE_KEY = "the-doner-cart-v2";
const MAX_QTY = 99;

function sanitize(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const out: CartLine[] = [];
  for (const raw of value.slice(0, 60)) {
    if (typeof raw !== "object" || raw === null) continue;
    const line = raw as Record<string, unknown>;
    const qty = Math.min(
      MAX_QTY,
      Math.max(1, Math.floor(typeof line.qty === "number" ? line.qty : 1))
    );
    if (line.kind === "builder") {
      if (
        typeof line.bread !== "string" ||
        typeof line.protein !== "string" ||
        typeof line.sauce !== "string"
      ) {
        continue;
      }
      out.push({
        kind: "builder",
        bread: line.bread,
        protein: line.protein,
        sauce: line.sauce,
        veggies: Array.isArray(line.veggies)
          ? line.veggies.filter((v): v is string => typeof v === "string")
          : [],
        qty,
      });
    } else if (line.kind === "product" && typeof line.productId === "string") {
      out.push({
        kind: "product",
        productId: line.productId,
        ...(typeof line.variantSize === "string" ? { variantSize: line.variantSize } : {}),
        qty,
      });
    }
  }
  return out;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [pricing, setPricing] = useState<PricingState>("idle");

  // İlk render'da localStorage okunmaz (SSR ile uyuşmazlık olurdu); yükleme
  // bittikten sonra yazmaya başlarız, yoksa boş sepet kayıtlıyı eziyor.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(sanitize(JSON.parse(raw)));
    } catch {
      // bozuk kayıt veya erişim engeli: sepet boş başlar
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // kota dolu / gizli sekme: sepet yine bellekte çalışır
    }
  }, [lines, loaded]);

  // Sepet içeriği ya da dil değiştiğinde tutarları sunucudan tazele.
  const requestId = useRef(0);
  useEffect(() => {
    if (!loaded) return;

    if (lines.length === 0) {
      setQuote(null);
      setPricing("idle");
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();
    setPricing((prev) => (prev === "ready" ? "ready" : "loading"));

    fetch("/api/menu/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, lang }),
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("quote"))))
      .then((data: Quote) => {
        // Yarışan istekler: yalnızca en son isteğin sonucu yazılır.
        if (id !== requestId.current) return;
        setQuote(data);
        setPricing("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || id !== requestId.current) return;
        void error;
        setPricing("error");
      });

    return () => controller.abort();
  }, [lines, lang, loaded]);

  // sepet açıkken arka planın kaymasını engelle
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const add = useCallback((line: CartLineDraft) => {
    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(line.qty ?? 1)));
    const next = { ...line, qty } as CartLine;
    const key = lineKey(next);
    setLines((prev) => {
      const found = prev.find((l) => lineKey(l) === key);
      if (found) {
        return prev.map((l) =>
          lineKey(l) === key ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l
        );
      }
      return [...prev, next];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) =>
            lineKey(l) === key ? { ...l, qty: Math.min(MAX_QTY, Math.floor(qty)) } : l
          )
    );
  }, []);

  const remove = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartState>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    return {
      lines,
      count,
      quote,
      pricing,
      isOpen,
      add,
      setQty,
      remove,
      clear,
      openCart,
      closeCart,
    };
  }, [lines, quote, pricing, isOpen, add, setQty, remove, clear, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalı");
  return ctx;
}
