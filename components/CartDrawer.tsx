"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { lineKey, useCart } from "@/lib/cart";
import { formatCents } from "@/lib/money";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type Stage = "cart" | "form" | "done";

/**
 * Sepet çekmecesi.
 *
 * Tutarların hiçbiri burada hesaplanmaz: satır fiyatı, ara toplam, servis
 * ücreti ve genel toplam `/api/menu/quote` yanıtından okunur. Sipariş de
 * `/api/orders` ucuna yalnızca seçim bilgisiyle gider ve tutar orada yeniden
 * hesaplanır — ekrandaki tutarla siparişe yazılan tutar aynı kaynaktan gelir.
 */
export default function CartDrawer() {
  const { t, lang } = useLanguage();
  const { lines, count, quote, pricing, isOpen, setQty, remove, clear, closeCart } = useCart();
  const [stage, setStage] = useState<Stage>("cart");
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  /** Satır anahtarına göre sunucudan gelen fiyatlar. */
  const priced = useMemo(
    () => new Map((quote?.lines ?? []).map((l) => [l.key, l] as const)),
    [quote]
  );

  const hasUnavailable = (quote?.lines ?? []).some((l) => l.unavailable);
  const totalsReady = quote !== null && pricing !== "error";

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  // Sepet boşalırsa (ör. son ürün silindi) ödeme adımında kalınmasın.
  useEffect(() => {
    if (stage === "form" && lines.length === 0) setStage("cart");
  }, [stage, lines.length]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = t.cart.errName;
    if (!/^[0-9\s()+-]{8,17}$/.test(form.phone.trim())) e.phone = t.cart.errPhone;
    if (form.address.trim().length < 6) e.address = t.cart.errAddress;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, lang, customer: form }),
      });
      if (!response.ok) {
        setSubmitError(t.cart.errSubmit);
        return;
      }
      const data = (await response.json()) as { orderNo: string };
      setOrderNo(data.orderNo);
      setStage("done");
      clear();
    } catch {
      setSubmitError(t.cart.errSubmit);
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setStage("cart");
    setOrderNo(null);
    setForm({ name: "", phone: "", address: "", note: "" });
    setErrors({});
    setSubmitError(null);
    closeCart();
  };

  // 0 / 1 / çok ayrımı tek yerde; her iki dilde de doğru ek alır.
  const itemCountText =
    count === 0
      ? t.cart.empty
      : count === 1
        ? t.cart.itemsOne
        : t.cart.itemsOther.replace("{count}", String(count));

  const grandText = totalsReady ? formatCents(quote.totalCents) : "—";

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden
        className={`fixed inset-0 z-[70] bg-void/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.cart.title}
        className={`fixed top-0 right-0 z-[71] h-[100dvh] w-full max-w-[420px] ember-surface border-l border-line flex flex-col transition-transform duration-400 ease-out shadow-[-28px_0_80px_rgba(0,0,0,0.45)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-line shrink-0">
          <div className="min-w-0">
            <p className="tag text-flame">{t.cart.title}</p>
            <p className="font-display font-extrabold text-xl text-bone truncate">
              {stage === "done"
                ? t.cart.orderReceived
                : t.cart.heading.replace("{count}", String(count))}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={closeCart}
            aria-label={t.cart.closeBtn}
            className="focus-ring w-10 h-10 shrink-0 border border-line text-smoke hover:text-amber hover:border-amber transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ---- SEPET ---- */}
        {stage === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {lines.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <p className="text-smoke text-sm">{t.cart.empty}</p>
                  <a
                    href="/#builder"
                    onClick={closeCart}
                    className="focus-ring tag border border-amber text-amber px-4 py-2 hover:bg-amber hover:text-void transition-colors"
                  >
                    {t.cart.buildBtn}
                  </a>
                </div>
              ) : (
                <ul className="space-y-4">
                  {lines.map((line) => {
                    const key = lineKey(line);
                    const info = priced.get(key);
                    return (
                      <li
                        key={key}
                        className={`border p-4 ${
                          info?.unavailable ? "border-flame/50 bg-flame/5" : "border-line bg-void/35"
                        }`}
                      >
                        <div className="flex justify-between gap-3 mb-1">
                          <p className="font-display font-semibold text-bone text-sm min-w-0">
                            {info?.label ?? "…"}
                          </p>
                          <p className="font-mono text-sm text-bone shrink-0 tabular-nums">
                            {info ? formatCents(info.lineCents) : "—"}
                          </p>
                        </div>
                        {info?.detail && <p className="text-xs text-smoke mb-3">{info.detail}</p>}
                        {info?.unavailable && (
                          <p className="tag text-flame mb-3">{t.cart.unavailableItem}</p>
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center border border-line">
                            <button
                              onClick={() => setQty(key, line.qty - 1)}
                              aria-label={t.cart.decreaseQty}
                              className="focus-ring w-8 h-8 text-bone hover:text-flame transition-colors"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-mono text-sm text-bone tabular-nums">
                              {line.qty}
                            </span>
                            <button
                              onClick={() => setQty(key, line.qty + 1)}
                              aria-label={t.cart.increaseQty}
                              disabled={line.qty >= 99}
                              className="focus-ring w-8 h-8 text-bone hover:text-flame transition-colors disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => remove(key)}
                            className="focus-ring tag text-smoke hover:text-flame transition-colors"
                          >
                            {t.cart.removeBtn}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <div className="border-t border-line px-6 py-5 shrink-0">
                {pricing === "error" && (
                  <p role="alert" className="text-xs text-flame mb-3">
                    {t.cart.priceError}
                  </p>
                )}
                {hasUnavailable && (
                  <p role="alert" className="text-xs text-flame mb-3">
                    {t.cart.unavailableHint}
                  </p>
                )}

                <div className="flex justify-between gap-3 text-sm text-smoke mb-2">
                  <span>{t.cart.subtotal}</span>
                  <span className="tabular-nums">
                    {totalsReady ? formatCents(quote.subtotalCents) : "—"}
                  </span>
                </div>

                {/* Servis ücreti panelden yönetilir; 0 ise satır hiç gösterilmez. */}
                {totalsReady && (quote.serviceFeeCents > 0 || quote.freeServiceOverCents > 0) && (
                  <>
                    <div className="flex justify-between gap-3 text-sm text-smoke mb-3">
                      <span>{t.cart.deliveryFee}</span>
                      <span className="tabular-nums">
                        {quote.serviceFeeCents === 0
                          ? t.cart.freeDelivery
                          : formatCents(quote.serviceFeeCents)}
                      </span>
                    </div>
                    {quote.remainingForFreeServiceCents > 0 && (
                      <p className="text-xs text-smoke/70 mb-3">
                        {t.cart.freeDeliveryThreshold.replace(
                          "{amount}",
                          formatCents(quote.remainingForFreeServiceCents)
                        )}
                      </p>
                    )}
                  </>
                )}

                <div className="flex justify-between items-center gap-3 border-t border-line pt-3 mb-4">
                  <span className="tag text-smoke">{t.cart.total}</span>
                  <span className="font-display font-extrabold text-2xl text-amber tabular-nums">
                    {grandText}
                  </span>
                </div>
                <button
                  onClick={() => setStage("form")}
                  disabled={!totalsReady || quote.totalCents <= 0 || hasUnavailable}
                  className="focus-ring w-full bg-flame-gradient text-void font-display font-extrabold py-3 hover:brightness-110 transition-[filter,transform] active:translate-y-px text-xs tracking-wider disabled:opacity-40 disabled:pointer-events-none"
                >
                  {t.cart.addressBtn}
                </button>
              </div>
            )}
          </>
        )}

        {/* ---- ADRES FORMU ---- */}
        {stage === "form" && (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <p className="tag text-smoke">{itemCountText}</p>
              <div>
                <label htmlFor="name" className="tag text-smoke block mb-2">
                  {t.cart.nameLabel}
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder={t.cart.namePh}
                  aria-invalid={Boolean(errors.name)}
                  className={`w-full bg-void border px-3 py-2.5 text-sm text-bone placeholder:text-smoke/50 outline-none transition-colors focus:border-amber ${
                    errors.name ? "border-flame" : "border-line"
                  }`}
                />
                {errors.name && <p className="text-xs text-flame mt-1.5">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="tag text-smoke block mb-2">
                  {t.cart.phoneLabel}
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  placeholder={t.cart.phonePh}
                  aria-invalid={Boolean(errors.phone)}
                  className={`w-full bg-void border px-3 py-2.5 text-sm text-bone placeholder:text-smoke/50 outline-none transition-colors focus:border-amber ${
                    errors.phone ? "border-flame" : "border-line"
                  }`}
                />
                {errors.phone && <p className="text-xs text-flame mt-1.5">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="address" className="tag text-smoke block mb-2">
                  {t.cart.addressLabel}
                </label>
                <textarea
                  id="address"
                  rows={3}
                  autoComplete="street-address"
                  value={form.address}
                  onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
                  placeholder={t.cart.addressPh}
                  aria-invalid={Boolean(errors.address)}
                  className={`w-full bg-void border px-3 py-2.5 text-sm text-bone placeholder:text-smoke/50 outline-none resize-none transition-colors focus:border-amber ${
                    errors.address ? "border-flame" : "border-line"
                  }`}
                />
                {errors.address && <p className="text-xs text-flame mt-1.5">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="note" className="tag text-smoke block mb-2">
                  {t.cart.noteLabel}
                </label>
                <input
                  id="note"
                  value={form.note}
                  onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
                  placeholder={t.cart.notePh}
                  className="w-full bg-void border border-line px-3 py-2.5 text-sm text-bone placeholder:text-smoke/50 outline-none focus:border-amber transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-line px-6 py-5 shrink-0">
              {submitError && (
                <p role="alert" className="text-xs text-flame mb-3">
                  {submitError}
                </p>
              )}
              <div className="flex justify-between items-center gap-3 mb-4">
                <span className="tag text-smoke">{t.cart.total}</span>
                <span className="font-display font-extrabold text-2xl text-amber tabular-nums">
                  {grandText}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStage("cart")}
                  className="focus-ring tag border border-line text-smoke px-4 hover:border-smoke transition-colors"
                >
                  {t.cart.backBtn}
                </button>
                <button
                  onClick={submit}
                  disabled={submitting || !totalsReady}
                  className="focus-ring flex-1 bg-flame-gradient text-void font-display font-extrabold py-3 hover:brightness-110 transition-[filter,transform] active:translate-y-px text-xs tracking-wider disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submitting ? t.cart.submitting : t.cart.submitBtn}
                </button>
              </div>
              <p className="text-xs text-smoke/60 mt-3 leading-relaxed">{t.cart.payNote}</p>
            </div>
          </>
        )}

        {/* ---- ONAY ---- */}
        {stage === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
            <div className="w-16 h-16 border border-herb text-herb flex items-center justify-center text-2xl shadow-[0_0_36px_rgba(123,214,111,0.35)]">
              ✓
            </div>
            <p className="font-display font-extrabold text-2xl text-bone">{t.cart.orderSuccessTitle}</p>
            <p className="tag text-amber">{t.cart.orderNo.replace("{no}", orderNo || "")}</p>
            <p className="text-sm text-smoke leading-relaxed">{t.cart.orderSuccessDesc}</p>
            <button
              onClick={startOver}
              className="focus-ring tag border border-amber text-amber px-5 py-2.5 mt-2 hover:bg-amber hover:text-void transition-colors"
            >
              {t.cart.closeBtn}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
