"use client";

/**
 * Hesap ekranlarının ortak form alanı.
 *
 * Müşteri tarafındaki genel `components/ui` bileşenlerinden ayrı duruyor:
 * oradakiler ödeme formunun hata/`invalid` sözleşmesini taşıyor, buradaki
 * alanlar ise etiket + kutu kadar basit. İkisini birleştirmek, hesap
 * formlarına hiç kullanılmayan bir hata protokolü taşımak olurdu.
 */

export function TextField({
  id,
  label,
  hint,
  ...props
}: { id: string; label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="tag mb-2 block text-smoke">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="w-full border border-line bg-void px-3 py-2.5 text-sm text-bone outline-none transition-colors placeholder:text-smoke/50 focus:border-amber"
        {...props}
      />
      {hint && <p className="mt-1.5 text-xs text-smoke/70">{hint}</p>}
    </div>
  );
}

/** Panel başlığı — beş ekranda da aynı hiyerarşi. */
export function PanelHeader({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="mb-6">
      <h2 className="font-display text-xl font-extrabold text-bone">{title}</h2>
      {lead && <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-smoke">{lead}</p>}
    </header>
  );
}
