# ADR 0003: Componentes y repos

## Estado

Aceptado

## Contexto

Hoy el repo es un SPA Vite + React + TypeScript + Tailwind, sin backend (proyecto tratado
como greenfield — el código existente era solo una demo de landing). Con Postgres y login
admin en alcance ([ADR-0001](0001-plataforma-de-despliegue.md),
[ADR-0002](0002-motor-de-base-de-datos.md)), hace falta alguna capa de servidor para: guardar
cotizaciones, autenticar al admin, y exponer CRUD de reglas de precio.

## Decisión

Monorepo único. Frontend estático (build de Vite) + carpeta `api/` con Vercel Serverless
Functions (Node.js) sirviendo los endpoints de servidor (`POST /api/quotes`,
`POST /api/admin/login`, `GET/PUT /api/admin/pricing-rules`).

## Alternativas consideradas

- **Backend separado** (ej. Express en Railway/Render) — más libertad de runtime, pero dos
  deploys, dos configuraciones, y riesgo de salir del free tier de Vercel al pagar hosting
  aparte para el backend.
- **Monorepo con workspaces separados** (paquete frontend y paquete backend independientes) —
  más orden a largo plazo, pero over-engineering para un equipo de una persona en este
  estadio del proyecto.

## Consecuencias

- Un solo repo, un solo deploy, cero infraestructura adicional — encaja directo con el
  mandato de Vercel free tier.
- Requiere configurar bien `vercel.json` (las rutas de `api/*` deben resolver antes que el
  rewrite catch-all del SPA) y mantener separado el código de cliente del código de servidor,
  para no filtrar secretos (ej. connection string de Neon) al bundle del frontend.
