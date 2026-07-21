package com.dnvcasas.infrastructure.persistence.adapter;

import com.dnvcasas.application.dto.PropertyFilter;
import com.dnvcasas.application.port.PropertyRepository;
import com.dnvcasas.domain.entity.Property;
import com.dnvcasas.infrastructure.persistence.jpa.PropertyJpaRepository;
import com.dnvcasas.infrastructure.persistence.spec.PropertySpecifications;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Adapter de persistencia de propiedades: el más denso del módulo. Implementa el port
 * {@link PropertyRepository} (capa application) combinando el repositorio Spring Data
 * {@link PropertyJpaRepository} con consultas Criteria armadas a mano vía
 * {@link EntityManager}.
 *
 * La estrategia de lectura es en dos pasos, a propósito, para paginar bien sin duplicar
 * filas por los JOIN de colecciones:
 *   1) Primero se traen SOLO los ids de la página (count + query de ids ordenados).
 *   2) Después se cargan las entidades completas de esos ids y se hidratan sus
 *      colecciones (ver loadInIdOrder).
 * Si paginaras directo sobre una query con "join fetch" a una colección, la base
 * devolvería N filas por propiedad y la paginación por filas quedaría mal. Por eso
 * primero ids, después entidades.
 */
@Repository
public class PropertyRepositoryAdapter implements PropertyRepository {

    private final PropertyJpaRepository jpa;
    private final EntityManager em;

    public PropertyRepositoryAdapter(PropertyJpaRepository jpa, EntityManager em) {
        this.jpa = jpa;
        this.em = em;
    }

    /**
     * Listado público del catálogo, con filtros y paginación.
     *
     * @param filter criterios de búsqueda + página/tamaño + orden.
     * @return la página de propiedades y el total de coincidencias (para el paginador).
     */
    @Override
    @Transactional(readOnly = true)
    public PageResult findAll(PropertyFilter filter) {
        Specification<Property> spec = PropertySpecifications.build(filter);

        // Cortamos temprano si no hay coincidencias: nos ahorramos la query de ids y la carga.
        int total = (int) count(spec);
        if (total == 0) return new PageResult(List.of(), 0);

        List<Integer> ids = findIds(spec, filter);
        if (ids.isEmpty()) return new PageResult(List.of(), total);

        return new PageResult(loadInIdOrder(ids), total);
    }

    /**
     * Listado del panel admin (incluye pausadas, excluye borradas), ordenado por fecha
     * de creación descendente y paginado.
     *
     * @param page     número de página, 1-based (por eso el -1 al pasar a PageRequest).
     * @param pageSize tamaño de página.
     */
    @Override
    @Transactional(readOnly = true)
    public PageResult findAllAdmin(int page, int pageSize) {
        long total = jpa.countAdmin();
        if (total == 0) return new PageResult(List.of(), 0);

        List<Integer> ids = jpa.findAdminIds(
                org.springframework.data.domain.PageRequest.of(page - 1, pageSize,
                        org.springframework.data.domain.Sort.by(
                                org.springframework.data.domain.Sort.Direction.DESC, "createdAt")));
        if (ids.isEmpty()) return new PageResult(List.of(), (int) total);

        return new PageResult(loadInIdOrder(ids), (int) total);
    }

    /**
     * Trae una propiedad completa por id, con todas sus colecciones hidratadas.
     *
     * Los cuatro fetchXxx parecen "no usarse" (no se guarda el resultado), pero SÍ
     * hacen efecto: corren dentro de la misma transacción, así que Hibernate va
     * completando las colecciones sobre la MISMA instancia que ya está en el contexto
     * de persistencia (la que devolvió findByIdWithDestination). Por eso al final
     * devolvemos `found` y ya viene con imágenes, amenities, precios y disponibilidad.
     * Se hace en fetch separados para no armar un producto cartesiano gigante.
     *
     * @return la propiedad, o vacío si no existe o está borrada.
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<Property> findById(int id) {
        Optional<Property> found = jpa.findByIdWithDestination(id);
        if (found.isEmpty()) return Optional.empty();

        jpa.fetchImages(id);
        jpa.fetchAmenities(id);
        jpa.fetchSeasonPrices(id);
        jpa.fetchAvailability(id);
        return found;
    }

    /** Barrios distintos para los combos de filtro (opcionalmente por destino). */
    @Override
    @Transactional(readOnly = true)
    public List<String> findNeighborhoods(Integer destinationId) {
        return jpa.findNeighborhoods(destinationId);
    }

