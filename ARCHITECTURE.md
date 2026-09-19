# Arquitectura de DNV Casas

## Vista general

```text
Navegador
   │
   ├── Frontend React servido por Nginx
   │       │
   │       ├── catálogo público
   │       └── panel administrativo
   │
   └── API REST Spring Boot
           │
           ├── JWT / BCrypt
           ├── Cloudinary
           └── MySQL 8
```

El frontend es una SPA que consume una API REST. La API aplica reglas de negocio, persiste el catálogo en MySQL y delega el almacenamiento productivo de imágenes en Cloudinary.

## Componentes desplegables

### Frontend

- React 19 y React Router 7.
- Vite para desarrollo y build.
- Tailwind CSS para estilos.
- Axios para HTTP.
- Nginx sirve el build estático y resuelve las rutas SPA con fallback a `index.html`.
- Las variables `VITE_*` se incorporan en build time, no en runtime del contenedor Nginx.

Puntos de entrada:

- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/lib/api.js`

### Backend

- Java 21 y Spring Boot 3.3.5.
- Empaquetado Maven multi-módulo.
- API stateless con JWT HS256.
- Spring Data JPA/Hibernate y Flyway.
- Actuator expone únicamente health.
- Springdoc puede exponer OpenAPI/Swagger según configuración.

Punto de entrada:

- `backend-java/dnvcasas-api/src/main/java/com/dnvcasas/api/DnvCasasApplication.java`

### Base de datos

- MySQL 8.0.
- Flyway es responsable del schema; Hibernate usa `ddl-auto: none`.
- La migración V1 reproduce el schema heredado de EF Core.
- Los nombres PascalCase de tablas y columnas son significativos en MySQL sobre Linux.

### Imágenes

- Producción usa Cloudinary.
- Existe un adapter alternativo para filesystem local.
- La selección se realiza mediante el perfil Spring `cloudinary`.
- Ambos adapters implementan el mismo servicio de aplicación y conservan reglas equivalentes de tamaño, extensión y cantidad.

## Módulos del backend

```text
dnvcasas-api
    ↓
dnvcasas-infrastructure
    ↓
dnvcasas-application
    ↓
dnvcasas-domain
```

### Domain

Responsabilidades:

- entidades y relaciones;
- aggregate root `Property`;
- value objects;
- enums;
- invariantes y transiciones de estado;
- excepción de dominio.

El módulo depende de Jakarta Persistence para el mapeo JPA. Por ello es un dominio rico y aislado de Spring, pero no completamente independiente de persistencia.

### Application

Responsabilidades:

- casos de uso;
- DTOs de entrada y salida;
- puertos de repositorio, tokens y hashing;
- mapeo entre dominio y contrato externo;
- límites de paginación y orquestación transaccional.

La capa utiliza Spring, Validation, Jackson y `MultipartFile`; no es una capa completamente agnóstica del framework.

### Infrastructure

Responsabilidades:

- adapters JPA;
- repositorios Spring Data;
- Specifications de búsqueda;
- BCrypt;
- emisión JWT;
- Cloudinary y filesystem local;
- migraciones Flyway.

### API

Responsabilidades:

- controllers HTTP;
- autenticación y autorización;
- CORS;
- rate limiting del login;
- conversión de parámetros;
- serialización JSON;
- OpenAPI, Actuator y manejo global de errores.

## Flujo público

```text
Página React
  → hook de consulta
  → Axios
  → controller público
  → service de aplicación
  → puerto PropertyRepository
  → adapter JPA + Specifications
  → MySQL
  → DTO JSON
  → render
```

La consulta pública sólo devuelve propiedades activas. Puede filtrar por categoría, destino, barrio, rango de fechas, capacidad, dormitorios, precio máximo, tipo y condición de destacada.

El filtro de barrio usa `LOCATE`, no `LIKE`, para tratar `%` y `_` como caracteres literales.

## Flujo administrativo

```text
Login
  → BCrypt sobre AdminUsers
  → JWT de administrador
  → localStorage del navegador
  → Authorization: Bearer
  → /api/admin/**
  → caso de uso
  → reglas del aggregate
  → persistencia e integraciones
```

La API no mantiene sesiones ni cookies. El frontend elimina el token local en logout o ante una respuesta 401. No existen refresh tokens ni revocación centralizada.

## Modelo de datos

```text
Destination 1 ─── N Property
Property    1 ─── N PropertyImage
Property    1 ─── N PropertyAmenity
Property    1 ─── N PropertySeasonPrice
Property    1 ─── N PropertyAvailability
```

Tablas principales:

- `AdminUsers`
- `Destinations`
- `Properties`
- `PropertyImages`
- `PropertyAmenities`
- `PropertySeasonPrices`
- `PropertyAvailabilities`

Propiedades y destinos usan borrado lógico. Las colecciones hijas de una propiedad se persisten en cascada.

## Contratos críticos

### Enums ordinales

Categoría, tipo, estado y disponibilidad se almacenan como enteros y se exponen como enteros en JSON. Su posición es un contrato de datos y no debe cambiarse sin una migración coordinada.

### JSON heredado

El backend Java fue diseñado para conservar el contrato de un backend ASP.NET anterior. Orden de campos, nombres, fechas, escala decimal, mensajes y códigos HTTP están cubiertos parcialmente por tests de contrato.

### Golden contracts

Los archivos de `golden/contract/` capturan respuestas REST históricas. `GoldenIT` ejecuta esos escenarios contra MySQL real y compara status, content type y JSON normalizado.

### Errores

- Reglas de dominio: HTTP 400 con `{ "error": "..." }`.
- Validación de DTO: HTTP 400 con detalle por campo.
- Recurso inexistente: HTTP 404.
- JWT ausente o inválido: HTTP 401.
- JWT válido sin rol: HTTP 403.
- Fallo inesperado: HTTP 500 sin filtrar detalles internos.

## Persistencia y rendimiento

Las colecciones se hidratan mediante varias consultas dentro de la misma transacción para evitar un producto cartesiano entre imágenes, amenities, temporadas y disponibilidad. Los listados primero obtienen IDs paginados y luego hidratan los datos necesarios.

`open-in-view` está deshabilitado. El acceso a relaciones lazy debe ocurrir dentro de límites transaccionales definidos.

## Áreas de mayor riesgo

- ordinales persistidos;
- migraciones Flyway y datos existentes;
- compatibilidad JSON/golden;
- autenticación y claims heredados;
- actualización de disponibilidad con restricción única;
- consistencia entre Cloudinary y la base;
- configuración de puertos y perfiles por entorno;
- componentes frontend de gran tamaño y contratos duplicados manualmente.

## Deuda conocida

- No hay tests automatizados del frontend.
- No hay E2E de navegador.
- El rate limiter vive en memoria y no se comparte entre réplicas.
- El token administrativo se almacena en `localStorage`.
- El panel pide hasta 100 propiedades sin paginación visual.
- Hay URLs, puertos y perfiles inconsistentes entre archivos locales y producción.
- Algunas páginas frontend concentran presentación, estado y reglas de interacción.
- Permanece compatibilidad con .NET cuya vigencia debe decidirse explícitamente.

