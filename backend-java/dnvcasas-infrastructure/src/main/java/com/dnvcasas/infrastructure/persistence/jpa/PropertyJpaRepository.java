package com.dnvcasas.infrastructure.persistence.jpa;

import com.dnvcasas.domain.entity.Property;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio Spring Data JPA de propiedades. Además de {@link JpaRepository} (CRUD),
 * extiende {@link JpaSpecificationExecutor} para poder correr las Specifications
 * dinámicas que arma {@code PropertySpecifications} (los filtros del catálogo).
 *
 * Truco clave de este repo: la carga por partes con varios "left join fetch". Cada
 * método fetchXxx trae UNA colección de la propiedad. Esto es a propósito: cargar
 * varias colaciones (imágenes + amenities + precios...) en una sola query haría un
 * producto cartesiano enorme (N imágenes x M amenities = N*M filas). En su lugar, el
 * adapter llama varios fetch chicos y Hibernate "cose" las colecciones en la misma
 * entidad porque ya está en el contexto de persistencia (la misma transacción).
 *
 * Recordá que status se guarda como número (ORDINAL) por herencia del .NET:
 * 0 = ACTIVE, 2 = DELETED. Por eso las queries usan literales 0 y 2, no nombres.
 */
public interface PropertyJpaRepository
        extends JpaRepository<Property, Integer>, JpaSpecificationExecutor<Property> {

    /** Trae la propiedad con su destino ya cargado, salvo que esté borrada (status 2). */
    @Query("select distinct p from Property p left join fetch p.destination where p.id = :id and p.status <> 2")
    Optional<Property> findByIdWithDestination(@Param("id") int id);

    // Los cuatro fetch de abajo cargan cada colección por separado (ver nota de arriba
    // sobre por qué no se hace todo junto). El adapter los llama en cadena dentro de la
    // misma transacción para hidratar la entidad ya traída por findByIdWithDestination.

    /** Hidrata las imágenes de la propiedad. */
    @Query("select distinct p from Property p left join fetch p.images where p.id = :id")
    Optional<Property> fetchImages(@Param("id") int id);

    /** Hidrata las amenities (comodidades) de la propiedad. */
    @Query("select distinct p from Property p left join fetch p.amenities where p.id = :id")
    Optional<Property> fetchAmenities(@Param("id") int id);

    /** Hidrata los precios por temporada de la propiedad. */
    @Query("select distinct p from Property p left join fetch p.seasonPrices where p.id = :id")
    Optional<Property> fetchSeasonPrices(@Param("id") int id);

    /** Hidrata el calendario de disponibilidad de la propiedad. */
    @Query("select distinct p from Property p left join fetch p.availability where p.id = :id")
    Optional<Property> fetchAvailability(@Param("id") int id);

    /**
     * Carga varias propiedades por id trayendo destino e imágenes de una (para el
     * listado). Acá sí se juntan destino + imágenes porque destino es un solo registro
     * (ManyToOne), así que no explota el producto cartesiano como pasaría con dos
     * colecciones grandes.
     */
    @Query("select distinct p from Property p "
         + "left join fetch p.destination "
         + "left join fetch p.images "
         + "where p.id in :ids")
    List<Property> findByIdsWithDestinationAndImages(@Param("ids") List<Integer> ids);

    /** Hidrata amenities para un lote de propiedades ya cargadas (misma técnica). */
    @Query("select distinct p from Property p left join fetch p.amenities where p.id in :ids")
    List<Property> hydrateAmenities(@Param("ids") List<Integer> ids);

    /**
     * Lista los barrios distintos de propiedades ACTIVE (status 0), para los combos de
     * filtro. Si {@code destinationId} es null trae los de todos los destinos; si no,
     * solo los de ese destino. Ordenado alfabético.
     */
    @Query("select distinct p.neighborhood from Property p "
         + "where p.status = 0 and p.neighborhood is not null and p.neighborhood <> '' "
         + "and (:destinationId is null or p.destinationId = :destinationId) "
         + "order by p.neighborhood asc")
    List<String> findNeighborhoods(@Param("destinationId") Integer destinationId);

    /** IDs paginados para el listado del admin (incluye pausadas, excluye borradas). */
    @Query("select p.id from Property p where p.status <> 2")
    List<Integer> findAdminIds(Pageable pageable);

    /** Total de propiedades no borradas, para la paginación del admin. */
    @Query("select count(p) from Property p where p.status <> 2")
    long countAdmin();
}
