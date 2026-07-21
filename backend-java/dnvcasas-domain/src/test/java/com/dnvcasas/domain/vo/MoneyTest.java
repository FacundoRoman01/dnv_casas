package com.dnvcasas.domain.vo;

import com.dnvcasas.domain.exception.DomainException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests del value object Money (monto + moneda + etiqueta).
 *
 * Dos invariantes importantes que protege, ambas heredadas del decimal de C#:
 *  - el monto no puede ser negativo (pero sí null, que significa "a consultar"),
 *  - la comparación por valor ignora la escala: 1.0 y 1.00 son iguales, PERO la
 *    escala NO se normaliza al guardar (85000.00 se conserva tal cual, porque el
 *    contrato JSON espera price:85000.00, no 85000).
 */
class MoneyTest {

    private static BigDecimal d(String v) { return new BigDecimal(v); }

    // from() carga monto, moneda y etiqueta.
    @Test
    void from_setsAllFields() {
        Money money = Money.from(d("85000"), "ARS", "por noche");
        assertEquals(0, d("85000").compareTo(money.getAmount()));
        assertEquals("ARS", money.getCurrency());
        assertEquals("por noche", money.getLabel());
    }

    // El precio "a consultar" tiene monto null y su etiqueta.
    @Test
    void consult_hasNullAmount() {
        Money money = Money.consult();
        assertNull(money.getAmount());
        assertEquals("A consultar", money.getLabel());
    }

    // Monto negativo -> DomainException.
    @Test
    void from_negativeAmount_throws() {
        DomainException ex = assertThrows(DomainException.class,
                () -> Money.from(d("-1"), "ARS", "por noche"));
        assertEquals("El precio no puede ser negativo", ex.getMessage());
    }

    // Monto null sí se permite (es "a consultar").
    @Test
    void from_nullAmount_allowed() {
        assertNull(Money.from(null, "ARS", "A consultar").getAmount());
    }

    // Dos Money con los mismos valores son iguales (igualdad por valor).
    @Test
    void recordsWithSameValues_areEqual() {
        assertEquals(Money.from(d("100"), "ARS", "por noche"),
                     Money.from(d("100"), "ARS", "por noche"));
    }

    // 1.0 y 1.00 son iguales aunque tengan distinta escala.
    @Test
    @DisplayName("1.0 y 1.00 son el mismo precio (como el decimal de C#)")
    void differentScale_sameValue_areEqual() {
        assertEquals(Money.from(d("1.0"), "ARS", "por noche"),
                     Money.from(d("1.00"), "ARS", "por noche"));
    }

    // Coherencia equals/hashCode: si son iguales, mismo hashCode (aun con escalas distintas).
    @Test
    @DisplayName("equals y hashCode coinciden entre escalas")
    void differentScale_sameHashCode() {
        assertEquals(Money.from(d("1.0"), "ARS", "por noche").hashCode(),
                     Money.from(d("1.00"), "ARS", "por noche").hashCode());
    }

    // Aunque para comparar la escala no importe, al guardar se conserva tal cual:
    // 85000.00 sigue siendo "85000.00", que es lo que el JSON tiene que mostrar.
    @Test
    @DisplayName("la escala NO se normaliza: es el contrato JSON (price:85000.00)")
    void scaleIsPreserved() {
        assertEquals("85000.00",
                     Money.from(d("85000.00"), "ARS", "por noche").getAmount().toPlainString());
    }
}
