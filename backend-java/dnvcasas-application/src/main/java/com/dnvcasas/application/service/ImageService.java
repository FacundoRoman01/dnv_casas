package com.dnvcasas.application.service;

import com.dnvcasas.application.dto.PropertyDto.PropertyImageDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Caso de uso de imágenes, definido como interfaz. Ojo: acá el service es una interfaz
 * (no una clase con @Service) porque subir un archivo necesita tocar disco/almacenamiento,
 * que es infraestructura; entonces la implementación concreta vive en el módulo de infra.
 * La capa api depende de esta interfaz, no de la implementación.
 */
public interface ImageService {

    /**
     * Sube un archivo y lo asocia como imagen de la propiedad.
     * @param file el archivo recibido en el request multipart.
     * @return el DTO de la imagen ya guardada (id, url, orden, si es portada).
     */
    PropertyImageDto upload(int propertyId, MultipartFile file);

    /**
     * Borra una imagen.
     * @return true si existía y se borró, false si no había imagen con ese id.
     */
    boolean delete(int imageId);

    /** Reordena las imágenes de la propiedad según el orden de la lista de ids. */
    void reorder(int propertyId, List<Integer> orderedImageIds);
}
