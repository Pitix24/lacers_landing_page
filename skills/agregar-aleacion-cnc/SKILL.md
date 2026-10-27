---
name: agregar-aleacion-cnc
description: Agrega una nueva aleación (CNC_ALLOYS) o un nuevo proceso de mecanizado CNC (CNC_PROCESSES) a src/data/landingData.ts y la expone en el wizard de /cotizador-tecnico, respetando los tipos de src/types/landing.ts y los tokens de diseño de tailwind.config.js. Use when the user asks to add, register, or offer a new aluminum/metal alloy, temper, material de matriz, or machining process/requerimiento in the Cotizador Técnico or landing data.
---

# Agregar aleación o proceso CNC

## Dónde vive cada cosa

| Pieza | Archivo | Rol |
|---|---|---|
| `CncAlloy`, `CncProcess` | `src/types/landing.ts` | Contrato de tipos. **No agregar campos sin necesidad real.** |
| `CNC_ALLOYS`, `CNC_PROCESSES`, `DEFAULT_CNC_ALLOY_ID` | `src/data/landingData.ts` | Catálogos. Única fuente de verdad. |
| Wizard | `src/components/CotizadorTecnico.tsx` | Consume los catálogos: paso 01 (cards de proceso + chips de aleación), sidebar, ficha y mensaje de WhatsApp. **No hardcodear aleaciones ni procesos acá.** |

El wizard es data-driven: agregar una entrada al catálogo alcanza para que aparezca en la UI. Solo hay
que tocar el componente si la entrada necesita un comportamiento nuevo (y eso queda fuera de esta skill:
avisar al usuario antes).

## Flujo

### 1. Recolectar datos (preguntar lo que falte, no inventar especificaciones técnicas)

**Aleación** (`CncAlloy`):
- `id`: kebab-case, único (ej. `'2024-t351'`).
- `code`: número de serie corto, sin temple (ej. `'2024'`). Se usa en el código de proyecto `REQ-<code>-…`.
- `label`: texto visible completo, mismo estilo que los existentes (ej. `'Aluminio 2024-T351 (placa)'`).
- `note`: una línea técnica breve (temple, propiedad clave, advertencia de uso).

**Proceso** (`CncProcess`):
- `id`, `code` (2 letras mayúsculas, único — se usa en el código de proyecto), `label`, `icon`
  (nombre válido de Material Symbols Outlined), `description`, `tag`, `tolerance` (formato `'±0.05 mm'`),
  `machine`.
- `defaultAlloyId`: `id` existente en `CNC_ALLOYS`, u omitirlo si la aleación se verifica en banco.

### 2. Validar antes de editar
- `id` y `code` no colisionan con entradas existentes (`grep -n "code:" src/data/landingData.ts`).
- `defaultAlloyId` apunta a un `id` que existe.
- Textos en español, mismo tono técnico/HUD que el resto del archivo.

### 3. Editar `src/data/landingData.ts`
- Agregar la entrada **al final** del array correspondiente (`CNC_ALLOYS` o `CNC_PROCESSES`), con el
  tipo ya importado. No reordenar ni tocar entradas existentes.
- No cambiar `DEFAULT_CNC_ALLOY_ID` salvo pedido explícito: cambia el código de proyecto por defecto.

### 4. Revisar el wizard (solo lectura salvo excepción)
- Confirmar que la nueva entrada no requiere lógica nueva en `CotizadorTecnico.tsx`.
- Si hace falta tocar UI, usar **solo tokens del tema** (`tailwind.config.js`): colores `canvas`,
  `surface-card`, `metal`, `accent-red`, `accent-green`, `main`, `muted`; fuentes `font-sans`/`font-body`/
  `font-mono`; `rounded-sm`; sombras `shadow-glow-red`/`shadow-panel`. Nada de hex sueltos ni
  colores de la paleta default de Tailwind (`bg-gray-800`, `text-red-500`, …). Copiar las clases del
  chip/card vecino en lugar de inventar variantes.

### 5. Verificar
1. `npm run lint` (es `tsc --noEmit`): debe pasar sin errores.
2. `npm run build`: debe pasar.
3. Comprobación de datos: la entrada aparece una sola vez y con el tipo correcto
   (`grep -n "<id>" src/data/landingData.ts`).
4. Si es posible, `npm run dev` → `/cotizador-tecnico`: la aleación aparece como chip en el paso 01
   (o el proceso como card); al seleccionarla, el sidebar "Aleación sugerida", el código de proyecto
   (`REQ-<code>-…`), la ficha técnica y el texto de WhatsApp la reflejan.

### 6. Reportar
Resumir qué entrada se agregó, en qué archivo/línea, y el resultado de lint/build. Si no se pudo
verificar en el navegador, decirlo explícitamente.
