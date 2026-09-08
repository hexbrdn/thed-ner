"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Favorilerin istemci tarafı.
 *
 * Menüdeki her satır kendi başına "bu ürün favorimde mi" diye sorsaydı, tek
 * bir karta açılışında onlarca istek çıkardı. Liste bir kez çekilir, bellekte
 * tutulur; işaretleme **iyimser** uygulanır (kalp anında dolar) ve sunucu
 * reddederse geri alınır — bir favori için ağ turu beklemek, düğmeyi bozuk
 * gösterir.
 *
 * Oturum yoksa uç 401 döner ve `enabled` false kalır: kalp düğmesi menüde hiç
 * görünmez. Misafir akışında hesap fikri hiçbir yerde dayatılmaz.
 */

type FavoritesState = {
  /** Oturum açık ve favoriler kullanılabilir mi. */
  enabled: boolean;
  ids: Set<string>;
  toggle: (productId: string) => void;
};

const FavoritesContext = createContext<FavoritesState | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/account/favorites", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { productIds?: string[] } | null) => {
        if (!data) return;
        setEnabled(true);
        setIds(new Set(data.productIds ?? []));
      })
      .catch(() => {
        // Misafir ya da ağ hatası: favoriler kapalı kalır, menü aynen çalışır.
      });

    return () => controller.abort();
  }, []);

  const toggle = useCallback(
    (productId: string) => {
      setIds((current) => {
        const next = new Set(current);
        const wasFavorite = next.has(productId);
        if (wasFavorite) next.delete(productId);
        else next.add(productId);

        void fetch("/api/account/favorites", {
          method: wasFavorite ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        })
          .then((response) => {
            if (response.ok) return;
            // Sunucu kabul etmedi (sınır doldu, ürün yok): iyimser değişikliği
            // geri al ki ekran gerçeği göstersin.
            setIds((latest) => {
              const reverted = new Set(latest);
              if (wasFavorite) reverted.add(productId);
              else reverted.delete(productId);
              return reverted;
            });
          })
          .catch(() => {
            setIds((latest) => {
              const reverted = new Set(latest);
              if (wasFavorite) reverted.add(productId);
              else reverted.delete(productId);
              return reverted;
            });
          });

        return next;
      });
    },
    []
  );

  const value = useMemo<FavoritesState>(() => ({ enabled, ids, toggle }), [enabled, ids, toggle]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

/**
 * Favori durumu.
 *
 * Sağlayıcı yoksa (bileşen ağacın dışında kullanılırsa) hata fırlatmaz, kapalı
 * bir durum döner: kalp düğmesi menüde her yerde çalışmak zorunda değil, ama
 * eksik bir sağlayıcı yüzünden sayfa çökmemeli.
 */
export function useFavorites(): FavoritesState {
  return (
    useContext(FavoritesContext) ?? {
      enabled: false,
      ids: new Set<string>(),
      toggle: () => undefined,
    }
  );
}
