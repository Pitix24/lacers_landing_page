# Security Pass — LACERS CNC

Fecha: 2026-10-26
Alcance revisado:

- **Producto:** `docs/01-producto/PRD.md` (requisitos de seguridad, casos borde, riesgos).
- **Arquitectura:** `docs/03-arquitectura/TECH-DESIGN.md` y ADRs 0006, 0008, 0009, 0010, 0012, 0013, 0014.
- **Specs/tareas:** `openspec/changes/spec-02-api-cotizaciones` y `spec-04-panel-admin` (`tasks.md`).
- **Código:** `api/` (3 Functions), `server/` (`http.ts`, `neon.ts`, `quotes-repo.ts`), `src/lib/cotizador/`
  (Zod, contrato, cliente), `src/pages/AdminPage.tsx`, `src/App.tsx`, `vite.config.ts`, `prisma/`.
- **Configuración:** `vercel.json`, `.env.example`, `.gitignore`, `prisma.config.ts`, `package.json` + `npm audit`.
- **Tests:** `tests/*.spec.ts`, `playwright.config.ts`, `tests/global-setup.ts`.
- **Omitido:** CI/CD (no hay pipelines en el repo) y el estado real del deploy en Vercel/Neon
  (`docs/09-deploy/` está vacío; no hay Vercel CLI). `.env.local` no se leyó (lo bloquea una regla de
  permisos); sí se verificó que está ignorado por git y que ningún `.env*` aparece en el historial.

## Modelo del sistema (discovery)

| Elemento | Detalle |
| --- | --- |
| Qué hace | Landing de matricería CNC + wizard público `/cotizador-tecnico` que registra solicitudes; panel `/admin` para que el ingeniero las lea. |
| Actores | Visitante anónimo (público, potencialmente bot/spammer), admin único (ingeniero), plataforma (Vercel/Neon). |
| Datos sensibles | PII de contacto (nombre, empresa, email, teléfono, nota libre) — Ley 25.326; `DATABASE_URL`, `ADMIN_TOKEN`. |
| Superficie pública | `POST /api/quotes` (escritura anónima en Neon), `GET /api/health`, SPA estática (incluye el chunk de `/admin`). |
| Superficie privada | `GET /api/admin/quotes` (devuelve PII). |
| Frontera de confianza | Navegador ↔ Functions de `api/`: todo lo que llega del cliente se revalida con Zod en servidor; el cálculo (`pairs`, `projectCode`, contracción) se hace en servidor. |
| Operaciones sensibles | Alta anónima (spam / agotamiento de la base), lectura de PII desde admin. |

## Resumen ejecutivo

El backend está bien encaminado: validación Zod compartida en el servidor, consultas solo por Prisma (sin
SQL concatenado), secretos únicamente del lado servidor, idempotencia correcta y una comparación del token
de admin en tiempo constante. **El único hallazgo HIGH** era que `POST /api/quotes` no tenía rate limit
(requisito explícito del PRD y de ADR-0010): cualquiera podía llenar la base de Neon con un script. **Ya está
corregido en el código** (SEC-01), pero falta aplicar la migración en Neon antes de que haga efecto en un
deploy. Lo que sigue en importancia es de severidad media: faltan las cabeceras de seguridad en
`vercel.json` (SEC-02), la autenticación de `/admin` todavía es la provisoria con token estático (SEC-03,
planificada en spec-04) y no existe la anonimización/retención de PII (SEC-04, plazos sin decidir).
No se encontraron hallazgos CRITICAL.

## Fortalezas de seguridad

- **Validación en servidor con el mismo schema que el cliente** (`src/lib/cotizador/schema.ts`): ids de
  catálogo con `z.enum`, tallas acotadas 15–50, longitudes máximas en todos los textos, email/teléfono con
  formato, `privacyAccepted: z.literal(true)`. Campos derivados (`pairs`, `shrinkagePct`, `projectCode`)
  **nunca** se aceptan del cliente.
