"use client";

import type { MenuStatus } from "@/app/api/menu/status/route";

/**
 * Teslimat / gel-al seçimi.
 *
 * Panelde kapatılmış olan seçenek burada da kapalı görünür ve seçilemez;
 * müşteri seçip sonra sunucu tarafından reddedilmez.
 *
 * Her iki seçenek birden açık değilse anahtar hiç gösterilmez: tek seçenekli
 * bir "seçim" kullanıcıya karar veriyormuş hissi verip hiçbir şey sormaz.
 * Engel varsa zaten sayfanın üstündeki uyarı bandı söylüyor.
 */
export function FulfillmentSwitch({
  value,
  onChange,
  status,
  labels,
}: {
  value: "DELIVERY" | "PICKUP";
  onChange: (next: "DELIVERY" | "PICKUP") => void;
  status: MenuStatus | null;
  labels: { title: string; delivery: string; pickup: string };
}) {
  // Durum bilinmiyorsa teslimat açık varsayılır (mevcut davranış), gel-al
  // gösterilmez: olmayan bir seçeneği sunmaktansa göstermemek doğru.
  const deliveryOn = status?.deliveryEnabled ?? true;
  const pickupOn = status?.pickupEnabled ?? false;
  if (!deliveryOn || !pickupOn) return null;

  const options: { key: "DELIVERY" | "PICKUP"; label: string }[] = [
    { key: "DELIVERY", label: labels.delivery },
    { key: "PICKUP", label: labels.pickup },
  ];

  return (
    <div>
      <p className="tag text-smoke mb-2">{labels.title}</p>
      <div className="grid grid-cols-2 gap-px border border-line bg-line" role="group">
        {options.map((option) => {
          const active = value === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              aria-pressed={active}
              className={`focus-ring tag min-h-[44px] transition-colors ${
                active ? "bg-amber font-bold text-void" : "bg-void text-smoke hover:text-bone"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
