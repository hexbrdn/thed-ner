import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, requireAdmin, storeWrite } from "@/lib/admin/guard";
import {
  replaceOpeningHours,
  updateBusinessSettings,
  upsertClosure,
} from "@/lib/orders/business";

/**
 * İşletme ayarları: sipariş alımı, teslim biçimleri, hazırlık süresi,
 * çalışma saatleri ve tatil günleri.
 *
 * Üç ayrı yazma işi tek uçta toplandı çünkü üçü de aynı ekrandan, aynı
 * "işletme" kavramı altında değişiyor. Hangisinin yazılacağını gövdedeki
 * `section` alanı söyler; ayrımlı birleşim (discriminated union) sayesinde
 * eksik ya da karışık gövde şemadan geçemez.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "11:00" → 660. Gün başından itibaren dakika. */
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Saat SS:DD biçiminde olmalı.")
  .transform((value) => {
    const [h, m] = value.split(":");
    return Number(h) * 60 + Number(m);
  });

const bodySchema = z.discriminatedUnion("section", [
  z.object({
    section: z.literal("settings"),
    orderingEnabled: z.boolean().optional(),
    deliveryEnabled: z.boolean().optional(),
    pickupEnabled: z.boolean().optional(),
    // Üst sınır bilinçli: dört saatlik "hazırlık süresi" bir veri giriş
    // hatasıdır, işletme kararı değil.
    prepMinutes: z.number().int().min(0).max(240).optional(),
  }),
  z.object({
    section: z.literal("hours"),
    rows: z
      .array(
        z
          .object({
            weekday: z.number().int().min(0).max(6),
            open: timeSchema,
            close: timeSchema,
          })
          // Açılış ile kapanışın eşit olması "sıfır dakika açık" demektir;
          // gece yarısını aşan aralık (18:00–02:00) ise geçerlidir ve
          // `isOpenNow` tarafından desteklenir.
          .refine((row) => row.open !== row.close, {
            message: "Açılış ve kapanış saati aynı olamaz.",
          })
      )
      .max(21, "Bir haftada en fazla 21 aralık tanımlanabilir."),
  }),
  z.object({
    section: z.literal("closure"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-AA-GG biçiminde olmalı."),
    reason: z.string().trim().max(120).default(""),
  }),
]);

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return badRequest("Geçersiz istek gövdesi.");
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Geçersiz istek.");
  }

  const body = parsed.data;

  if (body.section === "settings") {
    const { section, ...patch } = body;
    void section;
    const result = await storeWrite(() => updateBusinessSettings(patch));
    if (result instanceof NextResponse) return result;
    return NextResponse.json({ ok: true, settings: result });
  }

  if (body.section === "hours") {
    const result = await storeWrite(() =>
      replaceOpeningHours(
        body.rows.map((row) => ({
          weekday: row.weekday,
          openMinute: row.open,
          closeMinute: row.close,
        }))
      )
    );
    if (result instanceof NextResponse) return result;
    return NextResponse.json({ ok: true, hours: result });
  }

  const result = await storeWrite(() => upsertClosure(body.date, body.reason));
  if (result instanceof NextResponse) return result;
  return NextResponse.json({ ok: true, closure: result });
}