- **Sin inyección SQL:** todo el acceso pasa por Prisma con consultas parametrizadas; la búsqueda del admin
  se recorta a 64 caracteres y el folio se valida como entero acotado (`server/quotes-repo.ts:122-141`).
- **Límite de cuerpo de 16 kB** con 413 y JSON inválido → 400 (`server/http.ts:19-29`).
- **Idempotencia** con `Idempotency-Key` UUID obligatoria, hash canónico del payload y `UNIQUE` en base:
  no hay doble alta ni filtración del payload de otra solicitud (`api/quotes.ts`).
- **Token admin en tiempo constante** (sha256 + `timingSafeEqual`) y **fail-closed**: sin `ADMIN_TOKEN` o
  con menos de 24 caracteres responde 503, nunca deja pasar (`server/http.ts:52-64`).
- **Secretos fuera del bundle:** ninguna variable usa prefijo `VITE_`; `server/neon.ts` solo lo importan
  `api/` y `server/`. Verificado en `dist/`: no hay URLs de conexión ni tokens, solo textos de UI.
- **`.gitignore`** cubre `.env*` (con excepción explícita de `.env.example`) y `server/generated`;
  `.env.example` solo trae placeholders.
- **Fallback en memoria imposible en producción:** `isMemoryFallbackAllowed()` exige `NODE_ENV !==
  'production'` **y** `VERCEL !== '1'`; sin base en Vercel la API responde 503 (`server/neon.ts:17-19`).
- **PII fuera de respuestas públicas y logs:** `POST /api/quotes` devuelve solo código y estimación;
  `logEvent` no recibe datos de contacto; `/api/admin/quotes` responde con `Cache-Control: no-store` y
  quita `payloadHash`.
- **XSS:** React escapa todo; no hay `dangerouslySetInnerHTML`, `eval` ni `innerHTML` en `src/`. Los links
  externos (`wa.me`) usan `rel="noopener noreferrer"` y el texto va por `encodeURIComponent`.
- **CSRF no aplica hoy:** no hay cookies; el admin usa `Authorization: Bearer` y el POST público exige un
  header custom (`Idempotency-Key`) que fuerza preflight CORS, y no hay cabeceras CORS que lo habiliten.
- **Dependencias de producción:** `npm audit --omit=dev` → 0 vulnerabilidades.
- **Tests E2E aislados de Neon:** `DATABASE_URL: ''` en el webServer + guard de `global-setup.ts`.

## Findings

### HIGH

#### SEC-01 — `POST /api/quotes` sin rate limit (✅ corregido en código; falta migrar Neon)

