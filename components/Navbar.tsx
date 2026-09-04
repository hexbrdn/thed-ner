"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, openCart } = useCart();
  const { lang, setLang, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const LINKS = [
    { href: "#filialen", label: t.nav.filialen },
    { href: "#produkte", label: t.nav.produkte },
    { href: "#unternehmen", label: t.nav.unternehmen },
    { href: "#franchise", label: t.nav.franchise },
    { href: "#builder", label: t.nav.buildYourOwn },
    { href: "#menu", label: t.nav.menu },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-void/90 backdrop-blur-md border-b border-line shadow-[0_14px_50px_rgba(0,0,0,0.4)]" : "bg-transparent"
      }`}
    >
      {/* Top Banner */}
      <div className="bg-flame-gradient text-void text-[11px] font-mono uppercase tracking-widest text-center py-1 px-4 truncate font-bold">
        {t.nav.franchiseInfo}
      </div>

      <nav className="max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 py-4">
        <a href="#top" className="focus-ring font-display font-extrabold text-lg md:text-xl tracking-tight text-bone shrink-0">
          SAMİ´S <span className="text-amber">//</span> DÖNER
        </a>

        {/* Desktop Links */}
        <ul className="hidden lg:flex items-center gap-6 tag text-smoke">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="focus-ring hover:text-amber transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex items-center border border-line bg-char p-0.5 rounded-none">
            <button
              onClick={() => setLang("tr")}
              className={`px-2 py-1 text-xs font-mono tracking-wider transition-colors ${
                lang === "tr" ? "bg-amber text-void font-bold" : "text-smoke hover:text-bone"
              }`}
              aria-label="Türkçe Dil Seçeneği"
            >
              TR
            </button>
            <button
              onClick={() => setLang("de")}
              className={`px-2 py-1 text-xs font-mono tracking-wider transition-colors ${
                lang === "de" ? "bg-amber text-void font-bold" : "text-smoke hover:text-bone"
              }`}
              aria-label="Almanca Dil Seçeneği (Deutsch)"
            >
              DE
            </button>
          </div>

          {/* Cart Button */}
          <button
            onClick={openCart}
            aria-label={`${t.nav.cart}, ${count} ${t.builder.cartItemCount}`}
            className="focus-ring relative tag border border-amber text-amber px-3 md:px-4 py-2 hover:bg-amber hover:text-void transition-colors"
          >
            {t.nav.cart}
            {count > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-herb text-void font-mono text-[11px] leading-5 text-center shadow-[0_0_20px_rgba(123,214,111,0.75)] font-bold">
                {count}
              </span>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden focus-ring tag border border-line text-smoke p-2 hover:border-amber transition-colors"
            aria-label="Menüyü aç/kapat"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="lg:hidden bg-char/95 backdrop-blur-lg border-b border-line px-6 py-6 space-y-4">
          <ul className="space-y-3 tag text-smoke">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-bone hover:text-amber py-1 transition-colors text-sm"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-line flex items-center justify-between">
            <span className="tag text-smoke">DİL / SPRACHE:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setLang("tr");
                  setMobileOpen(false);
                }}
                className={`px-3 py-1 text-xs font-mono border ${
                  lang === "tr" ? "border-amber text-amber bg-amber/10" : "border-line text-smoke"
                }`}
              >
                TÜRKÇE (TR)
              </button>
              <button
                onClick={() => {
                  setLang("de");
                  setMobileOpen(false);
                }}
                className={`px-3 py-1 text-xs font-mono border ${
                  lang === "de" ? "border-amber text-amber bg-amber/10" : "border-line text-smoke"
                }`}
              >
                DEUTSCH (DE)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
