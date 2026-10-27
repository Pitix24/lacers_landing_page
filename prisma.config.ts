import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

config({ path: ['.env.local', '.env'], quiet: true })

// Prisma 7: la URL sale de prisma.config.ts. Las migraciones usan la conexión directa
// (DATABASE_URL_UNPOOLED, recomendada por Neon para DDL); si falta, cae a DATABASE_URL.
// `prisma generate` no necesita base, por eso no se usa env() (que exige la variable).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
})
