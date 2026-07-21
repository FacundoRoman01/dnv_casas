package com.dnvcasas.domain.enums;

/**
 * Tipo de inmueble (el "qué es" físicamente, no el "qué se hace con él" —
 * eso es {@link PropertyCategory}).
 *
 * Se persiste como número por @Enumerated(EnumType.ORDINAL): CASA=0 ... OTRO=4.
 * No reordenar ni intercalar (ver la nota en PropertyCategory).
 */
public enum PropertyType {
    CASA,
    DEPARTAMENTO,
    CABANIA,      // "cabaña" sin ñ para evitar problemas de encoding en el enum
    LOFT,
    OTRO
}
