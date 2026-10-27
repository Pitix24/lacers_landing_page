#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

pause_for_evidence() {
  local clase="$1"
  local evidencia="$2"
  local board_url="$3"
  echo ""
  echo -e "${YELLOW}======================================================================"
  echo -e "⏸️  PAUSA DE EVIDENCIA — ${clase}"
  echo -e "📸 Qué capturar: ${evidencia}"
  echo -e "🔗 Subir a Collab: ${board_url}"
  echo -e "======================================================================${NC}"
  read -p "Presiona [ENTER] cuando hayas tomado la captura y subido tu evidencia para avanzar a la siguiente sesión..."
  echo ""
}

echo -e "${CYAN}🚀 Iniciando puesta al día automatizada: LACERS CNC (Clases 4 a 14)${NC}"

# ------------------------------------------------------------------------------
# FASE 0: Pre-instalación masiva de Skills de Armory y herramientas CLI
# ------------------------------------------------------------------------------
echo -e "${GREEN}[Fase 0] Instalando catálogo de Skills de OrysLabs Armory y utilidades...${NC}"
npx skills add https://github.com/juliusbrussee/caveman --skill caveman || true
npx skills add adminoryslabs/Armory --skill generar-prd-conversacional || true
npx skills add adminoryslabs/Armory --skill generar-tech-design || true
npx skills add adminoryslabs/Armory --skill revision-adversarial || true
npx skills add adminoryslabs/Armory --skill generar-backlog || true
npx skills add adminoryslabs/Armory --skill crear-guardrail || true
npx skills add adminoryslabs/Armory --skill playwright-e2e-test || true
npx skills add adminoryslabs/Armory --skill security-pass || true
npx skills add adminoryslabs/Armory --skill deploy-pass || true
npx skills add adminoryslabs/Armory --skill generar-readme || true
npx skills add https://github.com/softaworks/agent-toolkit --skill mermaid-diagrams || true
npx skills add https://github.com/tt-a1i/archify --skill archify || true

mkdir -p docs/{01-producto,02-diseno,03-arquitectura/adrs,04-backlog,05-specs,06-diagramas,07-testing,08-seguridad,09-deploy}
mkdir -p skills/agregar-aleacion-cnc .claude/agents

# ------------------------------------------------------------------------------
# CLASE 4: Agent Skills y Skill Propia del Proyecto
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASE 4: Agent Skills (Conocimiento Tribal del Proyecto) ===${NC}"
echo "Concepto clave: Una Skill empaqueta instrucciones específicas de tu negocio (en SKILL.md) para que el agente ejecute tareas repetitivas respetando tus convenciones sin re-explicarlas."

claude --dangerously-skip-permissions -p "Crea una skill personalizada para este repositorio en skills/agregar-aleacion-cnc/SKILL.md (y regístrala en .claude/skills si aplica) llamada 'agregar-aleacion-cnc'. Su propósito es permitir agregar una nueva aleación o proceso de mecanizado CNC en src/data/landingData.ts y en el wizard de /cotizador-tecnico manteniendo el tipado de src/types/landing.ts y los tokens de diseño Tailwind. Luego, usa esa skill para agregar la aleación 'Aluminio Aeroespacial 2024-T351' como ejemplo verificable."

pause_for_evidence "CLASE 4 (Agent Skills)" \
  "Terminal mostrando skills/agregar-aleacion-cnc/SKILL.md y el cambio en src/data/landingData.ts" \
  "https://collab.oryslabs.com/boards/86c9b46d-74ee-40b3-ad4b-27c1b40cd1da"

# ------------------------------------------------------------------------------
# CLASE 5: Harness Engineering, PRD.md, DESIGN.md y CLAUDE.md
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASE 5: Harness Engineering, PRD.md y CLAUDE.md ===${NC}"
echo "Concepto clave: El PRD define QUÉ construimos (alcance funcional MVP) y CLAUDE.md actúa como el arnés raíz con las reglas arquitectónicas y comandos que el agente lee al iniciar cada sesión."

claude --dangerously-skip-permissions -p "Usa la estructura de la skill generar-prd-conversacional para generar sin preguntas interactivas el documento docs/01-producto/PRD.md para LACERS CNC. Alcance del MVP: 1) Catálogo técnico interactivo de matricería CNC (aluminio 7075-T6, 6061, 2024-T351) y telemetría. 2) Wizard de Cotización Técnica en /cotizador-tecnico que guarde solicitudes reales en base de datos PostgreSQL (Neon) con cálculo preliminar de contracción y tiempos de mecanizado. 3) Panel administrativo protegido (/admin) para consultar y cambiar el estado de las cotizaciones recibidas. Además, documenta el sistema de diseño actual en docs/02-diseno/DESIGN.md y genera el archivo CLAUDE.md en la raíz del proyecto referenciando docs/01-producto/PRD.md y docs/02-diseno/DESIGN.md."

