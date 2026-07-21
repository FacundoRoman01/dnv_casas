package com.dnvcasas.api.controller;

import com.dnvcasas.application.dto.DestinationDto;
import com.dnvcasas.application.service.DestinationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Endpoint PÚBLICO de destinos (las localidades/zonas donde hay propiedades).
 * Expone el recurso REST /api/destinations. Solo lectura para el visitante.
 * El ABM (alta/baja/modificación) vive en AdminDestinationsController.
 */
@RestController
@RequestMapping("/api/destinations")
public class DestinationsController {

    private final DestinationService service;

    public DestinationsController(DestinationService service) {
        this.service = service;
    }

    /** GET /api/destinations — lista todos los destinos. Devuelve 200. */
    @GetMapping
    public List<DestinationDto> getAll() {
        return service.getAll();
    }
}
