"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";
let previousPaddingRight = "";

function emitLockChange(locked: boolean) {
  window.dispatchEvent(new CustomEvent("scroll-lock-change", { detail: { locked } }));
}

function lockScroll() {
  if (lockCount === 0) {
    const { body } = document;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    previousOverflow = body.style.overflow;
    previousPaddingRight = body.style.paddingRight;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    emitLockChange(true);
  }

  lockCount += 1;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  document.body.style.overflow = previousOverflow;
  document.body.style.paddingRight = previousPaddingRight;
  previousOverflow = "";
  previousPaddingRight = "";
  emitLockChange(false);
}

/**
 * Bir katman (çekmece, pencere) açıkken arkadaki sayfayı kilitler.
 *
 * İki ayrı sorunu birlikte çözer:
 *
 *  1. **Kayan arka plan.** Katmanın kendi listesi sonuna geldiğinde tekerlek
 *     hareketi sayfaya geçiyordu; kullanıcı sepette aşağı inmeye çalışırken
 *     arkadaki menü kayıyor, katmanı kapattığında da bambaşka bir yerde
 *     buluyordu kendini. Katmanların ayrıca `overscroll-contain` taşıması bunun
 *     tamamlayıcısı: biri zincirlemeyi keser, diğeri sayfayı sabitler.
 *  2. **Yana sıçrama.** Sayfanın kaydırma çubuğu gizlenince içerik o genişlik
 *     kadar sağa kayıyordu. Kaybolan çubuk kadar iç boşluk eklenerek düzen
 *     olduğu yerde kalır.
 *
 * Kilit referans sayımlıdır: sepet üstüne onay penceresi gibi ikinci bir katman
 * geldiğinde biri kapanınca arka sayfa erken serbest kalmaz.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    lockScroll();
    return unlockScroll;
  }, [active]);
}
