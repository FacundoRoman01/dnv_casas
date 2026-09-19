# DNV Casas

## Propósito

DNV Casas, presentado públicamente como “¿Dónde nos vamos?”, es un catálogo inmobiliario para publicar y descubrir propiedades destinadas a alquiler temporal, intercambio de casas y compraventa.

El producto está desarrollado y en producción para una clienta. Su canal principal de conversión es WhatsApp: el sitio presenta las propiedades y conduce la conversación comercial, pero no procesa pagos ni confirma reservas en línea.

## Usuarios

### Visitante

Puede:

- navegar el catálogo público;
- explorar alquileres, intercambios y propiedades en venta;
- filtrar por destino, barrio, fechas, capacidad, dormitorios, precio y tipo;
- consultar detalles, imágenes, prestaciones, disponibilidad y video cuando exista;
- iniciar una consulta por WhatsApp.

### Administradora

Puede autenticarse en el backoffice para:

- crear, editar, duplicar, pausar, reactivar y eliminar lógicamente propiedades;
- destacar propiedades;
- administrar destinos;
- gestionar imágenes y su orden;
- definir precios por temporada;
- actualizar disponibilidad.

## Alcance actual

El sistema incluye:

- SPA pública y panel administrativo en React;
- API REST en Spring Boot;
- persistencia MySQL;
- autenticación administrativa JWT;
- almacenamiento productivo de imágenes en Cloudinary;
- migraciones Flyway;
- ejecución mediante Docker Compose;
- contratos de compatibilidad automatizados para la API.

## Fuera de alcance actual

En la versión actualmente implementada no existe:

- checkout o pagos en línea;
- reserva confirmada dentro del sistema;
- gestión de clientes o CRM;
- mensajería interna;
- envío de correo;
- registro público de usuarios;
- múltiples roles administrativos;
- aplicación móvil nativa.

## Evolución prevista

Es probable que el producto incorpore más adelante una automatización de reservas. La dirección funcional considerada incluye:

- permitir que una reserva quede confirmada dentro del sistema;
- enviar una notificación por correo a la persona usuaria;
- enviar una notificación por correo a la administradora/clienta;
- conservar a WhatsApp como parte del circuito comercial cuando resulte conveniente.

Esta evolución todavía no está especificada ni planificada y no forma parte del comportamiento actual. Antes de implementarla será necesario definir mediante una spec, entre otros aspectos:

- estados y ciclo de vida de una reserva;
- quién puede solicitar, aprobar, rechazar o cancelar;
- relación con el calendario de disponibilidad;
- datos personales requeridos y su protección;
- contenido, remitente y proveedor de correo;
- reintentos, duplicados y trazabilidad de notificaciones;
- prevención de reservas simultáneas para una misma fecha;
- cambios necesarios en base de datos, API, frontend y operación.

No se prevé incorporar métodos de pago ni checkout como parte de esta automatización. Una reserva confirmada representaría una confirmación operativa dentro del sistema, no el cobro de la estadía.

## Conceptos del dominio

### Categoría comercial

- `ALQUILER`: propiedad ofrecida para alquiler.
- `INTERCAMBIO`: propiedad ofrecida para intercambio; no admite precio.
- `COMPRA`: propiedad ofrecida para venta.

### Tipo de propiedad

Casa, departamento, cabaña, loft u otro.

### Estado de publicación

- `ACTIVE`: visible en el catálogo público.
- `PAUSED`: oculta, pero recuperable.
- `DELETED`: borrado lógico y estado terminal para edición.

### Destino y barrio

El destino representa una zona principal del catálogo. El barrio es texto asociado a la propiedad y se utiliza como filtro secundario.

### Disponibilidad

Cada fecha puede estar disponible, en gestión o no disponible. La disponibilidad se reemplaza como conjunto, preservando internamente las filas que no necesitan recrearse.

### Temporada

Una propiedad puede tener precios para rangos de fechas. Dos temporadas de una misma propiedad no pueden superponerse.

## Restricciones esenciales del producto

- WhatsApp es el canal comercial principal y su número se incorpora al frontend durante el build.
- Las propiedades de intercambio no pueden tener precio.
- Sólo una propiedad activa puede marcarse como destacada.
- Pausar o eliminar una propiedad quita su condición de destacada.
- Una propiedad eliminada no puede reactivarse ni editarse.
- Las migraciones aplicadas y los ordinales persistidos son compatibles con datos productivos existentes.
- El contrato de la API conserva decisiones heredadas del backend ASP.NET anterior.

## Estado del producto

El sistema está activo en producción sobre un VPS de Hostinger y fue verificado después de una rotación de credenciales. La topología productiva se documenta en `OPERATIONS.md`.

Existen inconsistencias entre algunos archivos del repositorio y la configuración efectiva de producción. En particular, el mapping productivo confirmado de la API es `5254:8080`. Estas diferencias deben resolverse de forma controlada; no deben “corregirse” mediante un despliegue ciego.

## Mapa documental

- `AGENTS.md`: reglas para personas y agentes de IA.
- `ARCHITECTURE.md`: estructura técnica y flujos.
- `OPERATIONS.md`: producción, configuración y mantenimiento.
- `TESTING.md`: estrategia y comandos de verificación.
- `specs/`: comportamientos detallados, cuando se incorpore.
- `tasks/`: trabajo derivado de specs, cuando se incorpore.
- `decisions/`: decisiones arquitectónicas, cuando se incorpore.
