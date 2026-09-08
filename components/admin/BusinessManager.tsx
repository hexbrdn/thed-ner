"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BusinessSettings,
  ClosureRow,
  OpeningHourRow,
} from "@/lib/orders/business";
import { Badge, Button, ConfirmDialog, Field, Notice, TextInput, Toggle } from "./ui";

/**
 * İşletme ekranı.
 *
 * Buradaki üç anahtar sipariş akışının **tek kapatma yolu**: `orderingEnabled`
 * kapalıyken hiçbir sipariş kabul edilmez, `deliveryEnabled` / `pickupEnabled`
 * ilgili teslim biçimini kapatır. Çalışma saatleri de burada: müşteri
 * sitesindeki saatler sabit bir dosyadan okunuyor ama siparişin kabul edilip
 * edilmeyeceğine **bu tablo** karar veriyor.
 *
 * ─── Neden "düzenle → kaydet" ───────────────────────────────────────────────
 *
 * Ekran önce her anahtarı tek tıkla ve anında kaydediyordu. Yanlış yere
 * dokunmak, doğrudan canlı siteyi değiştiriyordu: geri alma yok, onay yok,
 * gözden geçirme yok. Üstelik "gel-al aç + teslimat kapat + saatleri değiştir"
 * gibi birlikte anlamlı olan bir değişiklik, üç ayrı ana yayılıyor ve arada
 * müşteri tutarsız bir dükkân görüyordu.
 *
 * Artık ekranın iki hâli var:
 *  - **Görüntüleme**: her şey okunur, hiçbir şey değişmez. Yanlış dokunuş
 *    diye bir şey yok.
 *  - **Düzenleme**: anahtarlar, saatler ve kapalı günler taslakta değişir;
 *    hiçbiri sunucuya gitmez. "KAYDET" hepsini birlikte yazar, "VAZGEÇ"
 *    hepsini birden atar.
 *
 * Taslak durumu, kaydedilmemiş değişiklik varken ekranın üstünde açıkça
 * duyurulur: kaydedildiğini sanıp sekmeyi kapatmak, eskiden yanlış tıklamak
 * kadar pahalıdır.
 */

const WEEKDAYS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

