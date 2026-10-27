# Testing E2E — LACERS CNC

Pruebas End-to-End con [Playwright](https://playwright.dev) sobre la SPA real (Vite + React Router) y la
API de `api/` servida por el plugin de `vite.config.ts`. El objetivo es una red de seguridad mínima
sobre los flujos críticos, no un plan de QA exhaustivo.

## Cómo correrlas

```bash
npm install                      # incluye @playwright/test
npx playwright install chromium  # una vez por máquina
npx playwright test              # suite completa (~15 s)
npx playwright test tests/cotizador-tecnico.spec.ts   # un solo spec
npx playwright show-trace test-results/<carpeta>/trace.zip   # depurar un fallo
```

> **Windows + WSL:** `node_modules` se instala desde Windows (binarios `@esbuild/win32-x64`), así que
> Playwright se corre con el Node de Windows (PowerShell o la terminal de VS Code), no desde WSL.

## Configuración (`playwright.config.ts`)

| Opción | Valor | Por qué |
| --- | --- | --- |
| `projects` | solo `chromium` (Desktop Chrome, 1280×720) | Navegador del público objetivo; el viewport ≥ `lg` muestra los links del navbar. |
| `baseURL` | `http://localhost:5173` | Puerto por defecto de `npm run dev` (Vite). |
| `webServer.command` | `npm run dev -- --port 5173 --strictPort` | Comando real del proyecto; `--strictPort` evita que Vite salte a otro puerto en silencio. |
| `webServer.reuseExistingServer` | `true` fuera de CI | Reutiliza un `npm run dev` ya abierto. |
| `webServer.env` | `DATABASE_URL: ''` | Vite prioriza `process.env` sobre `.env.local`: la API queda en modo memoria. |
| `globalSetup` | `tests/global-setup.ts` | Aborta la corrida si `/api/health` no responde `storage: "memory"`. |
| `trace` / `screenshot` | solo en fallos | Evidencia en `test-results/` (ignorado en git). |

### Datos y base de datos

El flujo de punta a punta hace `POST /api/quotes` de verdad (sin mocks), así que **nunca debe tocar
Neon**. Dos barreras lo garantizan: `DATABASE_URL` vacía en el server que levanta Playwright y el guard de
`global-setup.ts` para el caso en que se reutilice un `npm run dev` ya abierto con la base configurada.
En modo memoria cada envío genera un folio nuevo y una `Idempotency-Key` aleatoria, así que la suite se
puede repetir sin colisiones.

## Suites

| Archivo | Cubre |
| --- | --- |
| `tests/cotizador-tecnico.spec.ts` | Flujo crítico: pasos 01→04 del wizard (proceso, polímero, geometría, curva de tallas, contacto, privacidad), envío y ficha de confirmación con código `REQ-7075-MC05-NNNNNN`, link de WhatsApp y estado "solicitud registrada" en el sidebar. |
| `tests/cotizador-errores.spec.ts` | Validaciones: envío bloqueado sin pasos 01/02, curva de tallas invertida o vacía, nombre corto, falta de email/teléfono, privacidad sin aceptar y error de campo devuelto por la API (400). Navegación SPA: Home ↔ Cotizador sin recarga, ancla del navbar desde `/cotizador-tecnico` y scroll al tope al cambiar de vista. |
| `tests/catalogo-telemetria.spec.ts` | `CncTelemetryCard` (viewport, render, lecturas y coordenadas X/Y/Z que varían en vivo dentro del jitter), secciones técnicas (`#servicios`, `#materiales-y-contracciones`, `#galeria-cnc`, `#proceso`) y CTAs (Hero, catálogo, WhatsApp, banner "COTIZAR"). |

## Convenciones

- **Locators como los ve una persona:** `getByRole`, `getByLabel`, `getByText`. Nada de clases CSS ni
  XPath (los íconos `MaterialIcon` son `aria-hidden` y no ensucian los nombres accesibles).
- **El catálogo se importa de `src/data/landingData.ts`**, igual que en los componentes: si cambia un
  texto o se agrega una aleación/proceso, los tests siguen la fuente de verdad en vez de duplicarla.
- **Sin esperas manuales** (`waitForTimeout`, `networkidle`): solo aserciones web-first y `expect.poll`.
- **Cada test termina en un resultado visible** (texto, URL, atributo o posición en el viewport).
- **Un test rojo no se silencia:** no se ablandan aserciones, ni `test.skip`/`fixme`, ni reintentos o
  timeouts extra para esconder un fallo. Se diagnostica (bug de la app, test desactualizado o entorno)
  y se decide qué corregir.

## Verificación de que los tests pueden fallar

Con la suite en verde se rompió temporalmente la app (`setFichaOpen(false)` al registrar la solicitud
en `CotizadorTecnico.tsx`) y `cotizador-tecnico.spec.ts` falló en `getByText('// Solicitud registrada')`,
que es lo esperado. Después se revirtió el cambio.

## Estado actual

| Fecha | Resultado | Nota |
| --- | --- | --- |
| 2026-10-26 | 17/18 en verde | Falla `cotizador-errores › muestra el error de campo que devuelve la API ante un email inválido`: la API responde `"contact.email": "Invalid email address"` (mensaje por defecto de Zod, en inglés) en vez del `'Email inválido.'` declarado en `src/lib/cotizador/schema.ts`. Es un bug de la app: el `{ error }` de `z.union` no se aplica cuando falla la rama `z.email()`. |
