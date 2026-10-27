# Backlog: Landing Page Lacers — Matricería con Cotizador Técnico

| # | Item | Alcance | Depende de | Contexto extra requerido |
|---|---|---|---|---|
| 1 | Esquema DB + conexión Neon/Drizzle | Definir schema Drizzle (`materials`, `processes`, `pricing_formula`, `quotes`, `admin_users`), migraciones, conexión desde Vercel Functions | — | — |
| 2 | Landing — Presentación/Hero | Adaptar `Hero.tsx` existente a la versión final de contenido/copy | — | — |
| 3 | Landing — Servicios | Sección de servicios ofrecidos por Lacers | — | — |
| 4 | Landing — Portfolio de trabajos | Galería de trabajos ya realizados (candidato: adaptar `MachiningGallery.tsx` existente) | — | — |
| 5 | Landing — Contacto | Sección de contacto institucional (no confundir con el Cotizador) | — | — |
| 6 | Autenticación admin | `POST /api/admin/login` (bcrypt + JWT), middleware de verificación de JWT en cookie httpOnly para rutas `/api/admin/*` | #1 | — |
| 7 | Endpoint público de reglas de precio | `GET /api/pricing-rules` — expone materials/processes/pricing_formula vigentes | #1 | — |
| 8 | Motor de cálculo del Cotizador | Lógica pura: rango de precio/tiempo a partir de inputs + reglas, detección de `is_edge_case` por rango de dimensiones | #7 | **Sí** — fórmula real de pricing (multiplicadores por material/proceso, factores de tolerancia/plazo, rangos "razonables" de dimensión). Confirmado: todavía no existe esta documentación — resolver en discovery de negocio antes de generar la spec de este ítem |
| 9 | Panel admin de precios | UI protegida + `GET/PUT /api/admin/materials`, `/processes`, `/pricing-formula` | #6, #7 | — |
| 10 | UI del Cotizador (wizard end-to-end) | Formulario multi-step, localStorage, resultado, alerta caso especial, botones mailto/WhatsApp — adapta `CotizadorTecnico.tsx` existente | #8 | — |
| 11 | Persistencia de cotizaciones | `POST /api/quotes` no bloqueante, logging de fallo sin romper UI | #1, #10 | — |
| 12 | Resiliencia — snapshot de fallback | Snapshot estático embebido en build + proceso de regeneración, fallback en frontend si `pricing-rules` falla | #7, #8 | — |

## Cómo usar este backlog

Cada ítem es una spec independiente. Al implementarlo, arrancá un ciclo de Spec-Driven
Development (`sdd-new` o el flujo equivalente de tu harness) usando este ítem como el
"change" — no el proyecto completo. Si la columna "Contexto extra requerido" tiene algo,
compartilo como contexto al generar la spec de ese ítem.

**Nota sobre el ítem 8:** no se puede especificar en serio sin la fórmula/reglas de pricing
real de Lacers. Si se necesita avanzar en paralelo, los ítems 1-7 y 9-12 (estructura, sin
valores de fórmula reales) no dependen de resolver esto primero.
