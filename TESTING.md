# Estrategia de pruebas de DNV Casas

## Objetivo

Las pruebas deben demostrar que un cambio conserva reglas de negocio, contrato HTTP, persistencia y capacidad de construir los contenedores. La profundidad de verificación depende del riesgo, pero producción nunca debe utilizarse como primer entorno de prueba.

## Backend

El backend usa Maven Wrapper desde `backend-java`.

### Pruebas rápidas

```bash
cd backend-java
./mvnw test
```

En Windows PowerShell o la terminal integrada de Visual Studio Code:

```powershell
cd backend-java
./mvnw.cmd test
```

Estas pruebas no deberían requerir Docker. Cubren principalmente:

- invariantes de dominio;
- value objects;
- ordinales de enums;
- contrato de serialización JSON;
- seguridad JWT;
- rate limiting;
- manejo de errores.

### Verificación completa

```bash
cd backend-java
./mvnw verify
```

En Windows:

```powershell
cd backend-java
./mvnw.cmd verify
```

`verify` agrega las suites `*IT`, que usan Testcontainers y necesitan Docker disponible.

Incluye:

- `GoldenIT`: ejecuta los contratos de `golden/contract/` contra MySQL real;
- `WriteFlowIT`: prueba escritura, lectura, edición, duplicación, estados, reglas y reordenamiento a través de HTTP.

## Contratos golden

Los archivos de `golden/contract/` representan respuestas esperadas del contrato histórico de la API.

Reglas:

- No actualizarlos automáticamente.
- Investigar primero cualquier diferencia.
- Si el comportamiento anterior es correcto, reparar el código.
- Si el contrato cambia deliberadamente, exigir spec, aprobación y actualización coordinada de frontend, tests y documentación.
- Un test verde no demuestra por sí solo que el comportamiento satisface la intención actual del producto.

## Frontend

### Instalar de forma reproducible

```bash
cd frontend
npm ci
```

### Lint

```bash
npm run lint
```

### Build

```bash
npm run build
```

El build requiere un `VITE_WHATSAPP` válido. CI utiliza el escape `ALLOW_PLACEHOLDER_WHATSAPP=1` con un placeholder conocido para probar compilación; ese mecanismo no debe normalizarse como configuración productiva.

Actualmente no hay tests unitarios, de componentes ni E2E del frontend. Por ello, los cambios visuales o de interacción requieren verificación manual proporcional.

## Docker

CI construye por separado las imágenes backend y frontend. Antes de cambios en Dockerfiles, versiones base, usuario del contenedor, puertos o Nginx, verificar al menos:

```bash
docker build -t dnvcasas-api:test ./backend-java
```

El build frontend necesita argumentos equivalentes a los usados por CI o un número válido de un entorno seguro.

La construcción de imágenes no verifica por sí sola que Compose tenga mappings correctos. La topología esperada está en `OPERATIONS.md`.

## Matriz mínima por tipo de cambio

| Cambio | Verificación mínima |
|---|---|
| Dominio o value objects | tests de dominio + `mvn verify` |
| DTO, JSON o controller | contrato JSON + golden + `mvn verify` |
| JPA, filtros o transacciones | `mvn verify` con Testcontainers |
| Migración Flyway | base vacía + upgrade desde versión anterior + `mvn verify` |
| JWT o seguridad | suites de seguridad + flujos 401/403 + `mvn verify` |
| Imágenes | tests disponibles + upload/delete/reorder manual en entorno no productivo |
| Componente frontend | lint + build + recorrido manual afectado |
| Routing frontend/Nginx | build + navegación directa y refresh de rutas |
| Docker/Compose | build de imágenes + Compose local + health y smoke tests |
| Variables Vite | rebuild frontend + inspección del comportamiento resultante |

## Smoke tests antes de desplegar

- Frontend carga sin errores de consola críticos.
- Destinos y propiedades públicas responden.
- Filtros principales funcionan.
- Detalle de alquiler/intercambio y compra funciona.
- Enlaces de WhatsApp usan el destino correcto.
- Login administrativo funciona.
- El panel lista propiedades y destinos.
- Las rutas protegidas rechazan requests sin token.
- Imágenes existentes se muestran.
- API health responde `UP`.

## Verificación posterior al despliegue

La comprobación productiva debe ser breve y no destructiva:

- revisar estado de los tres servicios;
- consultar health;
- cargar frontend y catálogo;
- probar login;
- comprobar una propiedad e imagen existentes;
- revisar logs recientes;
- confirmar que no existen errores Flyway o de conexión.

Crear, editar o borrar datos en producción como smoke test necesita autorización y un caso controlado.

## CI actual

GitHub Actions ejecuta:

- backend: Java 21 y `./mvnw -B verify`;
- frontend: Node 20, `npm ci`, lint y build;
- Docker: build de ambas imágenes;
- prueba negativa: el frontend debe rechazar un build sin WhatsApp válido cuando no se habilita el escape de CI.

El pipeline de CI no equivale a un pipeline de deploy al VPS.

## Uso con Visual Studio Code

- Abrir la raíz del repositorio como workspace.
- Usar la terminal integrada para Maven, npm y Git.
- La configuración actual mantiene `java.configuration.updateBuildConfiguration` en modo `interactive`; aceptar una recarga sólo después de revisar cambios en los POM.
- No depender exclusivamente de los indicadores del editor: ejecutar los comandos del proyecto antes de entregar.
- Revisar `Source Control` para detectar archivos generados, secretos o cambios no relacionados.

## Limitaciones actuales y próximos pasos

- Incorporar tests frontend sin acoplarlos a detalles visuales frágiles.
- Agregar E2E para catálogo, WhatsApp y backoffice.
- Probar adapters de imágenes y compensaciones.
- Validar Compose completo en CI o en un entorno de staging.
- Evitar conteos fijos de tests en documentación; la suite evoluciona.
- Definir evals de accesibilidad, responsive y regresión visual.

