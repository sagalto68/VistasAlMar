## Vistas al Mar — Apartamento en Platja d'Aro

Pequeño proyecto web para mostrar el apartamento **Vistas al Mar** y gestionar solicitudes de reserva conectadas con **Google Sheets + Google Calendar** mediante **Google Apps Script**.

La web es estática (HTML/CSS/JS) y se puede alojar en cualquier hosting estático (Netlify, GitHub Pages, Cloudflare Pages, etc.).

---

### Estructura del proyecto

- `index.html`  
  Landing de una sola página con:
  - Sección hero y descripción del apartamento.
  - Galería de fotos.
  - Calendario de disponibilidad y formulario de reserva.
  - Secciones de actividades y restaurantes recomendados.

- `css/styles.css`  
  Estilos globales de la web (tipografías, colores, layout, calendario, formularios…).

- `js/app.js`  
  Lógica de la aplicación:
  - Carga de precios diarios (`getPricing`) desde Apps Script.
  - Carga de fechas reservadas (`getBookings`).
  - Renderizado del calendario y cálculo de precio total (noches + limpieza).
  - Envío de la solicitud de reserva (`createBooking` vía POST).
  - Panel admin básico (`getStats`) y tracking de visitas.
  - Galería de imágenes y lightbox.

- `fotos/`  
  Imágenes utilizadas en la web (hero, interiores, playa).

- `docs/README_VistasAlMar.txt`  
  Documentación técnica detallada: estructura de la hoja de cálculo, Apps Script, flujo de confirmación, etc.

- `docs/RESUMEN_TRABAJOS.txt`  
  Resumen de cambios, mejoras y bugs corregidos durante la puesta en marcha.

---

### Backend (resumen rápido)

El backend vive en **Google Apps Script** y trabaja sobre una hoja de cálculo con al menos estas pestañas:

- `Precios`: calendario horizontal con:
  - Fila 1: fechas (tipo fecha).
  - Fila 2: precio por noche.
  - Celda B5: importe de limpieza.
- `Reservas`: solicitudes y reservas con estado (`Pendiente`, `Confirmada`, `Cancelada`).
- `Visitas`: registros de visitas a la web.

Endpoints principales del Web App:

- `action=getPricing`  → precios diarios + limpieza.
- `action=getBookings` → rangos ocupados (confirmadas + pendientes).
- `action=createBooking` (POST) → crea una fila en `Reservas` y envía correos de “solicitud recibida”.
- `action=getStats`    → métricas para el panel admin.
- `action=trackVisit`  → tracking sencillo de visitas.

La confirmación/cancelación definitiva se hace cambiando el **Estado** en la pestaña `Reservas` (dispara el trigger `onSheetEdit`, envía emails y crea/actualiza eventos en Google Calendar).

---

### Desarrollo en local

Requisitos mínimos:

- Servidor estático (Laragon, `python -m http.server`, `npx serve`, etc.).
- Acceso al Web App de Google Apps Script configurado en `js/app.js` (`APPS_SCRIPT_URL`).

Ejemplo con Laragon (carpeta en `C:\laragon\www\vistasalmar`):

- Arrancar Laragon y acceder a `http://localhost/vistasalmar/`.

---

### Flujo de reserva (vista de negocio)

1. El huésped selecciona un rango de fechas en el calendario y envía el formulario.
2. La web calcula:
   - Nº de noches.
   - Precio total (noches + limpieza).
   - Desglose detallado por día.
3. Se crea una fila en `Reservas` con Estado **Pendiente** y se envían correos:
   - Al huésped: “Solicitud recibida — confirmaremos en \<24h”.
   - Al propietario: detalle de la solicitud.
4. El propietario abre la hoja `Reservas` y cambia el Estado:
   - A **Confirmada** → email de confirmación + evento en Google Calendar.
   - A **Cancelada**  → email de cancelación + evento marcado como cancelado (si existía).

---

### Próximos pasos / ideas

- Confirmar / cancelar reservas directamente desde el email del propietario (enlaces a Apps Script).
- Menú personalizado en la hoja `Reservas` (filtros rápidos de pendientes, etc.).
- Extender el panel admin de la web (`?panel=vistasMar2025`) para listar reservas pendientes con acciones de Confirmar/Cancelar.

