"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/lib/admin/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCart } from "@/lib/cart";

/**
 * Ana sayfadaki "öne çıkan lezzetler".
 *
 * Ürünler ve fiyatlar katalogtan (admin paneli) gelir; bileşende sabit ürün ya
 * da sabit fiyat yoktur. Sepete eklerken de fiyat gönderilmez — yalnızca ürün
 * kimliği ve varsa boy; tutarı sunucu hesaplar.
 */
export default function Products({ products }: { products: Product[] }) {
  const { t, lang } = useLanguage();
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
          <p className="tag text-smoke max-w-[320px]">{t.products.description}</p>
        </div>

        {products.length === 0 ? (
          <p className="border border-line bg-char px-5 py-8 text-center text-smoke">
            {t.products.empty}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => {
              const name = lang === "tr" ? product.nameTr || product.name : product.name;
              const desc =
                lang === "tr"
                  ? product.descriptionTr || product.description
                  : product.description;
              const variant = product.variants[0];
              const price = variant ? variant.price : (product.discountPrice ?? product.price);

              return (
                <div
                  key={product.id}
                  className="kinetic-card border border-line bg-char flex flex-col justify-between p-6 hover:border-amber transition-all duration-300 group"
                >
                  <div>
                    <div className="relative aspect-[4/3] mb-6 overflow-hidden border border-line bg-panel">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center font-display font-extrabold text-4xl text-smoke/25">
                          {name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-char via-transparent to-transparent" />
                      <span className="tag absolute top-3 left-3 bg-void/80 backdrop-blur-sm px-2.5 py-1 text-amber border border-line">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-3 mb-2">
                      <h3 className="font-display font-extrabold text-xl md:text-2xl text-bone min-w-0">
                        {name}
                      </h3>
                      <span className="font-display font-extrabold text-lg text-amber tabular-nums shrink-0">
                        {formatPrice(price)}
                      </span>
                    </div>
                    {desc && <p className="text-smoke text-sm leading-relaxed mb-6">{desc}</p>}
                  </div>

                  <button
                    onClick={() => {
                      add({
                        kind: "product",
                        productId: product.id,
                        ...(variant ? { variantSize: variant.size } : {}),
                      });
                      openCart();
                    }}
                    className="focus-ring w-full border border-amber text-amber font-display font-semibold py-3 hover:bg-amber hover:text-void transition-colors tag"
                  >
                    {t.menuGrid.addToCart}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/speisekarte"
            className="focus-ring tag border border-line text-smoke px-6 py-3 hover:border-amber hover:text-amber transition-colors"
          >
            {t.products.seeMenu}
          </Link>
        </div>
      </div>
    </section>
  );
}
