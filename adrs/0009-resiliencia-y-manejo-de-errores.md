# ADR 0009: Resiliencia y manejo de errores

## Estado

Aceptado

## Contexto

El Cotizador ahora depende de dos llamadas de red que no existían antes: leer reglas de
precio vigentes (`GET /api/pricing-rules`, [ADR-0004](0004-fuente-de-reglas-de-precio.md)) y
persistir la cotización (`POST /api/quotes`). El PRD pide explícitamente evitar ponerle trabas
al cliente, y el canal oficial de envío sigue siendo el mailto compuesto en el cliente.

## Decisión

- **Falla en `GET /api/pricing-rules`:** el frontend usa un snapshot estático de reglas
  embebido en el build (última copia conocida) y muestra un aviso: "estimación aproximada,
  puede no reflejar el precio más reciente". El cliente nunca se queda sin poder cotizar.
- **Falla en `POST /api/quotes`:** no bloquea el flujo. El botón de mailto sigue habilitado y
  funcional con los datos ya calculados — se pierde el registro histórico de esa cotización
  puntual en Neon, pero el ingeniero igual recibe el mail completo.

## Alternativas consideradas

- **Bloquear con mensaje de error** ante falla de `pricing-rules` — más simple de implementar,
  pero descartada por contradecir el pedido explícito del PRD de no poner trabas al cliente.
- **Bloquear el mailto hasta confirmar guardado** en DB — garantiza cero pérdida de registros,
  pero descartada porque el mailto es el canal oficial de envío según el PRD, y no debe
  depender de la disponibilidad de Neon para funcionar.

## Consecuencias

- El flujo del cliente nunca se interrumpe por una caída de Neon o de las Functions —
  consistente con el objetivo de negocio de reducir fricción.
- El snapshot estático embebido puede quedar desactualizado si el admin cambia precios y Neon
  tiene una caída prolongada justo después — riesgo aceptado, de baja probabilidad e impacto
  acotado (el cliente ve un aviso de que es aproximado). El registro en `quotes` no es 100%
  confiable como fuente única de verdad de "todas las cotizaciones enviadas" — puede haber
  huecos si Neon falló en el momento del guardado.
