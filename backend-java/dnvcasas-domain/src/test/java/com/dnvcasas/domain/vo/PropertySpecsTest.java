package com.dnvcasas.domain.vo;

import com.dnvcasas.domain.exception.DomainException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests del value object PropertySpecs (dormitorios, baños, capacidad, metros,
 * tamaño del terreno). Protege que no se puedan armar specs con valores negativos
 * y que un landSize null se guarde como "" (nunca null), para que el resto del
 * código no tenga que chequear null.
 */
class PropertySpecsTest {

    // Specs válidas: los getters devuelven lo cargado.
    @Test
    void constructor_validSpecs_ok() {
        PropertySpecs specs = new PropertySpecs(2, 1, 4, new BigDecimal("65"), "300m2");
        assertEquals(2, specs.getBedrooms());
        assertEquals(4, specs.getCapacity());
    }

    // Cualquiera de dormitorios/baños/capacidad en negativo -> DomainException.
    @ParameterizedTest
    @CsvSource({ "-1, 0, 0", "0, -1, 0", "0, 0, -1" })
    void constructor_negativeValues_throws(int bedrooms, int bathrooms, int capacity) {
        assertThrows(DomainException.class,
                () -> new PropertySpecs(bedrooms, bathrooms, capacity, null, ""));
    }

    // landSize null se convierte en "" (string vacío), no queda null.
    @Test
    void constructor_nullLandSize_coercedToEmpty() {
        assertEquals("", new PropertySpecs(1, 1, 2, null, null).getLandSize());
    }
}
