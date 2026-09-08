/**
 * Stripe olaylarını yerel sunucuya taşır.
 *
 * Neden gerekli: sipariş yalnızca ödeme olayı ulaştığında PAID'e geçer ve
 * panele düşer. Stripe ise `localhost`'a istek atamaz — geliştirmede olayı
 * taşıyan bir köprü olmazsa ödeme alınır ama sipariş "ödeme bekleniyor"da
 * kalır. Köprü budur; canlıda karşılığı Stripe panelindeki webhook ucudur.
 *
 * `stripe login` istemez: CLI'ye kimliği .env'deki test anahtarından veririz,
 * böylece depoyu klonlayan herkes tek komutla aynı ortamı kurar. Anahtar
 * komut satırına değil ortam değişkenine konur; işlem listesinde görünmesin.
 *
 * Çalıştırma:  npm run dev:stripe   (dev sunucusu ayrı bir terminalde açıkken)
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const ENV_FILE = ".env";

/** .env'i okur. dotenv bağımlılığı eklemeye değmeyecek kadar basit bir biçim. */
function readEnv() {
  if (!existsSync(ENV_FILE)) return {};
  const out = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

/**
 * `stripe` çalıştırılabiliri.
 *
 * winget ile kurulan sürüm PATH'e her zaman girmiyor; bu yüzden PATH'te
 * bulunamazsa bilinen kurulum dizinine bakılır.
 */
function stripeBin() {
  const onPath = spawnSync("stripe", ["--version"], { shell: true });
  if (onPath.status === 0) return "stripe";

  const wingetPath = path.join(
    process.env.LOCALAPPDATA ?? path.join(homedir(), "AppData", "Local"),
    "Microsoft",
    "WinGet",
    "Packages",
    "Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe",
    "stripe.exe"
  );
  if (existsSync(wingetPath)) return wingetPath;

  console.error(
    "Stripe CLI bulunamadı. Kurulum:  winget install --id Stripe.StripeCli -e"
  );
  process.exit(1);
}

/**
 * Olayların taşınacağı adres.
 *
 * Sabit `localhost:3000` yazmak, dev sunucusu başka bir porta düştüğünde
 * köprüyü sessizce ölü bir adrese bağlıyordu: ödeme alınıyor, sipariş
 * "ödeme bekleniyor"da kalıyordu. Adres bu yüzden uygulamanın kendi
 * NEXT_PUBLIC_APP_URL'inden türetilir; PORT ile de ezilebilir.
 */
function forwardTarget(values) {
  const base = process.env.NEXT_PUBLIC_APP_URL || values.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  let url;
  try {
    url = new URL(base);
  } catch {
    console.error(`NEXT_PUBLIC_APP_URL geçerli bir adres değil: ${base}`);
    process.exit(1);
  }
  const port = process.env.PORT || url.port || (url.protocol === "https:" ? "443" : "80");
  return `${url.hostname}:${port}/api/webhooks/stripe`;
}

const env = readEnv();
const FORWARD_TO = forwardTarget(env);
const apiKey = env.STRIPE_SECRET_KEY;

if (!apiKey) {
  console.error(`${ENV_FILE} içinde STRIPE_SECRET_KEY yok.`);
  process.exit(1);
}
if (!apiKey.startsWith("sk_test_")) {
  // Canlı anahtarla dinlemek gerçek siparişlerin olaylarını bu makineye
  // çekerdi; kazara olmasın.
  console.error("STRIPE_SECRET_KEY canlı anahtar görünüyor. Bu betik yalnızca test anahtarıyla çalışır.");
  process.exit(1);
}

const bin = stripeBin();
const childEnv = { ...process.env, STRIPE_API_KEY: apiKey };

/*
 * İmza anahtarı uyuşmazlığı en sinsi arızadır: köprü çalışır, olay ulaşır,
 * ama uygulama imzayı doğrulayamayıp 400 döner ve sipariş yine beklemede
 * kalır. Bu yüzden dinlemeye başlamadan önce anahtar karşılaştırılır.
 */
const printed = spawnSync(bin, ["listen", "--print-secret"], {
  env: childEnv,
  encoding: "utf8",
});
const secret = printed.stdout?.trim().match(/whsec_[A-Za-z0-9]+/)?.[0];

if (!secret) {
  console.error("Webhook imza anahtarı alınamadı:", printed.stderr?.trim() || "bilinmeyen hata");
  process.exit(1);
}

if (env.STRIPE_WEBHOOK_SECRET !== secret) {
  const content = readFileSync(ENV_FILE, "utf8");
  writeFileSync(
    ENV_FILE,
    /^STRIPE_WEBHOOK_SECRET=.*$/m.test(content)
      ? content.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, `STRIPE_WEBHOOK_SECRET=${secret}`)
      : `${content.trimEnd()}\nSTRIPE_WEBHOOK_SECRET=${secret}\n`
  );
  console.log(`${ENV_FILE} içindeki STRIPE_WEBHOOK_SECRET güncellendi. Dev sunucusunu yeniden başlatın.`);
}

console.log(`Stripe olayları ${FORWARD_TO} adresine taşınıyor. Durdurmak için Ctrl+C.`);

const child = spawn(bin, ["listen", "--forward-to", FORWARD_TO], {
  env: childEnv,
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