pause_for_evidence "CLASE 5 (PRD.md y CLAUDE.md)" \
  "Archivos docs/01-producto/PRD.md, docs/02-diseno/DESIGN.md y CLAUDE.md en el repositorio" \
  "https://collab.oryslabs.com/boards/86c9b46d-74ee-40b3-ad4b-27c1b40cd1da"

# ------------------------------------------------------------------------------
# CLASE 6: Diseño Técnico (TECH-DESIGN.md), ADRs y Revisión Adversarial
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASE 6: Tech Design, ADRs y Revisión Adversarial ===${NC}"
echo "Concepto clave: Antes de tocar código, el agente diseña la arquitectura técnica (TECH-DESIGN.md + ADRs) y un segundo pase adversarial busca agujeros de seguridad, acoplamiento o límites de capa gratuita."

claude --dangerously-skip-permissions -p "Ejecuta la skill generar-tech-design tomando como entrada docs/01-producto/PRD.md y CLAUDE.md. Nota mandatoria del curso: El proyecto se DEBE poder desplegar en Vercel free tier y la base de datos para persistencia DEBE ser PostgreSQL en Neon (usando Prisma o @neondatabase/serverless y Serverless Functions / API Routes compatibles con Vercel). Guarda la versión inicial en docs/03-arquitectura/TECH-DESIGN-v1.md y genera al menos 8 ADRs numerados en docs/03-arquitectura/adrs/ (incluyendo persistencia Neon PostgreSQL, despliegue Vercel free tier, arquitectura de API REST, validación server-side, autenticación admin por cookie firmada e idempotencia en cotizaciones). Luego, aplica la skill revision-adversarial sobre TECH-DESIGN-v1.md y genera la versión corregida final en docs/03-arquitectura/TECH-DESIGN.md."

pause_for_evidence "CLASE 6 (Tech Design + ADRs + Revisión Adversarial)" \
  "Vista de docs/03-arquitectura/TECH-DESIGN.md y listado de archivos en docs/03-arquitectura/adrs/" \
  "https://collab.oryslabs.com/boards/1fbfdd32-7f49-417b-b7c1-77bf0e1c2fd8"

# ------------------------------------------------------------------------------
# CLASE 7: Backlog de Specs y OpenSpec
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASE 7: Despiece en BACKLOG.md y Arnés OpenSpec ===${NC}"
echo "Concepto clave: Descomponemos el PRD y el Tech Design en unidades mínimas verificables (Specs) dentro de BACKLOG.md y usamos OpenSpec para planificar e implementar cada Spec sin alucinaciones."

claude --dangerously-skip-permissions -p "Ejecuta la skill generar-backlog usando docs/01-producto/PRD.md, docs/03-arquitectura/TECH-DESIGN.md y los ADRs en docs/03-arquitectura/adrs/. Genera docs/04-backlog/BACKLOG.md con las especificaciones ordenadas por dependencia (Spec 1: Configuración de persistencia PostgreSQL Neon + Prisma Schema para cotizaciones CNC; Spec 2: Endpoints API REST /api/cotizaciones y /api/catalogo con validación server-side; Spec 3: Conexión del Wizard /cotizador-tecnico con la API real y confirmación con código de seguimiento; Spec 4: Panel /admin con autenticación para gestionar cotizaciones). Además, crea la estructura de planificación en openspec/ (config.yaml, specs/ y changes/) y el resumen en docs/05-specs/README.md."

pause_for_evidence "CLASE 7 (BACKLOG.md y OpenSpec)" \
  "Archivo docs/04-backlog/BACKLOG.md y estructura generada en la carpeta openspec/" \
  "https://collab.oryslabs.com/boards/86c9b46d-74ee-40b3-ad4b-27c1b40cd1da"

# ------------------------------------------------------------------------------
# CLASE 8: Memoria Persistente (Engram), Hooks y Guardrails
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASE 8: Engram, Hooks y Guardrails (.claude/settings.json) ===${NC}"
echo "Concepto clave: Los Hooks inyectan contexto determinístico en cada prompt y los Guardrails (permissions.deny) bloquean por configuración cualquier comando destructivo o filtración de secretos."

