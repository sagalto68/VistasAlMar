VISTAS AL MAR - DOCUMENTACIÓN PROYECTO
======================================

1. ESTRUCTURA DE CARPETAS
-------------------------

Carpeta del proyecto (raíz):

- index.html
  Página principal del apartamento. Contiene solo el HTML (estructura y contenido).

- css/styles.css
  Estilos globales de la web (colores, tipografías, layout, calendario, formularios, etc.).

- js/app.js
  Lógica de la web:
  - Calendario y disponibilidad.
  - Cálculo de precios y resumen de reserva.
  - Envío de la solicitud al backend (Google Apps Script).
  - Carga de la galería de fotos.
  - Panel de administración (estadísticas).
  - Tracking básico de visitas.

- fotos/
  Imágenes utilizadas por la web (hero, galería y fondos varios).
  Nombres esperados (pueden cambiarse si se actualizan también en app.js y styles.css):
  - hero.jpg, beach.jpg, dining.jpg, kitchen.jpg, living.jpg, bedroom.jpg, bath.jpg

- app script.txt
  Código completo del backend en Google Apps Script.
  Este fichero se copia/pega en script.google.com para crear o actualizar el backend.

- docs/README_VistasAlMar.txt
  Este documento. Explica cómo está montado todo y qué tocar para mantenimiento.


2. VISIÓN GENERAL DEL SISTEMA
-----------------------------

La web es estática (HTML + CSS + JS) y se apoya en un backend en Google Apps Script que
trabaja sobre una hoja de cálculo de Google Sheets y un calendario de Google Calendar.

- FRONTEND (esta carpeta)
  - index.html  -> maqueta y contenido.
  - css/styles.css -> estilos.
  - js/app.js -> lógica de reservas, calendario, galería, panel admin.

- BACKEND (Google)
  - Google Sheets con al menos estas pestañas:
    - "Reservas" -> todas las solicitudes/ reservas.
    - "Visitas"  -> tracking de accesos a la web.
    - "Precios"  -> calendario horizontal de precios por día + coste de limpieza.
  - Google Calendar para marcar las reservas confirmadas.
  - Proyecto de Google Apps Script (Web App) con el contenido de "app script.txt".

El FRONTEND se comunica con el BACKEND a través de la URL del Web App:
  - APPS_SCRIPT_URL en js/app.js


3. BACKEND - GOOGLE APPS SCRIPT
-------------------------------

3.1. Hoja de cálculo (Google Sheets)

Debe existir una hoja de cálculo con estas pestañas mínimas:

- Pestaña "Reservas"
  Se puede crear/actualizar ejecutando en Apps Script la función setupSheets().
  Estructura de columnas (fila 1, cabeceras):
    A: ID
    B: Fecha Solicitud
    C: Nombre
    D: Email
    E: Check-in
    F: Check-out
    G: Personas
    H: Teléfono
    I: Total €
    J: Estado
    K: Motivo Cancelación
    L: ID Evento Calendario
    M: Desglose

- Pestaña "Visitas"
  También creada por setupSheets():
    A: Timestamp
    B: Fecha
    C: Hora
    D: Página
    E: Referrer
    F: Dispositivo

- Pestaña "Precios"
  Debe existir y rellenarse manualmente (o importando un Excel).
  Formato mínimo:
    Fila 1:
      A1: "dia"
      B1, C1, D1, ... -> fechas (tipo fecha de Google, no texto).
    Fila 2:
      A2: "importe"
      B2, C2, D2, ... -> precio por noche para cada día.
    Fila 5:
      B5: importe de limpieza (por ejemplo 80).

  El Apps Script leerá:
    - Fila 1 -> fechas (convertidas a "yyyy/MM/dd").
    - Fila 2 -> precio por noche.
    - B5     -> coste de limpieza.


3.2. Proyecto de Google Apps Script

- Ir a https://script.google.com/ y crear un proyecto.
- Pegar TODO el contenido de "app script.txt".

En el script hay dos bloques importantes a revisar:

- SPREADSHEET_ID
  const SPREADSHEET_ID = 'XXXXXXXXXXXX';
  -> Debe contener el ID de la hoja de cálculo (la parte entre /d/ y /edit en la URL del Sheet).

- CONFIG
  const CONFIG = {
    OWNER_EMAIL:    "propietario@ejemplo.com",   // Quien recibe notificaciones internas
    PUBLIC_EMAIL:   "reserva@ejemplo.com",       // Email público que se muestra y se usa como reply-to
    OWNER_PHONE:    "600 000 000",
    CALENDAR_ID:    "tucalendario@gmail.com",    // ID del calendario de Google para las reservas
    APARTMENT_NAME: "Vistas al Mar",
    LOCATION:       "Playa de Aro, Costa Brava",
    ADMIN_SECRET:   "tuClaveSecretaAdmin123!",   // Clave para acceder al panel de admin
  };

- IMPORTANTE:
  - Si se cambia de cuenta Google o de hoja/calendario, hay que actualizar:
    - SPREADSHEET_ID (ID de la nueva hoja).
    - CONFIG.CALENDAR_ID (nuevo calendario).
    - Emails y teléfono si hace falta.


3.3. Instalación y despliegue del backend

Pasos habituales:

1) Configurar SPREADSHEET_ID y CONFIG en app script.txt y pegarlo en Apps Script.
2) Ejecutar setupSheets() desde el editor de Apps Script (una sola vez).
   - Crea/limpia pestañas "Reservas" y "Visitas".
3) Crear/ajustar la pestaña "Precios" en el Sheet.
4) Ejecutar installTrigger() desde Apps Script.
   - Instala el trigger onEdit sobre "Reservas" para enviar emails y crear eventos de calendario.
