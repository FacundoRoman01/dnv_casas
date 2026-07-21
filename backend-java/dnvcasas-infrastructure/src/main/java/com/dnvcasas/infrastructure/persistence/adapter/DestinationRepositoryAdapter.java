package com.dnvcasas.infrastructure.persistence.adapter;

import com.dnvcasas.application.port.DestinationRepository;
import com.dnvcasas.domain.entity.Destination;
import com.dnvcasas.infrastructure.persistence.jpa.DestinationJpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Adapter de persistencia para destinos. Implementa el port {@link DestinationRepository}
 * (capa application) sobre {@link DestinationJpaRepository}.
 */
@Repository
public class DestinationRepositoryAdapter implements DestinationRepository {

    private final DestinationJpaRepository jpa;

    public DestinationRepositoryAdapter(DestinationJpaRepository jpa) {
        this.jpa = jpa;
    }

    /**
     * Trae los destinos activos junto con cuántas propiedades tiene cada uno.
     *
     * Hace dos queries (los destinos por un lado, los conteos por otro) y las cruza en
     * memoria en un Map id->count, en vez de un JOIN con GROUP BY que arrastraría los
     * destinos sin propiedades. Con getOrDefault(0) los destinos sin propiedades quedan
     * en 0.
     */
    @Override
    @Transactional(readOnly = true)
    public List<DestinationWithCount> findAllActive() {
        List<Destination> destinations = jpa.findAllActive();

        // Armamos el índice destinationId -> cantidad a partir de las filas [id, count].
        Map<Integer, Integer> counts = new HashMap<>();
        for (Object[] row : jpa.countByDestination())
            counts.put((Integer) row[0], ((Long) row[1]).intValue());

        return destinations.stream()
                .map(d -> new DestinationWithCount(d, counts.getOrDefault(d.getId(), 0)))
                .toList();
    }

    /** Busca un destino por id. */
    @Override
    @Transactional(readOnly = true)
    public Optional<Destination> findById(int id) {
        return jpa.findById(id);
    }

    /** Crea un destino nuevo. */
    @Override
    @Transactional
    public Destination create(Destination destination) {
        return jpa.saveAndFlush(destination);
    }

    /** Actualiza un destino existente. */
    @Override
    @Transactional
    public void update(Destination destination) {
        jpa.saveAndFlush(destination);
    }

    /**
     * Borrado lógico: no elimina la fila, solo marca isActive = false para que deje de
     * aparecer. Si el id no existe, no hace nada.
     */
    @Override
    @Transactional
    public void softDelete(int id) {
        jpa.findById(id).ifPresent(d -> {
            d.setActive(false);
            jpa.saveAndFlush(d);
        });
    }
}
