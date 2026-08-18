package com.dnvcasas.application.port;

import com.dnvcasas.domain.entity.PropertyImage;

import java.util.List;
import java.util.Optional;

/**
 * Puerto (arquitectura hexagonal) para persistir imágenes de propiedades. La aplicación
 * define las operaciones que necesita; la infraestructura las implementa contra la base.
 */
public interface ImageRepository {

    /**
     * Guarda una imagen nueva.
     * @return la imagen persistida (ya con su id asignado).
     */
    PropertyImage add(PropertyImage image);

    /** Busca una imagen por id. Vacío si no existe. */
    Optional<PropertyImage> findById(int imageId);

    /** Borra la imagen con ese id. */
    void delete(int imageId);

    /**
     * Reordena las imágenes de una propiedad según la lista de ids dada (el orden de
     * la lista es el orden final de visualización).
     */
    void reorder(int propertyId, List<Integer> orderedImageIds);

    /**
     * Cuenta cuántas imágenes tiene una propiedad. Se usa para validar el límite
     * máximo antes de aceptar un upload nuevo, sin tener que traer todas las
     * imágenes a memoria solo para contar cuántas son.
     */
    long countByPropertyId(int propertyId);
}