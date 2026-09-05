"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Admin kabuğu: sidebar + içerik alanı.
 *
 * Giriş sayfası kabuğun dışında kalır (henüz oturum yok, menü gösterilmemeli).
 * Masaüstünde sabit sidebar, mobil/tablette açılır-kapanır çekmece.
 */

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Ürünler", exact: false },
  { href: "/admin/categories", label: "Kategoriler", exact: false },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setNavOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`focus-ring tag px-4 py-3 border-l-2 transition-colors ${
              active
                ? "border-amber text-amber bg-amber/10"
                : "border-transparent text-smoke hover:text-bone hover:bg-panel"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-void text-bone flex flex-col lg:flex-row">
      {/* mobil üst çubuk */}
      <header className="lg:hidden flex items-center justify-between gap-4 px-5 py-4 border-b border-line bg-char sticky top-0 z-40">
        <Link href="/admin" className="focus-ring font-display font-extrabold text-base">
          SAMİ´S <span className="text-flame">// PANEL</span>
        </Link>
        <button
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          className="focus-ring tag border border-line px-3 py-2 hover:border-amber"
        >
          {navOpen ? "KAPAT ✕" : "MENÜ ☰"}
        </button>
      </header>

      {navOpen && (
        <div className="lg:hidden border-b border-line bg-char px-2 py-3">
          {nav}
          <SidebarFooter onLogout={logout} loggingOut={loggingOut} />
        </div>
      )}

      {/* masaüstü sidebar */}
      <aside className="hidden lg:flex w-[248px] shrink-0 flex-col border-r border-line bg-char sticky top-0 h-screen">
        <div className="px-6 py-7 border-b border-line">
          <Link href="/admin" className="focus-ring font-display font-extrabold text-lg leading-tight block">
            SAMİ´S
            <br />
            <span className="text-flame">// PANEL</span>
          </Link>
        </div>
        <div className="flex-1 py-5 px-2 overflow-y-auto">{nav}</div>
        <SidebarFooter onLogout={logout} loggingOut={loggingOut} />
      </aside>

      <main className="flex-1 min-w-0 px-5 md:px-8 lg:px-10 py-8 md:py-10">{children}</main>
    </div>
  );
}

function SidebarFooter({
  onLogout,
  loggingOut,
}: {
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <div className="border-t border-line p-4 mt-3 lg:mt-0 space-y-2">
      <Link
        href="/"
        className="focus-ring tag block px-4 py-3 text-smoke hover:text-bone hover:bg-panel transition-colors"
      >
        ← Siteyi görüntüle
      </Link>
      <button
        onClick={onLogout}
        disabled={loggingOut}
        className="focus-ring tag w-full text-left px-4 py-3 text-smoke hover:text-flame hover:bg-panel transition-colors disabled:opacity-40"
      >
        {loggingOut ? "Çıkılıyor…" : "Çıkış"}
      </button>
    </div>
  );
}
