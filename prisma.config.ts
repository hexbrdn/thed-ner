import path from 'node:path'
import { defineConfig } from 'prisma/config'

// Next.js .env.local dosyasını kendisi yükler, Prisma CLI ise yalnızca .env
// okur. Veritabanı bilgilerini tek bir yerde (.env.local) tutabilmek için
// CLI çalışırken dosyayı burada elle yüklüyoruz. Vercel gibi ortamlarda dosya
// bulunmaz; değişkenler zaten process.env içinde geldiği için hatayı yutuyoruz.
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(path.join(process.cwd(), file))
  } catch {
    // dosya yok, sorun değil
  }
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
