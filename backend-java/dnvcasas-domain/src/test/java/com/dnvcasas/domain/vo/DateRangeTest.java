package com.dnvcasas.domain.vo;

import com.dnvcasas.domain.exception.DomainException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests del value object DateRange (un rango de fechas [desde, hasta)).
 *
 * Protege dos cosas: que el rango se construya bien (desde tiene que ser
 * estrictamente anterior a hasta) y, sobre todo, la lógica de overlaps() que usa
 * Property para detectar temporadas superpuestas. El detalle fino: el intervalo
 * es medio-abierto, así que dos rangos que se tocan en el extremo (uno termina el
 * mismo día que arranca el otro) NO se consideran solapados.
 */
class DateRangeTest {

    private static LocalDate d(int m, int day) { return LocalDate.of(2026, m, day); }

    // desde posterior a hasta -> DomainException.
    @Test
    void constructor_fromAfterTo_throws() {
        assertThrows(DomainException.class, () -> new DateRange(d(2, 1), d(1, 1)));
    }

    // desde igual a hasta (rango de duración cero) -> DomainException.
    @Test
    void constructor_fromEqualsTo_throws() {
        assertThrows(DomainException.class, () -> new DateRange(d(1, 1), d(1, 1)));
    }

    // Rango válido: guarda desde y hasta como vienen.
    @Test
    void constructor_validRange_ok() {
        DateRange range = new DateRange(d(1, 1), d(2, 1));
        assertEquals(d(1, 1), range.from());
        assertEquals(d(2, 1), range.to());
    }

    // Dos rangos que se pisan -> overlaps true en ambos sentidos (es simétrico).
    @Test
    void overlaps_overlappingRanges_true() {
        DateRange a = new DateRange(d(1, 1), d(2, 1));
        DateRange b = new DateRange(d(1, 15), d(3, 1));
        assertTrue(a.overlaps(b));
        assertTrue(b.overlaps(a));
    }

    // El borde clave: uno termina el 1/2 y el otro arranca el 1/2 -> NO se solapan.
    @Test
    @DisplayName("adyacentes no se solapan: intervalo medio-abierto [from, to)")
    void overlaps_adjacentRanges_false() {
        DateRange a = new DateRange(d(1, 1), d(2, 1));
        DateRange b = new DateRange(d(2, 1), d(3, 1));
        assertFalse(a.overlaps(b));
    }

    // Rangos separados (sin contacto) -> no se solapan.
    @Test
    void overlaps_disjointRanges_false() {
        DateRange a = new DateRange(d(1, 1), d(2, 1));
        DateRange b = new DateRange(d(3, 1), d(4, 1));
        assertFalse(a.overlaps(b));
    }
}
