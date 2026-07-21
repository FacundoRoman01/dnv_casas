package com.dnvcasas.domain.enums;

/**
 * Estado de publicación de una propiedad. Es la "máquina de estados" del catálogo:
 * define qué operaciones se permiten (ver los métodos de {@code Property}).
 *
 * Se persiste como número por el @Enumerated(EnumType.ORDINAL): ACTIVE=0, PAUSED=1,
 * DELETED=2. No reordenar (ver la nota en PropertyCategory).
 *
 * DELETED es un borrado lógico (soft delete): la fila NO se elimina de la base,
 * solo se marca. Por eso una propiedad DELETED no se puede volver a modificar.
 */
public enum PropertyStatus {
    ACTIVE,   // publicada y visible
    PAUSED,   // oculta temporalmente; se puede reactivar
    DELETED   // borrada lógicamente; estado final, ya no se toca
}
