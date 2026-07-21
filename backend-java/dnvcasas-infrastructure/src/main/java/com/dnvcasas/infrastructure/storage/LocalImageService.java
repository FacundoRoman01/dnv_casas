package com.dnvcasas.infrastructure.storage;

import com.dnvcasas.application.dto.PropertyDto.PropertyImageDto;
import com.dnvcasas.application.port.ImageRepository;
import com.dnvcasas.application.service.ImageService;
import com.dnvcasas.domain.entity.PropertyImage;
import com.dnvcasas.domain.exception.DomainException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.*;
import java.util.*;

/**
 * Adapter de infraestructura que guarda las imágenes de las propiedades en el disco
 * local (filesystem) y registra su metadato en la base vía {@link ImageRepository}.
 * Implementa el port {@link ImageService} de la capa application: acá viven los
 * DETALLES técnicos (escribir bytes en disco, validar magic bytes, armar la URL).
 *
 * Se llama "Local" porque escribe en el filesystem de la máquina. Si mañana se guarda
 * en S3 u otro storage, se hace otro adapter que implemente el mismo port y no cambia
 * nada de application.
 */
@Service
public class LocalImageService implements ImageService {

    private static final Logger log = LoggerFactory.getLogger(LocalImageService.class);

    // Tope de tamaño: 10 MB por archivo.
    private static final long MAX_BYTES = 10L * 1024 * 1024;

    // Extensiones aceptadas. LinkedHashSet para conservar el orden al listarlas en el
    // mensaje de error (que salga siempre igual: jpg, jpeg, png, webp).
    private static final Set<String> EXTENSIONES_PERMITIDAS =
            new LinkedHashSet<>(List.of(".jpg", ".jpeg", ".png", ".webp"));

