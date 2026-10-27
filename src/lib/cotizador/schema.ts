import { z } from 'zod'
import { CNC_ALLOYS, CNC_POLYMERS, CNC_PROCESSES } from '../../data/landingData.js'

// Esquemas compartidos por el wizard (SPA) y las Functions de api/ (ADR-0007).
// Imports relativos con .js: este módulo también se ejecuta como ESM en Node.

export const SIZE_MIN = 15
export const SIZE_MAX = 50

const size = (which: 'inicial' | 'final') => {
  const range = { error: `Las tallas van de ${SIZE_MIN} a ${SIZE_MAX}.` }
  return z
    .number({ error: `Ingresá la talla ${which}.` })
    .int({ error: 'La talla debe ser un número entero.' })
    .min(SIZE_MIN, range)
    .max(SIZE_MAX, range)
}

const ids = <T extends { id: string }>(items: T[]) => items.map((item) => item.id) as [string, ...string[]]

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined))

export const quoteRequestInputSchema = z
  .object({
    processId: z.enum(ids(CNC_PROCESSES), { error: 'Elegí un tipo de requerimiento.' }),
    alloyId: z.enum(ids(CNC_ALLOYS), { error: 'Aleación desconocida.' }).nullable(),
    polymerId: z.enum(ids(CNC_POLYMERS), { error: 'Elegí un polímero.' }),
    geometryMode: z.enum(['cad', 'muestra']),
    sizeStart: size('inicial'),
    sizeEnd: size('final'),
    note: optionalText(1000),
    contact: z.object({
      name: z.string().trim().min(2, { error: 'Ingresá tu nombre.' }).max(120),
      company: optionalText(120),
      email: z
        // El error va en la rama: Zod 4 reporta el issue de la rama que coincide en tipo, no el de la unión.
        .union([z.literal(''), z.email({ error: 'Email inválido.' }).max(200, { error: 'Email inválido.' })])
        .optional()
        .transform((value) => (value ? value.toLowerCase() : undefined)),
      phone: z
        .union([z.literal(''), z.string().trim().regex(/^[+\d][\d\s()-]{5,30}$/, { error: 'Teléfono inválido.' })])
        .optional()
        .transform((value) => (value ? value : undefined)),
    }),
    privacyAccepted: z.literal(true, { error: 'Tenés que aceptar la política de privacidad.' }),
    /** Honeypot (ADR-0010): campo oculto que una persona deja vacío. */
    website: z.string().max(200).optional(),
  })
  .superRefine((input, ctx) => {
    if (input.sizeEnd < input.sizeStart) {
      ctx.addIssue({ code: 'custom', path: ['sizeEnd'], message: 'La talla final debe ser mayor o igual a la inicial.' })
    }
    if (!input.contact.email && !input.contact.phone) {
      ctx.addIssue({ code: 'custom', path: ['contact', 'email'], message: 'Dejanos un email o un teléfono.' })
    }
  })

export type QuoteRequestInput = z.input<typeof quoteRequestInputSchema>
export type QuoteRequestData = z.output<typeof quoteRequestInputSchema>
