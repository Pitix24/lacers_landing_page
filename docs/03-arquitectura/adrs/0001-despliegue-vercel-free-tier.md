# ADR 0001: Despliegue en Vercel (free tier)

## Estado

Aceptado (mandato del curso)

## Contexto

El PRD (`docs/01-producto/PRD.md`) suma persistencia y un panel `/admin` sobre una SPA que hoy
es solo estática (Vite + React, `vercel.json` con rewrite catch-all a `index.html`). Se necesita
una capa de servidor. Mandato del curso: el proyecto **debe** poder desplegarse en el plan free
(Hobby) de Vercel, con Serverless Functions / API Routes compatibles con Vercel. El equipo es
de una persona.

## Decisión

Frontend (build estático de Vite) y API (`api/*`, Vercel Functions en runtime Node.js) se
despliegan juntos en un único proyecto Vercel, plan Hobby. Previews por rama, producción desde
`main`. La región de las Functions se fija igual a la región de la base Neon (`regions` en
`vercel.json`).

## Alternativas consideradas

- **Netlify + Netlify Functions** — capacidades equivalentes, descartada por el mandato.
- **VPS / contenedor propio (Railway, Render)** — más control del runtime, pero suma costo fijo,
  un segundo deploy y operación (TLS, parches) desproporcionados para el volumen esperado.

## Consecuencias

- Deploy por `git push`, HTTPS y CDN incluidos, costo cero.
- **El plan Hobby es para uso personal / no comercial.** LACERS es una S.R.L. captando pedidos
  reales: Hobby es válido para la entrega académica y la demo, pero **antes del primer cliente
  real o de apuntar un dominio comercial a producción** hay que pasar a Pro (u otro hosting).
  Disparador explícito, registrado como riesgo en el TDD.
- El plan Hobby impone límites (invocaciones, cantidad de Functions por deploy, duración,
  retención corta de logs de runtime) que condicionan el diseño: pocos endpoints, sin jobs
  largos, observabilidad que no dependa solo de los logs de Vercel (ver ADR-0011).
- Las Functions son efímeras: nada de estado entre requests (rate limit, sesiones) puede
  depender del proceso; todo estado durable va a Neon.

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (C2, S3): se agrega la restricción de uso no comercial de
  Hobby con disparador de migración, y la co-ubicación de región Function/Neon.
