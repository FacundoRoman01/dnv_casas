package com.dnvcasas.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de entrada para crear o editar un destino (mismo cuerpo para ambos casos).
 * Un DTO es un paquete de datos sin lógica; las anotaciones de validación hacen que
 * Spring rechace con 400 la entrada inválida antes de que llegue al service.
 */
public record CreateUpdateDestinationDto(
    @NotBlank(message = "El nombre es requerido")
    @Size(min = 2, max = 100)
    String name,

    @NotBlank(message = "El país es requerido")
    @Size(max = 100)
    String country,

    @NotBlank(message = "La imagen es requerida")
    String imageUrl
) { }
