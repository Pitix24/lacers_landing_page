---
title: "LACERS CNC — Matricería CNC con Cotizador Técnico y Panel Admin"
---

# PRD: LACERS CNC — Matricería CNC con Cotizador Técnico y Panel Admin

<!-- REVISAR: este PRD se generó en modo no interactivo (estructura de la skill
generar-prd-conversacional, sin entrevista sección por sección). Problema, usuario y outcome
se derivaron del PRD previo en la raíz (`PRD.md`), del código actual y del alcance MVP indicado
por el usuario. Validar cada sección antes de usarlo como fuente para tech design. -->

## Problema

Hoy LACERS cotiza matrices de aluminio para calzado (moldes completos, texturizado/grabado 3D,
reparación de banco) de forma manual, por WhatsApp y llamadas, con el filtro técnico
concentrado en un solo ingeniero. Las consultas llegan incompletas (sin aleación, sin
polímero de inyección, sin curva de tallas), lo que obliga a varias idas y vueltas antes de
poder estimar algo, y muchas terminan en reuniones presenciales que arrancan "en blanco".

El wizard actual de `/cotizador-tecnico` ordena la información, pero la envía solo como texto
por WhatsApp: no queda registro, no se puede consultar después y no hay forma de saber en qué
estado está cada solicitud. Además, el sitio necesita proyectar la capacidad técnica real del
taller (aleaciones, tolerancias, telemetría de máquina) para filtrar y atraer al cliente
correcto.

## Usuario objetivo

**Primario — Cliente técnico de matricería:** fabricante de calzado o emprendedor/representante
técnico que necesita una matriz de inyección (PVC, TR, PU, EVA, caucho). Conoce o puede estimar
el tipo de requerimiento, el polímero que va a inyectar y la curva de tallas; casi siempre tiene
un archivo CAD o una muestra física. Llega al sitio buscando validar si LACERS puede fabricar
su matriz y obtener una primera estimación sin depender de una llamada.

**Secundario — Ingeniero/administrador de LACERS:** recibe las solicitudes, las revisa y las
mueve de estado (ej. nueva → en revisión → cotizada → cerrada). Necesita ver todas las
solicitudes en un solo lugar, con los datos técnicos ya armados.

<!-- REVISAR: se asume un único rol admin (el ingeniero), sin distinción de permisos entre
varios usuarios internos. -->

## Objetivo / resultado esperado

- El cliente obtiene, en una sola sesión y sin llamada previa, una **estimación preliminar** de
  contracción aplicada (según polímero) y de **tiempo de mecanizado** (según proceso, aleación y
  curva de tallas), y deja una solicitud formal registrada.
- El ingeniero deja de reconstruir requerimientos desde chats: cada solicitud llega persistida
  en PostgreSQL (Neon) con todos los datos técnicos y un código de proyecto
  (`REQ-<aleación>-<proceso><pares>`), y la gestiona desde `/admin` cambiando su estado.
- El sitio comunica la capacidad técnica del taller (catálogo de aleaciones, procesos,
  tolerancias, telemetría) de forma clara y consistente con el sistema de diseño industrial.

## Alcance (qué sí incluye esta versión)

**1. Catálogo técnico interactivo de matricería CNC y telemetría**
- Catálogo de aleaciones de bloque/placa: **Aluminio 7075-T6**, **Aluminio 6061** y
  **Aluminio 2024-T351**, cada una con nota técnica (dureza, uso recomendado, tratamiento).
- Catálogo de procesos de mecanizado (molde completo, texturizado/grabado 3D, reparación /
  ajuste de banco) con tolerancia, máquina y aleación por defecto.
- Tabla de contracción polimérica (PVC, TR, PU, EVA, caucho) y sección de materiales.
- Tarjeta de telemetría CNC en el Hero (coordenadas X/Y/Z con micro-variación simulada,
  estado de refrigeración, tolerancia activa).
- Fuente de datos única tipada (`src/data/landingData.ts` + `src/types/landing.ts`).

