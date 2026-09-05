"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/lib/admin/types";
import { Button, ConfirmDialog, Notice, TextInput } from "./ui";

type Row = Category & { productCount: number; activeCount: number };

export default function CategoryManager({ categories }: { categories: Row[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);

  async function send(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
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
      router.refresh();
      return true;
    } catch {
      setError("Sunucuya ulaşılamadı.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addCategory(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (await send("/api/admin/categories", "POST", { name })) setNewName("");
  }

  async function saveRename(id: string) {
    const name = editingName.trim();
    if (!name) return;
    if (await send(`/api/admin/categories/${encodeURIComponent(id)}`, "PATCH", { name })) {
      setEditingId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    if (await send(`/api/admin/categories/${encodeURIComponent(pendingDelete.id)}`, "DELETE")) {
      setPendingDelete(null);
    }
  }

  return (
    <div className="max-w-[880px]">
      <header className="mb-8">
        <p className="tag text-flame mb-2">Katalog</p>
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-bone">Kategoriler</h1>
      </header>

      <form onSubmit={addCategory} className="flex flex-col sm:flex-row gap-3 mb-7">
        <TextInput
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Yeni kategori adı (ör. Tatlılar)"
          aria-label="Yeni kategori adı"
          maxLength={80}
          className="flex-1"
        />
        <Button type="submit" disabled={busy || newName.trim() === ""}>
          + KATEGORİ EKLE
        </Button>
      </form>

      {error && (
        <div className="mb-6">
          <Notice kind="error" message={error} />
        </div>
      )}

      <ul className="border border-line divide-y divide-line">
        {categories.map((category) => (
          <li
            key={category.id}
            className="bg-char p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex-1 min-w-0">
              {editingId === category.id ? (
                <TextInput
                  autoFocus
                  value={editingName}
                  maxLength={80}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(category.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  aria-label="Kategori adı"
                />
              ) : (
                <>
                  <p className="font-display font-bold text-bone truncate">{category.name}</p>
                  <p className="tag text-smoke mt-1 tabular-nums">
                    {category.activeCount} aktif / {category.productCount} ürün
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {editingId === category.id ? (
                <>
                  <button
                    onClick={() => saveRename(category.id)}
                    disabled={busy}
                    className="focus-ring tag border border-amber bg-amber text-void px-3 py-2 font-semibold hover:bg-bone hover:border-bone transition-colors disabled:opacity-40"
                  >
                    KAYDET
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="focus-ring tag border border-line px-3 py-2 text-smoke hover:border-amber hover:text-amber transition-colors"
                  >
                    VAZGEÇ
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditingId(category.id);
                      setEditingName(category.name);
                      setError(null);
                    }}
                    className="focus-ring tag border border-line px-3 py-2 text-bone hover:border-amber hover:text-amber transition-colors"
                  >
                    DÜZENLE
                  </button>
                  <button
                    onClick={() => setPendingDelete(category)}
                    className="focus-ring tag border border-flame/50 px-3 py-2 text-flame hover:bg-flame hover:text-void transition-colors"
                  >
                    SİL
                  </button>
                </>
              )}
            </div>
          </li>
        ))}

        {categories.length === 0 && (
          <li className="bg-char px-5 py-10 text-center text-sm text-smoke">
            Henüz kategori yok. Yukarıdan ilk kategoriyi ekleyebilirsin.
          </li>
        )}
      </ul>

      <p className="text-xs text-smoke/70 mt-5 leading-relaxed">
        İçinde ürün bulunan kategoriler silinemez — önce ürünleri başka bir kategoriye taşı
        veya sil. Kategori sırası menüdeki görünüm sırasını belirler.
      </p>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Kategoriyi sil"
        message={`"${pendingDelete?.name ?? ""}" kategorisini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="EVET, SİL"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
