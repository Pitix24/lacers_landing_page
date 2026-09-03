# LACERS — Matricería CNC & Tooling

Landing page de **LACERS**, matricería CNC especializada en mecanizado y grabado de alta precisión en aluminio (7075-T6 / 6061) para moldes de inyección de calzado.

Construida en **React + TypeScript + Tailwind CSS**, a partir de un diseño generado en [Stitch](https://stitch.withgoogle.com/) y modularizada en componentes reutilizables y data-driven.

## Stack

- **React 18** + **TypeScript** (strict)
- **Vite** como bundler y dev server
- **Tailwind CSS 3** con design system propio (tokens semánticos)
- Sin dependencias de UI externas — componentes propios

## Puesta en marcha

```bash
npm install
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm run build     # type-check + build de producción a dist/
npm run preview   # sirve el build de producción
npm run lint      # solo type-check
```

## Estructura del proyecto

```
src/
├── components/
│   ├── common/            # MaterialIcon, SectionHeading, StatusPulseDot
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── CncTelemetryCard.tsx   # HUD interactivo del Hero (telemetría CNC en vivo)
│   ├── MetricsBar.tsx
│   ├── ProductionCycle.tsx    # "Ciclo Integral de Producción"
│   ├── MaterialsShrinkage.tsx # Física de contracción de polímeros
│   ├── MachiningGallery.tsx   # Galería de mecanizados macro
│   ├── CertifiedWorkflow.tsx  # "Flujo de Trabajo Certificado"
│   ├── CtaBanner.tsx
│   └── Footer.tsx
├── data/
│   └── landingData.ts     # Todo el contenido textual/listas, tipado con TS
├── types/
│   └── landing.ts         # Interfaces compartidas
├── App.tsx
└── index.css

public/assets/images/      # Renders CNC y logo (fuente: Stitch)
src/stitch-export/         # HTML/CSS original exportado de Stitch (referencia)
```

## Design System (Tailwind)

Tokens semánticos definidos en `tailwind.config.js`:

| Token | Valores | Uso |
|---|---|---|
| `canvas` / `canvas-deep` | `#0B0D0F` / `#121417` | Fondo base |
| `surface-card` / `surface-card-deep` | `#171A1E` / `#1E2227` | Tarjetas y HUD |
| `metal` / `metal-deep` | `#282C34` / `#33383F` | Bordes técnicos y divisores |
| `accent-red` / `accent-red-light` | `#DC2626` / `#EF4444` | Botones primarios, tags `//`, estados activos |
| `accent-green` | `#10B981` | WhatsApp, estado "NOMINAL // EN TOLERANCIA" |
| `main` / `muted` | `#FFFFFF` / `#9CA3AF` | Texto principal / secundario |

Tipografía: `font-sans` (Space Grotesk, titulares), `font-body` (Inter, cuerpo), `font-mono` (JetBrains Mono, métricas/HUD/coordenadas). Radios de borde acotados a `rounded-sm`/`rounded` (corte recto mecanizado).

## Datos

Todo el contenido repetido (métricas, tarjetas del ciclo de producción, tabla de contracción polimérica, galería, pasos del flujo de trabajo, enlaces del footer) vive centralizado y tipado en `src/data/landingData.ts`, renderizado vía `.map()` en cada componente.
