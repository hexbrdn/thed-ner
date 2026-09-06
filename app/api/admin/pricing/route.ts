import { NextResponse } from "next/server";
import { badRequest, requireAdmin, storeWrite } from "@/lib/admin/guard";
import { getCatalog, updateBuilder, updateSettings } from "@/lib/admin/store";
import type { BuilderGroup, BuilderOption } from "@/lib/admin/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Fiyat ayarları: servis ücreti ve "kendin seç" seçenek ek ücretleri.
 *
 * Grupların kimliği/sırası ve seçeneklerin kimlikleri koddan gelir; panelden
 * değiştirilebilen tek şey metin, ek ücret ve kalori değerleridir. Bu yüzden
 * gövde, mevcut yapılandırma üzerine **eşlenerek** uygulanır; bilinmeyen grup
 * ya da seçenek yok sayılır.
 */

function money(value: unknown, field: string): number | { error: string } {
  const num = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  if (typeof num !== "number" || !Number.isFinite(num)) {
    return { error: `${field} geçerli bir sayı olmalı.` };
  }
  if (num < 0) return { error: `${field} negatif olamaz.` };
  if (num > 10000) return { error: `${field} çok yüksek.` };
  return Math.round(num * 100) / 100;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const catalog = await getCatalog();
  return NextResponse.json({
    settings: catalog.settings,
    builder: catalog.builder,
    products: catalog.products
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({ id: p.id, name: p.name, price: p.discountPrice ?? p.price })),
  });
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Geçersiz istek gövdesi.");
  }
  const input = (body ?? {}) as Record<string, unknown>;
  const catalog = await getCatalog();

  /* ---------------------------------------------------------- ayarlar */
  if (input.settings !== undefined) {
    const raw = (input.settings ?? {}) as Record<string, unknown>;
    const fee = money(raw.serviceFee, "Servis ücreti");
    if (typeof fee !== "number") return badRequest(fee.error);
    const threshold = money(raw.freeServiceOver, "Ücretsiz servis eşiği");
    if (typeof threshold !== "number") return badRequest(threshold.error);

    const saved = await storeWrite(() =>
      updateSettings({ serviceFee: fee, freeServiceOver: threshold })
    );
    if (saved instanceof NextResponse) return saved;
  }

  /* --------------------------------------------------- yapılandırıcı */
  if (input.builder !== undefined) {
    const raw = (input.builder ?? {}) as Record<string, unknown>;

    let baseProductId = catalog.builder.baseProductId;
    if (raw.baseProductId !== undefined) {
      if (raw.baseProductId === null || raw.baseProductId === "") {
        baseProductId = null;
      } else if (typeof raw.baseProductId === "string") {
        if (!catalog.products.some((p) => p.id === raw.baseProductId)) {
          return badRequest("Seçilen taban ürün bulunamadı.");
        }
        baseProductId = raw.baseProductId;
      } else {
        return badRequest("Taban ürün geçersiz.");
      }
    }

    let fallbackBasePrice = catalog.builder.fallbackBasePrice;
    if (raw.fallbackBasePrice !== undefined) {
      const value = money(raw.fallbackBasePrice, "Yedek taban fiyat");
      if (typeof value !== "number") return badRequest(value.error);
      fallbackBasePrice = value;
    }

    let groups: BuilderGroup[] = catalog.builder.groups;
    if (raw.groups !== undefined) {
      if (!Array.isArray(raw.groups)) return badRequest("Seçenek grupları liste olmalı.");

      const patchByGroup = new Map(
        raw.groups
          .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
          .map((g) => [String(g.id), g] as const)
      );

      const applied: BuilderGroup[] = [];
      for (const group of catalog.builder.groups) {
        const patch = patchByGroup.get(group.id);
        if (!patch || !Array.isArray(patch.options)) {
          applied.push(group);
          continue;
        }
        const patchByOption = new Map(
          patch.options
            .filter((o): o is Record<string, unknown> => typeof o === "object" && o !== null)
            .map((o) => [String(o.id), o] as const)
        );

        const options: BuilderOption[] = [];
        for (const option of group.options) {
          const change = patchByOption.get(option.id);
          if (!change) {
            options.push(option);
            continue;
          }
          const price = money(change.price ?? option.price, `${option.label} ek ücreti`);
          if (typeof price !== "number") return badRequest(price.error);

          const kcalRaw = change.kcal ?? option.kcal;
          const kcal = typeof kcalRaw === "string" ? Number(kcalRaw) : kcalRaw;
          if (typeof kcal !== "number" || !Number.isFinite(kcal) || kcal < 0 || kcal > 5000) {
            return badRequest(`${option.label} kalorisi geçersiz.`);
          }

          const text = (value: unknown, fallback: string) =>
            typeof value === "string" ? value.trim().slice(0, 120) : fallback;

          options.push({
            ...option,
            label: text(change.label, option.label) || option.label,
            labelDe: text(change.labelDe, option.labelDe) || option.labelDe,
            desc: text(change.desc, option.desc),
            descDe: text(change.descDe, option.descDe),
            price,
            kcal: Math.round(kcal),
          });
        }
        applied.push({ ...group, options });
      }
      groups = applied;
    }

    const saved = await storeWrite(() =>
      updateBuilder({ baseProductId, fallbackBasePrice, groups })
    );
    if (saved instanceof NextResponse) return saved;
  }

  const fresh = await getCatalog();
  return NextResponse.json({ settings: fresh.settings, builder: fresh.builder });
}
