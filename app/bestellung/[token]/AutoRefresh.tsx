"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Takip sayfasını belirli aralıkla tazeler.
 *
 * İşletme panelde durumu ilerlettiğinde müşterinin sayfayı elle yenilemesi
 * gerekmesin. `router.refresh()` sunucu bileşenini yeniden çalıştırır; sayfa
 * yeniden yüklenmediği için kaydırma konumu korunur.
 *
 * Sekme arka plandayken tazeleme yapılmaz: kimsenin bakmadığı bir sayfa için
 * sunucuya istek atmanın anlamı yok.
 */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return null;
}
