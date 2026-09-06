import { NextResponse } from "next/server";
import { getPublicBuilder } from "@/lib/admin/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** "Kendin Seç" bölümünün seçenekleri ve güncel taban fiyatı. */
export async function GET() {
  return NextResponse.json(await getPublicBuilder());
}
