package com.dnvcasas.domain.enums;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * EnumOrdinalTest: clava el ORDEN de los enums, que es sagrado. Como los enums se
 * guardan en la base y salen en el JSON como su número ordinal (0,1,2...), cambiar
 * el orden de un valor, o meter uno nuevo en el medio, rompería los datos ya
 * guardados y el contrato con el frontend.
 *
 * Este test es un candado: si alguien reordena o agrega un valor sin querer,
 * falla y avisa. Cada assert fija el número exacto de cada valor y también la
 * CANTIDAD total (para cazar si se agregó uno al final).
 */
class EnumOrdinalTest {

    // Alquiler=0, Intercambio=1, Compra=2 (y son 3 en total).
    @Test
    @DisplayName("PropertyCategory: Alquiler=0, Intercambio=1, Compra=2")
    void propertyCategoryOrdinals() {
        assertEquals(0, PropertyCategory.ALQUILER.ordinal());
        assertEquals(1, PropertyCategory.INTERCAMBIO.ordinal());
        assertEquals(2, PropertyCategory.COMPRA.ordinal());
        assertEquals(3, PropertyCategory.values().length);
    }

    // Casa=0 ... Otro=4 (5 en total).
    @Test
    @DisplayName("PropertyType: Casa=0, Departamento=1, Cabaña=2, Loft=3, Otro=4")
    void propertyTypeOrdinals() {
        assertEquals(0, PropertyType.CASA.ordinal());
        assertEquals(1, PropertyType.DEPARTAMENTO.ordinal());
        assertEquals(2, PropertyType.CABANIA.ordinal());
        assertEquals(3, PropertyType.LOFT.ordinal());
        assertEquals(4, PropertyType.OTRO.ordinal());
        assertEquals(5, PropertyType.values().length);
    }

    // Active=0, Paused=1, Deleted=2 (3 en total).
    @Test
    @DisplayName("PropertyStatus: Active=0, Paused=1, Deleted=2")
    void propertyStatusOrdinals() {
        assertEquals(0, PropertyStatus.ACTIVE.ordinal());
        assertEquals(1, PropertyStatus.PAUSED.ordinal());
        assertEquals(2, PropertyStatus.DELETED.ordinal());
        assertEquals(3, PropertyStatus.values().length);
    }

    // Available=0, InProgress=1, Unavailable=2 (3 en total).
    @Test
    @DisplayName("AvailabilityStatus: Available=0, InProgress=1, Unavailable=2")
    void availabilityStatusOrdinals() {
        assertEquals(0, AvailabilityStatus.AVAILABLE.ordinal());
        assertEquals(1, AvailabilityStatus.IN_PROGRESS.ordinal());
        assertEquals(2, AvailabilityStatus.UNAVAILABLE.ordinal());
        assertEquals(3, AvailabilityStatus.values().length);
    }
}
