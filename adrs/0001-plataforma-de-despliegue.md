# ADR 0001: Plataforma de despliegue

## Estado

Aceptado

## Contexto

El PRD ahora requiere persistencia (PostgreSQL) y un panel admin con login, lo que introduce
la necesidad de alguna capa de servidor — antes el proyecto era 100% frontend estático. El
equipo es de una sola persona y busca minimizar costo e infraestructura operativa. El usuario
estableció como requisito mandatorio que el proyecto se despliegue en **Vercel, plan free
tier**.

## Decisión

El proyecto se despliega en Vercel (free tier).

## Alternativas consideradas

- **Netlify + Functions** — equivalente viable en capacidades, pero descartado porque el
  requisito mandatorio del proyecto pide específicamente Vercel.
- **VPS propio** (ej. DigitalOcean) — más control total del entorno, pero agrega costo fijo
  mensual y carga operativa (parches, escalado, TLS) injustificada para el volumen esperado.

## Consecuencias

- Deploys automáticos por git push, HTTPS y CDN incluidos, cero costo en el tier gratuito.
- El free tier de Vercel tiene límites de invocaciones/ejecución de Functions y ancho de
  banda — hay que monitorear si el tráfico crece, y migrar a un plan pago si se supera.
