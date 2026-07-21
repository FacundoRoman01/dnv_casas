# El contrato REST

`contract/` guarda una respuesta por escenario: método, path, body del request, status, content-type y el body crudo. **Es el contrato de la API**, y `GoldenIT` lo verifica en cada `mvn verify`.

```bash
cd backend-java && mvn verify      # replica los 62 escenarios contra MySQL real
```

No necesita nada más: los archivos están commiteados y el test levanta su propia base con Testcontainers.

## De dónde salieron

Nacieron como una foto del backend .NET, capturada antes de portarlo a Java, para poder verificar que el port no cambiara nada que el frontend viera. Ese backend ya no existe (vive en el historial de git, desde `c29cd2b`).

Hoy estos archivos **no son "lo que hacía el .NET": son lo que decidimos que la API haga.** Si cambiás uno a propósito, re-capturalo y explicá el cambio en el commit:

```bash
docker compose restart api && sleep 8      # el login limita a 5 intentos por IP
./tools/capture-golden.sh                  # → golden/contract
```

`tools/compare.py` compara dos capturas separando el ruido conocido — sirve para inspección manual, pero la verificación real la hace `GoldenIT`.

---

## Lo que estos archivos fijan

Nada de esto se dedujo leyendo código: se midió contra la API corriendo. Cada punto rompería el frontend en silencio.

### Serialización

| Campo | Valor | Por qué |
|---|---|---|
| `"createdAt":"2026-07-13T20:36:28"` | **sin `Z`** | La columna es `datetime(6)`, sin zona. `Instant`/`OffsetDateTime` agregarían la `Z`. Y `LocalDateTime` solo no alcanza: hay un formatter propio porque la fracción se trima (`.100` → `.1`) y el punto se omite si es cero. |
| `"price":85000.00` | escala preservada | La columna es `decimal(10,2)`. `stripTrailingZeros()` emitiría `85000`; sin `WRITE_BIGDECIMAL_AS_PLAIN` saldría `8.5E+4`. La normalización de escala vive solo en `Money.hashCode()`. |
| `"isFeatured":false` | prefijo `is` intacto | Jackson strippea el `is` de los accessors booleanos y emitiría `featured`, rompiendo el toggle del backoffice. De ahí el `@JsonProperty` explícito. |
| `"whatsAppMessage"` | camelCase parcial | No es `whatsappMessage`. Por eso no hay naming strategy global. |
| `"category":0` | **int**, no string | `WRITE_ENUMS_USING_INDEX`. El orden de declaración de los enums fija los ordinales — reordenarlos rompe el JSON *y* la base. |

**Son dos DTOs distintos:** `GET /properties` devuelve `PropertyListItemDto` (19 campos, el que el frontend usa más); `GET /properties/{id}` y los writes devuelven `PropertyDto` (25). El orden de declaración es el orden del JSON.

### El filtro

| Query | Resultado | Por qué |
|---|---|---|
| `neighborhood=%` | `total: 0` | Usa **`LOCATE`, no `LIKE`**: el `%` y el `_` son **literales**. Un `cb.like("%"+x+"%")` devolvería todo. |
| `neighborhood=centro` | matchea "Centro" | Case-insensitive por la **collation** (`utf8mb4_0900_ai_ci`), no por código. No envolver en `lower()`: la collation también ignora acentos. |
| `maxPrice=1` | `total: 2` | **Incluye las de precio null** (intercambios). Omitir el `isNull` las dejaría afuera. |
| `dateFrom` solo | `total: 10` | Un solo extremo desactiva el filtro. Requiere los dos. |
| `pageSize=500` | `"pageSize":100` | El clamp está en el service y el valor clampeado se **devuelve en el body**. |
| `sortBy=PRICE_ASC` | == default | Match exacto y case-sensitive. |

**Orden:** los nulls van al final en las dos direcciones. MySQL nativamente los pone primero en ASC, así que hace falta un flag `CASE WHEN ... IS NULL`, siempre ASC en las dos ramas. Los tres órdenes desempatan por `id DESC` — sin eso, dos propiedades con el mismo precio o `createdAt` podían aparecer repetidas al paginar.

### Errores — tres formas conviven

| Origen | Forma |
|---|---|
| Handler global | `{"error":"..."}` |
| Returns a mano en los controllers | `{"message":"..."}` (login 401, PATCH `/status` 400) |
| Validación de Bean Validation | `ProblemDetails` con `errors` en PascalCase |

Los `{"message":...}` **no** pasan por el `@RestControllerAdvice`.

---

## Lo que se arregló después del port

Estos archivos ya **no** reflejan el .NET en cuatro puntos. Se replicaron sus bugs mientras hubo que comparar, y se arreglaron apenas dejó de haberlo:

| | Antes (.NET) | Ahora |
|---|---|---|
| Rate limit del login | global — 5 intentos de cualquiera bloqueaban a todos 15 min | **por IP** |
| Rechazo del rate limit | `503`, sin body | **`429` + `Retry-After`** |
| `?page=0` | **HTTP 500** (`Skip(-12)` explotaba) | primera página |
| `?featured=false` | no filtraba: devolvía todas | filtra las no destacadas |
| Orden por defecto | indefinido ante empates | desempata por `id DESC` |
