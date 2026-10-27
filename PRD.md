---
title: "Landing Page Lacers — Matricería con Cotizador Técnico"
---

# PRD: Landing Page Lacers — Matricería con Cotizador Técnico

## Problema

Hoy, Lacers cotiza matrices y piezas troqueladas de forma 100% manual, vía WhatsApp y
llamadas, con el filtro técnico recayendo en un solo ingeniero — un recurso escaso y caro de
tiempo. Muchas consultas terminan en reuniones presenciales (el cliente lleva mallas, moldes
de prueba o el producto final a replicar) que arrancan sin información previa, alargando el
ciclo de cotización. Además, la landing actual no transmite la información de forma clara ni
profesional. Como el sitio es nuevo, hay una oportunidad de resolver ambas cosas desde el
lanzamiento: dar una primera estimación automática que filtre y adelante datos técnicos, y
proyectar una imagen profesional.

## Usuario objetivo

El usuario objetivo es el **Emprendedor** (o representante técnico de una empresa, sin equipo
de ventas dedicado) que se contacta con Lacers para fabricar una matriz o pieza troquelada.
Llega con una idea general del producto pero generalmente ya conoce (o puede estimar)
dimensiones, material y tolerancias — pocas veces llega sin noción del alcance. Casi siempre
trae algún tipo de referencia física o digital (molde, pieza de prueba, fotos, o el archivo del
diseño) que hoy solo se puede evaluar en una reunión presencial o por correo/WhatsApp con el
ingeniero.

## Objetivo / resultado esperado

Con el Cotizador funcionando, el ingeniero de Lacers debería tener menos reuniones "en blanco"
y cotizaciones más rápidas de armar — sin eliminar la reunión presencial (sigue siendo
obligatoria por el molde/pieza física), pero llegando con la información técnica mínima ya
adelantada. El éxito se ve en más consultas que llegan con datos preparados, menos idas y
vueltas para juntar información básica, y menos solicitudes vacías o inviables ocupando tiempo
del ingeniero. Se espera empezar a notar este cambio en el primer trimestre desde el
lanzamiento.

## Alcance (qué sí incluye esta versión)

- Landing institucional con las secciones: Presentación/Hero, Servicios, Portfolio de trabajos
  ya realizados, Contacto.
- Cotizador Técnico como flujo end-to-end:
  - Inputs: dimensiones, material, tolerancias, cantidad de piezas, proceso deseado, y plazo
    deseado por el cliente (afecta prioridad/estimación).
  - Output: rango estimado de precio + tiempo de fabricación.
  - Cierre: botón de envío por **mailto** (único canal que cuenta como envío formal de la
    cotización, con todos los datos técnicos armados en el mensaje) y botón de **WhatsApp**
    como contacto general (coordinar reunión presencial, evidencias, demos).
- El cálculo del cotizador se ejecuta con reglas de precios almacenadas en **PostgreSQL**
  (ya no hardcodeadas en el código).
- Cada cotización generada se **persiste en base de datos** (historial y consulta posterior).
- **Panel de administración de precios**: el ingeniero/admin edita la tabla de precios y reglas
  de cálculo (por material, dimensión, tolerancia, plazo) sin tocar código, protegido por
  **login** (solo rol admin — el cliente final del cotizador sigue sin login).

<!-- REVISAR: cambio de No-Scope — se agrega PostgreSQL, persistencia de cotizaciones y panel
admin con login. Esto implica algún tipo de backend/API (no se puede exponer Postgres ni
validar login desde frontend puro), pero el enfoque concreto (backend propio liviano vs.
BaaS tipo Supabase/Neon) todavía NO está decidido — resolver en tech design antes de
implementar. GCP, API de Gmail y pasarela de pago siguen fuera de alcance. -->

<!-- REVISAR: la tabla de precios y reglas de cálculo (por material, dimensión, tolerancia,
plazo) todavía no tiene valores definidos — sigue siendo dependencia crítica para el motor del
cotizador, independientemente de dónde viva (código o DB). Ver Supuestos y riesgos. -->

## No alcance (qué explícitamente no incluye esta versión)

- No incluye seguimiento de estado de una cotización (ej: "en revisión", "aprobada") — se
  persiste el registro, pero no hay flujo de estados. <!-- REVISAR: confirmar si el panel admin
  necesita alguna vista de historial/listado de cotizaciones, o solo administra precios -->
- No incluye login ni cuentas para el **cliente final** del cotizador — sigue siendo consulta
  libre y anónima. El login aplica únicamente al panel admin de precios.
- No incluye GCP, APIs de Gmail, ni pasarela de pago (regla de No-Scope original, sin cambios).
- El botón de WhatsApp no lleva los datos técnicos de la cotización ni se rastrea qué pasa en
  esa conversación — es un canal externo al sistema.

## Criterios de éxito

- **Métrica principal:** calidad del contacto recibido — % de mensajes de mail (vía mailto)
  que llegan con los datos técnicos completos (dimensiones, material, tolerancias, cantidad,
  proceso, plazo), en vez de vacíos o a medio completar.
- **Umbral:** sin número fijo definido todavía. <!-- REVISAR: definir un umbral concreto (ej:
  % de contactos completos) una vez haya datos reales de uso, para que este criterio sea
  evaluable -->
- **Ventana de evaluación:** primer trimestre desde el lanzamiento.
- **Anti-métricas** (no se consideran señal de éxito por sí solas): cantidad de visitas a la
  landing sin conversión a contacto, y tiempo de navegación en el sitio.

## Casos borde a contemplar

- Si el usuario carga valores fuera de un rango razonable (ej: dimensiones extremas), el
  cotizador no bloquea el flujo — muestra una alerta de "caso complicado/especial" pero permite
  continuar y enviar la solicitud igual.
- Si el usuario abandona el flujo a la mitad, el progreso se persiste en localStorage del
  navegador para retomarlo sin perder lo cargado.
- El mailto es el único canal que cuenta como envío formal de la cotización. El botón de
  WhatsApp es de contacto general, no lleva los datos técnicos ni se registra en el sistema.

## Supuestos y riesgos abiertos

**Supuestos:**
- Asumimos que el cliente conoce (o puede estimar razonablemente) términos técnicos como
  "material", "tolerancia" y dimensiones, sin necesitar asesoría previa para completar el
  cotizador. <!-- REVISAR: validar con los primeros usuarios reales, dado que el PRD también
  reconoce que "pocas veces" llega alguien sin noción del alcance -->
- Asumimos que el emprendedor siempre trae o puede describir una referencia (molde, pieza,
  foto, archivo) para la reunión presencial posterior.

**Riesgos:**
- La tabla de precios y reglas de cálculo del cotizador no tiene valores definidos aún — es la
  dependencia crítica que bloquea implementar el motor de cálculo. <!-- REVISAR: definir esta
  tabla antes de iniciar el desarrollo del cotizador -->
- El rango estimado por el cotizador puede diferir significativamente del precio real final
  (que depende de ver el molde/pieza física en la reunión presencial), generando expectativas
  mal puestas o desconfianza si la diferencia es muy grande.
- La arquitectura de backend para Postgres + login admin no está decidida (backend propio vs.
  BaaS gestionado) — esto es ahora la dependencia crítica de mayor riesgo del proyecto, porque
  reintroduce infraestructura de servidor que el No-Scope original quería evitar. <!-- REVISAR:
  resolver en tech design antes de estimar cronograma -->
