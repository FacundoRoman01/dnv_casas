package com.dnvcasas.infrastructure.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.dnvcasas.application.dto.PropertyDto.PropertyImageDto;
import com.dnvcasas.application.port.ImageRepository;
import com.dnvcasas.application.service.ImageService;
import com.dnvcasas.domain.entity.PropertyImage;
import com.dnvcasas.domain.exception.DomainException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Service
@Profile("cloudinary")
public class CloudinaryImageService implements ImageService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryImageService.class);
    private static final long MAX_BYTES = 10L * 1024 * 1024;
    private static final Set<String> EXTENSIONES_PERMITIDAS =
            new LinkedHashSet<>(List.of(".jpg", ".jpeg", ".png", ".webp"));

    // Tope de fotos por propiedad. Cuida créditos de Cloudinary (storage +
    // bandwidth) y mantiene la galería usable — más de esto ya degrada la UX
    // y el tiempo de carga de la página en vez de ayudar.
    private static final int MAX_IMAGENES_POR_PROPIEDAD = 30;

    private final ImageRepository repo;
    private final Cloudinary cloudinary;
    private final String cloudinaryFolder;

    public CloudinaryImageService(ImageRepository repo, Cloudinary cloudinary,
                                  @Value("${cloudinary.folder}") String cloudinaryFolder) {
        this.repo = repo;
        this.cloudinary = cloudinary;
        this.cloudinaryFolder = cloudinaryFolder;
        log.info("Servicio de imágenes configurado para usar Cloudinary en la carpeta '{}'", cloudinaryFolder);
    }

    @Override
    public PropertyImageDto upload(int propertyId, MultipartFile file) {
        String ext = extension(file.getOriginalFilename());

        if (!EXTENSIONES_PERMITIDAS.contains(ext))
            throw new DomainException(
                    "Tipo de archivo no permitido. Solo se aceptan: " + String.join(", ", EXTENSIONES_PERMITIDAS));

        if (file.getSize() > MAX_BYTES)
            throw new DomainException("El archivo no puede superar los 10 MB");

        // Chequeo del límite ANTES de subir nada a Cloudinary: si ya está en el
        // tope, cortamos acá y no gastamos ni un byte de storage/bandwidth en
        // un upload que vamos a rechazar igual.
        long actuales = repo.countByPropertyId(propertyId);
        if (actuales >= MAX_IMAGENES_POR_PROPIEDAD)
            throw new DomainException(
                    "Esta propiedad ya alcanzó el máximo de " + MAX_IMAGENES_POR_PROPIEDAD + " fotos");

        String publicId;
        String url;

        try {
            // Usando Map.of nativo de Java evitamos el error visual y el @SuppressWarnings
            Map<String, String> options = Map.of(
                    "public_id", UUID.randomUUID().toString(),
                    "folder", cloudinaryFolder
            );

            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);

            publicId = (String) result.get("public_id");
            url = (String) result.get("secure_url");

        } catch (IOException e) {
            throw new IllegalStateException("No se pudo subir el archivo a Cloudinary", e);
        }

        PropertyImage image = PropertyImage.uploaded(propertyId, url);

        try {
            PropertyImage saved = repo.add(image);
            // Log mejorado: Ahora sí queda registrado el ID y el public_id clarísimo
            log.info("Imagen guardada en DB exitosamente. ID: {}, PropertyID: {}, Cloudinary public_id: {}", saved.getId(), propertyId, publicId);
            return new PropertyImageDto(saved.getId(), saved.getUrl(), saved.getDisplayOrder(), saved.isCover());
        } catch (RuntimeException e) {
            // Log detallado de compensación
            log.error("Error al guardar en base de datos. Iniciando compensación: intentando borrar la imagen {} de Cloudinary...", publicId);
            try {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                log.info("Compensación exitosa: Imagen {} borrada de Cloudinary.", publicId);
            } catch (IOException destroyEx) {
                log.error("CRÍTICO: Falló la compensación. La imagen {} quedó huérfana en Cloudinary. Detalle del error: {}", publicId, destroyEx.getMessage());
            }
            throw e;
        }
    }

    @Override
    public boolean delete(int imageId) {
        Optional<PropertyImage> found = repo.findById(imageId);
        if (found.isEmpty()) return false;

        String url = found.get().getUrl();
        repo.delete(imageId);

        try {
            String publicId = cloudinaryFolder + "/" + url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'));
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Imagen con public_id {} borrada correctamente de Cloudinary.", publicId);
        } catch (Exception e) {
            // Log robusto para avisar de imágenes huérfanas
            log.warn("ATENCIÓN: Se eliminó la imagen {} de la base de datos, pero falló el borrado en Cloudinary. La imagen quedó huérfana. Causa: {}", url, e.getMessage());
        }
        return true;
    }

    @Override
    public void reorder(int propertyId, List<Integer> orderedImageIds) {
        repo.reorder(propertyId, orderedImageIds);
    }

    private static String extension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot).toLowerCase(Locale.ROOT);
    }
}