# Tasks — spec-01-persistencia-neon

## 1. Catálogo
- [x] 1.1 `CNC_POLYMERS` tipado en `landingData.ts`; el wizard deja de hardcodear polímeros
- [x] 1.2 Unificar id de caucho (`rubber` → `caucho`) antes de la primera migración (ADR-0005)
- [ ] 1.3 Agregar `6061-t6` con la skill `agregar-aleacion-cnc` — **bloqueado:** confirmar temple

## 2. Esquema y migración
- [x] 2.1 ADR-0014: Prisma 7 + `@prisma/adapter-neon` (reemplaza ADR-0004)
- [x] 2.2 `prisma/schema.prisma`: `QuoteRequest`, `CncMaterial`, enums `QuoteStatus`, `GeometryMode`, `CncMaterialKind`
- [x] 2.3 Migración inicial SQL + CHECKs de tallas, pares y contacto
- [x] 2.4 `prisma/seed.ts` sincroniza `cnc_materials` desde el catálogo en código
- [ ] 2.5 Aplicar `npm run db:migrate` y `npm run db:seed` en la rama `dev` — **requiere credenciales de Neon**
- [ ] 2.6 `admin_users` y `rate_limits` (ADR-0005) — se suman con spec-02 / spec-04
- [x] 2.7 Migraciones (`init`, `rate_limits`) y seed aplicados en la base de producción (integración Neon de Vercel, 2026-10-27): `cnc_materials` con 7 materiales activos

## 3. Cliente y plataforma
- [x] 3.1 `server/neon.ts`: `PrismaClient` singleton + `isMemoryFallbackAllowed()`
- [x] 3.2 `.env.example` (solo servidor) y `server/generated` en `.gitignore`
- [x] 3.3 `tsconfig.api.json` + build extendido (`prisma generate`, `tsc -p tsconfig.api.json`)
- [x] 3.4 `vercel.json`: rewrite de SPA que excluye `/api/`
- [ ] 3.5 `regions` en `vercel.json` alineada con la región de Neon
- [x] 3.6 Spike de plataforma: los imports `.js` de `src/lib` desde `api/` se resuelven en Vercel y el rewrite no captura `/api/`. Verificado en producción (deploy `0ac9169`, 2026-10-27): `GET /api/health` → 200 `storage: "database"`, `POST /api/quotes` → 400 con los mensajes Zod de `src/lib/cotizador/schema.ts`, `GET /api/admin/quotes` sin token → 401
- [ ] 3.7 Confirmar el límite de Functions por deploy en Hobby (hoy se despliegan 3 sin problemas)

## 4. Verificación
- [x] 4.1 `npx prisma validate` y `npm run build` pasan
- [x] 4.2 `dist/` sin secretos (`grep neon.tech|postgres://` vacío)
- [ ] 4.3 `npx prisma migrate status` contra `dev`
