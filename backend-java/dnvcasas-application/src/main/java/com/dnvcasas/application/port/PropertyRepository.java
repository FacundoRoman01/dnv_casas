package com.dnvcasas.application.port;

import com.dnvcasas.application.dto.PropertyFilter;
import com.dnvcasas.domain.entity.Property;

import java.util.List;
import java.util.Optional;

/**
 * Puerto (arquitectura hexagonal) del catálogo de propiedades. La capa de aplicación
 * define acá las operaciones que necesita ({@link com.dnvcasas.application.service.PropertyService})
 * y la infraestructura las implementa contra la base. Devuelve entidades de dominio
 * ({@link Property}), no filas ni entidades JPA crudas.
 */
public interface PropertyRepository {

    /**
     * Listado público con filtros y paginado (categoría, destino, fechas, huéspedes...).
     * @return la página de resultados más el total de coincidencias.
     */
    PageResult findAll(PropertyFilter filter);

    /**
     * Listado del panel admin: sin filtros de negocio, trae también pausadas/borradas.
     * @return la página pedida más el total.
     */
    PageResult findAllAdmin(int page, int pageSize);

    /** Busca una propiedad por id. Vacío si no existe. */
    Optional<Property> findById(int id);

    /**
     * Barrios distintos que existen, opcionalmente acotados a un destino.
     * @param destinationId destino para filtrar, o null para traer los de todos.
     */
    List<String> findNeighborhoods(Integer destinationId);

    /**
     * Crea una propiedad nueva (con sus colecciones hijas).
     * @return la propiedad persistida (ya con su id).
     */
    Property create(Property property);

    /** Guarda los cambios de una propiedad existente. */
    void update(Property property);

    // Paquete de datos de una página: los items de esta página + el total de coincidencias
    // (necesario para que el frontend calcule cuántas páginas hay).
    record PageResult(List<Property> items, int total) { }
}
