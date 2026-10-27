# ADR 0008: Autenticación del panel admin

## Estado

Aceptado

## Contexto

El panel de precios necesita proteger sus endpoints de escritura/lectura
([ADR-0006](0006-contratos-de-api.md)) — el PRD exige login solo para el rol admin, el cliente
final del cotizador sigue sin login.

## Decisión

Login propio contra la tabla `admin_users` ([ADR-0005](0005-modelo-de-datos.md)):
password hasheado con bcrypt, `POST /api/admin/login` emite un JWT firmado (secret en
variable de entorno de Vercel), guardado en cookie `httpOnly` con expiración. Endpoints
`/api/admin/*` validan el JWT antes de ejecutar.

## Alternativas consideradas

- **Password compartido simple** (una clave en env var, sin tabla de usuarios) — mínimo
  código, pero descartado porque no permite rotar credenciales sin redeploy ni distinguir
  admins si el equipo crece, y el costo de implementar login real es bajo dado que ya hay
  Drizzle + Neon en el stack.
- **Proveedor de auth gestionado (Clerk)** — cero código de auth propio, pero descartado por
  agregar una dependencia externa y su propio setup para un caso de un solo usuario admin,
  donde JWT + bcrypt ya cubre el requisito sin infraestructura adicional.

## Consecuencias

- Login estándar y auditable, soporta agregar más admins a futuro sin cambiar de enfoque,
  password nunca se guarda en texto plano.
- Hay que mantener a mano la lógica de expiración/renovación de JWT y el manejo seguro del
  secret de firma (variable de entorno, nunca en el bundle del frontend) — responsabilidad que
  un proveedor gestionado hubiera absorbido.
