"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // respect reduced motion: fall back to native scroll behavior
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      return () => {
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.1,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    const onScrollLockChange = (event: Event) => {
      const locked = (event as CustomEvent<{ locked?: boolean }>).detail?.locked === true;
      if (locked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };

    gsap.ticker.add(tick);
    window.addEventListener("scroll-lock-change", onScrollLockChange);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener("scroll-lock-change", onScrollLockChange);
      gsap.ticker.remove(tick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}
