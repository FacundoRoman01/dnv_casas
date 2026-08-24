package com.dnvcasas.application.dto;

import com.dnvcasas.domain.enums.AvailabilityStatus;
import com.dnvcasas.domain.enums.PropertyCategory;
import com.dnvcasas.domain.enums.PropertyType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO de entrada para crear o editar una propiedad (mismo cuerpo para ambos casos).
 * Es un paquete de datos plano: junta todo lo que manda el frontend (datos base, specs,
 * amenities, precios por temporada). No tiene lógica; el service lo traduce a objetos de
 * dominio ({@link com.dnvcasas.domain.entity.Property}). Las anotaciones de validación
 * cortan la entrada inválida con 400 antes de llegar al dominio.
 *
 * Ojo: algunos mensajes de validación están en inglés a propósito (ver los @NotNull de
 * abajo): se copiaron tal cual del backend .NET para no romper el contrato de errores.
 */
public record CreateUpdatePropertyDto(
    @NotBlank(message = "El título es requerido")
    @Size(min = 3, message = "El título debe tener al menos 3 caracteres")
    @Size(max = 200)
    String title,

    @NotBlank(message = "La descripción es requerida")
    String description,

    PropertyCategory category,
    PropertyType propertyType,

    @Min(value = 1, message = "Debe seleccionar un destino válido")
    int destinationId,

    String neighborhood,
    BigDecimal price,
    String priceLabel,
    String currency,

    @Min(value = 0, message = "Dormitorios debe estar entre 0 y 50")
    @Max(value = 50, message = "Dormitorios debe estar entre 0 y 50")
    int bedrooms,

    @Min(value = 0, message = "Baños debe estar entre 0 y 50")
    @Max(value = 50, message = "Baños debe estar entre 0 y 50")
    int bathrooms,

    BigDecimal squareMeters,
    String landSize,

    @Min(value = 1, message = "La capacidad debe ser al menos 1")
    int capacity,

    String whatsAppMessage,

    // Link de YouTube opcional (recorrido en video de la propiedad). Puede venir
    // null o vacío; el formato lo valida el dominio (Property.validarYoutubeUrl),
    // no acá, para no duplicar la regla en dos capas.
    @Size(max = 500, message = "El link de YouTube es demasiado largo")
    String youtubeUrl,

    // Mensaje en inglés a propósito: viene calcado del contrato de errores del backend .NET.
    @NotNull(message = "The Amenities field is required.")
    List<String> amenities,

    // Idem: mensaje en inglés heredado del .NET original, no lo traduzcas o rompés el contrato.
    @NotNull(message = "The SeasonPrices field is required.")
    List<CreateSeasonPriceDto> seasonPrices
) {
    // Un precio por temporada: etiqueta, precio por noche y rango de fechas (desde/hasta).
    public record CreateSeasonPriceDto(
        String label,
        BigDecimal pricePerNight,
        LocalDate dateFrom,
        LocalDate dateTo
    ) { }

    // Cuerpo del endpoint que reemplaza el calendario de disponibilidad de una propiedad.
    public record UpdateAvailabilityDto(List<AvailabilityDayDto> days) { }

    // Un día del calendario con su estado (disponible/ocupado/etc.).
    public record AvailabilityDayDto(LocalDate date, AvailabilityStatus status) { }
}