<!-- REVISAR: hoy `CNC_ALLOYS` solo contiene 7075-T6 y 2024-T351; falta agregar 6061 (temple a
confirmar, ej. 6061-T6) con su nota técnica. Usar la skill agregar-aleacion-cnc. -->
<!-- REVISAR: la telemetría es simulada en el cliente (no proviene de máquinas reales). Se
asume que esto es aceptable para el MVP y que el sitio no la presenta como dato en vivo real. -->

**2. Wizard de Cotización Técnica en `/cotizador-tecnico` con persistencia real**
- Wizard de 4 pasos: 01 Requerimiento + aleación, 02 Polímero, 03 Geometría (CAD / muestra
  física, como declaración — sin subida de archivos), 04 Escalado (curva de tallas → pares).
- **Cálculo preliminar** mostrado antes de enviar:
  - Contracción aplicada según polímero (factor por material, ej. PVC −1.4 %).
  - Tiempo estimado de mecanizado según proceso, aleación y cantidad de pares.
- Envío de la solicitud a una API (Vercel Functions) que la **persiste en PostgreSQL (Neon)**
  con: proceso, aleación, polímero, modo de geometría, talla inicio/fin, pares, nota, código
  de proyecto, resultados del cálculo preliminar, datos de contacto y estado inicial `nueva`.
- Confirmación en pantalla con el código de proyecto; WhatsApp se mantiene como canal de
  contacto complementario (no reemplaza el registro en DB).
- Validación del lado servidor de todos los campos (no se confía en el cálculo del cliente).

<!-- REVISAR: los coeficientes de tiempo de mecanizado (horas base por proceso, factor por
aleación, horas por par) no están definidos. Son dependencia crítica del cálculo. -->
<!-- REVISAR: los datos de contacto mínimos (nombre, empresa, email y/o teléfono) no existen
hoy en el wizard; se asume que se agregan como paso/sección final antes de enviar. -->

**3. Panel administrativo protegido en `/admin`**
- Login de administrador (credenciales en tabla de usuarios admin, password hasheado, sesión
  en cookie `httpOnly`), coherente con [ADR-0008](../../adrs/0008-autenticacion-admin.md).
- Listado de cotizaciones recibidas, ordenado por fecha, con filtro por estado.
- Vista de detalle de cada solicitud con todos los datos técnicos y el cálculo preliminar.
- Cambio de estado de la cotización: `nueva` → `en_revision` → `cotizada` → `cerrada`
  (más `descartada`), registrando fecha del último cambio.
- Todas las rutas `/api/admin/*` rechazan requests sin sesión válida.

<!-- REVISAR: el set de estados es una propuesta del agente; confirmar nombres y transiciones
permitidas (¿se puede volver atrás? ¿`descartada` desde cualquier estado?). -->

## No alcance (qué explícitamente no incluye esta versión)

- **No** hay precio en pantalla: el cálculo preliminar es solo contracción y tiempo de
  mecanizado. El precio se define por ingeniería tras revisar archivo/muestra.
- **No** hay subida real de archivos CAD ni fotos (el paso 03 sigue siendo declarativo).
- **No** hay cuentas ni login para el cliente final; el wizard es anónimo salvo los datos de
  contacto que deja en la solicitud.
- **No** hay edición de reglas de cálculo, aleaciones ni procesos desde `/admin`: el panel solo
  consulta solicitudes y cambia su estado. El catálogo se mantiene en código.
- **No** hay notificaciones automáticas (email/WhatsApp) al cliente ni al admin cuando cambia un
  estado.
- **No** hay telemetría conectada a máquinas reales, ni integración con CAM/ERP.
- **No** hay pasarela de pago, GCP ni API de Gmail.
- **No** hay roles múltiples ni auditoría detallada de quién cambió cada estado.

## Criterios de éxito

- **Persistencia:** el 100 % de los envíos válidos del wizard generan una fila en la tabla de
  cotizaciones de Neon, verificable desde `/admin` en menos de 5 s tras el envío.
