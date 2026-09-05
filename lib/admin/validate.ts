import type { ProductInput } from "./store";
import type { Variant } from "./types";

/**
 * İstek gövdesi doğrulaması.
 *
 * Admin de olsa gövde doğrudan diske yazılmaz: alanlar tek tek tiplenip
 * sınırlanır, bilinmeyen alanlar düşürülür.
 */

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const MAX_TEXT = 400;

function asString(value: unknown, field: string, max = MAX_TEXT, required = true): Result<string> {
  if (typeof value !== "string") {
    return required ? { ok: false, error: `${field} metin olmalı.` } : { ok: true, value: "" };
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) return { ok: false, error: `${field} boş olamaz.` };
  if (trimmed.length > max) return { ok: false, error: `${field} en fazla ${max} karakter olabilir.` };
  return { ok: true, value: trimmed };
}

function asPrice(value: unknown, field: string): Result<number> {
  const num = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (typeof num !== "number" || !Number.isFinite(num)) {
    return { ok: false, error: `${field} geçerli bir sayı olmalı.` };
  }
  if (num < 0) return { ok: false, error: `${field} negatif olamaz.` };
  if (num > 10000) return { ok: false, error: `${field} çok yüksek.` };
  return { ok: true, value: Math.round(num * 100) / 100 };
}

function asVariants(value: unknown): Result<Variant[]> {
  if (value === undefined || value === null) return { ok: true, value: [] };
  if (!Array.isArray(value)) return { ok: false, error: "Varyasyonlar liste olmalı." };
  if (value.length > 12) return { ok: false, error: "En fazla 12 varyasyon eklenebilir." };

  const variants: Variant[] = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) {
      return { ok: false, error: "Varyasyon biçimi geçersiz." };
    }
    const entry = raw as Record<string, unknown>;
    const size = asString(entry.size, "Varyasyon adı", 40, false);
    if (!size.ok) return size;
    const price = asPrice(entry.price, "Varyasyon fiyatı");
    if (!price.ok) return price;
    variants.push({ size: size.value, price: price.value });
  }
  return { ok: true, value: variants };
}

/** Görsel: yalnızca proje içi yol (/assets/...) kabul edilir. */
function asImage(value: unknown): Result<string | null> {
  if (value === undefined || value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string") return { ok: false, error: "Görsel yolu metin olmalı." };
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) {
    return { ok: false, error: "Görsel yolu / ile başlayan proje içi bir yol olmalı (ör. /assets/menu-klasik.webp)." };
  }
  if (trimmed.includes("..")) return { ok: false, error: "Görsel yolu geçersiz." };
  return { ok: true, value: trimmed };
}

export function parseProductBody(
  body: unknown,
  categoryIds: string[],
  partial: boolean
): Result<Partial<ProductInput>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Geçersiz istek gövdesi." };
  }
  const input = body as Record<string, unknown>;
  const out: Partial<ProductInput> = {};

  const has = (key: string) => Object.prototype.hasOwnProperty.call(input, key);
  const need = (key: string) => !partial || has(key);

  if (need("name")) {
    const r = asString(input.name, "Ürün adı", 120);
    if (!r.ok) return r;
    out.name = r.value;
  }

  if (need("description")) {
    const r = asString(input.description, "Açıklama", MAX_TEXT, false);
    if (!r.ok) return r;
    out.description = r.value;
  }

  if (need("categoryId")) {
    const r = asString(input.categoryId, "Kategori", 80);
    if (!r.ok) return r;
    if (!categoryIds.includes(r.value)) {
      return { ok: false, error: "Seçilen kategori bulunamadı." };
    }
    out.categoryId = r.value;
  }

  if (need("price")) {
    const r = asPrice(input.price, "Fiyat");
    if (!r.ok) return r;
    out.price = r.value;
  }

  if (need("discountPrice")) {
    const raw = input.discountPrice;
    if (raw === null || raw === undefined || raw === "") {
      out.discountPrice = null;
    } else {
      const r = asPrice(raw, "İndirimli fiyat");
      if (!r.ok) return r;
      out.discountPrice = r.value;
    }
  }

  if (need("image")) {
    const r = asImage(input.image);
    if (!r.ok) return r;
    out.image = r.value;
  }

  if (need("variants")) {
    const r = asVariants(input.variants);
    if (!r.ok) return r;
    out.variants = r.value;
  }

  if (has("active")) out.active = Boolean(input.active);
  else if (!partial) out.active = true;

  if (has("inStock")) out.inStock = Boolean(input.inStock);
  else if (!partial) out.inStock = true;

  // İndirimli fiyat taban fiyattan yüksek olamaz.
  const price = out.price;
  const discount = out.discountPrice;
  if (typeof price === "number" && typeof discount === "number" && discount >= price) {
    return { ok: false, error: "İndirimli fiyat, normal fiyattan düşük olmalı." };
  }

  return { ok: true, value: out };
}
