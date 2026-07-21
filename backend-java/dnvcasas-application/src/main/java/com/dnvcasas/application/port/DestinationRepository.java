package com.dnvcasas.application.port;

import com.dnvcasas.domain.entity.Destination;

import java.util.List;
import java.util.Optional;

/**
 * Puerto (arquitectura hexagonal) para los destinos (ciudades/lugares). La capa de
 * aplicación define acá lo que necesita; la infraestructura lo implementa contra la base.
 * Lo usa {@link com.dnvcasas.application.service.DestinationService}.
 */
public interface DestinationRepository {

    /** Devuelve los destinos activos junto con cuántas propiedades tiene cada uno. */
    List<DestinationWithCount> findAllActive();

    /** Busca un destino por id. Vacío si no existe. */
    Optional<Destination> findById(int id);

    /**
     * Crea un destino nuevo.
     * @return el destino persistido (ya con su id).
     */
    Destination create(Destination destination);

    /** Guarda los cambios de un destino existente. */
    void update(Destination destination);

    /** Borrado lógico: marca el destino como inactivo en vez de eliminar la fila. */
    void softDelete(int id);

    // Paquete de datos que junta un destino con su cantidad de propiedades. Se usa para
    // llenar el campo propertyCount del DTO sin tener que hacer una consulta extra por destino.
    record DestinationWithCount(Destination destination, int count) { }
}
