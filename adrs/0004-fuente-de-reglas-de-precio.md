# ADR 0004: Fuente de reglas de precio en runtime

## Estado

Aceptado

## Contexto

El motor de cálculo del Cotizador era originalmente 100% frontend con reglas hardcodeadas.
Ahora las reglas viven en Postgres y son editables desde el panel admin
([ADR-0003](0003-componentes-y-repos.md)). Hay que decidir cómo el Cotizador (cliente final)
obtiene esas reglas para calcular el rango de precio/tiempo.

## Decisión

El frontend consulta `GET /api/pricing-rules` cada vez que el cliente ejecuta un cálculo — la
tabla de precios vigente se lee en vivo desde Neon en el momento de la consulta.

## Alternativas consideradas

- **Snapshot cacheado + revalidación** — reduce llamadas a la DB y tolera caídas cortas, pero
  puede mostrar al cliente un precio ya desactualizado si el admin editó reglas recientemente;
  se descartó porque el PRD prioriza que el rango mostrado sea siempre el vigente.
- **Snapshot en build/deploy** — mantiene el espíritu original "todo en frontend", pero anula
  el propósito del panel admin (editar precios sin re-deployar), que es justamente el cambio
  de alcance que motivó esta decisión.

## Consecuencias

- El cliente siempre ve el precio vigente configurado por el admin, sin necesidad de
  re-deployar el sitio.
- El Cotizador pasa a depender de que `/api/pricing-rules` y Neon estén disponibles — esto
  introduce un punto de falla nuevo en un flujo que antes no tenía dependencias externas; el
  comportamiento ante esa falla se define en [ADR de resiliencia](0009-resiliencia-y-manejo-de-errores.md).
