# Instrucciones para trabajar en DNV Casas

## Contexto crítico

DNV Casas es un producto real y se encuentra en producción para una clienta. Todo cambio debe priorizar la continuidad del servicio, la integridad de los datos y la compatibilidad con el comportamiento existente.

Antes de modificar el repositorio, leer en este orden:

1. `PROJECT.md`
2. `ARCHITECTURE.md`
3. `OPERATIONS.md`
4. `TESTING.md`
5. La spec y la tarea aplicables, cuando existan

El `README.md` histórico no debe usarse como fuente de verdad hasta que sea revisado y reemplazado de forma controlada. Ante una contradicción, verificar el código, la configuración desplegada y los tests antes de concluir.

## Reglas de seguridad

- No conectarse al VPS, desplegar, reiniciar servicios ni modificar producción sin autorización explícita.
- No leer, copiar, registrar ni versionar secretos. Nunca incluir valores de `.env`, contraseñas, tokens o credenciales de Cloudinary en documentación, logs, commits o respuestas.
- No modificar puertos, nombres de variables, perfiles Spring, volúmenes, redes, health checks ni servicios Docker sin evaluar compatibilidad con producción y definir rollback.
- No ejecutar operaciones destructivas sobre Docker o MySQL. En particular, no usar `docker compose down -v` sobre producción.
- No editar migraciones Flyway ya aplicadas. Todo cambio de schema debe agregarse en una migración nueva y probarse desde una base vacía y desde el estado anterior.
- No reordenar ni insertar valores intermedios en enums persistidos por ordinal.
- No actualizar archivos de contrato golden para hacer pasar una regresión. Un cambio deliberado de contrato necesita spec, aprobación y explicación explícita.
- No cambiar simultáneamente comportamiento y arquitectura sin separar el trabajo en pasos verificables.
- Preservar cambios locales del usuario y revisar el diff completo antes de entregar.

## Compatibilidad obligatoria con producción

La topología confirmada es:

| Servicio | Puerto del VPS | Puerto del contenedor |
|---|---:|---:|
| Frontend React/Nginx | 5173 | 80 |
| API Spring Boot | 5254 | 8080 |
| MySQL | 3307 | 3306 |

Producción se ejecuta con Docker Compose en `~/dnv_casas`, usa `.env`, Flyway y Cloudinary. Cualquier cambio que afecte esta topología debe incluir:

- impacto esperado;
- compatibilidad hacia atrás;
- pasos de despliegue;
- verificación posterior;
- procedimiento de rollback;
- tratamiento de datos existentes.

## Límites arquitectónicos

La dirección de dependencias del backend es:

```text
dnvcasas-api → dnvcasas-infrastructure → dnvcasas-application → dnvcasas-domain
```

- Las reglas de negocio de propiedades pertenecen principalmente al aggregate `Property` y sus value objects.
- Los controllers traducen HTTP; no deben contener reglas de negocio.
- Los services de aplicación orquestan casos de uso y puertos.
- Infrastructure implementa persistencia, seguridad técnica y almacenamiento.
- Los contratos visibles para el frontend incluyen DTOs, JSON, códigos HTTP, errores y ordinales de enums.
- La compatibilidad heredada del backend .NET debe tratarse como contrato hasta que una decisión aprobada indique lo contrario.

## Flujo de trabajo esperado

```text
Contexto → Spec → Plan → Tasks → Implementación
→ Tests/Evals → Revisión del diff → Actualización documental
```

Para un cambio no trivial:

1. Verificar el comportamiento existente en código y tests.
2. Declarar alcance y fuera de alcance.
3. Identificar contratos, datos y rutas de producción afectados.
4. Escribir o actualizar la spec.
5. Preparar tareas pequeñas y reversibles.
6. Implementar sin cambios colaterales.
7. Ejecutar las verificaciones indicadas en `TESTING.md`.
8. Revisar migraciones, configuración, secretos y compatibilidad productiva.
9. Actualizar la documentación afectada.

## Convenciones

- Inglés para nombres de dominio, contratos, clases, métodos públicos, DTOs y endpoints.
- Español para comentarios, variables internas y mensajes dirigidos al usuario, salvo textos heredados que formen parte de un contrato probado.
- Commits pequeños, en español e imperativo, explicando el motivo.
- Usar el Maven Wrapper incluido en `backend-java`.
- Mantener Java 21 y Node 20 mientras no exista una decisión explícita de actualización.
- En Visual Studio Code, conservar la actualización de configuración Java/Maven como interactiva. No cambiar ajustes del workspace ni recomendar extensiones como requisito sin necesidad comprobada.

## Criterio de finalización

Un cambio no está terminado sólo porque compila. Debe:

- satisfacer la spec y sus criterios de aceptación;
- conservar los contratos no afectados;
- superar las pruebas proporcionales al riesgo;
- no introducir secretos ni cambios accidentales;
- incluir instrucciones de despliegue y rollback cuando afecte producción;
- dejar documentación y código consistentes.