    /** Inserta una propiedad nueva. saveAndFlush fuerza el INSERT para obtener el id. */
    @Override
    @Transactional
    public Property create(Property property) {
        return jpa.saveAndFlush(property);
    }

    /** Persiste los cambios de una propiedad existente (incluye sus colecciones en cascada). */
    @Override
    @Transactional
    public void update(Property property) {
        jpa.saveAndFlush(property);
    }

    // Cuenta cuántas propiedades matchean el filtro, sin traerlas. Criteria a mano para
    // reutilizar la misma Specification que se usa en findIds.
    private long count(Specification<Property> spec) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<Property> root = cq.from(Property.class);
        cq.select(cb.count(root));
        Predicate p = spec.toPredicate(root, cq, cb);
        if (p != null) cq.where(p);
        return em.createQuery(cq).getSingleResult();
    }

    // Trae SOLO los ids de la página que corresponde (paso 1 de la estrategia en dos
    // pasos). Aplica el filtro, el orden y la paginación. setFirstResult usa
    // (page-1)*pageSize porque page viene 1-based desde el frontend.
    private List<Integer> findIds(Specification<Property> spec, PropertyFilter f) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Integer> cq = cb.createQuery(Integer.class);
        Root<Property> root = cq.from(Property.class);
        cq.select(root.get("id"));

        Predicate p = spec.toPredicate(root, cq, cb);
        if (p != null) cq.where(p);
        cq.orderBy(orderBy(cb, root, f.sortBy()));

        return em.createQuery(cq)
                .setFirstResult((f.page() - 1) * f.pageSize())
                .setMaxResults(f.pageSize())
                .getResultList();
    }

    // Traduce el criterio de orden del filtro a columnas SQL. En todos los casos se
    // agrega el id descendente como DESEMPATE final: garantiza un orden determinístico
    // cuando dos filas empatan en el criterio principal (si no, la base podría
    // devolverlas en cualquier orden y romper la paginación / el test GoldenIT).
    private List<Order> orderBy(CriteriaBuilder cb, Root<Property> root, String sortBy) {
        Order desempate = cb.desc(root.get("id"));

        if ("price_asc".equals(sortBy) || "price_desc".equals(sortBy)) {
            Path<Object> amount = root.get("price").get("amount");
            // "nulls last" a mano: las propiedades sin precio (amount null, "a consultar")
            // van SIEMPRE al final, ordenen asc o desc. Se arma una columna virtual
            // (0 = tiene precio, 1 = null) y se ordena primero por ella. Hace falta
            // hacerlo así porque no todas las bases respetan NULLS LAST de forma portable.
            Expression<Integer> nullsLast = cb.<Integer>selectCase()
                    .when(cb.isNull(amount), 1)
                    .otherwise(0)
                    .as(Integer.class);
            Order valueOrder = "price_asc".equals(sortBy) ? cb.asc(amount) : cb.desc(amount);
            return List.of(cb.asc(nullsLast), valueOrder, desempate);
        }
        // Por defecto: más nuevas primero.
        return List.of(cb.desc(root.get("createdAt")), desempate);
    }

    // Paso 2: carga las entidades completas de los ids ya paginados y las devuelve EN EL
    // MISMO ORDEN que venían los ids. Esto es clave: la query "in :ids" NO respeta el
    // orden de la lista, así que reordenamos nosotros con un Map id->propiedad. El
    // hydrateAmenities completa las amenities sobre las mismas instancias (misma tx).
    private List<Property> loadInIdOrder(List<Integer> ids) {
        List<Property> loaded = jpa.findByIdsWithDestinationAndImages(ids);
        jpa.hydrateAmenities(ids);

        Map<Integer, Property> byId = new LinkedHashMap<>();
        for (Property p : loaded) byId.put(p.getId(), p);

        List<Property> ordered = new ArrayList<>(ids.size());
        for (Integer id : ids) {
            Property p = byId.get(id);
            if (p != null) ordered.add(p);
        }
        return ordered;
    }
}
