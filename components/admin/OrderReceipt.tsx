"use client";

import { formatCents } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orders/status";
import { BUSINESS_INFO } from "@/data/businessInfo";
import type { KitchenOrder } from "./OrderFeed";

/**
 * 80 mm termal yazıcı fişi.
 *
 * Ekranda görünmez; yalnızca yazdırma sırasında (`@media print`) ortaya çıkar
 * ve sayfanın geri kalanı gizlenir. Kâğıt genişliği `@page { size: 80mm auto }`
 * ile globals.css'te tanımlı — kural orada çünkü `@page` bir bileşenin içinden
 * verilemez.
 *
 * Tasarım kasıtlı olarak ilkel: tek sütun, tek yazı tipi (monospace), gri ton
 * yok. Termal yazıcı gri basmaz, arka plan rengi basmaz ve ince yazıyı okunmaz
 * hâle getirir; renkli/gölgeli bir tasarım kâğıtta lekeye dönüşür.
 *
 * Tutarlar **hesaplanmaz**, siparişten okunur: satır tutarları, ücretler ve
 * KDV dökümü sipariş anında dondurulmuştur (bkz. OrderLine anlık görüntüsü).
 * Ürün fiyatı bugün değişse bile bu fiş dünkü siparişin tutarını basar.
 */

type VatBucket = { rate: number; netCents: number; vatCents: number; grossCents: number };

/** `vatBreakdown` Json alanı olarak gelir; beklenen şekle uymayan veri basılmaz. */
function readVatBuckets(value: unknown): VatBucket[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is VatBucket =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as VatBucket).rate === "number" &&
      typeof (entry as VatBucket).netCents === "number" &&
      typeof (entry as VatBucket).vatCents === "number" &&
      typeof (entry as VatBucket).grossCents === "number"
  );
}

function berlinTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderReceipt({ order }: { order: KitchenOrder }) {
  const buckets = readVatBuckets(order.vatBreakdown);
  const isDelivery = order.fulfillment === "DELIVERY";

  return (
    <div className="receipt-root" aria-hidden>
      <div className="receipt-head">
        <strong>{BUSINESS_INFO.name}</strong>
        <br />
        {BUSINESS_INFO.address.street}
        <br />
        {BUSINESS_INFO.address.postalCode} {BUSINESS_INFO.address.city}
        <br />
        Tel: {BUSINESS_INFO.phone}
      </div>

      <hr className="receipt-rule" />

      <div className="receipt-order-no">{order.orderNo}</div>
      <div className="receipt-meta">
        {berlinTime(order.createdAt)}
        <br />
        {isDelivery ? "LIEFERUNG / TESLİMAT" : "ABHOLUNG / GEL-AL"}
        <br />
        {STATUS_LABELS[order.status].de} · {STATUS_LABELS[order.status].tr}
      </div>

      <hr className="receipt-rule" />

      {/* Müşteri bloğu: kuryenin kapıyı bulması için gereken her şey. */}
      <div className="receipt-block">
        <strong>{order.customerName}</strong>
        <br />
        {order.phone}
        {isDelivery && (
          <>
            <br />
            {order.street} {order.houseNo}
            <br />
            {order.zip} {order.city}
            {/* Kat ve zil ismi fişe basılmazsa kurye kapıda okuyamaz —
                toplanmalarının tek sebebi bu satır. */}
            {order.floor && (
              <>
                <br />
                {order.floor}
              </>
            )}
            {order.bellName && (
              <>
                <br />
                Klingel: {order.bellName}
              </>
            )}
          </>
        )}
      </div>

      {order.note && (
        <div className="receipt-note">
          <strong>NOT:</strong> {order.note}
        </div>
      )}

      <hr className="receipt-rule" />

      <table className="receipt-lines">
        <tbody>
          {order.lines.map((line) => (
            <tr key={line.id}>
              <td className="receipt-qty">{line.qty}×</td>
              <td className="receipt-label">
                {line.label}
                {line.detail && <div className="receipt-detail">{line.detail}</div>}
              </td>
              <td className="receipt-amount">{formatCents(line.lineCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="receipt-rule" />

      <table className="receipt-totals">
        <tbody>
          <tr>
            <td>Zwischensumme</td>
            <td className="receipt-amount">{formatCents(order.subtotalCents)}</td>
          </tr>
          {order.serviceFeeCents > 0 && (
            <tr>
              <td>Servicegebühr</td>
              <td className="receipt-amount">{formatCents(order.serviceFeeCents)}</td>
            </tr>
          )}
          {order.deliveryFeeCents > 0 && (
            <tr>
              <td>Liefergebühr</td>
              <td className="receipt-amount">{formatCents(order.deliveryFeeCents)}</td>
            </tr>
          )}
          <tr className="receipt-grand">
            <td>GESAMT</td>
            <td className="receipt-amount">{formatCents(order.totalCents)}</td>
          </tr>
        </tbody>
      </table>

      {/*
        § 33 UStDV (Kleinbetragsrechnung): 250 €'ya kadar olan belgede brüt
        tutar ve uygulanan KDV oranı bulunmak zorunda. Döküm sipariş anında
        dondurulduğu için burada yeniden hesap yapılmaz.
      */}
      {buckets.length > 0 && (
        <>
          <hr className="receipt-rule" />
          <table className="receipt-vat">
            <thead>
              <tr>
                <th>MwSt</th>
                <th>Netto</th>
                <th>Steuer</th>
                <th>Brutto</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <tr key={bucket.rate}>
                  <td>{bucket.rate}%</td>
                  <td className="receipt-amount">{formatCents(bucket.netCents)}</td>
                  <td className="receipt-amount">{formatCents(bucket.vatCents)}</td>
                  <td className="receipt-amount">{formatCents(bucket.grossCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <hr className="receipt-rule" />

      <div className="receipt-foot">
        {order.paymentStatus === "PAID" ? "BEZAHLT / ÖDENDİ (Online)" : "ZAHLUNG OFFEN"}
        <br />
        {BUSINESS_INFO.name} — Vielen Dank!
      </div>
    </div>
  );
}
