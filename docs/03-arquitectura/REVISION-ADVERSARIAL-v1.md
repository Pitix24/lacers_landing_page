# Revisión adversarial — TECH-DESIGN-v1 y ADRs 0001–0011

**Fecha:** 2026-10-26 · **Skill:** `revision-adversarial` · **Objeto:**
[TECH-DESIGN-v1.md](TECH-DESIGN-v1.md) y `adrs/0001`–`0011` · **Cruzado con:** PRD, DESIGN.md,
CLAUDE.md, `CotizadorTecnico.tsx`, `landingData.ts`, `vercel.json`, `package.json`, `tsconfig.json`.

**Condición de la revisión:** la corrió un subagente con contexto limpio, que no participó en la
generación del diseño (como pide la skill para evitar sesgo de autopreferencia). La revisión no
editó archivos. Las correcciones las aplicó después el agente principal, y quedan registradas en
la columna "Resolución" y en el "Historial" de cada ADR.

Los datos de plataforma que el revisor no pudo confirmar contra documentación vigente quedaron
marcados como **[verificar]** y pasaron a la lista de verificaciones de la spike (TECH-DESIGN.md).

## Crítico

| # | Objeto | Problema | Resolución |
|---|---|---|---|
| C1 | ADR-0003, 0007 | `"type": "module"` + `@vercel/node` exigen imports relativos con extensión `.js`; el alias `@/` no se resuelve en Functions; `tsconfig` no chequea `api/`/`server/` y `moduleResolution: bundler` oculta el error → 500 en producción con build verde. | ADR-0003: reglas de imports, `tsconfig.api.json` en el build, `catalog.ts` separado, spike de plataforma como primer ítem. |
| C2 | ADR-0001 | El plan Hobby es de uso no comercial; LACERS es una S.R.L. | ADR-0001: consecuencia explícita + disparador de migración a Pro; riesgo en el TDD. |
| C3 | ADR-0010, 0004, 0009 | Rate limit "contar y después insertar" con carrera bajo concurrencia, no cuenta intentos inválidos y bloquea replays legítimos; ADR-0004 negaba transacciones no interactivas del driver. | ADR-0010: upsert atómico en `rate_limits`, se cuenta cada intento, replay antes del límite. ADR-0004 corregido. |
| C4 | ADR-0009 | Reusar la clave con un payload editado devolvía la fila original y mostraba éxito: se perdían las correcciones en silencio. | ADR-0009: `payload_hash`, 409 `IDEMPOTENCY_KEY_REUSED`, clave generada al enviar y rotada al editar. |
| C5 | TDD, ADR-0008 | El PRD exige 401/redirect en `/admin`, pero la SPA estática devuelve 200; el TDD reescribía el criterio sin declararlo. | Nuevo ADR-0012: Routing Middleware con 302 + `React.lazy`. |

## Advertencia

| # | Objeto | Problema | Resolución |
|---|---|---|---|
| A1 | ADR-0007 | Una pestaña abierta antes de un deploy persiste valores distintos a los vistos; `calc_version` manual; redondeo JS ≠ `numeric`. | `calc_version` por hash de reglas; redondeo único; la confirmación muestra los valores del servidor; aviso `calcVersionChanged`. |
| A2 | ADR-0005, 0007 | Tres fuentes de polímeros con ids (`caucho`/`rubber`) y valores distintos; EVA expande. | `POLYMERS` único en `catalog.ts` antes de la primera migración; EVA se marca provisoria. |
| A3 | ADR-0005 | `project_code` no único y usa 7075 cuando no hay aleación; tallas no enteras; umbral de caso especial incompleto; 6061 sin id. | `public_code` con folio, token `VRF`, tallas enteras 15–50, `pairs` calculado en servidor + CHECK, `special_reasons`, id `6061-t6`. |
| A4 | TDD, ADR-0006 | Estados sin vuelta atrás, "cerrada" ambigua, 404 vs 409 indistinguibles, PATCH no idempotente. | Tabla de transiciones con reapertura, semántica de `cerrada` (REVISAR), PATCH idempotente, `SELECT` para 404/409. |
| A5 | ADR-0008 | Login sin límite de intentos; enumeración por tiempos; firma comparada sin tiempo constante. | Rate limit de login, scrypt de relleno, comparación en tiempo constante, `__Host-`. |
| A6 | ADR-0008 | SameSite=Strict sin chequeo de Origin. | Origin + `Content-Type: application/json` en mutaciones; `Cache-Control: no-store`. |
| A7 | ADR-0010 | El honeypot con "201 falso" puede descartar envíos legítimos. | Se persiste con `is_spam = true`, folio real, oculto por defecto. |
| A8 | ADR-0002, 0004 | Ramas Neon por preview copian datos personales; migraciones manuales sin orden; URL pooled para DDL. | Ramas fijas `main`/`dev` sin PII, URLs pooled/unpooled, orden migrar → deploy, expand/contract. |
| A9 | ADR-0005 | El alta de admin exige la URL de producción en la máquina local. | Script que genera el hash por prompt sin eco y se inserta por el SQL Editor de Neon. |
| A10 | ADR-0005, TDD | Datos personales sin aviso, sin retención; `ip_hash` es seudónimo. | Nuevo ADR-0013: aviso + checkbox, `ip_hash` a 24 h, anonimización a los 12 meses por cron. |
| A11 | TDD | Faltaba la estrategia de desarrollo local y de testing. | Sección "Desarrollo local y testing" en el TDD. |
| A12 | ADR-0011 | Logs de Hobby con retención corta, sin alertas, plazos de respuesta inconsistentes en el copy. | `/api/health` + monitor externo, SLA explícito, plazo de copy a unificar (REVISAR). |

## Sugerencia

| # | Problema | Resolución |
|---|---|---|
| S1 | Parseo manual de `x-forwarded-for`, IPv6 rotando direcciones. | `ipAddress()` de `@vercel/functions`, agrupar IPv6 por /64, bucket `unknown`. |
| S2 | El riesgo de filtrar secretos estaba mal planteado. | Regla "ningún secreto con prefijo `VITE_`" + grep del bundle. |
| S3 | Cold starts multiplicados por cantidad de Functions; región. | Costo aceptado en ADR-0006; misma región Function/Neon en ADR-0001. |
| S4 | Las respuestas no se validaban; faltaban 405/413. | Esquemas Zod de respuesta; 405/413 en el contrato. |
| S5 | El borrador no se validaba al rehidratar; recargar tras el éxito perdía el código. | Validación al rehidratar + `lacers.cotizador.last.v1`. |
| S6 | El folio secuencial revela volumen. | Aceptado y documentado en ADR-0005. |
| S7 | Sesión no revocable; faltaba `frame-ancestors`. | `SESSION_NOT_BEFORE`; CSP `frame-ancestors 'none'` en el TDD. |
| S8 | Higiene documental: punteros al diseño viejo de la raíz. | El TDD final declara reemplazados los documentos de la raíz; los enlaces del PRD y de CLAUDE.md quedan como acción pendiente. |
| S9 | Rewrite de `vercel.json`. | Se mantiene `/((?!api/).*)`; el criterio del preview lo verifica. |

## ADRs que resistieron

0002 (salvo ramas/PII), 0004 (salvo el error sobre transacciones), 0006 (ajustes menores), la
concurrencia de 0009 (índice único) y la decisión de 0011 de no reintentar automáticamente ni
usar una cola local.
