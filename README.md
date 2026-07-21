# DNV Casas — ¿Dónde nos vamos?

Catálogo de alquiler, intercambio y venta de casas. El cierre de cada operación es por WhatsApp, no hay pagos online.

- **Frontend**: React 19 + Vite + Tailwind
- **Backend**: Java 21 + Spring Boot 3 (Clean Architecture + DDD)
- **DB**: MySQL 8

## Levantar el proyecto

Requiere Docker Desktop.

```bash
cp .env.example .env      # completar los valores — el WhatsApp es obligatorio
docker compose up -d --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:5254/api |
| Swagger | http://localhost:5254/swagger-ui.html |
| MySQL | localhost:3307 |

> El MySQL usa el puerto **3307** a propósito: el 3306 suele estar ocupado por otros proyectos.

Login del admin: `admin@dnvcasas.com` / `admin123`

### Comandos útiles

```bash
docker compose logs -f api      # ver logs del backend
docker compose down             # bajar todo (los datos persisten)
docker compose down -v          # bajar Y BORRAR los datos
docker compose up -d --build    # rebuild tras cambiar código
```

Los datos viven en volúmenes nombrados (`dnvcasas_mysql_data`, `dnvcasas_uploads`), así que sobreviven a `docker compose down`. Solo `-v` los borra.

### El número de WhatsApp

**El build del frontend falla si `VITE_WHATSAPP` falta o es un placeholder.** Es a propósito: 16 botones en todas las páginas salen de ahí y no hay otra vía de contacto. Vite hornea el valor en build time, así que un número muerto se compila sin ruido y rompe todo en silencio.

Para levantar en local mientras no esté el número real:

```bash
ALLOW_PLACEHOLDER_WHATSAPP=1 docker compose up -d --build web
```

El pipeline de deploy simplemente no pasa esa variable.

## Desarrollo sin Docker

Conviene para tener hot-reload. Requiere el MySQL de Docker corriendo:

```bash
docker compose up -d mysql

# La API no arranca sin una JWT_KEY de al menos 32 caracteres.
export JWT_KEY=clave_de_desarrollo_de_al_menos_32_caracteres

cd backend-java && ./mvnw spring-boot:run -pl dnvcasas-api   # http://localhost:8080
cd frontend && npm run dev                                  # http://localhost:5173
```

`application.yml` apunta a `localhost:3307` por defecto. Usá `./mvnw` (viene
versionado en el repo) — no hace falta tener Maven instalado, el wrapper baja la
versión correcta solo.

## Tests

```bash
cd backend-java
./mvnw test      # 86 tests, rápido y sin Docker
./mvnw verify    # + 79 de integración (levantan MySQL con Testcontainers) = 165
```

| Suite | Qué cubre |
|---|---|
| Dominio (49) | Value Objects e invariantes de `Property`: máquina de estados, solapamiento de temporadas, reglas por categoría |
| Contrato JSON (15) | `createdAt` sin `Z`, la escala del precio, enums como int, `isFeatured`, el orden de los 25 y los 19 campos |
| JWT (12) | Clock skew de 5 min, claims heredados del .NET, firma/issuer/audiencia |
| Rate limit + errores (10) | Login por IP con 429 + `Retry-After`, y que una URL inexistente dé 404 y no 500 |
| `GoldenIT` (64) | Replica contra MySQL real el contrato que tenía el backend .NET (ver `golden/`) |
| `WriteFlowIT` (15) | Crear/editar/duplicar/pausar/borrar por HTTP, y las invariantes llegando hasta el status code |

Los tests de dominio corren en memoria: son rápidos pero **no ven las costuras**. El bug más grave que tuvo este código —el botón "Duplicar" devolviendo 400— vivía justo ahí, entre el dominio y la persistencia, y lo caza `WriteFlowIT`, no los 49.

## Migraciones

Flyway. Las migraciones viven en `backend-java/dnvcasas-infrastructure/src/main/resources/db/migration/` y corren solas al arrancar.

```
V1__baseline_schema_de_ef.sql    el schema heredado — NO editar
V2__...                          las nuevas van acá
```

`V1` es la línea de base: en una base que ya existe, Flyway la marca como aplicada sin correrla; en una vacía la ejecuta, así que el schema es reproducible desde cero. Nunca editar una migración ya aplicada — Flyway valida el checksum.

## Arquitectura del backend

```
dnvcasas-domain           entidades, value objects, invariantes
dnvcasas-application      services, DTOs, puertos
dnvcasas-infrastructure   JPA, repositorios, JWT, uploads, Flyway
dnvcasas-api              controllers, config, manejo de errores
```

`Property` es un aggregate root con comportamiento: no tiene setters públicos y se modifica por métodos (`feature()`, `pause()`, `replaceSeasonPrices()`, ...) que validan las invariantes. Las violaciones lanzan `DomainException` y el handler global las traduce a HTTP 400.

### Notas del port

Este backend fue portado desde ASP.NET Core 8 manteniendo el contrato REST byte a byte, para no tocar el frontend. Quedan decisiones que solo se entienden con esa historia:

- **`golden/contract/`** es el contrato REST, verificado por `GoldenIT`. Explica por qué hay tanto `@JsonPropertyOrder` y `@JsonProperty` explícito.
- **El filtro usa `LOCATE`, no `LIKE`** (`PropertySpecifications`): el `%` y el `_` son literales. Cambiarlo altera el comportamiento de búsqueda.
- **`amenities` tiene `@OrderBy("id ASC")`** — el .NET no ordenaba y el orden dependía del `pageSize`.
- **`DotNetCompatibleAuthoritiesConverter`** lee el claim de rol tanto de `role` como de la URI de schema XML que emitía el .NET. **Ya se puede borrar**: los tokens del .NET vivían 12 h y el cutover fue antes de eso. Su test documenta por qué existía.

Los bugs del .NET que se replicaron durante el port ya están arreglados — la lista y el antes/después están en [`golden/README.md`](golden/README.md).
