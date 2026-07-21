package com.dnvcasas.infrastructure.persistence.jpa;

import com.dnvcasas.domain.entity.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

/**
 * Repositorio Spring Data JPA para los destinos (ciudades/zonas). Implementado por
 * Spring en runtime; consumido por {@code DestinationRepositoryAdapter}.
 */
public interface DestinationJpaRepository extends JpaRepository<Destination, Integer> {

    /** Solo los destinos activos (los que se muestran en el sitio). */
    @Query("select d from Destination d where d.isActive = true")
    List<Destination> findAllActive();

    /**
     * Cuenta propiedades no borradas por destino, para mostrar "(N propiedades)".
     * El {@code status <> 2} descarta las DELETED (status 2 = borrado lógico; recordá
     * que el enum se guarda como número por herencia del backend .NET). Devuelve filas
     * {@code [destinationId, count]} como Object[]; el adapter las arma en un Map.
     */
    @Query("select p.destinationId, count(p) from Property p where p.status <> 2 group by p.destinationId")
    List<Object[]> countByDestination();
}
