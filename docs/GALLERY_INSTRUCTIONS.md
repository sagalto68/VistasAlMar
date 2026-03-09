# Instrucciones para gestionar imágenes de la galería

Este documento explica cómo **añadir, eliminar o modificar las fotos** que aparecen en la galería de la web `Vistas al Mar`.

## Ubicación de los archivos

- Carpeta física de imágenes: `fotos/` (contiene `hero.jpg`, `dining.jpg`, etc.)
- El frontend lee la galería a partir de un array en `js/app.js`.
- Las imágenes usadas como fondo (`hero`, `dining`, etc.) se definen en variables CSS dentro de `css/styles.css`.

## Añadir una nueva foto a la galería

1. Copia el fichero de imagen en la carpeta `fotos/`. Por ejemplo:
   ```
   fotos/balcon.jpg
   ```
2. Abre `js/app.js` y localiza el array `galleryPhotos` (línea ~224):
   ```js
   const galleryPhotos = [
     {file: 'hero.jpg', title: 'Comedor con vistas'},
     // ... otros elementos ...
   ];
   ```
3. Añade un objeto con el nombre del fichero y el título que se mostrará:
   ```js
   {file: 'balcon.jpg', title: 'Balcón con vistas'},
   ```
4. Guarda el archivo y recarga la web. La galería se actualizará automáticamente.

> **Nota**: no importa el orden en que coloques los elementos; la vista se genera en el orden del array.

## Eliminar o renombrar una foto

1. Borra la línea correspondiente en el array `galleryPhotos`.
2. Si deseas, elimina el fichero físico de la carpeta `fotos/` o renómbralo.
3. Recarga la web para comprobar que la foto ha desaparecido.

## Cambiar imágenes de fondo (hero, about, etc.)

1. Localiza las variables CSS en el archivo `css/styles.css` al inicio:
   ```css
   :root {
     --img-hero:url(../fotos/hero.jpg);
     --img-dining:url(../fotos/dining.jpg);
     /* ... */
   }
   ```
2. Modifica la URL al nombre de imagen deseado y guarda.
3. Actualiza el fichero en `fotos/` con la imagen nueva.

> **Importante**: mantiene los mismos nombres si no quieres tocar CSS.

## Consejos rápidos

- Las fotos deben estar optimizadas para la web (menos de 200 KB si es posible).
- Usa nombres claros y sin espacios (`playa.jpg`, `interior2.png`).
- Si trabajas en local, puedes previsualizar con `python -m http.server` o tu servidor habitual.

Con este procedimiento la gestión de imágenes es rápida y evita errores. ¡Disfruta actualizando la galería!