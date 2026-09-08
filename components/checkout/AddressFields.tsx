"use client";

import { formatCents } from "@/lib/money";
import { Field, Select, TextInput } from "@/components/ui";
import type { useLanguage } from "@/lib/i18n/LanguageContext";
import type { DeliveryCity } from "@/app/api/menu/delivery/route";
import type { CheckoutFieldErrors } from "@/lib/checkout/validate";

/**
 * Teslimat adresi alanları.
 *
 * Akış bilinçli olarak **önce şehir, sonra posta kodu**: posta kodunu ezbere
 * bilmeyen müşteri şehrini seçip listeden bulur, teslimat verilmeyen bir kod
 * listede hiç görünmez. Yani "buraya teslimat yapmıyoruz" hatası formu
 * doldurduktan sonra doğmaz — hiç doğmaz.
 *
 * Sokak, kapı numarası, kat ve zil ismi serbest metindir: hiçbiri teslimat
 * kararına girmez, hepsi kuryenin kapıyı bulması içindir. Bu yüzden kat ve zil
 * ismi zorunlu tutulmaz; müstakil evde ikisi de anlamsızdır.
 */
export function AddressFields({
  zones,
  zonesFailed,
  city,
  onCityChange,
  zip,
  onZipChange,
  zipsForCity,
  street,
  houseNo,
  floor,
  bellName,
  onFieldChange,
  errors,
  etaMinutes,
  t,
}: {
  zones: DeliveryCity[] | null;
  zonesFailed: boolean;
  city: string;
  onCityChange: (next: string) => void;
  zip: string;
  onZipChange: (next: string) => void;
  zipsForCity: DeliveryCity["zips"];
  street: string;
  houseNo: string;
  floor: string;
  bellName: string;
  onFieldChange: (field: "street" | "houseNo" | "floor" | "bellName", value: string) => void;
  errors: CheckoutFieldErrors;
  etaMinutes: number | null;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  if (zonesFailed) {
    return (
      <p role="alert" className="border border-flame/50 bg-flame/10 px-4 py-3 text-sm text-flame">
        {t.cart.zonesError}
      </p>
    );
  }

  if (zones !== null && zones.length === 0) {
    return (
      <p role="alert" className="border border-flame/50 bg-flame/10 px-4 py-3 text-sm text-flame">
        {t.cart.zonesEmpty}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.cart.cityLabel} htmlFor="city" error={errors.city}>
          <Select
            id="city"
            value={city}
            invalid={Boolean(errors.city)}
            onChange={(e) => onCityChange(e.target.value)}
            autoComplete="address-level2"
          >
            <option value="">{zones === null ? t.cart.loading : t.cart.selectCity}</option>
            {(zones ?? []).map((entry) => (
              <option key={entry.city} value={entry.city}>
                {entry.city}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={t.cart.zipLabel} htmlFor="zip" error={errors.zip}>
          <Select
            id="zip"
            value={zip}
            disabled={!city}
            invalid={Boolean(errors.zip)}
            onChange={(e) => onZipChange(e.target.value)}
            autoComplete="postal-code"
          >
            <option value="">{city ? t.cart.selectZip : t.cart.cityFirst}</option>
            {zipsForCity.map((entry) => (
              <option key={entry.zip} value={entry.zip}>
                {entry.zip} —{" "}
                {t.cart.zoneMinOrder.replace("{amount}", formatCents(entry.minOrderCents))}
                {entry.feeCents === 0
                  ? `, ${t.cart.zoneFeeFree}`
                  : `, ${t.cart.zoneFee.replace("{amount}", formatCents(entry.feeCents))}`}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {etaMinutes !== null && zip && (
        <p className="font-mono text-[11px] text-amber">
          {t.cart.etaDelivery.replace("{minutes}", String(etaMinutes))}
        </p>
      )}

      {/* Sokak ve numara ayrı alanlarda: kuryenin kapıyı bulması için
          numaranın adresin içinde kaybolmaması gerekiyor. */}
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <Field label={t.cart.streetLabel} htmlFor="street" error={errors.street}>
          <TextInput
            id="street"
            autoComplete="address-line1"
            value={street}
            invalid={Boolean(errors.street)}
            placeholder={t.cart.streetPh}
            onChange={(e) => onFieldChange("street", e.target.value)}
          />
        </Field>
        <Field label={t.cart.houseNoLabel} htmlFor="houseNo" error={errors.houseNo}>
          <TextInput
            id="houseNo"
            autoComplete="address-line2"
            value={houseNo}
            invalid={Boolean(errors.houseNo)}
            placeholder={t.cart.houseNoPh}
            onChange={(e) => onFieldChange("houseNo", e.target.value)}
          />
        </Field>
      </div>

      {/* Çok katlı binada bu iki alan siparişin teslim edilip edilmemesini
          belirler; müstakil evde hiçbir şey ifade etmez. Bu yüzden sorulur
          ama zorunlu tutulmaz. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.cart.floorLabel} htmlFor="floor">
          <TextInput
            id="floor"
            value={floor}
            placeholder={t.cart.floorPh}
            onChange={(e) => onFieldChange("floor", e.target.value)}
          />
        </Field>
        <Field label={t.cart.bellNameLabel} htmlFor="bellName">
          <TextInput
            id="bellName"
            value={bellName}
            placeholder={t.cart.bellNamePh}
            onChange={(e) => onFieldChange("bellName", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
