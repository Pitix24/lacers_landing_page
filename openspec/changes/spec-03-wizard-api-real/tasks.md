# Tasks — spec-03-wizard-api-real

- [x] 1. Paso de contacto: nombre, empresa, email o teléfono, checkbox de privacidad
- [x] 2. Honeypot `website` oculto
- [x] 3. `submitQuote` (`src/lib/cotizador/client.ts`) con timeout de 20 s y resultados tipados
- [x] 4. `Idempotency-Key` generada al enviar y reutilizada mientras el payload no cambie (en memoria del componente)
- [ ] 5. Persistir la clave y el borrador en `localStorage` (`lacers.cotizador.draft.v1`, ADR-0009/0011)
- [x] 6. Errores por campo (400), diálogo de reuso (409 → "enviar como nueva solicitud"), 503/red → "Reintentar" + WhatsApp
- [ ] 7. 429 con link a WhatsApp (depende del rate limit de spec-02)
- [x] 8. Confirmación con `public_code`, pares y contracción del servidor; aviso de "modo local" si `storage = memory`
- [x] 9. WhatsApp como canal complementario con el código en el mensaje
- [ ] 10. Persistir la confirmación en `lacers.cotizador.last.v1`
- [ ] 11. E2E Playwright "wizard completo → `public_code`" y "reintento tras falla" contra un preview
- [x] 12. `npm run build` pasa
