# spec-04-panel-admin

Backlog #4: panel /admin con autenticación para gestionar cotizaciones.

**Estado:** En implementación — corte **4b parcial** (listado). `/admin` lista las cotizaciones con
filtros; la autenticación es **provisoria** (`ADMIN_TOKEN` por header `Authorization: Bearer`).
La 4a (login scrypt + cookie firmada + middleware, ADR-0008/0012) sigue pendiente.
Avance en [`tasks.md`](tasks.md).
