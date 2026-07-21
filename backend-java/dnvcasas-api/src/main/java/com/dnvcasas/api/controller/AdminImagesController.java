package com.dnvcasas.api.controller;

import com.dnvcasas.api.error.NotFoundProblem;
import com.dnvcasas.application.service.ImageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoint de administración de imágenes sueltas. Expone /api/admin/images.
 * Por ahora solo permite borrar una imagen por su id (la subida y el reordenamiento
 * cuelgan de AdminPropertiesController porque necesitan el id de la propiedad).
 * Protegido por rol Admin.
 */
@RestController
@RequestMapping("/api/admin/images")
public class AdminImagesController {

    private final ImageService service;

    public AdminImagesController(ImageService service) {
        this.service = service;
    }

    /** DELETE /api/admin/images/{imageId} — borra una imagen. 204 ok, 404 si no existe. */
    @DeleteMapping("/{imageId}")
    public ResponseEntity<?> delete(@PathVariable int imageId) {
        return service.delete(imageId)
                ? ResponseEntity.noContent().build()
                : NotFoundProblem.response();
    }
}
