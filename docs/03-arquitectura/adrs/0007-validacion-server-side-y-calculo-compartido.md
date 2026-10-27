# ADR 0007: Validación server-side y cálculo preliminar compartido

## Estado

Aceptado (mandato del usuario: validación server-side). Detalle de implementación propuesto
por el agente — REVISAR.

## Contexto

El PRD exige "validación del lado servidor de todos los campos (no se confía en el cálculo del
cliente)" y que los valores mostrados "coincidan con los guardados en DB (mismo cálculo en
servidor)". Hoy los factores de contracción están hardcodeados en `CotizadorTecnico.tsx`
(`POLYMERS`, ej. PVC −1.4 %), no coinciden con `POLYMER_SHRINKAGE_TABLE`, y los coeficientes de
tiempo de mecanizado no existen.

## Decisión

- Esquema de entrada con **Zod** en `src/lib/cotizador/schema.ts`, usado por el wizard (UX) y
  por `POST /api/quotes` (autoridad). Rechaza con 400: ids fuera de catálogo, tallas no enteras
  o fuera de 15–50, `size_end < size_start`, sin email ni teléfono, email/teléfono mal
  formados, textos largos (`note` ≤ 1000, contacto ≤ 120), privacidad no aceptada. Campos
  desconocidos se descartan (`strip`).
- Función pura `calcularEstimacion(input)` en `src/lib/cotizador/calc.ts` con las reglas de
  `src/data/catalog.ts`. Devuelve `pairs`, `shrinkage_pct`, `machining_hours_est`,
  `estimate_provisional`, `is_special_case`, `special_reasons`, `calc_version`.
  - Redondeo con una única función `round(x, decimales)` del módulo, aplicada **antes** de
    mostrar y de insertar (no se delega en `numeric` de Postgres ni en `toFixed`).
  - Polímeros expansivos (EVA): no se publica un % de contracción; se marca
    `estimate_provisional` y `special_reasons: ['polymer_expansive']`. REVISAR con ingeniería.
- `calc_version` = hash corto (sha256, 8 caracteres) del objeto de reglas serializado,
  calculado en build/arranque: cambia solo cuando cambian las reglas, sin depender de memoria.
- El servidor **ignora** cualquier resultado enviado por el cliente, recalcula, genera
  `project_code`/`public_code`, y responde con los valores persistidos. **La pantalla de
  confirmación muestra los valores devueltos por el servidor**, no los locales.
- El cliente envía su `calc_version`; si difiere de la del servidor (pestaña abierta desde antes
  de un deploy), el servidor persiste igual con las reglas nuevas y responde
  `calcVersionChanged: true`; la confirmación avisa "La estimación se actualizó con las reglas
  vigentes".

## Alternativas consideradas

- **Validación manual con `if`s en el handler** — cero dependencias, pero duplica reglas entre
  cliente y servidor y tiende a divergir.
- **Cálculo solo en servidor** (el wizard pide la estimación a un endpoint) — una sola
  implementación, pero una request por cambio de paso y sin feedback si la API falla.
- **Rechazar con 409 ante `calc_version` distinta** — más estricto, pero obliga al usuario a
  reenviar por un cambio que no controla.

## Consecuencias

- Una única implementación del cálculo; lo persistido es siempre lo que el usuario ve en la
  confirmación.
- Suma `zod` al bundle del frontend (~13 kB gz).
- Puede haber una diferencia entre el resumen previo al envío y la confirmación si hubo deploy
  en el medio; se avisa en vez de bloquear.
- Los coeficientes reales de mecanizado siguen sin definir (riesgo del PRD); hasta tenerlos,
  toda estimación de tiempo sale `estimate_provisional = true`.
- Un test de tabla proceso × aleación × polímero fija los resultados; cambiar reglas obliga a
  actualizar el test (y cambia `calc_version` solo).

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (A1, A2, A3): `calc_version` derivada por hash, redondeo
  único, confirmación con valores del servidor, manejo de pestañas viejas, EVA, tallas enteras.
