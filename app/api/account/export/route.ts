import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/account/guard";
import { exportCustomerData } from "@/lib/account/repository";
import { withDatabase } from "@/lib/security/dbGuard";

/**
 * Veri dışa aktarımı — DSGVO Art. 20.
 *
 * Yanıt indirilecek bir dosya olarak işaretlenir; kullanıcının verisini
 * "yapılandırılmış, yaygın kullanılan ve makine tarafından okunabilir" biçimde
 * alma hakkı ancak dosya elinde olduğunda gerçekten kullanılabilir hâle gelir.
 *
 * GET olması güvenli: yalnızca oturum sahibinin kendi verisini okur, hiçbir şey
 * değiştirmez ve kimlik parametresi almaz.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return withDatabase(async () => {
    const customer = await requireCustomer();
    if (customer instanceof NextResponse) return customer;

    const data = await exportCustomerData(customer.id);
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="samis-doener-daten-${stamp}.json"`,
        // Kişisel veri: hiçbir ara katman önbelleğe almamalı.
        "Cache-Control": "no-store",
      },
    });
  });
}
