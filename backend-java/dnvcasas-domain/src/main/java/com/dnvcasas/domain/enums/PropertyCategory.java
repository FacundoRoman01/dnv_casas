package com.dnvcasas.domain.enums;

/**
 * Categoría comercial de una propiedad: define qué se puede hacer con ella.
 *
 * OJO: el orden importa. Se persiste como número (@Enumerated(EnumType.ORDINAL)),
 * así que ALQUILER=0, INTERCAMBIO=1, COMPRA=2 quedan guardados en la base como
 * esos enteros. Nunca reordenes ni intercales valores: romperías los datos ya
 * guardados y el contrato JSON con el frontend (que también manda el enum como int).
 */
public enum PropertyCategory {
    ALQUILER,     // se alquila (tiene precio)
    INTERCAMBIO,  // se intercambia — regla de dominio: NO puede tener precio
    COMPRA        // se vende (tiene precio)
}