/** 660 → "11:00" */
function toTimeInput(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type Interval = { open: string; close: string };
/** Gün indeksine göre aralıklar; bir güne birden çok aralık girilebilir. */
type Week = Interval[][];

function toWeek(rows: OpeningHourRow[]): Week {
  const week: Week = Array.from({ length: 7 }, () => []);
  for (const row of rows) {
    week[row.weekday]?.push({
      open: toTimeInput(row.openMinute),
      close: toTimeInput(row.closeMinute),
    });
  }
  // Aynı günün aralıkları saate göre sıralı dursun: 18:00–22:00 satırının
  // 11:00–14:00'ün üstünde görünmesi okuyanı yanıltır.
  for (const intervals of week) intervals.sort((a, b) => a.open.localeCompare(b.open));
  return week;
}

/** Ekranın tamamının kaydedilmemiş hâli. */
type Draft = {
  orderingEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  prepMinutes: string;
  week: Week;
  /** Henüz yazılmamış kapalı günler. */
  addedClosures: { date: string; reason: string }[];
  /** Kaydedildiğinde silinecek mevcut kapalı günler. */
  removedClosureIds: string[];
};

function toDraft(settings: BusinessSettings, hours: OpeningHourRow[]): Draft {
  return {
    orderingEnabled: settings.orderingEnabled,
    deliveryEnabled: settings.deliveryEnabled,
    pickupEnabled: settings.pickupEnabled,
    prepMinutes: String(settings.prepMinutes),
    week: toWeek(hours),
    addedClosures: [],
    removedClosureIds: [],
  };
}

export default function BusinessManager({
  settings,
  hours,
  closures,
}: {
  settings: BusinessSettings;
  hours: OpeningHourRow[];
  closures: ClosureRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(settings, hours));

  const [closureDate, setClosureDate] = useState("");
  const [closureReason, setClosureReason] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  /*
   * Düzenleme kapalıyken taslak sunucudan geleni izler.
   *
   * Düzenleme AÇIKKEN izlemez: arka planda tetiklenen bir `router.refresh()`
   * (başka bir sekmede yapılan bir kayıt, örneğin) kullanıcının yazdıklarının
   * üstüne yazamamalı.
   */
  useEffect(() => {
    if (!editing) setDraft(toDraft(settings, hours));
  }, [editing, settings, hours]);

  async function send(url: string, method: string, body?: unknown): Promise<boolean> {
    const response = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "İşlem başarısız oldu.");
      return false;
    }
    return true;
  }

  /** Taslağın sunucudan gelen hâlden farkı var mı. */
  const dirty =
    draft.orderingEnabled !== settings.orderingEnabled ||
    draft.deliveryEnabled !== settings.deliveryEnabled ||
    draft.pickupEnabled !== settings.pickupEnabled ||
    draft.prepMinutes.trim() !== String(settings.prepMinutes) ||
    JSON.stringify(draft.week) !== JSON.stringify(toWeek(hours)) ||
    draft.addedClosures.length > 0 ||
    draft.removedClosureIds.length > 0;

  /**
   * Tüm değişiklikleri yazar.
   *
   * Sıra bilinçli: önce doğrulama (hiçbir istek atılmadan), sonra ayarlar,
   * saatler ve kapalı günler. Bir adım başarısız olursa kalanlar denenmez ve
   * düzenleme kipinden çıkılmaz — kullanıcı neyin yazılmadığını görsün diye
   * taslak olduğu gibi durur.
   */
  async function saveAll() {
    setError(null);
    setSaved(null);

    const minutes = Number(draft.prepMinutes.trim());
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 240) {
      setError("Hazırlık süresi 0 ile 240 dakika arasında olmalı.");
      return;
    }

    const rows: { weekday: number; open: string; close: string }[] = [];
    for (const [weekday, intervals] of draft.week.entries()) {
      for (const interval of intervals) {
        // Yarım doldurulmuş satır sessizce atılmaz; kullanıcı uyarılır.
        if (!interval.open || !interval.close) {
          setError(`${WEEKDAYS[weekday]} için açılış ve kapanış saati eksik.`);
          return;
        }
        if (interval.open === interval.close) {
          setError(`${WEEKDAYS[weekday]} için açılış ve kapanış saati aynı olamaz.`);
          return;
        }
        rows.push({ weekday, open: interval.open, close: interval.close });
      }
    }

    setBusy(true);
    try {
      const ok =
        (await send("/api/admin/business", "PATCH", {
          section: "settings",
          orderingEnabled: draft.orderingEnabled,
          deliveryEnabled: draft.deliveryEnabled,
          pickupEnabled: draft.pickupEnabled,
          prepMinutes: Math.round(minutes),
        })) && (await send("/api/admin/business", "PATCH", { section: "hours", rows }));
      if (!ok) return;

      for (const closure of draft.addedClosures) {
        const written = await send("/api/admin/business", "PATCH", {
          section: "closure",
          date: closure.date,
          reason: closure.reason,
        });
        if (!written) return;
      }

      for (const id of draft.removedClosureIds) {
        const removed = await send(
          `/api/admin/business/closures/${encodeURIComponent(id)}`,
          "DELETE"
        );
        if (!removed) return;
      }

      setEditing(false);
      setSaved("Değişiklikler kaydedildi ve sitede geçerli.");
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  function startEditing() {
    setDraft(toDraft(settings, hours));
    setError(null);
    setSaved(null);
    setEditing(true);
  }

  function discard() {
    setDraft(toDraft(settings, hours));
    setClosureDate("");
    setClosureReason("");
    setError(null);
    setEditing(false);
    setConfirmDiscard(false);
  }

  const patch = (next: Partial<Draft>) => setDraft((current) => ({ ...current, ...next }));

  function updateInterval(weekday: number, index: number, value: Partial<Interval>) {
    setDraft((current) => ({
      ...current,
      week: current.week.map((intervals, i) =>
        i === weekday
          ? intervals.map((interval, j) => (j === index ? { ...interval, ...value } : interval))
          : intervals
      ),
    }));
  }

  function addInterval(weekday: number) {
    setDraft((current) => ({
      ...current,
      week: current.week.map((intervals, i) =>
        i === weekday ? [...intervals, { open: "11:00", close: "21:00" }] : intervals
      ),
    }));
  }

  function removeInterval(weekday: number, index: number) {
    setDraft((current) => ({
      ...current,
      week: current.week.map((intervals, i) =>
        i === weekday ? intervals.filter((_, j) => j !== index) : intervals
      ),
    }));
  }

  function stageClosure(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(closureDate)) {
      setError("Lütfen geçerli bir tarih seçin.");
      return;
    }
    const already =
      closures.some((c) => c.date === closureDate) ||
      draft.addedClosures.some((c) => c.date === closureDate);
    if (already) {
      setError("Bu tarih listede zaten var.");
      return;
    }
    setError(null);
    patch({
      addedClosures: [...draft.addedClosures, { date: closureDate, reason: closureReason.trim() }],
    });
    setClosureDate("");
    setClosureReason("");
  }

  /** Görüntüleme kipinde de, düzenleme kipinde de gösterilen kapalı gün listesi. */
  const closureList = [
    ...closures.map((closure) => ({
      key: closure.id,
      date: closure.date,
      reason: closure.reason,
      removed: draft.removedClosureIds.includes(closure.id),
      staged: false,
      id: closure.id as string | null,
    })),
    ...draft.addedClosures.map((closure) => ({
      key: `new:${closure.date}`,
      date: closure.date,
      reason: closure.reason,
      removed: false,
      staged: true,
      id: null,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="max-w-[1000px] space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="tag text-flame">İşletme</p>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-bone">
            Sipariş alımı ve çalışma saatleri
          </h1>
          <p className="mt-2 max-w-[560px] text-sm text-smoke">
            {editing
              ? "Değişiklikler henüz kaydedilmedi; site şu an eski ayarlarla çalışıyor. Aşağıdaki her şeyi düzenleyip tek seferde kaydedebilirsiniz."
              : "Ayarları değiştirmek için önce düzenlemeye geçin. Böylece yanlış bir dokunuş doğrudan canlı siteyi etkilemez."}
          </p>
        </div>

        {!editing ? (
          <Button onClick={startEditing}>DÜZENLE</Button>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              onClick={() => (dirty ? setConfirmDiscard(true) : discard())}
              disabled={busy}
            >
              VAZGEÇ
            </Button>
            <Button onClick={saveAll} disabled={busy || !dirty}>
              {busy ? "KAYDEDİLİYOR…" : "KAYDET"}
            </Button>
          </div>
        )}
      </header>

      {error && <Notice kind="error" message={error} />}
      {saved && <Notice kind="success" message={saved} />}

      {editing && dirty && (
        <p className="border border-amber/60 bg-amber/10 px-4 py-3 text-sm text-amber">
          Kaydedilmemiş değişiklikler var. &quot;KAYDET&quot;e basana kadar hiçbiri
          sitede geçerli değil.
        </p>
      )}

      {/* ---- acil kapatma ---- */}
      <section className="border border-line bg-char p-6">
        <h2 className="font-display text-lg font-bold text-bone">Sipariş alımı</h2>
        <p className="mt-1 mb-5 text-sm text-smoke">
          Bu anahtar kapalıyken site sipariş kabul etmez; müşteri sepette
          &quot;sipariş alımı durduruldu&quot; uyarısını görür. Menü ve fiyatlar
          görünmeye devam eder.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {editing ? (
            <Toggle
              checked={draft.orderingEnabled}
              onChange={(next) => patch({ orderingEnabled: next })}
              onLabel="SİPARİŞ ALIMI AÇIK"
              offLabel="SİPARİŞ ALIMI DURDURULDU"
            />
          ) : (
            <Badge tone={settings.orderingEnabled ? "on" : "warn"}>
              {settings.orderingEnabled ? "SİPARİŞ ALIMI AÇIK" : "SİPARİŞ ALIMI DURDURULDU"}
            </Badge>
          )}
          {!settings.orderingEnabled && (
            <span className="tag border border-flame/60 bg-flame/10 px-3 py-2 text-flame">
              Site şu anda sipariş almıyor
            </span>
          )}
        </div>
      </section>

      {/* ---- teslim biçimleri ---- */}
      <section className="border border-line bg-char p-6">
        <h2 className="font-display text-lg font-bold text-bone">Teslim biçimleri</h2>
        <p className="mt-1 mb-5 text-sm text-smoke">
          Kapatılan biçim sepette hiç gösterilmez. İkisi birden kapalıysa sipariş
          verilemez.
        </p>

        <div className="flex flex-wrap gap-3">
          {editing ? (
            <>
              <Toggle
                checked={draft.deliveryEnabled}
                onChange={(next) => patch({ deliveryEnabled: next })}
                onLabel="ADRESE TESLİMAT AÇIK"
                offLabel="ADRESE TESLİMAT KAPALI"
              />
              <Toggle
                checked={draft.pickupEnabled}
                onChange={(next) => patch({ pickupEnabled: next })}
                onLabel="GEL-AL AÇIK"
                offLabel="GEL-AL KAPALI"
              />
            </>
          ) : (
            <>
              <Badge tone={settings.deliveryEnabled ? "on" : "off"}>
                {settings.deliveryEnabled ? "ADRESE TESLİMAT AÇIK" : "ADRESE TESLİMAT KAPALI"}
              </Badge>
              <Badge tone={settings.pickupEnabled ? "on" : "off"}>
                {settings.pickupEnabled ? "GEL-AL AÇIK" : "GEL-AL KAPALI"}
              </Badge>
            </>
          )}
        </div>

        {(editing ? draft.deliveryEnabled : settings.deliveryEnabled) && (
          <p className="mt-4 border-l-2 border-amber bg-void px-4 py-3 text-xs leading-relaxed text-smoke">
            Adrese teslimat açık olsa bile, <strong className="text-bone">Teslimat
            bölgeleri</strong> ekranında açık bir posta kodu yoksa hiçbir adres
            teslimat alanına girmez ve her sipariş &quot;bölge dışı&quot; diye
            reddedilir.
          </p>
        )}

        {!draft.deliveryEnabled && !draft.pickupEnabled && editing && (
          <p className="mt-4 border-l-2 border-flame bg-void px-4 py-3 text-xs leading-relaxed text-flame">
            İki teslim biçimi de kapalı: kaydedilirse site hiçbir sipariş
            alamaz.
          </p>
        )}

        <div className="mt-6 w-40">
          <Field
            label="Hazırlık süresi (dk)"
            hint="Gel-al siparişinde müşteriye gösterilen tahmini süre."
          >
            {editing ? (
              <TextInput
                value={draft.prepMinutes}
                onChange={(e) => patch({ prepMinutes: e.target.value })}
                inputMode="numeric"
              />
            ) : (
              <p className="border border-line bg-void px-3.5 py-2.5 text-sm tabular-nums text-bone">
                {settings.prepMinutes} dk
              </p>
            )}
          </Field>
        </div>
      </section>

      {/* ---- çalışma saatleri ---- */}
      <section className="border border-line bg-char p-6">
        <h2 className="font-display text-lg font-bold text-bone">Çalışma saatleri</h2>
        <p className="mt-1 text-sm text-smoke">
          Siparişin kabul edilip edilmeyeceğine <strong className="text-bone">bu
          tablo</strong> karar verir. Bir güne birden çok aralık girilebilir
          (öğle/akşam arası). Gece yarısını aşan aralık desteklenir: 18:00–02:00
          ertesi güne sarkar.
        </p>
        <p className="mt-3 border-l-2 border-flame bg-void px-4 py-3 text-xs leading-relaxed text-smoke">
          Sitedeki &quot;Konum&quot; bölümünde görünen saatler şimdilik ayrı bir
          dosyadan okunuyor. Burayı değiştirdiğinizde sitedeki liste
          değişmez — ikisi ayrışırsa site &quot;açığız&quot; derken sipariş
          reddedilebilir.
        </p>

        <div className="mt-6 space-y-3">
          {WEEKDAYS.map((label, weekday) => {
            const intervals = draft.week[weekday];
            return (
              <div
                key={label}
                className="flex flex-wrap items-center gap-3 border-b border-line/60 pb-3"
              >
                <span className="w-28 shrink-0 text-sm text-bone">{label}</span>

                {intervals.length === 0 ? (
                  <span className="tag text-smoke">KAPALI</span>
                ) : editing ? (
                  intervals.map((interval, index) => (
                    <span key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={interval.open}
                        onChange={(e) => updateInterval(weekday, index, { open: e.target.value })}
                        aria-label={`${label} açılış`}
                        className="bg-void border border-line text-bone text-sm px-2 py-1.5 focus-ring focus:border-amber"
                      />
                      <span className="text-smoke">–</span>
                      <input
                        type="time"
                        value={interval.close}
                        onChange={(e) => updateInterval(weekday, index, { close: e.target.value })}
                        aria-label={`${label} kapanış`}
                        className="bg-void border border-line text-bone text-sm px-2 py-1.5 focus-ring focus:border-amber"
                      />
                      <button
                        type="button"
                        onClick={() => removeInterval(weekday, index)}
                        aria-label={`${label} aralığını kaldır`}
                        className="focus-ring px-2 text-smoke transition-colors hover:text-flame"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="font-mono text-sm tabular-nums text-bone">
                    {intervals.map((i) => `${i.open}–${i.close}`).join("  ·  ")}
                  </span>
                )}

                {editing && (
                  <button
                    type="button"
                    onClick={() => addInterval(weekday)}
                    className="focus-ring tag border border-line px-3 py-1.5 text-smoke transition-colors hover:border-amber hover:text-amber"
                  >
                    + ARALIK
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- tatil günleri ---- */}
      <section className="border border-line bg-char p-6">
        <h2 className="font-display text-lg font-bold text-bone">Kapalı günler</h2>
        <p className="mt-1 mb-5 text-sm text-smoke">
          Tek seferlik kapanışlar (tatil, bakım). Bu günlerde çalışma saatleri
          ne olursa olsun sipariş alınmaz. Geçmiş tarihler listede görünmez.
        </p>

        {editing && (
          <form onSubmit={stageClosure} className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <Field label="Tarih">
                <TextInput
                  type="date"
                  value={closureDate}
                  onChange={(e) => setClosureDate(e.target.value)}
                />
              </Field>
            </div>
            <div className="min-w-[220px] flex-1">
              <Field label="Sebep (isteğe bağlı)">
                <TextInput
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="Yılbaşı tatili"
                  maxLength={120}
                />
              </Field>
            </div>
            <Button type="submit" variant="ghost" disabled={busy}>
              LİSTEYE EKLE
            </Button>
          </form>
        )}

        <ul className="mt-6 divide-y divide-line border border-line">
          {closureList.length === 0 && (
            <li className="bg-void px-5 py-4 text-sm text-smoke">
              Planlanmış kapalı gün yok.
            </li>
          )}
          {closureList.map((closure) => (
            <li
              key={closure.key}
              className="flex flex-wrap items-center justify-between gap-3 bg-void px-5 py-4"
            >
              <span className={`text-sm ${closure.removed ? "text-smoke/50 line-through" : "text-bone"}`}>
                <span className="font-mono tabular-nums">{closure.date}</span>
                {closure.reason && <span className="ml-3 text-smoke">{closure.reason}</span>}
                {closure.staged && <span className="ml-3 tag text-amber">KAYDEDİLMEDİ</span>}
                {closure.removed && <span className="ml-3 tag text-flame">KALDIRILACAK</span>}
              </span>

              {editing &&
                (closure.staged ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      patch({
                        addedClosures: draft.addedClosures.filter((c) => c.date !== closure.date),
                      })
                    }
                    disabled={busy}
                  >
                    LİSTEDEN ÇIKAR
                  </Button>
                ) : closure.removed ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      patch({
                        removedClosureIds: draft.removedClosureIds.filter(
                          (id) => id !== closure.id
                        ),
                      })
                    }
                    disabled={busy}
                  >
                    GERİ AL
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    onClick={() =>
                      patch({ removedClosureIds: [...draft.removedClosureIds, closure.id!] })
                    }
                    disabled={busy}
                  >
                    KALDIR
                  </Button>
                ))}
            </li>
          ))}
        </ul>
      </section>

      {/* Düzenleme kipinde alt tarafta da bir kaydetme çubuğu: uzun sayfada
          başa dönmek gerekmesin. */}
      {editing && (
        <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border border-line bg-char/95 p-4 backdrop-blur">
          {dirty && <span className="tag mr-auto text-amber">Kaydedilmemiş değişiklik var</span>}
          <Button
            variant="ghost"
            onClick={() => (dirty ? setConfirmDiscard(true) : discard())}
            disabled={busy}
          >
            VAZGEÇ
          </Button>
          <Button onClick={saveAll} disabled={busy || !dirty}>
            {busy ? "KAYDEDİLİYOR…" : "KAYDET"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDiscard}
        title="Değişiklikleri at"
        message="Kaydedilmemiş tüm değişiklikler (anahtarlar, saatler, kapalı günler) atılacak ve ekran son kaydedilmiş hâle dönecek."
        confirmLabel="EVET, AT"
        onConfirm={discard}
        onCancel={() => setConfirmDiscard(false)}
      />
    </div>
  );
}
