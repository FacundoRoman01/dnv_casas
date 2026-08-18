package com.dnvcasas.infrastructure.persistence.jpa;

import com.dnvcasas.domain.entity.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repositorio Spring Data JPA para las imágenes de propiedades. Spring implementa esta
 * interfaz en runtime. Lo usa el {@code ImageRepositoryAdapter} (que sí implementa el
 * port de application).
 */
public interface ImageJpaRepository extends JpaRepository<PropertyImage, Integer> {

    /** Todas las imágenes de una propiedad. Query derivada del nombre del método. */
    List<PropertyImage> findByPropertyId(int propertyId);

    /**
     * Cuenta cuántas imágenes tiene una propiedad, sin traer los registros completos.
     * Se usa para validar el límite máximo de fotos antes de aceptar un upload:
     * es una query SELECT COUNT(*), mucho más liviana que traer toda la lista
     * solo para hacer .size() en memoria.
     */
    long countByPropertyId(int propertyId);
}