package com.dnvcasas.api.controller;

import com.dnvcasas.api.error.NotFoundProblem;
import com.dnvcasas.application.dto.*;
import com.dnvcasas.application.dto.CreateUpdatePropertyDto.UpdateAvailabilityDto;
import com.dnvcasas.application.service.ImageService;
import com.dnvcasas.application.service.PropertyService;
import com.dnvcasas.domain.enums.PropertyStatus;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;

/**
 * Endpoints de ADMINISTRACIÓN de propiedades (el panel del backoffice). Expone
 * el recurso REST /api/admin/properties: crear, editar, duplicar, pausar,
 * destacar, borrar, y subir/reordenar imágenes.
 *
 * Todo lo que cuelga de /api/admin/** exige rol Admin (ver SecurityConfig): sin
 * un JWT válido con ese rol, la request nunca llega a estos métodos.
 *
 * Como el resto de controllers, es solo la capa HTTP: delega en PropertyService
 * e ImageService y traduce el resultado a códigos de estado.
 */
@RestController
@RequestMapping("/api/admin/properties")
public class AdminPropertiesController {

    private final PropertyService propertyService;
    private final ImageService imageService;

    public AdminPropertiesController(PropertyService propertyService, ImageService imageService) {
        this.propertyService = propertyService;
        this.imageService = imageService;
    }

    /**
     * GET /api/admin/properties — listado paginado que ve el admin.
     * A diferencia del listado público, este incluye también las pausadas.
     * Devuelve 200. pageSize por defecto 20.
     */
    @GetMapping
    public PagedResult<PropertyListItemDto> getAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        return propertyService.getAllAdmin(page, pageSize);
    }

    /** GET /api/admin/properties/{id} — detalle para editar. 200 si existe, 404 si no. */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable int id) {
        return propertyService.getById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(NotFoundProblem::response);
    }

    /**
     * POST /api/admin/properties — crea una propiedad nueva.
     * Devuelve 201 Created con el header Location apuntando al nuevo recurso.
     * El @Valid dispara las validaciones del DTO; si fallan, salta a 400
     * (ver ValidationProblem en GlobalExceptionHandler).
     */
    @PostMapping
    public ResponseEntity<PropertyDto> create(@Valid @RequestBody CreateUpdatePropertyDto dto) {
        PropertyDto created = propertyService.create(dto);
        return ResponseEntity
                .created(URI.create("/api/admin/properties/" + created.id()))
                .body(created);
    }

    /** PUT /api/admin/properties/{id} — edita una propiedad. 200 si existe, 404 si no. */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable int id, @Valid @RequestBody CreateUpdatePropertyDto dto) {
        return propertyService.update(id, dto)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(NotFoundProblem::response);
    }

    /**
     * PATCH /api/admin/properties/{id}/status — pausa o reactiva la propiedad.
     * El body es un entero (0 = Active, 1 = Paused), el mismo esquema ordinal
     * que usa el enum en la base. Devuelve 204 si funcionó, 404 si no existe,
     * 400 si el número está fuera de rango o si intentan mandar DELETED (para
     * borrar hay que usar DELETE, no este endpoint).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable int id, @RequestBody Integer status) {
        if (status == null || status < 0 || status >= PropertyStatus.values().length)
            return ResponseEntity.badRequest().body(
                    new MessageBody("Status inválido. Valores permitidos: 0 (Active), 1 (Paused)."));

        PropertyStatus nuevo = PropertyStatus.values()[status];
        if (nuevo == PropertyStatus.DELETED)
            return ResponseEntity.badRequest().body(
                    new MessageBody("Para eliminar una propiedad usar DELETE /{id}."));

        return propertyService.updateStatus(id, nuevo)
                ? ResponseEntity.noContent().build()
                : NotFoundProblem.response();
    }

    /** PATCH /api/admin/properties/{id}/featured — destaca/quita destacado. 204 ok, 404 si no existe. */
    @PatchMapping("/{id}/featured")
    public ResponseEntity<?> setFeatured(@PathVariable int id, @RequestBody Boolean featured) {
        return propertyService.setFeatured(id, Boolean.TRUE.equals(featured))
                ? ResponseEntity.noContent().build()
                : NotFoundProblem.response();
    }

    /**
     * POST /api/admin/properties/{id}/duplicate — clona una propiedad existente.
     * Devuelve 201 Created con la copia (arranca pausada y sin destacar).
     *
     * Nota: este es EL endpoint del bug histórico. En el backend .NET original
     * "Duplicar" devolvía 400 por un problema en la costura dominio/persistencia.
     * Lo cubre WriteFlowIT contra MySQL real, no los tests de dominio en memoria.
     */
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<?> duplicate(@PathVariable int id) {
        return propertyService.duplicate(id)
                .<ResponseEntity<?>>map(dto -> ResponseEntity
                        .created(URI.create("/api/admin/properties/" + dto.id()))
                        .body(dto))
                .orElseGet(NotFoundProblem::response);
    }

    /**
     * DELETE /api/admin/properties/{id} — borra la propiedad (borrado lógico:
     * queda marcada DELETED, la fila no se elimina). 204 ok, 404 si no existe.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable int id) {
        return propertyService.delete(id)
                ? ResponseEntity.noContent().build()
                : NotFoundProblem.response();
    }

    /**
     * POST /api/admin/properties/{id}/images — sube una imagen (multipart/form-data).
     * 200 con los datos de la imagen creada, o 404 si la propiedad no existe.
     */
    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadImage(@PathVariable int id,
                                         @RequestParam("file") MultipartFile file) {
        if (propertyService.getById(id).isEmpty()) return NotFoundProblem.response();
        return ResponseEntity.ok(imageService.upload(id, file));
    }

    /**
     * PUT /api/admin/properties/{id}/images/reorder — reordena las imágenes.
     * El body es la lista de ids en el orden deseado. Devuelve 204.
     */
    @PutMapping("/{id}/images/reorder")
    public ResponseEntity<Void> reorderImages(@PathVariable int id, @RequestBody List<Integer> orderedImageIds) {
        imageService.reorder(id, orderedImageIds);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/admin/properties/{id}/availability — reemplaza el calendario de
     * disponibilidad completo. 204 ok, 404 si la propiedad no existe.
     */
    @PutMapping("/{id}/availability")
    public ResponseEntity<?> updateAvailability(@PathVariable int id,
                                                @RequestBody UpdateAvailabilityDto dto) {
        return propertyService.updateAvailability(id, dto)
                ? ResponseEntity.noContent().build()
                : NotFoundProblem.response();
    }

    public record MessageBody(String message) { }
}
