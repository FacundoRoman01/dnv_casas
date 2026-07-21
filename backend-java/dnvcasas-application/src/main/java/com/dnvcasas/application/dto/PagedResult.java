package com.dnvcasas.application.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.util.List;

/**
 * DTO genérico de salida para respuestas paginadas: los items de la página más los datos
 * de paginado (total de coincidencias, página actual y tamaño). Genérico en {@code <T>}
 * para reusarlo con cualquier tipo de item (propiedades, etc.). El @JsonPropertyOrder fija
 * el orden de los campos en el JSON, parte del contrato REST portado desde .NET.
 */
@JsonPropertyOrder({ "items", "total", "page", "pageSize" })
public record PagedResult<T>(
    List<T> items,
    int total,
    int page,
    int pageSize
) { }
