"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Field, Notice, TextInput } from "./ui";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Açık yönlendirme olmasın: yalnızca panel içi yollara dönülür.
  const raw = params.get("next") ?? "/admin";
  const next = raw.startsWith("/admin") && !raw.startsWith("//") ? raw : "/admin";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Giriş yapılamadı.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-[400px] ember-surface border border-line p-8 md:p-10"
    >
      <p className="tag text-flame mb-3">Yönetim Paneli</p>
      <h1 className="font-display font-extrabold text-3xl text-bone leading-tight mb-8">
        SAMİ´S
        <br />
        <span className="text-flame">DÖNER</span>
      </h1>

      <div className="space-y-5">
        <Field label="Admin parolası">
          <TextInput
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {error && <Notice kind="error" message={error} />}

        <Button type="submit" disabled={busy || password.length === 0} className="w-full">
          {busy ? "GİRİŞ YAPILIYOR…" : "GİRİŞ YAP"}
        </Button>
      </div>
    </form>
  );
}
