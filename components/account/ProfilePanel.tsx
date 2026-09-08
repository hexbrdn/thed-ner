"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { accountTexts } from "./texts";
import { PanelHeader, TextField } from "./fields";

/**
 * Ayarlar: iletişim bilgileri, parola ve DSGVO işlemleri.
 *
 * Adres artık burada değil (bkz. AddressBook): eskiden aynı formda duruyordu
 * ve "telefonumu güncelleyeyim" diyen müşteri, farkında olmadan adresini de
 * yeniden kaydediyordu.
 *
 * Veri indirme, parola değiştirme ve hesap silme bir "gelişmiş ayarlar"
 * kutusuna saklanmaz, açıkta durur: DSGVO Art. 17/20 hakları fiilen
 * kullanılabilir olmalı, bulunması zor değil.
 */

export type AccountProfile = {
  email: string;
  name: string;
  phone: string;
};

export default function ProfilePanel({ profile }: { profile: AccountProfile }) {
  const { lang } = useLanguage();
  const de = lang !== "tr";
  const t = accountTexts(de);
  const router = useRouter();

  const [form, setForm] = useState(profile);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof AccountProfile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [key]: e.target.value }));
    setState("idle");
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setError(null);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Adres alanları gönderilmez: sunucu verilmeyen alana dokunmaz,
        // dolayısıyla varsayılan adresten eşitlenen değerler korunur.
        body: JSON.stringify({ name: form.name, phone: form.phone, lang }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setState("error");
        setError(data?.error ?? t.saveFailed);
        return;
      }
      setState("saved");
      router.refresh();
    } catch {
      setState("error");
      setError(t.serverError);
    }
  }

  return (
    <section>
      <PanelHeader title={t.settingsTitle} />

      <h3 className="font-display text-lg font-bold text-amber">{t.profileTitle}</h3>
      <p className="mb-4 mt-1 text-xs leading-relaxed text-smoke/70">{t.profileLead}</p>

      <form onSubmit={save} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="name"
            label={t.name}
            value={form.name}
            autoComplete="name"
            onChange={set("name")}
          />
          <TextField
            id="phone"
            label={t.phone}
            type="tel"
            value={form.phone}
            autoComplete="tel"
            onChange={set("phone")}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-flame">
            {error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={state === "saving"}
            className="focus-ring border border-amber px-5 py-2.5 font-display text-xs font-extrabold tracking-wider text-amber transition-colors hover:bg-amber hover:text-void disabled:opacity-50"
          >
            {state === "saving" ? t.saving : t.save}
          </button>
          {state === "saved" && (
            <span role="status" className="text-sm text-herb">
              {t.saved}
            </span>
          )}
        </div>
      </form>

      <div className="mt-12 border-t border-line pt-8">
        <h3 className="mb-4 font-display text-lg font-bold text-amber">{t.legalTitle}</h3>

        <p className="mb-2 text-sm text-smoke">{t.exportHint}</p>
        <a
          href="/api/account/export"
          className="focus-ring inline-block border border-line px-4 py-2 text-sm text-smoke transition-colors hover:border-amber hover:text-amber"
        >
          {t.exportBtn}
        </a>

        <PasswordSection de={de} />
        <DeleteSection de={de} title={t.deleteTitle} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------- parola değiştirme */

function PasswordSection({ de }: { de: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError(null);
    try {
      const response = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? (de ? "Änderung fehlgeschlagen." : "Değiştirilemedi."));
        setState("idle");
        return;
      }
      setCurrent("");
      setNext("");
      setState("done");
    } catch {
      setError(de ? "Server nicht erreichbar." : "Sunucuya ulaşılamadı.");
      setState("idle");
    }
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-3" noValidate>
      <h3 className="font-display text-sm font-bold text-bone">
        {de ? "Passwort ändern" : "Parola değiştir"}
      </h3>
      <p className="text-xs leading-relaxed text-smoke/70">
        {de
          ? "Nach der Änderung werden alle anderen Geräte abgemeldet."
          : "Değişiklikten sonra diğer tüm cihazlarda oturum kapanır."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          id="currentPassword"
          label={de ? "Aktuelles Passwort" : "Mevcut parola"}
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <TextField
          id="newPassword"
          label={de ? "Neues Passwort" : "Yeni parola"}
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-flame">
          {error}
        </p>
      )}
      {state === "done" && (
        <p role="status" className="text-sm text-herb">
          {de ? "Passwort geändert." : "Parola değiştirildi."}
        </p>
      )}
      <button
        type="submit"
        disabled={state === "busy"}
        className="focus-ring border border-line px-4 py-2 text-sm text-smoke transition-colors hover:border-amber hover:text-amber disabled:opacity-50"
      >
        {state === "busy"
          ? de
            ? "ÄNDERT…"
            : "DEĞİŞTİRİLİYOR…"
          : de
            ? "Passwort ändern"
            : "Parolayı değiştir"}
      </button>
    </form>
  );
}

/* ----------------------------------------------------------- hesap silme */

function DeleteSection({ de, title }: { de: boolean; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm: true }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? (de ? "Löschen fehlgeschlagen." : "Silinemedi."));
        setBusy(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError(de ? "Server nicht erreichbar." : "Sunucuya ulaşılamadı.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 border border-flame/40 bg-flame/5 p-4">
      <h3 className="font-display text-sm font-bold text-flame">{title}</h3>
      {/* Ne olacağı açıkça yazılır. "Her şey silinir" demek yanlış olurdu:
          siparişler yasal olarak duruyor kalır, kişisel alanları temizlenir. */}
      <p className="mt-2 text-xs leading-relaxed text-smoke">
        {de
          ? "Ihr Konto wird deaktiviert und alle personenbezogenen Angaben (Name, Telefon, Adressen, Favoriten, E-Mail) werden unwiderruflich entfernt. Ihre Bestellungen selbst bleiben als Buchungsbelege gespeichert — dazu sind wir nach § 147 AO gesetzlich verpflichtet —, jedoch ohne Ihre persönlichen Daten. Der Vorgang kann nicht rückgängig gemacht werden."
          : "Hesabınız kapatılır ve tüm kişisel bilgileriniz (ad, telefon, adresler, favoriler, e-posta) geri döndürülemez biçimde silinir. Siparişlerin kendisi muhasebe belgesi olarak saklı kalır — § 147 AO uyarınca buna yasal olarak mecburuz — ancak kişisel bilgileriniz olmadan. İşlem geri alınamaz."}
      </p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring mt-3 border border-flame px-4 py-2 text-sm text-flame transition-colors hover:bg-flame hover:text-void"
        >
          {title}
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
          <TextField
            id="deletePassword"
            label={de ? "Passwort zur Bestätigung" : "Onay için parola"}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-flame">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring border border-line px-4 py-2 text-sm text-smoke"
            >
              {de ? "Abbrechen" : "Vazgeç"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="focus-ring border border-flame bg-flame px-4 py-2 text-sm font-bold text-void disabled:opacity-50"
            >
              {busy ? (de ? "LÖSCHT…" : "SİLİNİYOR…") : de ? "Endgültig löschen" : "Kalıcı olarak sil"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
