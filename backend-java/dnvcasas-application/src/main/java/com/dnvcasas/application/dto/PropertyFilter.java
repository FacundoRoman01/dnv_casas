package com.dnvcasas.application.dto;

import com.dnvcasas.domain.enums.PropertyCategory;
import com.dnvcasas.domain.enums.PropertyType;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO de entrada con los criterios de búsqueda del listado público de propiedades.
 * Paquete de datos plano: junta todos los filtros opcionales (categoría, destino, fechas,
 * huéspedes, precio máximo...) más el paginado y el orden. Los tipos envueltos (Integer,
 * Boolean) admiten null = "ese filtro no se aplicó". El service lo normaliza (acota page
 * y pageSize) antes de pasárselo al repositorio.
 */
public record PropertyFilter(
    PropertyCategory category,
    Integer destinationId,
    String neighborhood,
    LocalDate dateFrom,
    LocalDate dateTo,
    Integer guests,
    Integer bedrooms,
    BigDecimal maxPrice,
    PropertyType propertyType,
    Boolean featured,
    int page,
    int pageSize,
    String sortBy
) { }
