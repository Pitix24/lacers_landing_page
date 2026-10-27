# Technical Design Document: Landing Page Lacers — Matricería con Cotizador Técnico

**Tipo de proyecto:** Greenfield (el código existente en el repo era únicamente una demo de
landing, sin backend ni persistencia — se trata como base de arranque, no como restricción
heredada).
**Design.md disponible:** No — el modelo de datos y los flujos se derivaron solo del PRD.

## Resumen

Se construye una landing institucional con un Cotizador Técnico interactivo que calcula un
rango de precio y tiempo estimado a partir de dimensiones, material, tolerancia, cantidad,
proceso y plazo deseado. A diferencia del PRD original (100% frontend), el alcance se amplió
para incluir persistencia de cotizaciones y un panel admin de precios con login, sobre
PostgreSQL en Neon, desplegado en Vercel free tier usando Vercel Serverless Functions en el
mismo repo. El canal oficial de envío de la cotización sigue siendo un mailto compuesto en el
cliente; WhatsApp queda como contacto general sin datos técnicos.

## Arquitectura de componentes

Monorepo único desplegado en Vercel:

- **Frontend** (`src/`) — SPA existente en Vite + React + TypeScript + Tailwind + React
  Router. Sin cambios de framework. Se le agrega: fetch de reglas de precio, llamada de
  persistencia de cotización, y las vistas del panel admin (login + edición de precios).
- **API** (`api/`, nuevo) — Vercel Serverless Functions (Node.js) que exponen los endpoints
  REST de [ADR-0006](adrs/0006-contratos-de-api.md). Es la única capa que habla con Neon.
- **Base de datos** — PostgreSQL en Neon, accedida vía Drizzle ORM sobre
  `@neondatabase/serverless` ([ADR-0007](adrs/0007-stack-backend-cliente-de-base-de-datos.md)).

```
Cliente (browser)
   │
   ├─ GET /api/pricing-rules ──┐
   ├─ POST /api/quotes         │
   │                           ▼
   │                    Vercel Functions (api/)
   │                           │  Drizzle ORM
   │                           ▼
   │                    PostgreSQL (Neon)
   │
   ├─ POST /api/admin/login ───┤ (JWT en cookie httpOnly)
   └─ GET/PUT /api/admin/* ────┘ (requiere JWT)
```

**Manejo de estado** (derivado, sin ADR propio — no hubo decisión real a tomar): el progreso
del formulario del cotizador sigue viviendo en `localStorage` del cliente (comportamiento ya
definido en el PRD, sin cambios). Las reglas de precio vigentes se piden en vivo en cada
cálculo ([ADR-0004](adrs/0004-fuente-de-reglas-de-precio.md)). La sesión de admin vive en una
cookie httpOnly con JWT ([ADR-0008](adrs/0008-autenticacion-admin.md)). No hay estado
compartido entre pestañas/sesiones de clientes — cada cotización es independiente.

## Decisiones de arquitectura

| # | Decisión | Estado |
|---|---|---|
| [ADR-0001](adrs/0001-plataforma-de-despliegue.md) | Plataforma de despliegue: Vercel (free tier) | Aceptado |
| [ADR-0002](adrs/0002-motor-de-base-de-datos.md) | Motor de base de datos: PostgreSQL en Neon | Aceptado |
| [ADR-0003](adrs/0003-componentes-y-repos.md) | Componentes: monorepo + Vercel Functions | Aceptado |
| [ADR-0004](adrs/0004-fuente-de-reglas-de-precio.md) | Fuente de reglas de precio en runtime: fetch en vivo | Aceptado |
| [ADR-0005](adrs/0005-modelo-de-datos.md) | Modelo de datos: relacional normalizado | Aceptado |
| [ADR-0006](adrs/0006-contratos-de-api.md) | Contratos de API: REST simple | Aceptado |
| [ADR-0007](adrs/0007-stack-backend-cliente-de-base-de-datos.md) | Cliente de DB: Drizzle ORM | Aceptado |
| [ADR-0008](adrs/0008-autenticacion-admin.md) | Autenticación admin: JWT propio + bcrypt | Aceptado |
| [ADR-0009](adrs/0009-resiliencia-y-manejo-de-errores.md) | Resiliencia: fallback estático + no bloquear mailto | Aceptado |

## Modelo de datos

Ver [ADR-0005](adrs/0005-modelo-de-datos.md) para el detalle completo. Entidades principales:

