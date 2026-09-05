"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { formatPrice, type Product, type PublicCategory } from "@/lib/admin/types";
import { useCart } from "@/lib/cart";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * Menü bölümü.
 *
 * Ürünler artık statik dosyadan değil, admin panelinin yazdığı katalogdan
 * gelir (`app/page.tsx` sunucuda okur, prop olarak geçer). Pasif ürünler
 * sunucu tarafında zaten filtrelenmiştir.
 */
export default function MenuGrid({ menu }: { menu: PublicCategory[] }) {
  const { t } = useLanguage();
  const section = useRef<HTMLDivElement>(null);
  const { add, openCart } = useCart();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".menu-card");
      ScrollTrigger.create({
        trigger: section.current,
        start: "top 78%",
        once: true,
        onEnter: () => {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.08,
              duration: 0.55,
              ease: "power3.out",
              clearProps: "opacity,transform",
            }
          );
        },
      });
    }, section);
    return () => ctx.revert();
  }, [menu]);

  // öne çıkan kartlar: görseli olan ilk üç ürün
  const featured = menu
    .flatMap((c) => c.products)
    .filter((p) => p.image)
    .slice(0, 3);

  const effectivePrice = (p: Product) => p.discountPrice ?? p.price;

  const addToCart = (p: Product) => {
    if (!p.inStock) return;
    add({
      id: `product-${p.id}`,
      label: p.name,
      detail: p.description,
      price: effectivePrice(p),
    });
    openCart();
  };

  return (
    <section
      ref={section}
      id="menu"
      className="relative overflow-hidden bg-char py-28 md:py-36 border-t border-line"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#FF3D12,#FFC247,#7BD66F,transparent)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_16%_10%,rgba(255,61,18,0.16),transparent_36%),radial-gradient(ellipse_at_86%_20%,rgba(98,213,255,0.10),transparent_34%)]" />
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="tag text-flame mb-3">{t.menuGrid.tag}</p>
            <h2 className="font-display font-extrabold text-[9vw] md:text-[3.2vw] leading-[0.95] text-bone">
              {t.menuGrid.title1}
              <br />
              <span className="text-flame">{t.menuGrid.title2}</span>
            </h2>
          </div>
          <p className="tag text-smoke max-w-[280px]">{t.menuGrid.subText}</p>
        </div>

        {featured.length > 0 && (
          <div className="grid md:grid-cols-3 gap-3 md:gap-px md:bg-line md:border md:border-line">
            {featured.map((product, i) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={!product.inStock}
                className="menu-card kinetic-card focus-ring bg-void border border-line md:border-0 flex flex-col text-left hover:bg-panel hover:shadow-ember-card transition-all duration-300 group disabled:opacity-60 disabled:pointer-events-none"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-panel border-b border-line">
                  <Image
                    src={product.image as string}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover saturate-[0.95] contrast-[1.05] group-hover:saturate-[1.22] group-hover:scale-[1.04] transition-[transform,filter] duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/10 to-transparent" />
                  <p
                    className={`tag absolute bottom-3 left-4 ${
                      i === 1 ? "text-steel" : i === 2 ? "text-sumac" : "text-amber"
                    }`}
                  >
                    {`Menü 0${i + 1}`}
                  </p>
                </div>

                <div className="accent-rail p-8 flex flex-col flex-1">
                  <h3 className="font-display font-extrabold text-2xl text-bone mb-3">
                    {product.name}
                  </h3>
                  <p className="text-smoke text-sm leading-relaxed mb-8 flex-1">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-line">
                    <PriceTag product={product} size="lg" />
                    <span className="tag text-smoke group-hover:text-amber transition-colors">
                      {product.inStock ? t.menuGrid.addToCart : "TÜKENDİ"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-20 md:mt-28 space-y-14">
          {menu.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-5 mb-8">
                <h3 className="font-display font-extrabold text-2xl md:text-3xl text-bone whitespace-nowrap">
                  {category.name}
                </h3>
                <span className="h-px flex-1 bg-line" />
              </div>

              <ul className="grid md:grid-cols-2 gap-px bg-line border border-line">
                {category.products.map((product) => (
                  <li
                    key={product.id}
                    className="menu-card bg-void hover:bg-panel transition-colors duration-300 p-6 md:p-7 flex gap-5"
                  >
                    {product.image && (
                      <div className="relative w-16 h-16 shrink-0 overflow-hidden border border-line bg-panel">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover saturate-[0.95]"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-4">
                        <h4 className="font-display font-bold text-lg text-bone leading-tight">
                          {product.name}
                        </h4>
                        {product.variants.length <= 1 && <PriceTag product={product} size="md" />}
                      </div>

                      {product.description && (
                        <p className="text-smoke text-sm leading-relaxed mt-2">
                          {product.description}
                        </p>
                      )}

                      {product.variants.length > 1 && (
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 pt-3 border-t border-line">
                          {product.variants.map((variant) => (
                            <span
                              key={variant.size + variant.price}
                              className="flex items-baseline gap-2"
                            >
                              <span className="tag text-smoke">{variant.size}</span>
                              <span className="font-display font-bold text-base text-amber tabular-nums">
                                {formatPrice(variant.price)}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}

                      {!product.inStock && (
                        <p className="tag text-flame mt-3">MOMENTAN NICHT VERFÜGBAR</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** İndirim varsa eski fiyat üstü çizili gösterilir. */
function PriceTag({ product, size }: { product: Product; size: "md" | "lg" }) {
  const textSize = size === "lg" ? "text-2xl" : "text-lg";

  if (product.discountPrice === null) {
    return (
      <span
        className={`font-display font-extrabold ${textSize} text-bone tabular-nums whitespace-nowrap`}
      >
        {formatPrice(product.price)}
      </span>
    );
  }

  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-sm text-smoke line-through tabular-nums">
        {formatPrice(product.price)}
      </span>
      <span className={`font-display font-extrabold ${textSize} text-flame tabular-nums`}>
        {formatPrice(product.discountPrice)}
      </span>
    </span>
  );
}
