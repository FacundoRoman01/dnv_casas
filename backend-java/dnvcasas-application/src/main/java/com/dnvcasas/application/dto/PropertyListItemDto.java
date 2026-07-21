package com.dnvcasas.application.dto;

import com.dnvcasas.domain.enums.PropertyCategory;
import com.dnvcasas.domain.enums.PropertyStatus;
import com.dnvcasas.domain.enums.PropertyType;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO de salida REDUCIDO de una propiedad, para los listados (grilla/resultados). Trae solo
 * lo justo para mostrar la tarjeta: sin descripción larga, sin todas las imágenes (solo la
 * portada), sin precios por temporada ni disponibilidad. La versión completa es {@link PropertyDto}.
 *
 * El @JsonPropertyOrder fija el orden de campos del JSON (contrato REST portado desde .NET);
 * el @JsonProperty en isFeatured fuerza ese nombre exacto en la salida.
 */
@JsonPropertyOrder({
    "id", "title", "category", "propertyType",
    "destinationId", "destinationName", "neighborhood",
    "price", "priceLabel", "currency",
    "bedrooms", "bathrooms", "squareMeters", "landSize", "capacity",
    "coverImageUrl", "amenities", "status", "isFeatured"
})
public record PropertyListItemDto(
    int id,
    String title,
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
    String coverImageUrl,
    List<String> amenities,
    PropertyStatus status,
    @JsonProperty("isFeatured") boolean isFeatured
) { }