- **`materials`** (`id`, `name`, `price_multiplier`, `active`)
- **`processes`** (`id`, `name`, `price_multiplier`, `time_multiplier`, `active`)
- **`pricing_formula`** (fila única de configuración: `base_price_per_volume_unit`,
  `base_time_per_volume_unit`, `tolerance_tight_multiplier`, `rush_lead_time_multiplier`,
  `updated_at`)
- **`quotes`** (`id`, `created_at`, `length_mm`, `width_mm`, `height_mm`, `material_id` FK,
  `process_id` FK, `tolerance_level`, `quantity`, `desired_lead_time_days`,
  `estimated_price_min`, `estimated_price_max`, `estimated_time_min_days`,
  `estimated_time_max_days`, `is_edge_case`)
- **`admin_users`** (`id`, `email`, `password_hash`, `created_at`)

Relaciones: `quotes.material_id → materials.id`, `quotes.process_id → processes.id`.
`pricing_formula` no tiene relaciones (fila de configuración global).

## Criterios de aceptación por flujo

### Flujo de cotización (cliente)

- [ ] El formulario captura dimensiones, material, tolerancia, cantidad, proceso y plazo
      deseado.
- [ ] Al calcular, el frontend llama `GET /api/pricing-rules` primero.
- [ ] Si la llamada responde 200, el cálculo usa esas reglas; si falla (error/timeout), usa el
      snapshot estático embebido en el build y muestra el aviso "estimación aproximada, puede
      no reflejar el precio más reciente".
- [ ] El resultado muestra un rango de precio (mínimo–máximo) y un rango de tiempo estimado
      (mínimo–máximo).
- [ ] Si alguna dimensión cae fuera del rango razonable definido, se marca `is_edge_case=true`,
      se muestra alerta de "caso especial/complicado", y el envío NO se bloquea.
- [ ] El progreso del formulario se guarda en `localStorage` en cada paso y se recupera si el
      usuario recarga o vuelve antes de completar el flujo.
- [ ] Al confirmar, se dispara `POST /api/quotes` de forma no bloqueante (best-effort) y se
      genera en paralelo el link `mailto:` con asunto y cuerpo pre-armados con todos los datos
      técnicos.
- [ ] El botón de mailto queda habilitado y funcional incluso si `POST /api/quotes` falla.
- [ ] El botón de WhatsApp abre una conversación general, sin los datos técnicos de la
      cotización en el mensaje, y sin registrar nada en el sistema.

### Flujo de administración de precios

- [ ] `POST /api/admin/login` valida email+password contra `admin_users`; credenciales
      inválidas devuelven 401 genérico (no revela cuál campo fue incorrecto).
- [ ] Login exitoso setea una cookie `httpOnly` con JWT firmado y expiración definida.
- [ ] Toda ruta `/api/admin/*` rechaza (401/403) requests sin JWT válido o expirado.
- [ ] El panel admin lista `materials` y `processes` con su multiplicador, editable y
      guardable por fila.
- [ ] El panel admin permite editar los campos numéricos de `pricing_formula`.
- [ ] Un cambio guardado en el panel se refleja en el siguiente `GET /api/pricing-rules` sin
      necesidad de un nuevo deploy.

### Persistencia y trazabilidad de cotizaciones

- [ ] Toda cotización enviada exitosamente vía `POST /api/quotes` queda registrada en `quotes`
      con todos los campos técnicos completos.
- [ ] Un fallo en `POST /api/quotes` se registra en logs del servidor pero no genera ningún
      error visible ni bloqueante en la UI del cliente.

## Riesgos técnicos abiertos

- La tabla de precios (`materials`, `processes`, `pricing_formula`) no tiene valores/fórmula
  reales definidos todavía — sigue siendo la dependencia crítica antes de poder probar el
  cotizador end-to-end (heredado del PRD).
- El snapshot estático embebido (fallback de [ADR-0009](adrs/0009-resiliencia-y-manejo-de-errores.md))
  necesita un proceso para mantenerse razonablemente sincronizado con la DB — si no se
  actualiza nunca, el fallback puede volverse muy desactualizado con el tiempo. No definido en
  este documento: cómo/cuándo se regenera ese snapshot.
- El manejo de secretos (connection string de Neon, JWT signing secret) depende de configurar
  correctamente las variables de entorno de Vercel por ambiente (preview vs producción) — un
  error de configuración podría filtrar credenciales o romper el ambiente de preview.
- El límite de invocaciones/ejecución del free tier de Vercel no fue dimensionado contra el
  tráfico esperado — riesgo bajo probabilidad para el volumen actual, pero sin validar.
