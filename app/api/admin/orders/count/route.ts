import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/guard";
import { ACTIVE_STATUSES } from "@/lib/orders/status";

/**
 * Panelin her sayfasında dönen sipariş sayacı.
 *
 * Kenar çubuğundaki rozet bunu yoklar. Sipariş listesinin kendisi
 * (`/api/admin/orders`) bu iş için fazla ağır: yüz siparişi satırlarıyla
 * birlikte taşır ve ürün yönetimindeyken o yükü her on beş saniyede bir
 * çekmenin anlamı yok. Burada dönen tek şey iki sayı.
 *
 * `unacknowledged` — henüz "Görüldü" denmemiş ödenmiş sipariş — rozetin
 * kırmızı yanmasının sebebi; `active` ise mutfakta akışta olan toplam.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [active, unacknowledged] = await Promise.all([
    prisma.order.count({ where: { status: { in: [...ACTIVE_STATUSES] } } }),
    prisma.order.count({ where: { status: "PAID", acknowledgedAt: null } }),
  ]);

  return NextResponse.json({ active, unacknowledged });
}
