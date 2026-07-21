package com.dnvcasas.infrastructure.persistence.spec;

import com.dnvcasas.application.dto.PropertyFilter;
import com.dnvcasas.domain.entity.Property;
import com.dnvcasas.domain.entity.PropertyAvailability;
import com.dnvcasas.domain.enums.AvailabilityStatus;
import com.dnvcasas.domain.enums.PropertyStatus;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Construye las Specifications (predicados de consulta dinámicos de Spring Data JPA)
 * para filtrar el catálogo público de propiedades. Es infraestructura pura: traduce
 * el {@link PropertyFilter} que arma la capa application a condiciones SQL sobre las
 * entidades JPA.
 *
 * Clase de utilidad: constructor privado, todo estático. No se instancia.
 *
 * Cada filtro se arma solo si el campo correspondiente viene informado, y al final
 * se combinan todos con AND. Ojo con dos "gotchas" heredados del port desde .NET que
 * están comentados abajo: el uso de LOCATE en vez de LIKE, y que category/propertyType
 * se comparan como enums que en la base son números (ORDINAL).
 */
public final class PropertySpecifications {

    private PropertySpecifications() { }

    /**
     * Arma la Specification combinada a partir del filtro. Siempre incluye el filtro
     * fijo de status = ACTIVE (el catálogo público solo muestra propiedades activas).
     *
     * @param f filtro con los criterios opcionales de búsqueda.
     * @return la Specification combinada con AND, o null si no hubiera partes (no pasa:
     *         el status ACTIVE siempre está).
     */
    public static Specification<Property> build(PropertyFilter f) {
        List<Specification<Property>> parts = new ArrayList<>();

        // Filtro base no negociable: el catálogo público solo muestra ACTIVE.
        // Recordá que Status se guarda como número (ORDINAL) en la base heredada.
        parts.add((root, query, cb) -> cb.equal(root.get("status"), PropertyStatus.ACTIVE));

        if (f.category() != null)
            parts.add((root, query, cb) -> cb.equal(root.get("category"), f.category()));

        if (f.destinationId() != null)
            parts.add((root, query, cb) -> cb.equal(root.get("destinationId"), f.destinationId()));

        if (f.neighborhood() != null && !f.neighborhood().isBlank())
            // OJO: buscamos "contiene el texto" con la función LOCATE, NO con LIKE.
            // Con LOCATE(sub, str) el texto que ingresa el usuario se compara literal:
            // si escribe "%" o "_", se buscan esos caracteres tal cual. Con LIKE, "%" y
            // "_" serían comodines y cambiarían el resultado de la búsqueda (además de
            // exponer a inyección de comodines). LOCATE devuelve la posición (1-based) o
            // 0 si no encontró; por eso el filtro es "> 0". No lo cambies a LIKE.
            parts.add((root, query, cb) -> cb.greaterThan(
                    cb.function("locate", Integer.class,
                            cb.literal(f.neighborhood()), root.get("neighborhood")),
                    0));

        if (f.guests() != null)
            parts.add((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("specs").get("capacity"), f.guests()));

        if (f.bedrooms() != null)
            parts.add((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("specs").get("bedrooms"), f.bedrooms()));

        if (f.maxPrice() != null)
            // "Hasta tal precio": pasa si el precio es <= maxPrice O si no tiene precio
            // (amount null = "a consultar", ej. intercambios). No queremos esconder las
            // propiedades sin precio solo porque el usuario puso un tope.
            parts.add((root, query, cb) -> cb.or(
                    cb.isNull(root.get("price").get("amount")),
                    cb.lessThanOrEqualTo(root.get("price").get("amount"), f.maxPrice())));

        if (f.propertyType() != null)
            // propertyType también es enum guardado como número (ORDINAL) en la base.
            parts.add((root, query, cb) -> cb.equal(root.get("propertyType"), f.propertyType()));

        if (f.featured() != null)
            parts.add((root, query, cb) -> cb.equal(root.get("isFeatured"), f.featured()));

        if (f.dateFrom() != null && f.dateTo() != null)
            // Filtro por disponibilidad de fechas. Buscamos propiedades que NO tengan
            // ningún día marcado UNAVAILABLE dentro del rango pedido. Se resuelve con un
            // NOT EXISTS sobre una subconsulta correlacionada a PropertyAvailability: si
            // existe al menos un día no disponible en el rango, la propiedad se descarta.
            parts.add((root, query, cb) -> {
                Subquery<Integer> sub = query.subquery(Integer.class);
                Root<PropertyAvailability> a = sub.from(PropertyAvailability.class);
                sub.select(a.get("property").get("id")).where(
                        cb.equal(a.get("status"), AvailabilityStatus.UNAVAILABLE),
                        cb.between(a.get("date"), f.dateFrom(), f.dateTo()),
                        // correlación con la propiedad de la query externa
                        cb.equal(a.get("property").get("id"), root.get("id")));
                return cb.not(cb.exists(sub));
            });

        // Combina todas las partes con AND. reduce sobre la lista: parte1 AND parte2 AND ...
        return parts.stream().reduce(Specification::and).orElse(null);
    }
}
