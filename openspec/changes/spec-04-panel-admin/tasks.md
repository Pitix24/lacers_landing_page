# Tasks — spec-04-panel-admin

## 4a. Autenticación
- [x] 1. Auth provisoria: `requireAdmin` con `ADMIN_TOKEN` (≥ 24 caracteres, comparación en tiempo constante); 503 si no está configurado
- [ ] 2. `server/session.ts` con Web Crypto, cookie `__Host-lacers_admin`, `SESSION_NOT_BEFORE` (ADR-0008)
- [ ] 3. scrypt + `admin_users` + `npm run admin:create`
- [ ] 4. `login` / `logout` / `session` + rate limit de login
- [ ] 5. `middleware.ts` con 302 a `/admin/login?next=` (ADR-0012)

## 4b. Gestión de cotizaciones
- [x] 6. `GET /api/admin/quotes?status=&q=&spam=` (máx. 100, orden por fecha desc, `no-store`)
- [x] 7. `/admin` en chunk lazy: token en `sessionStorage`, filtro por estado, búsqueda por código/folio, spam opcional, estado vacío, badges por estado
- [ ] 8. Paginación por `cursor`
- [ ] 9. `GET/PATCH /api/admin/quotes/[id]` con máquina de estados (404/409/200 idempotente)
- [ ] 10. Detalle y cambio de estado en ≤ 2 clics — **bloqueado:** confirmar semántica de `cerrada` / `descartada`

## Verificación
- [x] 11. `npm run build` pasa; chunk `AdminPage` separado (~9 kB)
- [ ] 12. Test HTTP del 302 del middleware
