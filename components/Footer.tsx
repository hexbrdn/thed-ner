"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative overflow-hidden bg-void border-t border-line pt-20 pb-10">
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#FF3D12,#FFC247,#62D5FF,transparent)]" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 mb-16">
          <div>
            <p className="font-display font-extrabold text-2xl text-bone mb-4">
              SAMİ´S <span className="text-amber">//</span> DÖNER
            </p>
            <p className="text-smoke text-sm max-w-xs leading-relaxed mb-4">
              {t.footer.description}
            </p>
            <p className="font-mono text-xs text-amber uppercase tracking-wider">
              {t.footer.franchiseInfo}
            </p>
          </div>

          <div>
            <p className="tag text-smoke mb-4">{t.footer.navigationTitle}</p>
            <ul className="space-y-2 text-sm text-bone">
              <li><Link href="/" className="hover:text-amber transition-colors">{t.footer.links.home}</Link></li>
              <li><Link href="/#unternehmen" className="hover:text-amber transition-colors">{t.footer.links.company}</Link></li>
              <li><Link href="/#filialen" className="hover:text-amber transition-colors">{t.footer.links.branches}</Link></li>
              {/* Ürünler ana sayfadan kendi sayfasına taşındı. */}
              <li><Link href="/speisekarte" className="hover:text-amber transition-colors">{t.footer.links.products}</Link></li>
              <li><Link href="/#franchise" className="hover:text-amber transition-colors">{t.footer.links.franchise}</Link></li>
              <li><Link href="/#blog" className="hover:text-amber transition-colors">{t.footer.links.blog}</Link></li>
            </ul>
          </div>

          <div>
            <p className="tag text-smoke mb-4">{t.footer.legalTitle}</p>
            <ul className="space-y-2 text-sm text-bone">
              <li><Link href="/" className="hover:text-amber transition-colors">{t.footer.impressum}</Link></li>
              <li><Link href="/" className="hover:text-amber transition-colors">{t.footer.privacy}</Link></li>
            </ul>
          </div>

          <div>
            <p className="tag text-smoke mb-4">Social Media</p>
            <ul className="space-y-2 text-sm text-bone">
              <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber transition-colors">Instagram</a></li>
              <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber transition-colors">Facebook</a></li>
              <li><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber transition-colors">YouTube</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-line tag text-smoke">
          <span>{t.footer.rightsReserved}</span>
          <div className="flex gap-6">
            <Link href="/" className="focus-ring hover:text-amber transition-colors">
              {t.footer.backToTop}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
