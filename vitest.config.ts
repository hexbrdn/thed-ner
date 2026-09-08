import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Birim test yapılandırması.
 *
 * Kapsam bilinçli olarak **saf mantıkla** sınırlı: para hesabı, durum makinesi,
 * jeton imzası, parola özeti, girdi ayıklama. Bunlar veritabanı olmadan
 * çalışır, milisaniyeler sürer ve bir hata çıktığında sebebi tektir.
 *
 * Veritabanına ya da Stripe'a dokunan akışlar burada taklit edilmez; onların
 * doğru yeri elle yürütülen uçtan uca senaryodur (bkz. tests/README.md). Bir
 * webhook'u sahte bir Stripe ile test etmek, yalnızca sahte Stripe'ın doğru
 * yazıldığını kanıtlar.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});