    // "Magic bytes": los primeros bytes que identifican el formato real del archivo.
    // No confiamos solo en la extensión (se puede renombrar cualquier cosa a .jpg):
    // validamos que el contenido empiece con la firma esperada. Ver validarMagicBytes.
    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            ".jpg",  new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF },
            ".jpeg", new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF },
            ".png",  new byte[] { (byte) 0x89, 0x50, 0x4E, 0x47 },
            ".webp", new byte[] { 0x52, 0x49, 0x46, 0x46 });

    private final ImageRepository repo;
    private final Path uploadsPath;
    private final String uploadsUrl;

    /**
     * @param repo         puerto para persistir/borrar el metadato de la imagen.
     * @param physicalPath carpeta física donde se escriben los archivos. Si viene vacío,
     *                     usa ./wwwroot/uploads (el mismo layout que el backend .NET).
     * @param urlPath      prefijo de URL público con el que se sirven las imágenes.
     */
    public LocalImageService(ImageRepository repo,
                             @Value("${uploads.physical-path:}") String physicalPath,
                             @Value("${uploads.url-path:/uploads}") String urlPath) {
        this.repo = repo;
        // Path por defecto "wwwroot/uploads": nombre heredado del mundo ASP.NET, donde
        // wwwroot es la carpeta de contenido estático. Se mantiene por compatibilidad.
        this.uploadsPath = (physicalPath == null || physicalPath.isBlank())
                ? Paths.get(System.getProperty("user.dir"), "wwwroot", "uploads")
                : Paths.get(physicalPath);
        this.uploadsUrl = urlPath;
        try {
            // Nos aseguramos de que la carpeta exista al arrancar. Si no se puede crear,
            // fallamos temprano: sin carpeta no hay dónde guardar nada.
            Files.createDirectories(uploadsPath);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo crear el directorio de uploads", e);
        }
    }

    /**
     * Sube un archivo: valida extensión, tamaño y contenido real (magic bytes), lo
     * escribe en disco con un nombre aleatorio y registra el metadato en la base.
     *
     * @param propertyId id de la propiedad dueña de la imagen.
     * @param file       archivo recibido en el multipart del request.
     * @return DTO con los datos de la imagen ya guardada (id, url, orden, si es portada).
     * @throws DomainException       si la extensión no está permitida, supera 10 MB o el
     *                               contenido no coincide con la extensión.
     * @throws IllegalStateException si falla la escritura en disco.
     */
    @Override
    public PropertyImageDto upload(int propertyId, MultipartFile file) {
        String ext = extension(file.getOriginalFilename());

        if (!EXTENSIONES_PERMITIDAS.contains(ext))
            throw new DomainException(
                    "Tipo de archivo no permitido. Solo se aceptan: " + String.join(", ", EXTENSIONES_PERMITIDAS));

        if (file.getSize() > MAX_BYTES)
            throw new DomainException("El archivo no puede superar los 10 MB");

        // Nombre aleatorio (UUID) para evitar colisiones y no exponer el nombre original
        // del usuario. Conservamos la extensión validada.
        String fileName = UUID.randomUUID() + ext;
        Path destino = uploadsPath.resolve(fileName);

        try (InputStream in = file.getInputStream()) {

            // Leemos primero los 12 bytes de cabecera para validar el formato real ANTES
            // de escribir nada. 12 bytes alcanzan hasta para WEBP (firma RIFF....WEBP).
            byte[] header = new byte[12];
            int leidos = in.readNBytes(header, 0, header.length);
            validarMagicBytes(ext, header, leidos);

            // CREATE_NEW: falla si ya existiera un archivo con ese nombre (con UUID es
            // prácticamente imposible, pero así nunca pisamos algo existente). Escribimos
            // primero la cabecera ya leída y después el resto del stream.
            try (OutputStream out = Files.newOutputStream(destino,
                    StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE)) {
                out.write(header, 0, leidos);
                in.transferTo(out);
            }
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar el archivo", e);
        }

        PropertyImage image = PropertyImage.uploaded(propertyId, uploadsUrl + "/" + fileName);

        try {
            PropertyImage saved = repo.add(image);
            log.info("Imagen {} subida a la propiedad {}", saved.getUrl(), propertyId);
            return new PropertyImageDto(saved.getId(), saved.getUrl(), saved.getDisplayOrder(), saved.isCover());
        } catch (RuntimeException e) {
            // Compensación: el archivo ya está en disco, pero registrarlo en la base
            // falló. Borramos el archivo para no dejar un huérfano (archivo sin fila).
            // Si hasta el borrado falla, al menos lo dejamos logueado para limpieza manual.
            try {
                Files.deleteIfExists(destino);
            } catch (IOException borrado) {
                log.error("No se pudo borrar {} tras fallar el registro en la base — quedó huérfano",
                        destino, borrado);
            }
            throw e;
        }
    }

    /**
     * Valida que el contenido del archivo empiece con la firma (magic bytes) esperada
     * para su extensión. Evita que renombren un .exe a .jpg y lo suban.
     *
     * @throws DomainException si la cabecera leída no coincide con la firma esperada.
     */
    private static void validarMagicBytes(String ext, byte[] header, int leidos) {
        byte[] esperado = MAGIC_BYTES.get(ext);
        if (leidos < esperado.length
                || !Arrays.equals(header, 0, esperado.length, esperado, 0, esperado.length))
            throw new DomainException("El contenido del archivo no coincide con su extensión");

        // WEBP no alcanza con los primeros 4 bytes (RIFF): eso también lo tienen otros
        // formatos RIFF (ej. WAV). Los bytes 8..11 deben deletrear "WEBP" para confirmarlo.
        if (".webp".equals(ext)
                && (leidos < 12 || header[8] != 'W' || header[9] != 'E' || header[10] != 'B' || header[11] != 'P'))
            throw new DomainException("El contenido del archivo no coincide con su extensión");
    }

    /**
     * Borra una imagen: primero saca el metadato de la base y después el archivo del disco.
     *
     * @param imageId id de la imagen.
     * @return true si existía y se borró; false si no existía.
     */
    @Override
    public boolean delete(int imageId) {
        Optional<PropertyImage> found = repo.findById(imageId);
        if (found.isEmpty()) return false;

        String url = found.get().getUrl();
        repo.delete(imageId);

        try {
            // Del url guardado nos quedamos solo con el nombre de archivo y lo borramos
            // de la carpeta de uploads. Si el archivo ya no está, deleteIfExists no rompe.
            Files.deleteIfExists(uploadsPath.resolve(Paths.get(url).getFileName().toString()));
        } catch (IOException ignored) {
            // Si falla el borrado del archivo, no revertimos: el registro ya se borró y no
            // queremos que un error de filesystem tire abajo la operación. Queda un huérfano.
        }
        return true;
    }

    /**
     * Reordena las imágenes de una propiedad. Delega en el repositorio; la lógica de
     * reordenamiento vive en la entidad {@code PropertyImage}.
     *
     * @param propertyId      id de la propiedad.
     * @param orderedImageIds ids de las imágenes en el orden deseado.
     */
    @Override
    public void reorder(int propertyId, List<Integer> orderedImageIds) {
        repo.reorder(propertyId, orderedImageIds);
    }

    // Extrae la extensión (con el punto, en minúsculas) del nombre de archivo.
    // Devuelve "" si no hay nombre o no tiene punto.
    private static String extension(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        return dot < 0 ? "" : fileName.substring(dot).toLowerCase(Locale.ROOT);
    }
}
