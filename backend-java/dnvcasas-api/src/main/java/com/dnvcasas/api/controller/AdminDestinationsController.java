package com.dnvcasas.api.controller;

import com.dnvcasas.api.error.NotFoundProblem;
import com.dnvcasas.application.dto.CreateUpdateDestinationDto;
import com.dnvcasas.application.dto.DestinationDto;
import com.dnvcasas.application.service.DestinationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ABM de destinos para el backoffice. Expone /api/admin/destinations.
 * Protegido por rol Admin (ver SecurityConfig). Capa HTTP que delega en el service.
 */
@RestController
@RequestMapping("/api/admin/destinations")
public class AdminDestinationsController {

    private final DestinationService service;

    public AdminDestinationsController(DestinationService service) {
        this.service = service;
    }

    /** GET /api/admin/destinations — lista todos los destinos. 200. */
    @GetMapping
    public List<DestinationDto> getAll() {
        return service.getAll();
    }

    /** POST /api/admin/destinations — crea un destino. Devuelve el DTO creado (200). */
    @PostMapping
    public DestinationDto create(@Valid @RequestBody CreateUpdateDestinationDto dto) {
        return service.create(dto);
    }

    /** PUT /api/admin/destinations/{id} — edita un destino. 200 si existe, 404 si no. */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable int id, @Valid @RequestBody CreateUpdateDestinationDto dto) {
        return service.update(id, dto)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(NotFoundProblem::response);
    }

    /** DELETE /api/admin/destinations/{id} — borra un destino. 204 ok, 404 si no existe. */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable int id) {
        return service.delete(id)
                ? ResponseEntity.noContent().build()
                : NotFoundProblem.response();
    }
}
