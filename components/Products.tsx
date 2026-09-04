"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCart } from "@/lib/cart";

export default function Products() {
  const { t } = useLanguage();
  const { add, openCart } = useCart();

  return (
    <section id="produkte" className="relative overflow-hidden bg-void py-24 md:py-32 border-t border-line">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <p className="tag text-flame mb-3">{t.products.tag}</p>
            <h2 className="font-display font-extrabold text-[8vw] md:text-[3.2vw] leading-[0.95] text-bone">
              {t.products.title}
            </h2>
          </div>
          <p className="tag text-smoke max-w-[320px]">
            {t.products.description}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {t.products.items.map((item, i) => (
            <div
              key={item.id}
              className="kinetic-card border border-line bg-char flex flex-col justify-between p-6 hover:border-amber transition-all duration-300 group"
            >
              <div>
                <div className="relative aspect-[4/3] mb-6 overflow-hidden border border-line bg-panel">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-char via-transparent to-transparent" />
                  <span className="tag absolute top-3 left-3 bg-void/80 backdrop-blur-sm px-2.5 py-1 text-amber border border-line">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-2xl text-bone mb-2">
                  {item.title}
                </h3>
                <p className="text-smoke text-sm leading-relaxed mb-6">
                  {item.description}
                </p>
              </div>

              <button
                onClick={() => {
                  add({ id: item.id, label: item.title, detail: item.description, price: 175 });
                  openCart();
                }}
                className="focus-ring w-full border border-amber text-amber font-display font-semibold py-3 hover:bg-amber hover:text-void transition-colors tag"
              >
                {t.menuGrid.addToCart}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
