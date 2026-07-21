package com.dnvcasas.api.controller;

import com.dnvcasas.api.error.NotFoundProblem;
import com.dnvcasas.application.dto.*;
import com.dnvcasas.application.service.PropertyService;
import com.dnvcasas.domain.enums.PropertyCategory;
import com.dnvcasas.domain.enums.PropertyType;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Endpoints PÚBLICOS del catálogo de propiedades (los que ve el visitante del
 * sitio, sin login). Expone el recurso REST /api/properties.
 *
 * Recordá que un controller es solo la capa de entrada HTTP: no tiene lógica de
 * negocio, únicamente recibe la request, la delega en el PropertyService y
 * devuelve lo que el service le da. Toda la lógica vive en la capa application.
 */
@RestController
@RequestMapping("/api/properties")
public class PropertiesController {

    private final PropertyService service;

    public PropertiesController(PropertyService service) {
        this.service = service;
    }

    /**
     * GET /api/properties — listado paginado y filtrable del catálogo.
     * Todos los filtros son opcionales (query params). Devuelve 200 con la página.
     * page arranca en 1 y pageSize por defecto es 12.
     */
    @GetMapping
    public PagedResult<PropertyListItemDto> getAll(
            @RequestParam(required = false) PropertyCategory category,
            @RequestParam(required = false) Integer destinationId,
            @RequestParam(required = false) String neighborhood,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Integer guests,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) PropertyType propertyType,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int pageSize,
            @RequestParam(required = false) String sortBy) {

        return service.getAll(new PropertyFilter(
                category, destinationId, neighborhood, dateFrom, dateTo,
                guests, bedrooms, maxPrice, propertyType, featured,
                page, pageSize, sortBy));
    }

    /** GET /api/properties/neighborhoods — lista de barrios, opcionalmente de un destino. */
    @GetMapping("/neighborhoods")
    public List<String> getNeighborhoods(@RequestParam(required = false) Integer destinationId) {
        return service.getNeighborhoods(destinationId);
    }

    /**
     * GET /api/properties/{id} — detalle de una propiedad.
     * Si existe devuelve 200 con el DTO; si no, 404 (NotFoundProblem, nunca 500).
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable int id) {
        // Patrón que se repite en varios endpoints: el service devuelve un
        // Optional; si viene con valor -> 200 OK, si viene vacío -> 404.
        return service.getById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(NotFoundProblem::response);
    }
}