- **Severity:** HIGH
- **Confidence:** MEDIUM (el código lo confirma; no se pudo confirmar si hoy hay un deploy público con `DATABASE_URL`)
- **Category:** Resource exhaustion / Business-logic abuse (OWASP A04 Insecure Design)
- **Affected artifact:** Código + spec
- **Location:** `api/quotes.ts` (antes: comentario "Pendiente de spec-02: rate limit por IP"); `openspec/changes/spec-02-api-cotizaciones/tasks.md` tarea 2.8 sin hacer.
- **Description:** El único endpoint de escritura anónima no tenía ningún límite por IP. El PRD lo exige
  ("límite de tasa básico por IP en el endpoint público") y lista el riesgo ("la tabla de cotizaciones puede
  llenarse de spam"). El honeypot no frena a un script que deja `website` vacío.
- **Evidence:** No existía tabla `rate_limits` en `prisma/schema.prisma` ni en la migración inicial, ni
  llamada a ningún limitador en el handler.
- **Attack scenario:** Un script genera un UUID nuevo por request y hace `POST /api/quotes` en bucle con un
  payload válido de ~1–16 kB. Cada request inserta una fila con `isSpam = false`.
- **Potential impact:** (1) Disponibilidad: agota el almacenamiento/compute del plan de Neon y las
  invocaciones de Vercel → cotizador y panel caídos. (2) Integridad del negocio: el listado admin (máx.
  100 filas, orden por fecha) queda enterrado en basura y se pierden leads reales. Justificación del HIGH:
  explotable sin autenticación, con un script trivial, sobre el flujo que es el objetivo del producto.
- **Existing mitigation:** Honeypot (solo bots ingenuos), body ≤ 16 kB, validación Zod.
- **Recommended remediation (aplicada):**
  - `server/rate-limit.ts`: contador de ventana fija en **un único upsert atómico** sobre `rate_limits`
    (exactamente el SQL de ADR-0010), 5 intentos / 10 min por IP, IPv6 agrupada por /64, bucket =
    `sha256(scope:IP:IP_HASH_SALT)` (la IP nunca se guarda en claro). Responde **429 +
    `Retry-After`** con mensaje en voseo.
  - `api/quotes.ts`: cuentan los intentos válidos **e inválidos** (400); los replays idempotentes (misma
    key + mismo payload) **no** consumen cupo, según ADR-0010.
  - `prisma/schema.prisma` + `prisma/migrations/20261027000000_rate_limits/migration.sql`.
  - `.env.example`: nueva variable `IP_HASH_SALT`.
  - Solo actúa con base configurada; en modo memoria (local/E2E) no limita.
- **Pendiente del humano:** correr `npm run db:migrate` contra `dev` y luego contra producción **antes** del
  deploy, y cargar `IP_HASH_SALT` en Vercel. Si la tabla falta, el limitador falla abierto (ver SEC-10)
  y lo registra como `ratelimit.error`: no rompe el alta, pero tampoco protege.
- **Suggested verification:** Contra la rama `dev`: 6 `POST` seguidos con keys distintas desde la misma IP
  → el 6.º responde 429 con `Retry-After`; repetir el 1.º (misma key y payload) → 200 sin consumir cupo.
  Agregar un test de integración contra `dev` (tarea 4.3 de spec-02).
- **Required change type:** CODE FIX

### MEDIUM

#### SEC-02 — `vercel.json` no define cabeceras de seguridad

- **Severity:** MEDIUM
- **Confidence:** HIGH
- **Category:** Security misconfiguration (OWASP A05)
- **Affected artifact:** Configuración
- **Location:** `vercel.json` (solo tiene `rewrites`).
- **Description:** No se envían `Content-Security-Policy`, `X-Frame-Options` / `frame-ancestors`,
  `X-Content-Type-Options`, `Referrer-Policy` ni `Permissions-Policy`. `/admin` tampoco lleva
  `X-Robots-Tag: noindex`. (Vercel ya agrega HSTS por defecto en sus dominios; confirmar en el dominio propio.)
- **Evidence:** `vercel.json:1-3`.
- **Attack scenario:** Sin CSP, cualquier XSS futuro (p. ej. un componente nuevo que renderice HTML) puede
  leer el token admin de `sessionStorage` y exfiltrarlo. Sin `frame-ancestors`, `/admin` y el wizard se pueden
  embeber en un sitio de terceros (clickjacking; hoy de bajo impacto porque el admin no tiene acciones de escritura).
- **Potential impact:** Amplifica cualquier XSS a robo de sesión admin → lectura de toda la PII.
  MEDIUM y no HIGH: hoy no se encontró ningún vector de XSS; es defensa en profundidad.
- **Existing mitigation:** React escapa por defecto; sin `dangerouslySetInnerHTML`.
- **Recommended remediation:** agregar en `vercel.json` un bloque `headers` para `/(.*)`:
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Frame-Options: DENY`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` y una CSP
  compatible con lo que carga la app hoy (scripts propios, Google Fonts):
  `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`.
  Publicarla primero como `Content-Security-Policy-Report-Only` en un preview. Para `/admin(.*)` sumar
  `X-Robots-Tag: noindex, nofollow` y `Cache-Control: no-store`.
- **Suggested verification:** `curl -I` sobre el preview: cabeceras presentes; recorrer landing, wizard y
  `/admin` sin violaciones de CSP en consola; test Playwright que lea `response.headers()`.
- **Required change type:** CODE FIX

#### SEC-03 — Auth provisoria de `/admin`: token estático compartido, sin expiración ni límite de intentos

- **Severity:** MEDIUM
- **Confidence:** HIGH
- **Category:** Identification & authentication failures / Broken access control (OWASP A07, A01)
- **Affected artifact:** Código + spec + PRD
- **Location:** `server/http.ts:52-64`, `src/pages/AdminPage.tsx:10,39,83`, `src/App.tsx:17-24`; tareas 2–5 y 12 de `spec-04-panel-admin` sin hacer.
- **Description:** El acceso a la PII depende de un único `ADMIN_TOKEN`: no expira, no se puede revocar sin
  redeploy, vive en `sessionStorage` (legible por JS) y `/api/admin/quotes` no tiene límite de intentos.
  `requireAdmin` solo valida longitud ≥ 24, no entropía (`"aaaa…"` pasa). `GET /admin` responde 200 con la
  SPA a cualquiera (la API sí devuelve 401), así que el criterio del PRD ("request a `/admin` sin sesión →
  401/redirección") no se cumple todavía.
- **Evidence:** Comentarios "Auth provisoria … hasta spec-04" en ambos archivos; `tasks.md` de spec-04.
- **Attack scenario:** El token se comparte por chat o queda en el historial del portapapeles → quien lo
  tenga lee toda la base de contactos indefinidamente. Fuerza bruta no es viable con un token aleatorio de
  ≥ 24 caracteres, pero sí con uno elegido a mano.
- **Potential impact:** Exposición de toda la PII. MEDIUM: el control existe, es correcto en tiempo
  constante y falla cerrado; el riesgo está en el ciclo de vida del secreto, no en un bypass.
- **Existing mitigation:** Comparación constante, 503 sin configurar, `no-store`, chunk lazy.
- **Recommended remediation:** Implementar spec-04 tal como ADR-0008/0012 (cookie `__Host-` HttpOnly
  firmada con expiración de 8 h, scrypt, rate limit de login reutilizando `server/rate-limit.ts`,
  middleware con 302). Mientras tanto: generar el token con el comando de `.env.example` y rotarlo si se compartió.
- **Suggested verification:** Tarea 12 de spec-04 (test HTTP del 302) + tests de cookie alterada/expirada.
- **Required change type:** CODE FIX (ya especificado en spec-04)

#### SEC-04 — PII sin retención ni anonimización

- **Severity:** MEDIUM
- **Confidence:** HIGH
- **Category:** Privacy / data protection (Ley 25.326)
- **Affected artifact:** Código + ADR + PRD
- **Location:** ADR-0013 (estado "Propuesto — REVISAR"); tarea 3.2 de spec-02 (`/api/cron/retention`) sin hacer; `anonymizedAt` existe en el schema pero nada lo escribe.
- **Description:** Nombre, empresa, email, teléfono y nota libre se guardan sin plazo. La nueva tabla
  `rate_limits` (SEC-01) tampoco se purga todavía.
- **Attack scenario:** Ante un acceso indebido a la base (credencial filtrada, SEC-03), el volumen de PII
  expuesta crece sin tope con el tiempo.
- **Potential impact:** Exposición regulatoria y mayor daño ante un incidente.
- **Existing mitigation:** Consentimiento con `privacyAcceptedAt`; PII fuera de logs y respuestas públicas.
- **Recommended remediation:** Decidir los plazos (ADR-0013 sugiere 12 meses tras `cerrada`/`descartada` y
  24 h para `rate_limits`) e implementar el cron con `CRON_SECRET`.
- **Suggested verification:** Test del cron con una fila vieja → `contact_*` y `note` en NULL y `anonymized_at` seteado.
- **Required change type:** PRODUCT / REQUIREMENT CHANGE (los plazos y el encuadre legal son decisión de negocio; después, CODE FIX)

### LOW

#### SEC-05 — Los logs de error incluían `err.message` de Prisma (✅ corregido en `POST /api/quotes`)

- **Severity:** LOW · **Confidence:** MEDIUM · **Category:** Sensitive data in logs (OWASP A09)
- **Location:** `api/quotes.ts` (catch final); igual patrón en `api/admin/quotes.ts:36`.
- **Description:** Los errores de Prisma pueden incluir la invocación con sus argumentos; en el alta, esos
  argumentos son datos de contacto, lo que contradice "logging sin PII" (ADR-0013). En el endpoint admin los
  argumentos solo son filtros (estado/código), sin PII.
- **Remediation:** Aplicada en `api/quotes.ts`: se loguea solo `err.code` / `err.name`. Recomendado igualar
  `api/admin/quotes.ts` por consistencia.
- **Verification:** Forzar un error de base en `dev` y revisar el log de la Function.
- **Required change type:** CODE FIX

#### SEC-06 — Vulnerabilidades en dependencias de desarrollo

- **Severity:** LOW · **Confidence:** HIGH · **Category:** Vulnerable components (OWASP A06)
- **Evidence:** `npm audit`: `esbuild ≤ 0.24.2` vía `vite 5` (GHSA-67mh-4wv8-2f99: otro sitio puede leer las
  respuestas del dev server), `source-map-js 1.2.1` (DoS, marcada high por npm), `postcss-selector-parser`
  (DoS). `--omit=dev` → 0.
- **Description:** Nada de esto llega a producción. El caso de esbuild es el único con algo de impacto: con
  `npm run dev` abierto y `.env.local` con `DATABASE_URL`, una web maliciosa podría usar el dev server para
  dar altas en la rama `dev` de Neon. Por eso queda en LOW pese a la etiqueta "high" de npm.
- **Remediation:** `npm audit fix` (sin cambios mayores) para `source-map-js`/`postcss-selector-parser`;
  planificar Vite ≥ 6.4 (mayor) para esbuild.
- **Required change type:** CODE FIX

#### SEC-07 — `readJsonBody` lee el cuerpo entero antes de medirlo

- **Severity:** LOW · **Confidence:** HIGH · **Category:** Resource exhaustion
- **Location:** `server/http.ts:20-23`.
- **Description:** `request.text()` carga todo el cuerpo y recién después compara contra 16 kB; no mira
  `Content-Length`. El tope real lo pone Vercel (4,5 MB por request), así que el impacto es acotado.
- **Remediation:** Rechazar antes si `Content-Length` > 16 kB, o leer el stream con corte.
- **Required change type:** CODE FIX

#### SEC-08 — Sin tests de los controles de seguridad

- **Severity:** LOW · **Confidence:** HIGH · **Category:** Missing security tests
- **Location:** `tests/` (solo flujos de UI); tarea 4.3 de spec-02 sin hacer.
- **Description:** No hay tests de: `GET /api/admin/quotes` sin token o con token incorrecto → 401; body > 16 kB
  → 413; `Idempotency-Key` ausente → 400; replay → 200 y key reutilizada → 409; honeypot → `isSpam`; 429 del
  rate limit (este último necesita la rama `dev`, porque en memoria no limita).
- **Remediation:** Agregar un spec Playwright de API (`request.post/get`) para los casos que corren en
  memoria y un test de integración contra `dev` para el 429.
- **Required change type:** TEST FIX

### INFO

#### SEC-09 — Test E2E fallando por el mensaje de error de email (no es de seguridad, ya existía)

- **Location:** `src/lib/cotizador/schema.ts:41-44`; `tests/cotizador-errores.spec.ts:86`.
- **Evidence:** Aislando el schema (sin pasar por el handler), `safeParse` con `email: 'no-es-un-email'`
  devuelve `"Invalid email address"`: Zod 4.6 muestra el mensaje del `z.email()` interno y no el `error`
  del `union`. El test espera `"Email inválido."`. No lo causó este pase (el schema no se tocó).
- **Remediation:** Pasar el mensaje al validador interno: `z.email({ error: 'Email inválido.' })`.
- **Required change type:** CODE FIX (funcional)

#### SEC-10 — El rate limit falla abierto si la base no responde

- **Location:** `server/rate-limit.ts` (catch de `hitRateLimit`).
- **Description:** Si el upsert falla (por ejemplo, migración no aplicada o un error puntual de Neon), la
  request sigue y se loguea `ratelimit.error`. ADR-0010 no define este caso. Se eligió fallar abierto para
  no perder leads legítimos; la alternativa (429/503) prioriza la protección sobre la conversión.
  Detrás de una IP compartida (oficina, CGNAT), varios clientes comparten el cupo de 5 cada 10 min, y en Vercel la IP sale de
  `x-real-ip`/`x-forwarded-for` que escribe la plataforma (fuera de Vercel esas cabeceras serían falsificables).
- **Required change type:** ACCEPT RISK

## Prioridad

1. **SEC-01 (despliegue):** aplicar la migración `20261027000000_rate_limits` en `dev` y producción y cargar
   `IP_HASH_SALT` **antes** del próximo deploy; si no, el rate limit no tiene efecto.
2. **SEC-02:** cabeceras en `vercel.json`. Es barato y reduce el impacto de SEC-03 mientras siga el token en `sessionStorage`.
3. **SEC-03:** spec-04 (sesión con cookie HttpOnly + middleware). Reutiliza `server/rate-limit.ts` para el login.
4. **SEC-04:** decisión de plazos y cron de retención (también purga `rate_limits`).
5. **SEC-08:** tests de los controles (cubren SEC-01 y SEC-03).
6. **SEC-05 / SEC-06 / SEC-07 / SEC-09:** ajustes chicos, se pueden hacer juntos.

## Gobernanza / Decisión requerida

- **SEC-04 — PRODUCT / REQUIREMENT CHANGE:** el plazo de retención (12 meses sugerido) y el encuadre legal
  (aviso, inscripción ante la AAIP) son decisiones de negocio/legales; ADR-0013 sigue en "REVISAR".
- **SEC-10 — ACCEPT RISK:** confirmar si se acepta que el rate limit falle abierto ante un error de base y
  que las IP compartidas compartan cupo, o si se prefiere fallar cerrado. Si se acepta, registrarlo en ADR-0010.
- **ADRs 0008, 0010 y 0012** siguen en estado "Propuesto/REVISAR". SEC-01 implementó ADR-0010 tal como
  está escrito y SEC-03 depende de 0008/0012: conviene que el responsable los pase a "Aceptado" o los ajuste.

## Cambios aplicados en este pase

| Archivo | Cambio |
| --- | --- |
| `server/rate-limit.ts` (nuevo) | Rate limit atómico por IP (ADR-0010). |
| `api/quotes.ts` | 429 + `Retry-After`; cuentan los intentos inválidos; los replays no consumen cupo; log de error sin `err.message`. |
| `prisma/schema.prisma`, `prisma/migrations/20261027000000_rate_limits/` | Tabla `rate_limits`. **Sin aplicar en Neon.** |
| `.env.example` | `IP_HASH_SALT`. |
| `openspec/changes/spec-02-api-cotizaciones/tasks.md` | 2.8 marcada (pendiente: `ip_hash` + purga). |

Verificación: `npm run lint` y `npm run build` pasan; `ipPrefix`/`clientIp` probados con IPv4, IPv4-mapped,
IPv6 completa, comprimida y con zona; `npx playwright test` → **17 pasan, 1 falla** (SEC-09: ya fallaba
antes y no está relacionado con estos cambios).
