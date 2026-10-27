# Sistema de diseño — LACERS CNC

Documenta el sistema de diseño **tal como está implementado hoy** en el repo. Fuente de verdad
de los tokens: `tailwind.config.js` y `src/index.css`. Si este documento y el código difieren,
manda el código — actualizar este archivo.

## Concepto visual

Estética de **interfaz industrial / HUD de máquina CNC**: fondo oscuro mate (bandeja de
máquina), paneles con bordes técnicos finos, esquinas casi rectas, acento rojo para estados
activos y verde solo para estado nominal. La tipografía monoespaciada transmite lectura de
instrumento (coordenadas, tolerancias, códigos de proyecto). Diseño originado en Stitch
(`src/stitch-export/lacers-desktop.html`, `lacers-mobile.html`).

Principios:
- **Precisión sobre decoración:** cada elemento muestra un dato técnico (tolerancia, máquina,
  factor de contracción) o no aparece.
- **Dark-only:** no hay tema claro (`darkMode: 'class'` está configurado pero no se usa un
  modo claro).
- **Rojo = acción / estado activo; verde = nominal.** Nunca se usan como decoración.

## Tokens de color

| Token Tailwind | Hex | Uso |
|---|---|---|
| `canvas` | `#0B0D0F` | Fondo base de la página (`body`, `html`, track del scrollbar) |
| `canvas-deep` | `#121417` | Fondo de secciones alternas, franjas de cabecera de viewport |
| `surface-card` | `#171A1E` | Tarjetas, paneles de paso del wizard |
| `surface-card-deep` | `#1E2227` | Tarjeta seleccionada, chips, HUD flotante |
| `metal` | `#282C34` | Bordes, divisores, gridlines, barra de progreso inactiva, thumb del scrollbar |
| `metal-deep` | `#33383F` | Borde en hover, texto de pasos pendientes |
| `accent-red` | `#DC2626` | Acento primario: CTAs, tags `//`, estado activo, progreso completo, `::selection` |
| `accent-red-light` | `#EF4444` | Paso en configuración (progreso activo), hover de CTA |
| `accent-green` | `#10B981` | Estado nominal / completo, WhatsApp, "NOMINAL // EN TOLERANCIA" |
| `main` | `#FFFFFF` | Texto principal y títulos |
| `muted` | `#9CA3AF` | Texto secundario, descripciones, labels mono |

Patrones de opacidad usados: `border-metal/50` (divisores internos), `bg-accent-red/10`
(chip seleccionado), `bg-accent-red/[0.02]` (dropzone).

## Tipografía

Cargadas desde Google Fonts en `index.html`.

| Familia Tailwind | Fuente | Pesos | Uso |
|---|---|---|---|
| `font-sans` | Space Grotesk | 600, 700 | Títulos H1–H3, labels de tarjeta. Siempre `uppercase tracking-tight` |
| `font-body` | Inter | 400, 500, 600 | Párrafos y descripciones (default del `body`) |
| `font-mono` | JetBrains Mono | 400, 500, 600 | Tags técnicos, telemetría, códigos, badges, estados. Generalmente `uppercase tracking-widest` |

Escala habitual:
- H2 de sección: `text-2xl md:text-4xl font-bold uppercase tracking-tight`.
- H3 de paso/tarjeta: `text-lg font-bold uppercase tracking-tight`.
- Párrafo: `text-sm` / `text-[13px]` `leading-relaxed text-muted`, ancho máximo `max-w-[60ch]`–`[62ch]`.
- Micro-labels mono: `text-[10px]`–`text-xs`, `uppercase tracking-widest`.

## Forma, sombra y textura

- **Border radius** casi nulo: `none 0`, `sm/DEFAULT 2px`, `md 3px`, `lg 4px`. El estándar es
  `rounded-sm`. Excepción: puntos de estado (`rounded-full`).
- **Sombras:**
  - `shadow-glow-red` (`0 0 16px rgba(220,38,38,.35)`) — tarjeta seleccionada.
  - `shadow-glow-red-lg` (`0 0 24px rgba(220,38,38,.55)`) — CTA destacado / hover.
  - `shadow-panel` (`0 8px 32px rgba(0,0,0,.6)`) — HUD / paneles flotantes.
- **Textura:** `bg-dot-grid` (puntos rojos 1px cada 24px) para fondos de calibración.
- **Bordes:** 1px `border-metal` en todo panel; `border-accent-red` para estado seleccionado;
  `border-dashed border-metal-deep` para zonas deshabilitadas/placeholder.

## Iconografía

