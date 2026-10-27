import { expect, test } from '@playwright/test'
import { CNC_ALLOYS, CNC_POLYMERS, CNC_PROCESSES } from '../src/data/landingData'

// Flujo crítico: configurar una matriz en los 4 pasos del wizard y registrar la solicitud.
const proceso = CNC_PROCESSES.find((p) => p.id === 'molde')!
const aleacion = CNC_ALLOYS.find((a) => a.id === proceso.defaultAlloyId)!
const polimero = CNC_POLYMERS.find((p) => p.id === 'pu')!

test('completa el wizard de punta a punta y muestra la confirmación con código de seguimiento', async ({ page }) => {
  await page.goto('/cotizador-tecnico')
  await expect(page.getByRole('heading', { name: 'Configuración de matriz // Nuevo proyecto' })).toBeVisible()

  const enviar = page.getByRole('button', { name: 'Enviar solicitud a ingeniería' })
  await expect(enviar).toBeDisabled()

  // Paso 01 — requerimiento (precarga la aleación por defecto del proceso)
  await page.getByRole('button', { name: new RegExp(proceso.label) }).click()
  await expect(page.getByText(aleacion.note)).toBeVisible()
  await expect(page.getByText(proceso.machine, { exact: true })).toBeVisible()

  // Paso 02 — polímero
  await page.getByRole('button', { name: polimero.label, exact: true }).click()
  await expect(page.getByText(`1.2% (base ${polimero.label})`).first()).toBeVisible()

  // Paso 03 — geometría (placeholder): se elige muestra física
  await page.getByRole('button', { name: 'Muestra física u horma' }).click()
  await expect(page.getByText('Foto 01 — Frente')).toBeVisible()

  // Paso 04 — curva de tallas, nota y contacto
  await page.getByLabel('Talla inicial:').fill('38')
  await page.getByLabel('Talla final:').fill('42')
  await expect(page.getByText('05', { exact: true })).toBeVisible()
  await page.getByLabel('Nota para ingeniería (opcional):').fill('E2E Playwright: logotipo grabado en talón.')
  await page.getByLabel('Nombre y apellido:').fill('Modelista E2E')
  await page.getByLabel('Empresa (opcional):').fill('Calzados de Prueba S.A.')
  await page.getByLabel('Email:').fill('e2e@lacers-cnc.test')
  await page.getByRole('checkbox', { name: /Acepto que LACERS guarde estos datos/ }).check()

  await expect(page.getByText('Configuración válida // lista para envío')).toBeVisible()
  await expect(enviar).toBeEnabled()
  await enviar.click()

  // Confirmación: ficha con el código público REQ-<aleación>-<proceso><pares>-<folio>
  const codigo = new RegExp(`^REQ-${aleacion.code}-${proceso.code}05-\\d{6}$`)
  await expect(page.getByText('// Solicitud registrada')).toBeVisible()
  await expect(page.getByText(codigo).first()).toBeVisible()
  await expect(page.getByText('38—42 / 5 pares')).toBeVisible()
  await expect(page.getByText('Muestra física · pendiente de recepción en taller').last()).toBeVisible()
  await expect(page.getByRole('link', { name: '[ Seguir por WhatsApp con ingeniería ]' })).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/\d+\?text=/,
  )

  // Al cerrar la ficha, el sidebar queda con el estado registrado
  await page.getByRole('button', { name: 'Cerrar' }).click()
  await expect(page.getByText('// Solicitud registrada')).toBeHidden()
  await expect(page.getByText('Status: solicitud registrada')).toBeVisible()
  await expect(page.getByText(codigo)).toBeVisible()

  // Reenviar el mismo formulario reutiliza la Idempotency-Key: replay 200 con el mismo código
  const registrado = await page.getByText(codigo).textContent()
  const replay = page.waitForResponse((res) => res.url().endsWith('/api/quotes') && res.request().method() === 'POST')
  await enviar.click()
  const respuesta = await replay
  expect(respuesta.status()).toBe(200)
  expect((await respuesta.json()).publicCode).toBe(registrado)
  await expect(page.getByText('// Solicitud registrada')).toBeVisible()
})