claude --dangerously-skip-permissions -p "Configura .claude/settings.json para este proyecto incluyendo: 1) Un hook en UserPromptSubmit que recuerde al agente respetar los tokens de diseño de LACERS y responder con concisión técnica. 2) Una lista robusta de guardrails en permissions.deny que bloquee: Bash(rm -rf /), Bash(sudo rm -rf *), Read(.env), Read(.env.*), Edit(.env), Edit(.env.*), Read(.ssh/*), Read(**/*.pem), Read(**/*.key), Read(**/secrets/*) y Bash(git push --force*)."

pause_for_evidence "CLASE 8 (Engram, Hooks y Guardrails)" \
  "Contenido de .claude/settings.json mostrando los bloques hooks y permissions.deny (y ventana de engram tui si lo tienes instalado)" \
  "https://collab.oryslabs.com/boards/86c9b46d-74ee-40b3-ad4b-27c1b40cd1da"

# ------------------------------------------------------------------------------
# CLASE 9: Subagentes, Persistencia Neon PostgreSQL e Implementación de Specs
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASE 9: Subagentes, Neon PostgreSQL y Ejecución de Specs ===${NC}"
echo "Concepto clave: Los subagentes (.claude/agents/) operan con ventana de contexto aislada (caja negra) para implementar Specs en paralelo o auditar código sin contaminar la sesión del agente orquestador."

claude --dangerously-skip-permissions -p "Realiza las tareas de la Clase 9: 1) Crea dos subagentes en .claude/agents/: 'code-reviewer.md' (especialista en revisión de calidad, tipado TypeScript y seguridad) y 'spec-implementer.md' (ejecutor independiente de specs del backlog con acceso a base de datos Neon y Prisma). 2) Configura la capa de persistencia para PostgreSQL en Neon creando prisma/schema.prisma (modelo QuoteRequest para el cotizador técnico CNC y modelo CncMaterial), neon.ts y .env.example. 3) Implementa los endpoints serverless en api/ (compatibles con Vercel) y conecta el formulario de /cotizador-tecnico para que envíe y persista las cotizaciones reales (con fallback seguro en local/test si DATABASE_URL no está activa) y agrega la vista /admin para listar cotizaciones. Documenta el avance de las specs en openspec/ y docs/05-specs/README.md."

pause_for_evidence "CLASE 9 (Subagentes + Neon DB + Specs Implementadas)" \
  "Archivos en .claude/agents/, prisma/schema.prisma, y la app corriendo con /cotizador-tecnico y /admin" \
  "https://collab.oryslabs.com/boards/f07c2b71-e4f3-4497-86e9-dfe7f36281a9"

# ------------------------------------------------------------------------------
# CLASE 10: CodeGraph y Diagramas de Arquitectura (Mermaid)
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASE 10: CodeGraph y Diagramas de Secuencia con Mermaid ===${NC}"
echo "Concepto clave: CodeGraph combina análisis estático (AST) y embeddings para que el agente navegue el grafo real de llamadas del código y genere diagramas de arquitectura exactos sin alucinar archivos."

claude --dangerously-skip-permissions -p "Analiza el grafo de componentes y llamadas del repositorio y genera en docs/06-diagramas/ tres entregables usando la skill mermaid-diagrams: 1) docs/06-diagramas/cotizacion-secuencia-v1.md con el diagrama de secuencia Mermaid completo del proceso de Cotización Técnica CNC (desde el Wizard en React hasta la validación y persistencia en Neon PostgreSQL). 2) docs/06-diagramas/cotizacion-secuencia-v1.html (versión visualizable en navegador con Mermaid CDN). 3) docs/06-diagramas/admin-flujo-v1.md con el diagrama de flujo de revisión administrativa de cotizaciones."

pause_for_evidence "CLASE 10 (CodeGraph y Diagramas Mermaid)" \
  "Diagrama Mermaid renderizado (abriendo docs/06-diagramas/cotizacion-secuencia-v1.html en el navegador) y salida de CodeGraph" \
  "https://collab.oryslabs.com/boards/86c9b46d-74ee-40b3-ad4b-27c1b40cd1da"

# ------------------------------------------------------------------------------
# CLASE 11: Pruebas End-to-End Automatizadas con Playwright
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASE 11: QA Automatizado End-to-End con Playwright ===${NC}"
echo "Concepto clave: Playwright levanta un navegador real (Chromium) y ejecuta los flujos críticos de punta a punta como un humano, sirviendo como red de seguridad determinística antes de cada despliegue."

