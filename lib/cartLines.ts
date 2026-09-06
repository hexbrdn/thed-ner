import type { CartLineInput } from "@/lib/admin/store";

/**
 * İstemciden gelen sepet tarifinin doğrulanması.
 *
 * Gövde tamamen güvenilmezdir: yalnızca kimlikler ve adet okunur, para ile
 * ilgili hiçbir alan kabul edilmez. Fiyat hesabı her zaman sunucuda
 * (`priceCart`) yapılır.
 */

const MAX_LINES = 60;
const MAX_ID = 120;

function id(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_ID) return null;
  return trimmed;
}

function qty(value: unknown): number {
  const n = typeof value === "number" ? Math.floor(value) : Number.NaN;
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 99);
}

export function parseCartLines(value: unknown): CartLineInput[] {
  if (!Array.isArray(value)) return [];

  const lines: CartLineInput[] = [];
  for (const raw of value.slice(0, MAX_LINES)) {
    if (typeof raw !== "object" || raw === null) continue;
    const entry = raw as Record<string, unknown>;

    if (entry.kind === "builder") {
      const bread = id(entry.bread);
      const protein = id(entry.protein);
      const sauce = id(entry.sauce);
      if (!bread || !protein || !sauce) continue;
      const veggies = Array.isArray(entry.veggies)
        ? entry.veggies
            .slice(0, 20)
            .map(id)
            .filter((v): v is string => v !== null)
        : [];
      lines.push({ kind: "builder", bread, protein, sauce, veggies, qty: qty(entry.qty) });
      continue;
    }

    if (entry.kind === "product") {
      const productId = id(entry.productId);
      if (!productId) continue;
      const variantSize = typeof entry.variantSize === "string" ? entry.variantSize.slice(0, 40) : undefined;
      lines.push({
        kind: "product",
        productId,
        ...(variantSize ? { variantSize } : {}),
        qty: qty(entry.qty),
      });
    }
  }
  return lines;
}

export function parseLang(value: unknown): "tr" | "de" {
  return value === "de" ? "de" : "tr";
}
