package com.dnvcasas.application.dto;

import com.dnvcasas.domain.enums.AvailabilityStatus;
import com.dnvcasas.domain.enums.PropertyCategory;
import com.dnvcasas.domain.enums.PropertyStatus;
import com.dnvcasas.domain.enums.PropertyType;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de salida COMPLETO de una propiedad (el detalle que se ve al abrir una propiedad).
 * Paquete de datos sin lógica: aplana la entidad de dominio {@link com.dnvcasas.domain.entity.Property}
 * y sus colecciones hijas (imágenes, amenities, precios por temporada, disponibilidad) en
 * algo listo para serializar a JSON. El {@link PropertyListItemDto} es la versión reducida
 * para listados.
 *
 * El @JsonPropertyOrder fija el orden EXACTO de los campos en el JSON: el contrato REST se
 * portó byte a byte desde .NET y lo verifican los tests golden, así que este orden no se toca.
 * Los @JsonProperty en whatsAppMessage e isFeatured fuerzan ese nombre de campo exacto
 * (sin ellos Jackson los serializaría como "whatsAppMessage"/"featured" distinto al contrato).
 *
 * Los campos opcionales nuevos se agregan AL FINAL del orden a propósito: no existían en el
 * contrato golden original y así no corren de lugar ningún campo existente.
 */
@JsonPropertyOrder({
    "id", "title", "description", "category", "propertyType",
    "destinationId", "destinationName", "neighborhood",
    "price", "priceLabel", "currency",
    "bedrooms", "bathrooms", "squareMeters", "landSize", "capacity",
    "status", "whatsAppMessage", "createdAt", "coverImageUrl",
    "images", "amenities", "seasonPrices", "availability", "isFeatured",
    "youtubeUrl", "googleMapsUrl"
})
public record PropertyDto(
    int id,
    String title,
    String description,
    PropertyCategory category,
    PropertyType propertyType,
    int destinationId,
    String destinationName,
    String neighborhood,
    BigDecimal price,
    String priceLabel,
    String currency,
    int bedrooms,
    int bathrooms,
    BigDecimal squareMeters,
    String landSize,
    int capacity,
    PropertyStatus status,
    @JsonProperty("whatsAppMessage") String whatsAppMessage,
    LocalDateTime createdAt,
    String coverImageUrl,
    List<PropertyImageDto> images,
    List<String> amenities,
    List<PropertySeasonPriceDto> seasonPrices,
    List<PropertyAvailabilityDto> availability,
    @JsonProperty("isFeatured") boolean isFeatured,
    String youtubeUrl,
    String googleMapsUrl
) {
    // Una imagen de la propiedad. isCover marca la portada. @JsonProperty fuerza el nombre
    // "isCover" en el JSON (Jackson por defecto lo serializaría como "cover").
    @JsonPropertyOrder({ "id", "url", "displayOrder", "isCover" })
    public record PropertyImageDto(
        int id,
        String url,
        int displayOrder,
        @JsonProperty("isCover") boolean isCover
    ) { }

    // Un precio por temporada tal como sale en el detalle.
    @JsonPropertyOrder({ "id", "label", "pricePerNight", "dateFrom", "dateTo" })
    public record PropertySeasonPriceDto(
        int id,
        String label,
        BigDecimal pricePerNight,
        LocalDate dateFrom,
        LocalDate dateTo
    ) { }

    // Un día del calendario de disponibilidad con su estado.
    @JsonPropertyOrder({ "date", "status" })
    public record PropertyAvailabilityDto(
        LocalDate date,
        AvailabilityStatus status
    ) { }
}
