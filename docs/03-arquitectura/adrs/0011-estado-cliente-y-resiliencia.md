# ADR 0011: Estado del cliente, resiliencia y observabilidad

## Estado

Propuesto — decidido por el agente sin entrevista (sesión no interactiva). REVISAR.

## Contexto

PRD: abandono a mitad del wizard → retomar desde `localStorage`; falla de red o Neon → "error
recuperable, conserva lo cargado y permite reintentar"; sesión admin expirada → "redirige a login
sin aplicar el cambio". El ADR-0009 previo (fallback a mailto, guardado best-effort) queda
invalidado: ahora la persistencia es el canal formal y WhatsApp es complementario. No hay
notificaciones (PRD, "No alcance") y los logs de runtime de Hobby se retienen poco tiempo.

## Decisión

- **Wizard:** el borrador (selecciones, curva, nota, contacto) se guarda en `localStorage`
  (`lacers.cotizador.draft.v1`) en cada cambio. Al rehidratar se valida con Zod y se descartan
  ids que ya no estén en el catálogo. Tras el éxito se borra el borrador y se guarda
  `lacers.cotizador.last.v1` (`public_code`, fecha) para que recargar no haga perder el código.
- **Falla al enviar** (red, timeout de **20 s** —cubre cold start de Neon + Function—, 5xx/503):
  mensaje recuperable, datos intactos, botón "Reintentar" (ADR-0009). Sin reintentos
  automáticos.
- **400:** errores por campo del servidor. **409 reuso de clave:** diálogo de ADR-0009.
  **429:** "Demasiados envíos, probá en unos minutos" + link a WhatsApp.
- **Admin:** estado en el servidor; la SPA refetchea tras cada cambio. Un 401 redirige a
  `/admin/login?next=…` sin reintentar la mutación; el badge no cambia hasta respuesta 200.
- **Servidor:** errores de Neon → 503 `DB_UNAVAILABLE`; log JSON con `requestId`, ruta, código y
  duración (nunca datos de contacto).
- **Observabilidad:** monitor externo gratuito (ej. UptimeRobot) sobre `GET /api/health`
  (`SELECT 1`) cada 5 min con alerta por email al ingeniero. No hay tabla de errores (si la
  base está caída no se podría escribir en ella).
- **SLA operativo:** sin notificaciones, el tiempo de respuesta depende de que el ingeniero
  revise `/admin`. El copy del sitio debe prometer un único plazo coherente (hoy conviven
  "< 12 horas" y "24 horas hábiles") — REVISAR con el usuario.

## Alternativas consideradas

- **Reintentos automáticos con backoff** — menos clics, pero con Neon caído solo multiplica
  requests y demora el feedback.
- **Cola local de envíos pendientes** — tolera caídas largas, pero el usuario se iría sin
  confirmación ni código, justo lo que el PRD quiere dar.
- **Log drain / servicio de logs externo** — retención larga, pero los drains no están en Hobby
  y suman un proveedor.

## Consecuencias

- Ningún dato cargado se pierde por una falla transitoria; reintentos seguros.
- Si Neon está caído, no hay registro hasta que el cliente reintente o caiga a WhatsApp; el
  monitor avisa la caída, pero no recupera esas solicitudes.
- Diagnóstico post-mortem limitado por la retención corta de logs de Hobby.
- El borrador en `localStorage` incluye datos de contacto en el navegador del cliente.

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (A12, S5, A1): timeout ajustado a cold start, validación del
  borrador al rehidratar, persistencia del último código, monitor de `/api/health`, SLA
  explícito.
