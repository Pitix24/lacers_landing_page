# ADR 0006: Contratos de API

## Estado

Aceptado

## Contexto

El frontend (SPA estático) necesita hablar con las Vercel Functions
([ADR-0003](0003-componentes-y-repos.md)) para: leer reglas de precio vigentes
([ADR-0004](0004-fuente-de-reglas-de-precio.md)), persistir cotizaciones, autenticar al admin,
y hacer CRUD sobre `materials`/`processes`/`pricing_formula` ([ADR-0005](0005-modelo-de-datos.md)).

## Decisión

REST convencional, JSON sobre HTTP:

- `GET /api/pricing-rules` — reglas vigentes (público, sin auth)
- `POST /api/quotes` — persiste una cotización (público, sin auth)
- `POST /api/admin/login` — autentica admin, devuelve sesión/token
- `GET/PUT /api/admin/materials`, `/api/admin/processes`, `/api/admin/pricing-formula` —
  CRUD de reglas (requiere sesión admin)

## Alternativas consideradas

- **tRPC** — tipado end-to-end automático entre frontend y functions sin escribir tipos de
  request/response a mano, menos boilerplate. Descartado: agrega una librería/paradigma nuevo
  para un equipo de una persona, y el proyecto no tiene necesidad actual de que otro cliente
  (no-React) consuma esta API, que es donde tRPC pierde su ventaja de tipado compartido.

## Consecuencias

- Endpoints estándar, fáciles de probar con curl/Postman/Thunder Client sin tooling adicional.
- Los tipos de request/response entre frontend y backend no se comparten automáticamente —
  hay que mantenerlos sincronizados a mano (ej. con interfaces TypeScript compartidas en
  `src/types/`), con el riesgo de que se desincronicen si no se disciplina el proceso.
