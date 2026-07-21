package com.dnvcasas.application.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

/**
 * DTO de salida de un destino (lo que ve el frontend). Paquete de datos sin lógica.
 * El @JsonPropertyOrder fija el orden de los campos en el JSON: el contrato REST se portó
 * byte a byte desde .NET, así que el orden importa.
 */
@JsonPropertyOrder({ "id", "name", "country", "imageUrl", "propertyCount" })
public record DestinationDto(
    int id,
    String name,
    String country,
    String imageUrl,
    int propertyCount
) {
    // Constructor de conveniencia para cuando no calculamos la cantidad de propiedades
    // (ej. al crear/editar un destino): arranca en 0.
    public DestinationDto(int id, String name, String country, String imageUrl) {
        this(id, name, country, imageUrl, 0);
    }
}
