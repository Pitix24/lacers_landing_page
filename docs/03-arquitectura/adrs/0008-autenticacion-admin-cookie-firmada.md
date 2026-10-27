# ADR 0008: Autenticación admin por cookie firmada

## Estado

Aceptado (mandato del usuario). Algoritmos propuestos por el agente — REVISAR.

## Contexto

El PRD pide login de admin con credenciales en tabla, password hasheado y sesión en cookie
`httpOnly`; "todas las rutas `/api/admin/*` rechazan requests sin sesión válida". Un único admin
en el MVP. Las Functions no tienen estado en memoria (ADR-0001).

## Decisión

- Password hasheado con **scrypt** de `node:crypto` (salt aleatorio por usuario, parámetros en
  el hash almacenado). Si el email no existe, se corre igual un scrypt de relleno (sin
  diferencia de tiempos que permita enumerar usuarios).
- Login limitado por el mecanismo de ADR-0010: 5 intentos cada 15 min por IP y por email →
  429.
- Login correcto emite cookie `__Host-lacers_admin` =
  `base64url(payload).base64url(HMAC-SHA256(payload, SESSION_SECRET))`, con
  `payload = { sub, email, iat, exp }`, expiración 8 h. Firma implementada con **Web Crypto**
  (`crypto.subtle`), para que el mismo módulo corra en Functions y en el Routing Middleware.
- Verificación: comparación de firma en tiempo constante; se rechaza si `exp` venció o si
  `iat < SESSION_NOT_BEFORE` (variable de entorno opcional para cerrar todas las sesiones sin
  rotar el secreto).
- Atributos: `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`.
- CSRF: en métodos que modifican (login, logout, PATCH) se exige `Origin` igual al host propio y
  `Content-Type: application/json`; si no, 403.
- `requireAdmin(request)` en `server/session.ts` al inicio de cada handler `/api/admin/*` → 401.
- `/admin/*` (HTML) protegido además por Routing Middleware (ADR-0012).
- Alta de admin: `npm run admin:create` pide el password **por prompt sin eco** (nunca por
  argumento) e imprime el hash scrypt; se inserta desde el SQL Editor de Neon. Así la URL de
  producción no necesita estar en la máquina local. Mismo procedimiento para rotar el password.

## Alternativas consideradas

- **JWT con librería (`jose`)** — mismo modelo con formato estándar; se descarta por sumar
  dependencia para un payload propio de cuatro campos.
- **Sesiones en tabla** (`sessions` en Neon) — revocables una por una, pero suma una query a cada
  request admin y otra al middleware.
- **Auth gestionada (Clerk, Neon Auth)** — cero código de auth, pero dependencia externa
  sobredimensionada para un admin.

## Consecuencias

- Sin dependencias de auth; verificación sin DB en cada request.
- Revocación solo masiva (`SESSION_NOT_BEFORE` o rotar `SESSION_SECRET`, ambos requieren
  redeploy para tomar el nuevo valor); no se puede cerrar una sesión puntual. Aceptable con un
  admin.
- Mantener a mano la criptografía (formato de cookie, comparación constante) es superficie de
  error propia; se cubre con tests de firma alterada, expirada y anterior a `SESSION_NOT_BEFORE`.

## Historial

- 2026-10-26 — v1.
- 2026-10-26 — Revisión adversarial (A5, A6, A9, C5, S7): rate limit de login, scrypt de
  relleno, prefijo `__Host-`, chequeo de Origin, Web Crypto para compartir con el middleware,
  `SESSION_NOT_BEFORE`, alta de admin sin secretos de producción en local.
