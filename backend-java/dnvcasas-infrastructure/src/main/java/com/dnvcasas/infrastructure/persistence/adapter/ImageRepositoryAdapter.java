package com.dnvcasas.infrastructure.persistence.adapter;

import com.dnvcasas.application.port.ImageRepository;
import com.dnvcasas.domain.entity.PropertyImage;
import com.dnvcasas.infrastructure.persistence.jpa.ImageJpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Adapter de persistencia para imágenes. Implementa el port {@link ImageRepository}
 * (capa application) sobre {@link ImageJpaRepository}. Solo se ocupa del metadato en
 * la base; los archivos físicos los maneja {@code LocalImageService}.
 */
@Repository
public class ImageRepositoryAdapter implements ImageRepository {

    private final ImageJpaRepository jpa;

    public ImageRepositoryAdapter(ImageJpaRepository jpa) {
        this.jpa = jpa;
    }

    /** Guarda una imagen nueva. saveAndFlush fuerza el INSERT ya para tener el id generado. */
    @Override
    @Transactional
    public PropertyImage add(PropertyImage image) {
        return jpa.saveAndFlush(image);
    }

    /** Busca una imagen por id. */
    @Override
    @Transactional(readOnly = true)
    public Optional<PropertyImage> findById(int imageId) {
        return jpa.findById(imageId);
    }

    /** Borra físicamente la fila de la imagen, si existe. */
    @Override
    @Transactional
    public void delete(int imageId) {
        jpa.findById(imageId).ifPresent(jpa::delete);
    }

    /**
     * Reordena las imágenes de una propiedad: trae las actuales, deja que la entidad
     * aplique el nuevo orden (la regla vive en {@code PropertyImage.reorder}) y guarda
     * todas juntas.
     */
    @Override
    @Transactional
    public void reorder(int propertyId, List<Integer> orderedImageIds) {
        List<PropertyImage> images = jpa.findByPropertyId(propertyId);
        PropertyImage.reorder(images, orderedImageIds);
        jpa.saveAllAndFlush(images);
    }
}
