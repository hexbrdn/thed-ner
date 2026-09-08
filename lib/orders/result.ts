import type { RejectionReason } from "./availability";

/**
 * Sipariş oluşturmanın sonucu.
 *
 * Hatalar **fırlatılmaz, döndürülür**: müşteriye gösterilecek her durum
 * (kapalıyız, bölge dışı, sepet eşiği) normal bir akıştır, istisna değil.
 * Böylece arayüz tarafında her durum tip düzeyinde ele alınmak zorunda kalır.
 */

export type OrderError =
  /** Zod doğrulaması düştü; `field` formda hangi alanın işaretleneceğini söyler. */
  | { code: "invalid_input"; field?: string; message: string }
  | { code: "empty_cart" }
  /** Ürün sipariş sırasında menüden kalkmış. */
  | { code: "unavailable_items"; items: string[] }
  /** Ödeme oturumu açılamadı (sağlayıcı hatası, eksik anahtar). */
  | { code: "payment_unavailable" }
  /** Aynı kaynaktan çok sayıda sipariş denemesi; `retryAfterSeconds` sonra tekrar. */
  | { code: "too_many_requests"; retryAfterSeconds: number }
  | RejectionReason;

export type CreateOrderResult =
  | { ok: true; orderNo: string; checkoutUrl: string }
  | { ok: false; error: OrderError };
