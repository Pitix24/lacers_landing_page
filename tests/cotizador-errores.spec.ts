import { expect, test, type Page } from '@playwright/test'
import { CNC_POLYMERS, CNC_PROCESSES, HERO_CONTENT, MATERIALS_SECTION } from '../src/data/landingData'

const MSG_PASOS = 'Completá los pasos 01, 02 y 04 para habilitar el envío'
const MSG_CONTACTO = 'Completá tus datos de contacto y aceptá la privacidad'
const MSG_OK = 'Configuración válida // lista para envío'

async function completarPasosTecnicos(page: Page) {
  await page.getByRole('button', { name: new RegExp(CNC_PROCESSES[0].label) }).click()
  await page.getByRole('button', { name: CNC_POLYMERS[0].label, exact: true }).click()
}

test.describe('Cotizador — validaciones de campos obligatorios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cotizador-tecnico')
  })

  test('el envío queda bloqueado hasta completar requerimiento y polímero', async ({ page }) => {
    const enviar = page.getByRole('button', { name: 'Enviar solicitud a ingeniería' })
    await expect(page.getByText(MSG_PASOS)).toBeVisible()
    await expect(enviar).toBeDisabled()

    await page.getByRole('button', { name: new RegExp(CNC_PROCESSES[0].label) }).click()
    await expect(page.getByText(MSG_PASOS)).toBeVisible()
    await expect(enviar).toBeDisabled()

    await page.getByRole('button', { name: CNC_POLYMERS[0].label, exact: true }).click()
    await expect(page.getByText(MSG_CONTACTO)).toBeVisible()
    await expect(enviar).toBeDisabled()
  })

  test('una curva de tallas invertida o vacía invalida el paso 04', async ({ page }) => {
    await completarPasosTecnicos(page)
    const pares = page.getByText('Pares de matrices:').locator('..')

    await page.getByLabel('Talla inicial:').fill('44')
    await page.getByLabel('Talla final:').fill('40')
    await expect(pares).toContainText('--')
    await expect(page.getByText(MSG_PASOS)).toBeVisible()

    await page.getByLabel('Talla final:').fill('')
    await expect(pares).toContainText('--')
    await expect(page.getByText(MSG_PASOS)).toBeVisible()

    await page.getByLabel('Talla final:').fill('45')
    await expect(pares).toContainText('02')
    await expect(page.getByText(MSG_CONTACTO)).toBeVisible()
  })

  test('exige nombre, un medio de contacto y aceptar la privacidad', async ({ page }) => {
    await completarPasosTecnicos(page)
    const enviar = page.getByRole('button', { name: 'Enviar solicitud a ingeniería' })
    const privacidad = page.getByRole('checkbox', { name: /Acepto que LACERS guarde estos datos/ })

    // Nombre de 1 carácter: inválido
    await page.getByLabel('Nombre y apellido:').fill('A')
    await page.getByLabel('Email:').fill('e2e@lacers-cnc.test')
    await privacidad.check()
    await expect(enviar).toBeDisabled()

    // Nombre válido pero sin email ni teléfono
    await page.getByLabel('Nombre y apellido:').fill('Modelista E2E')
    await page.getByLabel('Email:').fill('')
    await expect(page.getByText(MSG_CONTACTO)).toBeVisible()
    await expect(enviar).toBeDisabled()

    // Solo teléfono alcanza
    await page.getByLabel('Teléfono / WhatsApp:').fill('+54 9 11 5555-0000')
    await expect(page.getByText(MSG_OK)).toBeVisible()
    await expect(enviar).toBeEnabled()

    // Sin aceptar privacidad vuelve a bloquear
    await privacidad.uncheck()
    await expect(page.getByText(MSG_CONTACTO)).toBeVisible()
    await expect(enviar).toBeDisabled()
  })

  test('muestra el error de campo que devuelve la API ante un email inválido', async ({ page }) => {
    await completarPasosTecnicos(page)
    await page.getByLabel('Nombre y apellido:').fill('Modelista E2E')
    await page.getByLabel('Email:').fill('no-es-un-email')
    await page.getByRole('checkbox', { name: /Acepto que LACERS guarde estos datos/ }).check()
    await page.getByRole('button', { name: 'Enviar solicitud a ingeniería' }).click()

    await expect(page.getByRole('alert')).toContainText('Revisá los datos de la solicitud.')
    await expect(page.getByText('Email inválido.')).toBeVisible()
    await expect(page.getByText('// Solicitud registrada')).toBeHidden()
  })
})

test.describe('Navegación entre vistas SPA', () => {
  test('navega Home ↔ Cotizador sin recargar el documento', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: HERO_CONTENT.title })).toBeVisible()
    // Marca en window: si la navegación recargara la página, se perdería.
    await page.evaluate(() => ((window as unknown as { __spa: boolean }).__spa = true))

    await page.getByRole('banner').getByRole('link', { name: 'Solicitar Cotización Técnica' }).click()
    await expect(page).toHaveURL('/cotizador-tecnico')
    await expect(page.getByRole('heading', { name: 'Configuración de matriz // Nuevo proyecto' })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __spa?: boolean }).__spa)).toBe(true)

    await page.getByRole('link', { name: /Logo LACERS/ }).click()
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1, name: HERO_CONTENT.title })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __spa?: boolean }).__spa)).toBe(true)
  })

  test('un ancla del navbar desde /cotizador-tecnico vuelve a la Home y hace scroll a la sección', async ({ page }) => {
    await page.goto('/cotizador-tecnico')
    await page.getByRole('banner').getByRole('link', { name: 'Materiales y Contracciones' }).click()

    await expect(page).toHaveURL('/#materiales-y-contracciones')
    await expect(page.getByRole('heading', { name: MATERIALS_SECTION.title })).toBeInViewport()
  })

  test('al entrar al cotizador desde el final de la Home arranca arriba de todo', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
    await page.getByRole('link', { name: 'COTIZAR', exact: true }).click()

    await expect(page).toHaveURL('/cotizador-tecnico')
    await expect(page.getByRole('heading', { name: 'Configuración de matriz // Nuevo proyecto' })).toBeInViewport()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  })
})
