# Ubicación de propiedades en Google Maps

## Objetivo

Permitir que la administradora cargue un enlace opcional de Google Maps por
propiedad y que la ficha pública muestre un botón `Ver ubicación en Google Maps`.

## Alcance

- Agregar `googleMapsUrl` como dato opcional de la propiedad.
- Aceptar enlaces HTTPS de Google Maps, incluidos los enlaces compartidos
  `maps.app.goo.gl`, los enlaces heredados `goo.gl/maps` y las URLs de
  `google.<dominio>/maps`.
- Incorporar el campo al alta, edición, duplicado y detalle de una propiedad.
- Mostrar el botón únicamente cuando la propiedad tenga un enlace válido.
- Abrir Google Maps en una pestaña nueva con protección `noopener/noreferrer`.
- Mantener una presentación responsive para mobile y desktop.

## Fuera de alcance

- No se muestra un mapa embebido.
- No se usa Google Maps API ni se agregan claves o secretos.
- No se geocodifican direcciones ni se almacenan coordenadas.
- No se modifican testimonios en este cambio.

## Compatibilidad y datos

- La columna nueva es nullable: todas las propiedades existentes siguen siendo
  válidas y no muestran el botón hasta que la administradora cargue el enlace.
- La migración es aditiva y no transforma ni elimina datos existentes.
- El campo se agrega al final del DTO completo; el DTO reducido de listados no
  cambia.

## Criterios de aceptación

1. Una propiedad sin ubicación conserva el comportamiento actual.
2. El panel permite guardar, editar y quitar un enlace de Google Maps.
3. Un enlace no perteneciente a Google Maps se rechaza con un error claro.
4. El detalle muestra un botón legible y usable en mobile y desktop.
5. El botón abre exactamente el enlace configurado en una pestaña nueva.
6. Crear, editar y duplicar conservan correctamente el nuevo dato.

## Despliegue y rollback

El despliegue futuro requiere reconstruir API y frontend para que Flyway aplique
`V4`. La versión anterior de la aplicación ignora la columna nullable, por lo que
el rollback consiste en volver a las imágenes anteriores sin eliminar la columna.
