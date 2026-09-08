import type { CartLineDraft } from "@/lib/cart";

/**
 * Geçmiş bir siparişi sepete geri koymak.
 *
 * Sipariş satırının `options` alanı, sipariş anında oraya yazılmış sepet
 * girdisidir. Yine de körü körüne güvenilmez: veri JSON sütunundan geliyor ve
 * şema zamanla değişebilir. Tanımadığımız biçim sessizce atlanır — "tekrar
 * sipariş" düğmesinin eksik çıkması, sepete bozuk satır koymaktan iyidir.
 *
 * Menüden kalkmış ürünler burada elenmez: sepete eklendiklerinde fiyat ucu
 * onları "artık yok" olarak işaretler ve sepet uyarıyı zaten gösterir. Aynı
 * kontrolü burada tekrarlamak, iki ayrı yerde eskiyecek iki ayrı kural olurdu.
 */
export function toCartDraft(options: unknown, qty = 1): CartLineDraft | null {
  if (typeof options !== "object" || options === null) return null;
  const line = options as Record<string, unknown>;

  if (line.kind === "builder") {
    if (
      typeof line.bread !== "string" ||
      typeof line.protein !== "string" ||
      typeof line.sauce !== "string"
    ) {
      return null;
    }
    return {
      kind: "builder",
      bread: line.bread,
      protein: line.protein,
      sauce: line.sauce,
      veggies: Array.isArray(line.veggies)
        ? line.veggies.filter((v): v is string => typeof v === "string")
        : [],
      qty,
    };
  }

  if (line.kind === "product" && typeof line.productId === "string") {
    return {
      kind: "product",
      productId: line.productId,
      ...(typeof line.variantSize === "string" ? { variantSize: line.variantSize } : {}),
      qty,
    };
  }

  return null;
}

/**
 * Sipariş satırlarından sepet taslakları.
 *
 * Adet de taşınır: "3× Döner"i tekrar sipariş eden biri 1 tane değil 3 tane
 * bekler.
 */
export function reorderDrafts(
  lines: readonly { options: unknown; qty: number }[]
): CartLineDraft[] {
  return lines
    .map((line) => toCartDraft(line.options, line.qty))
    .filter((draft): draft is CartLineDraft => draft !== null);
}
