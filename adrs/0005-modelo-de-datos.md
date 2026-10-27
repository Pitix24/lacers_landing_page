# ADR 0005: Modelo de datos

## Estado

Aceptado

## Contexto

Sin Design.md disponible — entidades derivadas solo del PRD. El PRD ahora requiere: persistir
cada cotización generada, y una tabla de precios editable por el admin
([ADR-0004](0004-fuente-de-reglas-de-precio.md)) sin panel de autoadministración basado en
código libre.

## Decisión

Modelo relacional normalizado en PostgreSQL (Neon):

- **`materials`** — `id`, `name`, `price_multiplier`, `active`
- **`processes`** — `id`, `name`, `price_multiplier`, `time_multiplier`, `active`
- **`pricing_formula`** — fila única de configuración global: `base_price_per_volume_unit`,
  `base_time_per_volume_unit`, `tolerance_tight_multiplier`, `rush_lead_time_multiplier`,
  `updated_at`
- **`quotes`** — `id`, `created_at`, `length_mm`, `width_mm`, `height_mm`, `material_id` (FK),
  `process_id` (FK), `tolerance_level`, `quantity`, `desired_lead_time_days`,
  `estimated_price_min`, `estimated_price_max`, `estimated_time_min_days`,
  `estimated_time_max_days`, `is_edge_case` (boolean — caso fuera de rango razonable)
- **`admin_users`** — `id`, `email`, `password_hash`, `created_at`

## Alternativas consideradas

- **Config flexible (JSONB)** — una sola tabla con la fórmula completa en JSON, más rápida de
  iterar sin migraciones, pero descartada porque el panel admin necesitaría lógica extra de
  validación de forma, y el volumen de reglas (material, proceso, fórmula) es chico y estable.
- **Hack híbrido** (materials/processes normalizados + parámetros de fórmula como filas
  clave-valor genéricas) — más flexible para agregar parámetros sin migración, pero se
  descartó a favor de columnas tipadas explícitas en `pricing_formula`, más simples de validar
  y de leer para un admin no técnico.

## Consecuencias

- Cada campo de precio es tipado y validable a nivel de base de datos (constraints), y el
  admin edita filas simples (materiales, procesos) sin tocar JSON.
- Agregar un parámetro nuevo a la fórmula (ej. un factor por acabado superficial) requiere una
  migración de schema (`ALTER TABLE`), no solo un cambio de datos — costo aceptado a cambio de
  tipado fuerte.