Material Symbols Outlined (peso 400, sin relleno), vía el componente
`src/components/common/MaterialIcon.tsx`. Los nombres se tipan como `MaterialIconName`.
Tamaños típicos `text-[16px]`–`text-[30px]`; color `text-muted` en reposo, `text-accent-red`
en activo. Iconos en uso: `precision_manufacturing`, `grid_view`, `tune`, `straighten`,
`folder_zip`, `architecture`, `cloud_upload`.

## Layout

- Contenedor de sección: `w-full px-4 py-16 md:px-8 lg:px-12` + `mx-auto max-w-[1600px]`.
- Fondos de sección alternados entre `bg-canvas` y `bg-canvas-deep`.
- Navbar fija; el contenido arranca con `pt-16`.
- Grillas responsivas mobile-first: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. El wizard usa
  `lg:grid-cols-[minmax(0,2.3fr)_minmax(290px,1fr)]` (wizard + panel resumen lateral).
- Espaciado vertical entre bloques: `gap-8`; dentro de paneles: `gap-5`, `p-6`.

## Componentes base

| Componente | Archivo | Descripción |
|---|---|---|
| `SectionHeading` | `src/components/common/SectionHeading.tsx` | Tag técnico `// ETIQUETA` + H2 + badge mono opcional a la derecha |
| `MaterialIcon` | `src/components/common/MaterialIcon.tsx` | Glifo Material Symbols, `aria-hidden` |
| `StatusPulseDot` | `src/components/common/StatusPulseDot.tsx` | Punto 8px con `animate-ping`, color por `className` (rojo por defecto) |
| `.tag-technical` | `src/index.css` | Clase utilitaria: `font-mono text-xs uppercase tracking-widest text-accent-red` |

## Patrones de UI

**Tarjeta seleccionable (opción de wizard)**
- Reposo: `border-metal bg-surface-card hover:border-metal-deep`.
- Activa: `border-accent-red bg-surface-card-deep shadow-glow-red`, icono en `text-accent-red`.
- Pie con tag mono entre corchetes: `[Mecanizado 5-ejes]`, separado por `border-t border-metal/50`.

**Chip / pill de opción** (aleación, polímero)
- `rounded-sm border px-4 py-2 font-mono text-xs`.
- Activo: `border-accent-red bg-accent-red/10 text-main`; reposo: `border-metal bg-surface-card-deep text-muted`.

**Panel de paso del wizard**
- `rounded-sm border border-metal bg-surface-card p-6`, encabezado con índice `[01]` mono rojo
  + H3 + chip de estado a la derecha.
- Paso bloqueado: `pointer-events-none opacity-50`.
- Estado del paso (`StepStatus`): `PENDIENTE` (`text-metal-deep`), `EN CONFIGURACIÓN`
  (`text-accent-red`), `COMPLETO` (`text-accent-green`).

**Barra de progreso segmentada**
- 4 segmentos `h-1.5 rounded-sm`: `bg-accent-red` completo, `bg-accent-red-light` activo,
  `bg-metal` pendiente; labels `01 / Requerimiento` en mono 10px.

**HUD de telemetría** (`CncTelemetryCard`)
- Marco `border-metal bg-surface-card-deep shadow-panel`, franja de cabecera `bg-canvas-deep`
  con label de viewport, imagen con `contrast-125 grayscale-[15%]`, overlay de mira y
  coordenadas X/Y/Z que oscilan cada 450 ms.

**Lenguaje de copy**
- Tags con prefijo `//` (`// SOLICITUD DE COTIZACIÓN`), separadores `//` en badges y estados
  (`NOMINAL // EN TOLERANCIA`).
- Códigos de proyecto `REQ-<aleación>-<proceso><pares>` y tolerancias `±0.05 mm` en mono.
- Español rioplatense (voseo: "Definí", "Cargá").

## Accesibilidad

- Iconos decorativos con `aria-hidden="true"`.
- Opciones del wizard como `<button type="button">` (navegables por teclado).
- Contraste: `main` y `muted` sobre `canvas`/`surface-card` superan AA para texto normal;
  `metal-deep` se usa solo para estados pendientes no críticos.

<!-- REVISAR: no hay estilos de foco visibles definidos explícitamente (`focus-visible:`);
conviene agregar un anillo `accent-red` para navegación por teclado, especialmente en `/admin`. -->

## Extensión para `/admin` (pendiente)

El panel admin del PRD debe reutilizar estos tokens: tablas sobre `surface-card` con divisores
`border-metal`, headers mono `text-muted uppercase`, badges de estado con la misma semántica
(rojo = requiere acción / `nueva`, verde = `cotizada`/`cerrada`, `muted` = `descartada`) e
inputs `bg-canvas-deep border-metal focus:border-accent-red`.

<!-- REVISAR: el mapeo estado → color de badge es una propuesta; validarlo al diseñar /admin. -->
