# ADR 0013: Datos personales — aviso, retención y anonimización

## Estado

Propuesto — surgió de la revisión adversarial; plazos sugeridos por el agente. REVISAR con el
usuario (y, para el encuadre legal, con un asesor).

## Contexto

Cada solicitud guarda nombre, empresa, email y teléfono; el rate limit usa un hash de la IP, que
es un dato seudónimo (no anónimo: el espacio IPv4 se puede recorrer por fuerza bruta). El PRD
pide "política mínima de retención y no exponerlos fuera de `/admin`". LACERS opera en Argentina
(Ley 25.326 de Protección de Datos Personales).

## Decisión

- **Aviso y consentimiento:** el paso de contacto muestra el texto de finalidad ("usamos estos
  datos solo para responder tu solicitud") con un checkbox obligatorio; se guarda
  `privacy_accepted_at`.
- **Minimización:** `quotes.ip_hash` se pone en NULL a las 24 h; `rate_limits` se purga a las 24 h.
- **Retención:** a los **12 meses** de pasar a `cerrada` o `descartada`, se anonimizan
  `contact_*` y `note` (se conserva el dato técnico para estadística) y se setea `anonymized_at`.
- **Ejecución:** Vercel Cron diario (`crons` en `vercel.json`, compatible con Hobby a frecuencia
  diaria) que llama a `GET /api/cron/retention`, protegido con `CRON_SECRET` (header
  `Authorization: Bearer`). Es la 8.ª Function.
- Los datos de contacto nunca salen en logs ni en respuestas públicas (`POST /api/quotes`
  devuelve solo código y estimación).
- Las ramas `dev` de Neon no contienen datos reales (ADR-0002).

## Alternativas consideradas

- **Retención indefinida** — cero código, pero contradice el PRD y acumula riesgo legal.
- **Borrado manual desde el panel** — sin cron, pero depende de que alguien se acuerde y el PRD
  excluye acciones de edición más allá del estado.

## Consecuencias

- Cumple el pedido del PRD con un mecanismo automático y verificable.
- Suma una Function, un secreto (`CRON_SECRET`) y un checkbox más en el wizard (algo de fricción
  en la conversión).
- La inscripción de la base ante la autoridad de control (AAIP) y la redacción del aviso legal
  quedan fuera del diseño técnico: es decisión del negocio.
