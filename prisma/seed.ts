import { config } from 'dotenv'
import { CNC_ALLOYS, CNC_POLYMERS } from '../src/data/landingData.js'
import { getPrisma } from '../server/neon.js'

config({ path: ['.env.local', '.env'], quiet: true })

// Sincroniza el espejo cnc_materials con el catálogo en código (fuente de verdad, ADR-0005).
// Correr contra la rama dev de Neon: `npm run db:seed`.

const prisma = getPrisma()

const materials = [
  ...CNC_ALLOYS.map((a) => ({ id: a.id, kind: 'alloy' as const, code: a.code, label: a.label, note: a.note, shrinkagePct: null })),
  ...CNC_POLYMERS.map((p) => ({ id: p.id, kind: 'polymer' as const, code: p.code, label: p.label, note: null, shrinkagePct: p.shrinkagePct })),
]

await prisma.$transaction([
  ...materials.map((m) => prisma.cncMaterial.upsert({ where: { id: m.id }, create: m, update: { ...m, active: true } })),
  prisma.cncMaterial.updateMany({ where: { id: { notIn: materials.map((m) => m.id) } }, data: { active: false } }),
])
console.log(`cnc_materials sincronizado: ${materials.length} materiales activos`)
await prisma.$disconnect()
