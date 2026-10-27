# Flujo — Revisión administrativa de cotizaciones (v1)

> Recorrido del ingeniero/administrador en `/admin`: acceso, listado y filtrado de solicitudes,
> y ciclo de estados. Derivado de `src/pages/AdminPage.tsx`, `api/admin/quotes.ts`,
> `server/http.ts` y `server/quotes-repo.ts`.
>
> **Leyenda:** nodos con borde sólido = implementado hoy; nodos punteados = pendiente de
> **spec-04** (login con cookie firmada de ADR-0008, `PATCH` de estado y paginación por cursor).

## Grafo de componentes y llamadas

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| SPA | `src/App.tsx` | Ruta `/admin` con `lazy()` + `Suspense` (chunk aparte de la landing). |
| SPA | `src/pages/AdminPage.tsx` | Login provisorio por token en `sessionStorage`, filtros (`status`, `q`, `spam`), tabla y estados vacío/error. |
| Function | `api/admin/quotes.ts` | `GET /api/admin/quotes`: `requireAdmin`, valida `status` contra `QUOTE_STATUSES`, `q` truncado a 64, límite 100. Quita `payloadHash` de la respuesta. |
| Servidor | `server/http.ts` | `requireAdmin()`: `Authorization: Bearer <ADMIN_TOKEN>` comparado con `timingSafeEqual` sobre sha256. |
| Servidor | `server/quotes-repo.ts` | `list()`: filtro por estado, oculta spam por defecto, busca por `publicCode` o `folio`, orden `createdAt desc`. |
| Datos | `prisma/schema.prisma` | Índice `(status, createdAt desc)` sobre `quote_requests`. |

## Diagrama de flujo

```mermaid
flowchart TD
    %% ── Acceso ──
    Start([Ingeniero abre /admin]) --> Lazy[App.tsx carga AdminPage<br/>lazy + Suspense]
    Lazy --> HasToken{¿Token en<br/>sessionStorage?}
    HasToken -->|No| LoginForm[Formulario: token de administrador]
    LoginForm --> SaveToken[handleLogin: guarda token<br/>en sessionStorage]
    SaveToken --> Load
    HasToken -->|Sí| Load

    %% ── Carga del listado ──
    Load[load: arma query params<br/>status, q, spam=1] --> Fetch[/"GET /api/admin/quotes<br/>Authorization: Bearer token"/]

    subgraph API [api/admin/quotes.ts · Vercel Function]
        direction TB
        Fetch --> Cfg{¿ADMIN_TOKEN configurado<br/>y de 24+ caracteres?}
        Cfg -->|No| E503Cfg[503 ADMIN_NOT_CONFIGURED]
        Cfg -->|Sí| Auth{requireAdmin:<br/>timingSafeEqual sha256}
        Auth -->|No coincide| E401[401 UNAUTHORIZED]
        Auth -->|OK| VStatus{¿status válido en<br/>QUOTE_STATUSES?}
        VStatus -->|No| E400[400 VALIDATION_ERROR]
        VStatus -->|Sí| Repo{getQuotesRepo}
        Repo -->|null: prod sin DATABASE_URL| E503Db[503 DB_UNAVAILABLE]
        Repo -->|prismaRepo / memoryRepo| List[repo.list<br/>status · q ≤ 64 · includeSpam · limit 100]
        List --> Query[(Neon PostgreSQL<br/>quote_requests<br/>ORDER BY created_at DESC)]
        Query -->|error| E503Read[503 DB_UNAVAILABLE<br/>logEvent admin.quotes.db_error]
        Query -->|filas| Strip[Quita payloadHash<br/>200 AdminQuotesResponse · no-store]
    end

    E401 --> Logout[logout: borra token<br/>de sessionStorage]
    Logout --> LoginForm
    E503Cfg --> ErrBox[Alerta con mensaje + Reintentar]
    E400 --> ErrBox
    E503Db --> ErrBox
    E503Read --> ErrBox
    ErrBox -->|Reintentar| Load

    Strip --> Empty{¿items vacío?}
    Empty -->|Sí| EmptyState[Estado vacío:<br/>Sin cotizaciones]
    Empty -->|No| Table[QuotesTable: código, fecha, requerimiento,<br/>aleación, polímero, tallas, contacto, estado]
    Strip -.->|storage = memory| MemBanner[Aviso: modo local sin DATABASE_URL]

    %% ── Revisión ──
    Table --> Review[Revisa la solicitud:<br/>casos especiales pairs_gt_30 / polymer_expansive,<br/>aleación a verificar VRF, marca spam]
    Review --> Filter{¿Refinar listado?}
    Filter -->|Cambia estado o spam| Load
    Filter -->|Busca código o folio y envía| Load
    EmptyState --> Filter

    Review --> Contact[Contacta al cliente por<br/>email / teléfono fuera del sistema]
    Contact --> Decide{Decisión de ingeniería}

    %% ── Cambio de estado (spec-04) ──
    Decide --> Patch[/"PATCH /api/admin/quotes/:id<br/>estado nuevo"/]
    Patch --> Session{¿Sesión válida?<br/>cookie firmada ADR-0008}
    Session -->|No| Relogin[Redirige a login<br/>sin aplicar el cambio]
    Relogin --> LoginForm
    Session -->|Sí| Trans{¿Transición permitida?<br/>ADR-0005}
    Trans -->|No| E409[Rechaza: transición inválida]
    E409 --> ErrBox
    Trans -->|Sí| Update[(UPDATE status,<br/>status_changed_at = now)]
    Update --> Load
    Review --> Logout2([Salir: logout]) --> LoginForm

    %% ── Estilos (tokens de tailwind.config.js) ──
    classDef ok fill:#171A1E,stroke:#10B981,color:#FFFFFF
    classDef err fill:#171A1E,stroke:#DC2626,color:#FFFFFF
    classDef db fill:#1E2227,stroke:#33383F,color:#FFFFFF
    classDef todo fill:#121417,stroke:#9CA3AF,color:#9CA3AF,stroke-dasharray:5 4
    class Strip,Table,EmptyState ok
    class E401,E400,E503Cfg,E503Db,E503Read,ErrBox err
    class Query,Update db
    class Patch,Session,Relogin,Trans,E409,Update,Decide todo
```

## Ciclo de estados de una solicitud

Transiciones permitidas según ADR-0005 (validación en servidor pendiente de spec-04). Toda
solicitud nace en `nueva` desde `POST /api/quotes`.

```mermaid
stateDiagram-v2
    [*] --> nueva: POST /api/quotes
    nueva --> en_revision: el ingeniero la toma
    nueva --> descartada
    en_revision --> cotizada: se envía la cotización
    en_revision --> descartada
    en_revision --> nueva: vuelve a la cola
    cotizada --> cerrada: el cliente acepta
    cotizada --> descartada
    cotizada --> en_revision: recotizar
    descartada --> en_revision: reabrir
    cerrada --> cotizada: reabrir
```

## Notas

- **Auth provisoria:** hoy el panel usa `ADMIN_TOKEN` como Bearer guardado en `sessionStorage`;
  un `401` hace logout automático. La spec-04 lo reemplaza por login + cookie `httpOnly` firmada
  (ADR-0008, ADR-0012).
- **Datos personales (ADR-0013):** el contacto solo viaja en `/api/admin/*`; `logEvent` nunca
  registra nombre, email ni teléfono.
- **Spam:** las solicitudes con honeypot se ocultan salvo con el filtro "Incluir spam"
  (`spam=1`).
- **Fuera de alcance del MVP (PRD):** notificaciones automáticas al cambiar de estado, roles
  múltiples y auditoría de quién cambió cada estado.
