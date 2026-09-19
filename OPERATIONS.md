# Operación de DNV Casas

## Alcance

Este documento describe el contexto operativo confirmado. No contiene secretos ni sustituye un runbook de acceso al servidor. Toda acción sobre producción requiere autorización explícita y una evaluación previa del impacto.

## Producción confirmada

- Proveedor: Hostinger.
- Plan: VPS KVM 2.
- Sistema operativo observado: Ubuntu 26.04.1 LTS.
- Directorio de la aplicación: `~/dnv_casas`.
- Orquestación: Docker Compose.
- Imágenes: Cloudinary.
- Configuración: archivo `.env` no versionado.
- Base de datos: MySQL 8.0.
- Migraciones: Flyway al iniciar la API.

### Topología de red

| Servicio | Puerto externo | Puerto interno | Estado esperado |
|---|---:|---:|---|
| `web` | 5173 | 80 | Up |
| `api` | 5254 | 8080 | Up |
| `mysql` | 3307 | 3306 | Up, healthy |

El mapping productivo confirmado de la API es `5254:8080`. El repositorio ha contenido una variante `5254:8081`; no debe desplegarse sin corregir y revisar previamente el diff de Compose.

## Configuración

Variables observadas o requeridas, sin valores:

### Base de datos

- `MYSQL_ROOT_PASSWORD`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- Alternativas reconocidas por la configuración de la aplicación: `DB_URL`, `DB_USER`, `DB_PASSWORD`, `DB_POOL_SIZE`

Producción ha usado las variables estándar `SPRING_DATASOURCE_*`; el Compose versionado ha usado `DB_*`. Antes de modificar el despliegue debe elegirse y documentarse una convención, preservando compatibilidad durante la transición.

### Seguridad

- `JWT_KEY`
- `JWT_ISSUER`
- `JWT_AUDIENCE`

`JWT_KEY` debe tener al menos 32 caracteres. Cambiarla invalida los tokens administrativos emitidos anteriormente.

### Frontend

- `API_URL`, utilizada por Compose como argumento para `VITE_API_URL`
- `VITE_API_URL`, al ejecutar o construir el frontend directamente
- `VITE_WHATSAPP`
- `VITE_INSTAGRAM`
- `ALLOW_PLACEHOLDER_WHATSAPP`, únicamente como escape de desarrollo/CI

Las variables Vite quedan incorporadas en el bundle durante el build. Cambiar el `.env` sin reconstruir el frontend no cambia el JavaScript servido por Nginx.

`ALLOW_PLACEHOLDER_WHATSAPP` no debería ser necesario en un build productivo que ya posee un número válido.

### Imágenes

- `CLOUDINARY_URL`
- `CLOUDINARY_FOLDER`
- `UPLOADS_PHYSICAL_PATH`, para almacenamiento local
- `UPLOADS_URL_PATH`, para almacenamiento local

No documentar ni registrar el valor de `CLOUDINARY_URL`.

### API

- `FRONTEND_URL`
- `SWAGGER_ENABLED`

Swagger debería permanecer deshabilitado públicamente en producción salvo necesidad explícita.

## Comprobaciones de estado

Ejecutar únicamente con autorización y desde el directorio correcto:

```bash
cd ~/dnv_casas
docker compose ps
docker compose logs --tail=100 api
curl -f http://localhost:5254/actuator/health
```

El health check esperado sin autenticación es:

```json
{"status":"UP"}
```

Una verificación funcional posterior a un despliegue debe incluir:

- carga del frontend;
- consulta pública de destinos y propiedades;
- login administrativo;
- lectura y edición controlada de una propiedad;
- visualización de imágenes existentes;
- revisión de logs de API y MySQL;
- ausencia de migraciones fallidas.

## Despliegues

Todavía no está documentado un pipeline automático de despliegue al VPS. Hasta verificar el procedimiento efectivo, no se debe asumir que un push despliega producción.

Todo despliegue futuro debería registrar:

1. commit o tag desplegado;
2. backup requerido;
3. cambios de `.env`;
4. migraciones incluidas;
5. servicios a reconstruir;
6. ventana esperada;
7. smoke tests;
8. rollback.

No usar comandos generales de reconstrucción si sólo cambió un servicio. El frontend necesita rebuild cuando cambian variables `VITE_*`.

## Flyway y base de datos

- Las migraciones aplicadas son inmutables.
- Una corrección se realiza con una migración nueva.
- Hibernate no debe crear ni modificar el schema.
- V1 es la línea de base heredada de EF Core.
- Las migraciones deben verificarse contra una base vacía y contra una copia o estado representativo del schema anterior.
- Nunca borrar el volumen de MySQL para resolver un fallo de migración.

Antes de un cambio de schema productivo se necesita un backup comprobable y un plan de recuperación.

El procedimiento real de backup y restore todavía debe investigarse y validarse antes de documentarlo como operativo.

## Cloudinary

Cloudinary es el almacenamiento productivo de imágenes. La base conserva las URLs y el servicio externo conserva los archivos.

Riesgos operativos:

- upload exitoso seguido de fallo de persistencia;
- borrado en DB seguido de fallo en Cloudinary;
- imágenes huérfanas;
- cambio accidental de carpeta;
- agotamiento de cuota.

La aplicación intenta compensar algunos fallos, pero una compensación fallida requiere revisión manual de logs y recursos huérfanos.

## Seguridad operacional

- No pegar secretos en chats, issues, commits o documentación.
- Rotar cualquier credencial que haya sido expuesta.
- Mantener acceso SSH y credenciales fuera del repositorio.
- Revisar firewall y necesidad de exposición pública de MySQL antes de cambiar reglas.
- Aplicar actualizaciones del sistema dentro de una ventana, verificando que Docker y Compose recuperen los servicios tras reinicio.
- No asumir que `restart: unless-stopped` reemplaza un plan de recuperación.

## Rollback

El rollback debe diseñarse por cambio. Como mínimo debe considerar:

- volver a la imagen o commit anterior;
- conservar compatibilidad con migraciones ya ejecutadas;
- restaurar configuración anterior sin revelar secretos;
- verificar API, frontend, DB y Cloudinary;
- evitar rollbacks de código incompatibles con un schema nuevo.

Una migración destructiva o no compatible hacia atrás exige una estrategia específica; no alcanza con volver a construir la imagen anterior.

## Acciones prohibidas sin autorización específica

- `docker compose down -v`;
- borrar o recrear volúmenes;
- restaurar una base sobre producción;
- editar migraciones aplicadas;
- cambiar credenciales, firewall o puertos;
- limpiar recursos Cloudinary en masa;
- desplegar directamente desde una rama no aprobada;
- ejecutar scripts no revisados sobre el VPS.

## Pendientes operativos

- Confirmar y documentar el procedimiento real de deploy.
- Confirmar estrategia y periodicidad de backups.
- Probar un restore fuera de producción.
- Comparar el Compose productivo con el versionado.
- Definir política de actualizaciones y reinicios del VPS.
- Revisar exposición de MySQL y reglas de firewall.
- Definir monitoreo y alertas más allá del health check.

