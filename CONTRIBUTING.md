# Cómo contribuir

Guía corta para que alguien nuevo trabaje sin adivinar. Para levantar el
proyecto, ver el [README](README.md).

## Convención de idioma (importante)

El código mezcla inglés y español **a propósito**, con una regla:

- **Inglés** para todo lo que es contrato o dominio: nombres de clases, campos
  de DTOs y entidades, métodos públicos, endpoints. Ej: `PropertyDto`,
  `getAll()`, `isFeatured`. Esto no se toca — el frontend y el contrato REST
  dependen de esos nombres.
- **Español** para la implementación interna y los comentarios: variables
  locales, métodos privados, mensajes de log y de error al usuario. Ej:
  `normalizarPage()`, `porIp`, `"Solo se pueden destacar propiedades activas"`.

Si dudás: ¿lo ve el frontend o el cliente HTTP? → inglés. ¿Es plomería interna? → español.

## Arquitectura en una frase

Cuatro módulos Maven, dependencias en una sola dirección:

```
api → infrastructure → application → domain
```

El **dominio no conoce a nadie** (ni Spring, ni la base). Si te encontrás
importando algo de `infrastructure` dentro de `domain`, parás: vas para el lado
equivocado. La regla de dependencias es lo que mantiene el código testeable.

`Property` es un aggregate root con comportamiento: **no tiene setters
públicos**, se modifica por métodos (`feature()`, `pause()`,
`replaceSeasonPrices()`, ...) que validan las invariantes. Si necesitás cambiar
una regla de negocio, va ahí, no en el controller.

## Antes de commitear

```bash
cd backend-java
./mvnw verify        # los 165 tests tienen que pasar (necesita Docker)
```

El CI corre lo mismo en cada push (`.github/workflows/ci.yml`). Un PR con el CI
en rojo no se mergea.

`.editorconfig` fija el formato (4 espacios en Java, LF, UTF-8). Casi todos los
IDEs lo respetan solos.

## Agregar una migración de base de datos

Usamos Flyway. Las migraciones viven en
`backend-java/dnvcasas-infrastructure/src/main/resources/db/migration/`.

1. Creá el archivo siguiente en la numeración: `V3__lo_que_hace.sql` (el
   próximo número libre; hoy el último es el `V2`).
2. **Nunca edites una migración ya aplicada.** Flyway valida el checksum y el
   arranque falla. Si te equivocaste, corregís con una migración nueva.
3. `V1__baseline_schema_de_ef.sql` es la línea de base heredada del .NET — no se
   toca jamás.

Al arrancar, Flyway aplica las que falten solo.

## Commits

Mensajes en español, en imperativo, explicando el **porqué** y no solo el qué —
el estilo del historial actual. Un buen commit de este repo dice qué problema
resolvía, no solo qué archivo tocó.
