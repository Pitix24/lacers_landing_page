import { expect, test } from '@playwright/test'
import {
  CTA_BANNER_CONTENT,
  GALLERY_CARDS,
  GALLERY_SECTION,
  HERO_CONTENT,
  MATERIALS_SECTION,
  POLYMER_SHRINKAGE_TABLE,
  PRODUCTION_CYCLE_CARDS,
  PRODUCTION_CYCLE_SECTION,
  TELEMETRY_COORDINATES,
  TELEMETRY_HEADER,
  TELEMETRY_STATUS,
  TELEMETRY_TOP_READOUTS,
  WHATSAPP_NUMBER,
  WORKFLOW_SECTION,
  WORKFLOW_STEPS,
} from '../src/data/landingData'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('CncTelemetryCard', () => {
  test('muestra viewport, render y lecturas de máquina', async ({ page }) => {
    await expect(page.getByText(TELEMETRY_HEADER.viewportLabel)).toBeVisible()
    await expect(page.getByRole('img', { name: TELEMETRY_HEADER.imageAlt })).toBeVisible()
    for (const readout of TELEMETRY_TOP_READOUTS) {
      await expect(page.getByText(readout.value, { exact: true })).toBeVisible()
    }
    await expect(page.getByText(TELEMETRY_STATUS.statusValue)).toBeVisible()
    await expect(page.getByText(TELEMETRY_STATUS.toleranceLabel)).toBeVisible()
  })

  test('las coordenadas X/Y/Z se actualizan en vivo dentro del rango de jitter', async ({ page }) => {
    const ejeX = TELEMETRY_COORDINATES.find((c) => c.axis === 'X')!
    const lecturaX = page.getByText(/^X:/)
    await expect(lecturaX).toBeVisible()

    const leer = async () => Number((await lecturaX.textContent())?.match(/-?\d+\.\d{3}/)?.[0])
    const inicial = await leer()
    expect(Math.abs(inicial - ejeX.base)).toBeLessThanOrEqual(0.015)
    await expect.poll(leer, { message: 'la coordenada X debería variar con el jitter' }).not.toBe(inicial)

    for (const c of TELEMETRY_COORDINATES) {
      await expect(page.getByText(new RegExp(`^${c.axis}: -?\\d+\\.\\d{3} mm$`))).toBeVisible()
    }
  })
})

test.describe('Secciones técnicas', () => {
  test('el ciclo de producción lista las 4 tarjetas', async ({ page }) => {
    const seccion = page.locator('#servicios')
    await expect(seccion.getByRole('heading', { name: PRODUCTION_CYCLE_SECTION.title })).toBeVisible()
    for (const card of PRODUCTION_CYCLE_CARDS) {
      await expect(seccion.getByText(card.title, { exact: true })).toBeVisible()
    }
  })

  test('la tabla de contracciones muestra cada polímero con su rango', async ({ page }) => {
    const seccion = page.locator('#materiales-y-contracciones')
    await expect(seccion.getByRole('heading', { name: MATERIALS_SECTION.title })).toBeVisible()
    await expect(seccion.getByText(MATERIALS_SECTION.tableLabel)).toBeVisible()
    for (const polimero of POLYMER_SHRINKAGE_TABLE) {
      await expect(seccion.getByText(polimero.rangeLabel, { exact: true })).toBeVisible()
      await expect(seccion.getByText(polimero.note)).toBeVisible()
    }
  })

  test('la galería muestra las piezas mecanizadas con su imagen', async ({ page }) => {
    const seccion = page.locator('#galeria-cnc')
    await expect(seccion.getByRole('heading', { name: GALLERY_SECTION.title })).toBeVisible()
    for (const card of GALLERY_CARDS) {
      await expect(seccion.getByRole('img', { name: card.alt })).toBeVisible()
      await expect(seccion.getByText(card.code)).toBeVisible()
    }
  })

  test('el flujo certificado lista los 4 pasos', async ({ page }) => {
    const seccion = page.locator('#proceso')
    await expect(seccion.getByRole('heading', { name: WORKFLOW_SECTION.title })).toBeVisible()
    for (const paso of WORKFLOW_STEPS) {
      await expect(seccion.getByText(paso.title, { exact: true })).toBeVisible()
    }
  })
})

test.describe('CTAs', () => {
  test('el CTA principal del Hero lleva al Cotizador Técnico', async ({ page }) => {
    const cta = page.getByRole('main').getByRole('link', { name: HERO_CONTENT.primaryCta.label })
    await expect(cta).toHaveAttribute('href', HERO_CONTENT.primaryCta.href)
    await cta.click()
    await expect(page).toHaveURL('/cotizador-tecnico')
    await expect(page.getByRole('heading', { name: 'Configuración de matriz // Nuevo proyecto' })).toBeVisible()
  })

  test('el CTA de catálogo hace scroll a la galería', async ({ page }) => {
    await page.getByRole('link', { name: HERO_CONTENT.secondaryCta.label }).click()
    await expect(page).toHaveURL(/#galeria-cnc$/)
    await expect(page.getByRole('heading', { name: GALLERY_SECTION.title })).toBeInViewport()
  })

  test('el CTA de WhatsApp abre wa.me en una pestaña nueva', async ({ page }) => {
    const cta = page.getByRole('link', { name: HERO_CONTENT.whatsappCta.label })
    await expect(cta).toHaveAttribute('href', `https://wa.me/${WHATSAPP_NUMBER}`)
    await expect(cta).toHaveAttribute('target', '_blank')
    await expect(cta).toHaveAttribute('rel', /noopener/)
  })

  test('el banner final "COTIZAR" lleva al Cotizador Técnico', async ({ page }) => {
    const banner = page.locator('#cotizacion')
    await expect(banner.getByRole('heading', { name: CTA_BANNER_CONTENT.title })).toBeVisible()
    await banner.getByRole('link', { name: CTA_BANNER_CONTENT.cta.label, exact: true }).click()
    await expect(page).toHaveURL(CTA_BANNER_CONTENT.cta.to)
  })
})
