"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/**
 * Ödeme tamamlandıktan sonra sepeti boşaltır.
 *
 * Sepet, ödemeye yönlendirilirken bilinçli olarak temizlenmez: müşteri Stripe
 * sayfasından vazgeçip geri dönerse sepetini bulmalı. Temizlik ancak siparişin
 * gerçekten ödendiği anlaşıldığında, yani bu sayfada yapılır.
 */
export function ClearCart() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
