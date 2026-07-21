package com.dnvcasas.domain.enums;

/**
 * Estado de un día puntual en el calendario de disponibilidad de una propiedad
 * (ver {@code PropertyAvailability}). Un día = un estado.
 *
 * Se persiste como número por @Enumerated(EnumType.ORDINAL): AVAILABLE=0,
 * IN_PROGRESS=1, UNAVAILABLE=2. No reordenar (ver la nota en PropertyCategory).
 */
public enum AvailabilityStatus {
    AVAILABLE,    // libre, se puede reservar
    IN_PROGRESS,  // con una operación en curso (reserva tentativa)
    UNAVAILABLE   // ocupado / bloqueado
}
