"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPrice, type BuilderConfig, type Settings } from "@/lib/admin/types";
import { Button, Field, Notice, Select, TextInput } from "./ui";

/**
 * Fiyat ayarları ekranı.
 *
 * Buradaki iki blok, müşteri tarafındaki fiyatların tek kaynağıdır:
 *  - Servis ücreti → sepet ve sipariş toplamı,
 *  - "Kendin Seç" → taban fiyat (menüdeki gerçek ürün) + seçenek ek ücretleri.
 */

type BaseProduct = { id: string; name: string; price: number };

const GROUP_TITLES: Record<string, string> = {
  bread: "Ekmek",
  protein: "Et",
  veggies: "Sebzeler",
  sauce: "Sos",
};

function toInput(value: number): string {
  return String(value).replace(".", ",");
}

function toNumber(value: string): number {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function PricingManager({
  initialSettings,
  initialBuilder,
  products,
}: {
  initialSettings: Settings;
  initialBuilder: BuilderConfig;
  products: BaseProduct[];
}) {
  const router = useRouter();
  const [serviceFee, setServiceFee] = useState(toInput(initialSettings.serviceFee));
  const [freeOver, setFreeOver] = useState(toInput(initialSettings.freeServiceOver));
  const [baseProductId, setBaseProductId] = useState(initialBuilder.baseProductId ?? "");
  const [fallbackBase, setFallbackBase] = useState(toInput(initialBuilder.fallbackBasePrice));
  const [groups, setGroups] = useState(initialBuilder.groups);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const basePrice = products.find((p) => p.id === baseProductId)?.price;

  const setOptionPrice = (groupId: string, optionId: string, value: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id !== groupId
          ? group
          : {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId ? { ...option, price: toNumber(value) } : option
              ),
            }
      )
    );
  };

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            serviceFee: toNumber(serviceFee),
            freeServiceOver: toNumber(freeOver),
          },
          builder: {
            baseProductId: baseProductId || null,
            fallbackBasePrice: toNumber(fallbackBase),
            groups: groups.map((group) => ({
              id: group.id,
              options: group.options.map((option) => ({
                id: option.id,
                price: option.price,
                kcal: option.kcal,
              })),
            })),
          },
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Kaydedilemedi.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[900px] min-w-0">
      <header className="mb-8">
        <p className="tag text-flame mb-2">Katalog</p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bone">Fiyat ayarları</h1>
        <p className="text-sm text-smoke mt-3 leading-relaxed">
          Müşteri tarafındaki tüm tutarlar bu sayfadaki değerlerden ve ürün
          fiyatlarından hesaplanır. Sitede ayrıca sabit yazılmış fiyat yoktur.
        </p>
      </header>

      {error && (
        <div className="mb-6">
          <Notice kind="error" message={error} />
        </div>
      )}
      {saved && !error && (
        <div className="mb-6">
          <Notice kind="success" message="Fiyat ayarları kaydedildi." />
        </div>
      )}

      <section className="border border-line bg-char p-5 md:p-6 mb-6">
        <h2 className="font-display font-bold text-xl text-bone mb-5">Servis ücreti</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Servis / paket ücreti (€)" hint="0 girilirse sepette bu satır hiç gösterilmez.">
            <TextInput
              inputMode="decimal"
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field
            label="Ücretsiz servis eşiği (€)"
            hint="Bu tutarın üstündeki siparişlerde ücret alınmaz. 0 = eşik yok."
          >
            <TextInput
              inputMode="decimal"
              value={freeOver}
              onChange={(e) => setFreeOver(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
      </section>

      <section className="border border-line bg-char p-5 md:p-6 mb-6">
        <h2 className="font-display font-bold text-xl text-bone mb-2">Kendin Seç — taban fiyat</h2>
        <p className="text-sm text-smoke mb-5 leading-relaxed">
          Yapılandırıcının taban fiyatı, seçtiğiniz menü ürününün güncel
          fiyatıdır. O ürünün fiyatını değiştirdiğinizde yapılandırıcı da
          kendiliğinden güncellenir.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Taban ürün">
            <Select value={baseProductId} onChange={(e) => setBaseProductId(e.target.value)}>
              <option value="">Ürün seçilmedi (yedek fiyat kullanılır)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatPrice(p.price)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Yedek taban fiyat (€)"
            hint="Taban ürün silinirse veya seçilmezse bu fiyat kullanılır."
          >
            <TextInput
              inputMode="decimal"
              value={fallbackBase}
              onChange={(e) => setFallbackBase(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>
        <p className="tag text-amber mt-5 border border-line bg-void px-4 py-3">
          Geçerli taban fiyat: {formatPrice(basePrice ?? toNumber(fallbackBase))}
        </p>
      </section>

      <section className="border border-line bg-char p-5 md:p-6 mb-8">
        <h2 className="font-display font-bold text-xl text-bone mb-2">Kendin Seç — ek ücretler</h2>
        <p className="text-sm text-smoke mb-5 leading-relaxed">
          Her seçeneğin taban fiyata eklediği tutar. 0 girilirse müşteri
          tarafında &quot;DAHİL&quot; olarak görünür.
        </p>

        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="tag text-smoke mb-3">{GROUP_TITLES[group.id] ?? group.id}</p>
              <div className="space-y-2">
                {group.options.map((option) => (
                  <div key={option.id} className="flex flex-wrap items-center gap-3">
                    <span className="flex-1 min-w-[160px] text-sm text-bone [overflow-wrap:anywhere]">
                      {option.label}
                      <span className="text-smoke/60"> · {option.labelDe}</span>
                    </span>
                    <TextInput
                      inputMode="decimal"
                      aria-label={`${option.label} ek ücreti`}
                      value={toInput(option.price)}
                      onChange={(e) => setOptionPrice(group.id, option.id, e.target.value)}
                      className="w-28 shrink-0"
                    />
                    <span className="tag text-smoke w-16 shrink-0 text-right tabular-nums">
                      {option.kcal} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3 justify-end">
        <Button onClick={save} disabled={busy}>
          {busy ? "KAYDEDİLİYOR…" : "KAYDET"}
        </Button>
      </div>
    </div>
  );
}