claude --dangerously-skip-permissions -p "Usa la skill playwright-e2e-test para configurar y ejecutar las pruebas End-to-End del proyecto: 1) Configura playwright.config.ts dejando únicamente el navegador chromium y activando baseURL y webServer con el comando y puerto reales de este proyecto (npm run dev). 2) Crea en tests/ tres archivos de pruebas E2E que pasen al 100%: tests/cotizador-tecnico.spec.ts (flujo completo de punta a punta en /cotizador-tecnico completando los pasos del wizard hasta la confirmación), tests/cotizador-errores.spec.ts (validaciones de campos obligatorios y navegación entre vistas SPA) y tests/catalogo-telemetria.spec.ts (verificación de CncTelemetryCard, secciones técnicas y CTAs). 3) Ejecuta npx playwright test para verificar que todos los tests pasen en verde y documenta la estrategia en docs/07-testing/README.md."

pause_for_evidence "CLASE 11 (Playwright E2E Testing)" \
  "Terminal mostrando todos los tests de 'npx playwright test' pasando en verde y captura del reporte HTML" \
  "https://collab.oryslabs.com/boards/bc825b43-0546-4bc2-991b-54cf03ce4fa2"

# ------------------------------------------------------------------------------
# CLASE 12: Auditoría de Seguridad (security-pass)
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASE 12: Auditoría de Seguridad OWASP Top 10 (security-pass) ===${NC}"
echo "Concepto clave: El agente audita vulnerabilidades reales (inyección, falta de validación en backend, exposición de API keys/secretos, cabeceras HTTP y CSRF/Auth) y aplica el hardening antes de salir a producción."

claude --dangerously-skip-permissions -p "Ejecuta la skill security-pass sobre todo el repositorio. Genera el informe detallado en docs/08-seguridad/SECURITY-REPORT.md evaluando OWASP Top 10, validación de entradas en el cotizador técnico y API, manejo de variables de entorno (.env.example vs secretos), cabeceras de seguridad en vercel.json y protección de la ruta /admin. Aplica inmediatamente en el código las correcciones para cualquier hallazgo crítico o alto y vuelve a correr npx playwright test para confirmar que nada se rompió."

pause_for_evidence "CLASE 12 (Security Pass & Hardening)" \
  "Archivo docs/08-seguridad/SECURITY-REPORT.md y cabeceras/validaciones de seguridad aplicadas" \
  "https://collab.oryslabs.com/boards/86c9b46d-74ee-40b3-ad4b-27c1b40cd1da"

# ------------------------------------------------------------------------------
# CLASES 13 Y 14: Deploy Pass (CI/CD 4 Pasos), Orden Final y README
# ------------------------------------------------------------------------------
echo -e "${CYAN}=== CLASES 13 Y 14: Sistema de Despliegue CI/CD (deploy-pass) y Cierre Final ===${NC}"
echo "Concepto clave: Desplegar no es solo hacer git push; es construir un pipeline determinístico en GitHub Actions que compile, valide esquemas, corra Playwright E2E, dispare el deploy a Vercel solo si todo pasa, y ejecute Smoke Tests post-deploy."

claude --dangerously-skip-permissions -p "Ejecuta las skills deploy-pass y generar-readme para cerrar el proyecto final siguiendo exactamente el modelo de Marioyahuar/mimo_demo: 1) Genera el plan de despliegue en docs/09-deploy/README.md. 2) Crea el workflow determinístico .github/workflows/ci-cd.yml con los 4 pasos obligatorios exigidos en la rúbrica final: Paso 1 (Build & Schema check con npm ci, validación de Prisma/tipos y npm run build), Paso 2 (Gate de pruebas End-to-End ejecutando npx playwright test con Chromium), Paso 3 (Deploy a Producción en Vercel mediante VERCEL_DEPLOY_HOOK_URL o Vercel CLI solo si las pruebas E2E pasan), y Paso 4 (Smoke Tests post-deploy haciendo chequeos GET de lectura a la URL productiva y verificando respuesta HTTP 200). 3) Crea el índice general en docs/README.md enlazando las carpetas 01-producto a 09-deploy y actualiza el README.md principal con un quickstart en 3 comandos y el mapa completo de artefactos AI-First."

pause_for_evidence "CLASES 13 Y 14 (CI/CD Pipeline + Proyecto Final Completo)" \
  "Archivo .github/workflows/ci-cd.yml, docs/09-deploy/README.md y ejecución del workflow en la pestaña Actions de GitHub" \
  "https://collab.oryslabs.com/boards/86c9b46d-74ee-40b3-ad4b-27c1b40cd1da"

echo -e "${GREEN}🎉 ¡Felicidades! Has completado e integrado las Clases 4 a 14 en lacers_landing_page.${NC}"