- **Completitud:** ≥ 80 % de las solicitudes recibidas en el primer trimestre tienen proceso,
  aleación, polímero, curva de tallas y un medio de contacto válido (sin campos vacíos).
- **Cálculo preliminar:** para cada combinación proceso × aleación × polímero, el wizard muestra
  contracción y tiempo estimado; los valores coinciden con los guardados en DB (mismo cálculo
  en servidor).
- **Seguridad del panel:** cualquier request a `/admin` o `/api/admin/*` sin sesión válida
  responde 401/redirección a login (verificable con test e2e).
- **Gestión:** el ingeniero puede cambiar el estado de una solicitud en ≤ 2 clics desde el
  listado, y el cambio persiste tras recargar.
- **Catálogo:** las tres aleaciones (7075-T6, 6061, 2024-T351) aparecen en el catálogo y en el
  paso 01 del wizard, con nota técnica.
- **Build:** `npm run build` (tsc + vite) pasa sin errores.

<!-- REVISAR: el umbral de completitud (80 %) y la ventana (primer trimestre) son propuestas
del agente; ajustar con datos reales de uso. -->

## Casos borde a contemplar

- **Curva de tallas inválida** (fin < inicio, vacío, no numérico): el wizard no habilita el
  envío y muestra 0 pares; el servidor rechaza la solicitud con 400.
- **Proceso sin aleación definida** (ej. reparación): se envía con aleación `a verificar en
  banco` y el cálculo de tiempo usa un valor por defecto marcado como provisorio.
- **Falla de red o de Neon al enviar:** el wizard muestra error recuperable, conserva lo cargado
  y permite reintentar; no se pierde la solicitud ni se duplica en reintentos (idempotencia
  por clave de envío).
- **Doble clic en "Enviar":** el botón se deshabilita mientras la request está en curso.
- **Abandono a mitad del wizard:** el progreso se conserva en `localStorage` para retomarlo.
- **Spam / envíos masivos:** límite de tasa básico por IP en el endpoint público.
- **Sesión admin expirada** durante un cambio de estado: se redirige a login sin aplicar el
  cambio y se informa al usuario.
- **Listado vacío en `/admin`:** estado vacío explícito ("Sin solicitudes registradas").
- **Valores extremos** (ej. > 30 pares o curvas fuera de rango habitual): se permite enviar pero
  se marca la solicitud como caso especial para revisión.

## Supuestos y riesgos abiertos

**Supuestos**
- El stack sigue siendo Vite + React + TypeScript + Tailwind en Vercel, con API en Vercel
  Functions y Neon vía Drizzle (ver `TECH-DESIGN.md` y ADRs 0001–0009).
- El cliente sabe identificar el polímero de inyección y la curva de tallas sin asesoría previa.
- Un único administrador gestiona las solicitudes en el MVP.
- La telemetría simulada es aceptable como recurso visual/de marca.

**Riesgos**
- **Coeficientes de tiempo de mecanizado sin definir:** bloquean el cálculo preliminar. Si se
  publican valores optimistas, generan expectativas incorrectas.
- **Desvío entre estimación y realidad:** el tiempo real depende del archivo/muestra; el wizard
  debe comunicar que es preliminar.
- **Divergencia con el PRD/TECH-DESIGN previos:** el PRD de la raíz incluía panel de precios y
  mailto como canal formal; este MVP los reemplaza por gestión de estados y persistencia
  directa. Los ADRs 0004–0006 deben revisarse para reflejar el nuevo alcance.
- **Seguridad del endpoint público:** sin rate limiting ni validación servidor, la tabla de
  cotizaciones puede llenarse de spam.
- **Datos personales:** las solicitudes guardan datos de contacto; se requiere política mínima
  de retención y no exponerlos fuera de `/admin`.

<!-- REVISAR: decidir si este PRD reemplaza al `PRD.md` de la raíz o si conviven; hoy hay dos
fuentes con alcances distintos. -->