5) Desplegar como Web App:
   - "Deploy" -> "New deployment" -> tipo "Web app".
   - Ejecutar como: la cuenta propietaria.
   - Quien tiene acceso: "Cualquiera con el enlace".
   - Copiar la URL que termina en /exec.

6) Actualizar APPS_SCRIPT_URL en js/app.js con la nueva URL /exec.
7) Para el menú "Reservas" en la hoja: ejecutar installMenuTrigger() una vez en Apps Script.
8) Para la lista de pendientes en el panel admin web: añadir la función getPendingBookings y la rama en doGet según docs/APPS_SCRIPT_getPendingBookings.txt; luego volver a desplegar la Web App.


4. FRONTEND - MANTENIMIENTO
---------------------------

4.1. Fichero index.html

Responsabilidades:
- Estructura HTML de la web.
- Incluye:
  - <link rel="stylesheet" href="css/styles.css">
  - <script src="js/app.js"></script>

Cambios típicos:
- Texto de secciones (descripción, actividades, restaurantes, etc.).
- Email mostrado al usuario (hay enlaces mailto con el correo público).
- Links externos (rutas, restaurantes, etc.).

Si se cambia el nombre de la carpeta "css" o "js", ajustar las rutas a styles.css y app.js.


4.2. Fichero css/styles.css

Responsabilidades:
- Estilos generales, colores, tipografías y layout.
- Variables CSS al inicio (bloque :root):
  - Colores principales.
  - Rutas de imágenes de fondo (hero, galería destacada, etc.).

Si se cambian nombres de archivos en "fotos/", actualizar aquí las variables:
  --img-hero, --img-dining, etc.


4.3. Fichero js/app.js

Responsabilidades:
- Conexión con el backend:
  - APPS_SCRIPT_URL: URL del Web App.
  - jsonp(...) para getBookings, getPricing y getStats.
  - fetch(...) POST para createBooking.

- Lógica de reservas:
  - renderCal(): dibuja el calendario y marca días reservados.
  - loadBookings(): carga rangos ocupados desde Apps Script.
  - loadPricing(): carga precios diarios y coste de limpieza.
  - calculatePrice() / updatePrice(): cálculo del total según fechas.
  - submitBooking(): envía la solicitud y muestra mensaje de éxito/error.

- Galería de fotos:
  - galleryPhotos: array de imágenes.
  - loadGallery(): crea la cuadrícula de fotos y el lightbox.

- Panel admin:
  - initAdminPanel(): si la URL tiene ?panel=vistasMar2025, muestra el panel, carga getStats y getPendingBookings.
  - Lista de reservas pendientes con botones Confirmar/Cancelar (requiere getPendingBookings en Apps Script; ver docs/APPS_SCRIPT_getPendingBookings.txt).

- Tracking:
  - trackVisit(): envía action=trackVisit con referrer y tipo de dispositivo (solo en http/https).

Si se cambia la URL del Web App, actualizar:
  const APPS_SCRIPT_URL = '...';


5. CÓMO CAMBIAR DE CUENTA / ENTORNO
-----------------------------------

Si en el futuro se quiere mover el sistema a otra cuenta Google (nuevo Gmail), los pasos son:

1) Crear nueva hoja de cálculo y nuevo calendario en la cuenta destino.
2) Crear un Apps Script nuevo, pegar app script.txt y:
   - Cambiar SPREADSHEET_ID al ID de la nueva hoja.
   - Cambiar CONFIG.CALENDAR_ID al ID del nuevo calendario.
   - Ajustar OWNER_EMAIL, PUBLIC_EMAIL y OWNER_PHONE si procede.
3) Ejecutar setupSheets(), montar la pestaña "Precios" y luego installTrigger().
4) Desplegar como Web App y obtener la nueva URL /exec.
5) Actualizar APPS_SCRIPT_URL en js/app.js con la nueva URL.
6) Subir/actualizar la web (Netlify, GitHub Pages, Cloudflare Pages, etc.).


6. HOSTING RECOMENDADO
----------------------

La web es estática; se puede alojar en cualquier hosting de archivos estáticos:

- Netlify (muy sencillo, drag & drop de la carpeta completa).
- GitHub Pages (si se usa un repositorio Git).
- Cloudflare Pages.

Requisitos:
- Subir la carpeta completa del proyecto:
  - index.html
  - css/
  - js/
  - fotos/
  - (opcional) docs/ y app script.txt, por comodidad.

Tras desplegar:
- Probar el calendario.
- Probar envío de reserva de prueba y comprobar que:
  - Aparece fila nueva en la pestaña "Reservas" (Estado "Pendiente").
  - Llegan los correos al propietario y al huésped.


7. USO DIARIO PARA EL PROPIETARIO
---------------------------------

1) Consultar reservas:
   - Ver pestaña "Reservas" en Google Sheets.
   - Filtrar por Estado ("Pendiente", "Confirmada", "Cancelada").

2) Confirmar o cancelar una reserva:
   - En la columna "Estado" (J) de la fila correspondiente:
     - Escribir "Confirmada" o "Cancelada".
   - El trigger onEdit se encarga de:
     - Enviar email al huésped.
     - Crear/actualizar el evento en Google Calendar.

3) Actualizar precios:
   - Modificar valores en la pestaña "Precios" (fila 2).
   - Ajustar B5 si cambia el coste de limpieza.
   - Los cambios se reflejan en la web al recargar la página.

4) Ver estadísticas:
   - Abrir la web con ?panel=vistasMar2025 al final de la URL.
   - Ejemplo: https://tu-dominio.com/?panel=vistasMar2025
   - Se mostrará el panel con visitas, reservas, pendientes e ingresos.

