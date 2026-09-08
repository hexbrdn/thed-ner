/**
 * Test ortamı.
 *
 * Gizli anahtarlar burada **sabit** verilir: testin gerçek `.env` dosyasını
 * okuması, geliştiricinin makinesindeki bir değere bağımlı hâle gelmek olurdu —
 * anahtar değişince testler kırılırdı, ki bu doğru bir sinyal değil.
 *
 * Değerler kasıtlı olarak "TEST" içeriyor: bir gün üretim günlüğünde
 * görünürlerse nereden geldikleri anlaşılsın.
 */

process.env.ORDER_TOKEN_SECRET ??= "TEST-order-token-secret-0123456789";
process.env.CUSTOMER_SESSION_SECRET ??= "TEST-customer-session-secret-0123";
process.env.ADMIN_SESSION_SECRET ??= "TEST-admin-session-secret-01234567";
process.env.NEXT_PUBLIC_APP_URL ??= "https://test.local";

// `lib/admin/store` modülü içe aktarıldığında Prisma istemcisi kurulur.
// Kurulum sırasında bağlantı açılmaz, ama datasource adresi yoksa istemci
// hata verir; saf fonksiyonları test edebilmek için sahte bir adres yeter.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.DIRECT_URL ??= process.env.DATABASE_URL;
