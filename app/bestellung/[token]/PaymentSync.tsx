"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Ödeme mutabakatını tetikler.
 *
 * Müşteri Stripe'tan bu sayfaya döndüğünde sipariş hâlâ "ödeme bekleniyor"da
 * görünüyorsa, webhook henüz gelmemiş (ya da hiç gelmeyecek) demektir. Bu
 * bileşen sunucudan siparişin ödeme durumunu Stripe'a **sordurur**; ödeme
 * gerçekten alınmışsa sipariş orada PAID'e geçer ve sayfa tazelenir.
 *
 * Kararı istemci vermez: buradan giden tek bilgi "şu siparişi kontrol et"
 * bilgisidir, cevabı da sunucu sağlayıcıdan okuyarak verir.
 *
 * Yoklama sınırlıdır. İlk saniyelerde sık sorar (webhook'un geleceği ya da
 * ödemenin görüneceği an burasıdır), sonra durur: PayPal gibi gecikmeli
 * yöntemlerde para dakikalar sonra düşebilir, onu webhook ve sayfanın 20
 * saniyelik tazelemesi yakalar. Sonsuza kadar Stripe'a soru sormanın anlamı
 * yok.
 */

/** İlk saniyelerdeki yoklama aralığı. */
const INTERVAL_MS = 3000;
/** En fazla kaç deneme — yaklaşık bir dakika. */
const MAX_ATTEMPTS = 20;

export function PaymentSync({ token }: { token: string }) {
  const router = useRouter();

  useEffect(() => {
    let attempts = 0;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      if (stopped) return;
      attempts++;

      try {
        const response = await fetch("/api/orders/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          const data = (await response.json()) as { status?: string };
          // Durum değiştiyse sunucu bileşeni yeniden çalışsın; bu bileşen de
          // sipariş artık beklemede olmadığı için kaldırılır.
          if (data.status && data.status !== "PENDING_PAYMENT") {
            stopped = true;
            router.refresh();
            return;
          }
        }
      } catch {
        // Ağ hatası: bir sonraki denemede yeniden bakılır, kullanıcıya
        // gösterilecek bir şey yok — sayfa zaten "ödeme bekleniyor" diyor.
      }

      if (!stopped && attempts < MAX_ATTEMPTS) {
        timer = setTimeout(check, INTERVAL_MS);
      }
    }

    check();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [router, token]);

  return null;
}
