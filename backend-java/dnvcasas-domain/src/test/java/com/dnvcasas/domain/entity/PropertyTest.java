package com.dnvcasas.domain.entity;

import com.dnvcasas.domain.entity.Property.SeasonPriceInput;
import com.dnvcasas.domain.enums.PropertyCategory;
import com.dnvcasas.domain.enums.PropertyStatus;
import com.dnvcasas.domain.enums.PropertyType;
import com.dnvcasas.domain.exception.DomainException;
import com.dnvcasas.domain.vo.DateRange;
import com.dnvcasas.domain.vo.Money;
import com.dnvcasas.domain.vo.PropertySpecs;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests del aggregate root Property. Corren 100% en memoria (sin base, sin Spring):
 * son rápidos y prueban las REGLAS DE NEGOCIO puras.
 *
 * Lo que protegen: que create/update validen (título, descripción, intercambio
 * sin precio), la máquina de estados (destacar solo activas, pausar limpia el
 * destacado, no se toca una borrada), que replaceSeasonPrices rechace solapamientos
 * sin corromper el estado previo, que duplicate deje una copia pausada sin hijos,
 * y que las colecciones sean de solo lectura desde afuera.
 *
 * OJO: acá NO se ve el bug de "Duplicar" (era de persistencia); eso lo caza WriteFlowIT.
 */
class PropertyTest {

    // Helpers cortos para no repetir: d() arma una fecha, n() un BigDecimal.
    private static LocalDate d(int m, int day) { return LocalDate.of(2026, m, day); }
    private static BigDecimal n(String v)      { return new BigDecimal(v); }

    // Propiedad de alquiler válida, punto de partida de la mayoría de los tests.
    private static Property newRental() {
        return Property.create(
                "Cabaña en el bosque", "Linda cabaña",
                PropertyCategory.ALQUILER, PropertyType.CABANIA,
                1, "Centro",
                Money.from(n("85000"), "ARS", "por noche"),
                new PropertySpecs(2, 1, 4, n("65"), ""),
                "Hola");
    }

    // Recién creada arranca ACTIVE y sin destacar.
    @Test
    void create_valid_startsActiveNotFeatured() {
        Property p = newRental();
        assertEquals(PropertyStatus.ACTIVE, p.getStatus());
        assertFalse(p.isFeatured());
        assertEquals("Cabaña en el bosque", p.getTitle());
    }

    // Título vacío, en blanco o muy corto (< 3) -> DomainException.
    @ParameterizedTest
    @ValueSource(strings = { "", "  ", "ab" })
    void create_invalidTitle_throws(String title) {
        assertThrows(DomainException.class, () -> Property.create(
                title, "desc", PropertyCategory.ALQUILER, PropertyType.CASA,
                1, "", Money.consult(), new PropertySpecs(1, 1, 2, null, ""), ""));
    }

    // Descripción vacía -> DomainException.
    @Test
    void create_emptyDescription_throws() {
        assertThrows(DomainException.class, () -> Property.create(
                "Titulo valido", "", PropertyCategory.ALQUILER, PropertyType.CASA,
                1, "", Money.consult(), new PropertySpecs(1, 1, 2, null, ""), ""));
    }

    // Intercambio CON precio viola la regla -> DomainException.
    @Test
    void create_exchangeWithPrice_throws() {
        DomainException ex = assertThrows(DomainException.class, () -> Property.create(
                "Casa a intercambiar", "desc", PropertyCategory.INTERCAMBIO, PropertyType.CASA,
                1, "", Money.from(n("50000"), "ARS", "por noche"),
                new PropertySpecs(1, 1, 2, null, ""), ""));
        assertTrue(ex.getMessage().contains("intercambio"));
    }

    // Intercambio SIN precio (monto null) es válido.
    @Test
    void create_exchangeWithoutPrice_ok() {
        Property p = Property.create(
                "Casa a intercambiar", "desc", PropertyCategory.INTERCAMBIO, PropertyType.CASA,
                1, "", Money.from(null, "ARS", "Intercambio"), new PropertySpecs(1, 1, 2, null, ""), "");
        assertEquals(PropertyCategory.INTERCAMBIO, p.getCategory());
    }

    // create() recorta los espacios de título y descripción.
    @Test
    void create_trimsTitleAndDescription() {
        Property p = Property.create(
                "  Titulo  ", "  desc  ", PropertyCategory.ALQUILER, PropertyType.CASA,
                1, "", Money.consult(), new PropertySpecs(1, 1, 2, null, ""), "");
        assertEquals("Titulo", p.getTitle());
        assertEquals("desc", p.getDescription());
    }

    // Destacar una activa la deja isFeatured=true.
    @Test
    void feature_activeProperty_setsFeatured() {
        Property p = newRental();
        p.feature();
        assertTrue(p.isFeatured());
    }

    // Destacar una pausada explota con el mensaje exacto (la misma regla que
    // WriteFlowIT verifica a nivel HTTP).
    @Test
    void feature_pausedProperty_throws() {
        Property p = newRental();
        p.pause();
        DomainException ex = assertThrows(DomainException.class, p::feature);
        assertEquals("Solo se pueden destacar propiedades activas", ex.getMessage());
    }

    // Pausar una destacada le quita el destacado y la deja PAUSED.
    @Test
    void pause_clearsFeatured() {
        Property p = newRental();
        p.feature();
        p.pause();
        assertFalse(p.isFeatured());
        assertEquals(PropertyStatus.PAUSED, p.getStatus());
    }

    // Borrar marca DELETED y también saca el destacado.
    @Test
    void delete_setsDeletedAndClearsFeatured() {
        Property p = newRental();
        p.feature();
        p.delete();
        assertEquals(PropertyStatus.DELETED, p.getStatus());
        assertFalse(p.isFeatured());
    }

    // No se puede pausar una borrada.
    @Test
    void pause_deletedProperty_throws() {
        Property p = newRental();
        p.delete();
        assertThrows(DomainException.class, p::pause);
    }

    // No se puede reactivar una borrada.
    @Test
    void activate_deletedProperty_throws() {
        Property p = newRental();
        p.delete();
        assertThrows(DomainException.class, p::activate);
    }

    // No se puede editar una borrada.
    @Test
    void update_deletedProperty_throws() {
        Property p = newRental();
        p.delete();
        assertThrows(DomainException.class, () -> p.update(
                "Nuevo titulo", "nueva desc", PropertyCategory.ALQUILER, PropertyType.CASA,
                1, "", Money.consult(), new PropertySpecs(1, 1, 2, null, ""), ""));
    }

    // Reactivar una pausada la vuelve ACTIVE.
    @Test
    void activate_pausedProperty_becomesActive() {
        Property p = newRental();
        p.pause();
        p.activate();
        assertEquals(PropertyStatus.ACTIVE, p.getStatus());
    }

    // Temporadas que no se pisan (adyacentes) se guardan las dos.
    @Test
    void replaceSeasonPrices_nonOverlapping_ok() {
        Property p = newRental();
        p.replaceSeasonPrices(List.of(
                new SeasonPriceInput("Alta",  n("100"), new DateRange(d(1, 1), d(2, 1))),
                new SeasonPriceInput("Media", n("80"),  new DateRange(d(2, 1), d(3, 1)))));
        assertEquals(2, p.getSeasonPrices().size());
    }

    // Temporadas que se solapan -> DomainException ("se superpone").
    @Test
    void replaceSeasonPrices_overlapping_throws() {
        Property p = newRental();
        DomainException ex = assertThrows(DomainException.class, () -> p.replaceSeasonPrices(List.of(
                new SeasonPriceInput("Alta",  n("100"), new DateRange(d(1, 1),  d(2, 1))),
                new SeasonPriceInput("Media", n("80"),  new DateRange(d(1, 15), d(3, 1))))));
        assertTrue(ex.getMessage().contains("se superpone"));
    }

    // Clave: si el set nuevo es inválido, las temporadas que ya estaban quedan
    // intactas. La validación pasa ANTES de tocar la colección.
    @Test
    @DisplayName("si el set entrante se superpone, el estado previo NO se toca")
    void replaceSeasonPrices_overlapping_doesNotMutateState() {
        Property p = newRental();
        p.replaceSeasonPrices(List.of(
                new SeasonPriceInput("Original", n("50"), new DateRange(d(6, 1), d(7, 1)))));

        assertThrows(DomainException.class, () -> p.replaceSeasonPrices(List.of(
                new SeasonPriceInput("Alta",  n("100"), new DateRange(d(1, 1),  d(2, 1))),
                new SeasonPriceInput("Media", n("80"),  new DateRange(d(1, 15), d(3, 1))))));

        assertEquals(1, p.getSeasonPrices().size());
        assertEquals("Original", p.getSeasonPrices().get(0).getLabel());
    }

    // Pasar una lista vacía borra todas las temporadas.
    @Test
    void replaceSeasonPrices_empty_clearsAll() {
        Property p = newRental();
        p.replaceSeasonPrices(List.of(
                new SeasonPriceInput("Alta", n("100"), new DateRange(d(1, 1), d(2, 1)))));
        p.replaceSeasonPrices(List.of());
        assertTrue(p.getSeasonPrices().isEmpty());
    }

    // replaceAmenities ignora las claves vacías o en blanco.
    @Test
    void replaceAmenities_filtersEmptyKeys() {
        Property p = newRental();
        p.replaceAmenities(List.of("wifi", "", "  ", "parking"));
        assertEquals(2, p.getAmenities().size());
        assertTrue(p.getAmenities().stream().anyMatch(a -> a.getAmenityKey().equals("wifi")));
    }

    // La copia lleva "(copia)" en el título, arranca PAUSED sin destacar y
    // conserva precio y specs.
    @Test
    void duplicate_copiesAsPausedWithCopiaSuffix() {
        Property p = newRental();
        p.feature();
        Property copy = p.duplicate();

        assertEquals("Cabaña en el bosque (copia)", copy.getTitle());
        assertEquals(PropertyStatus.PAUSED, copy.getStatus());
        assertFalse(copy.isFeatured());
        assertEquals(p.getPrice(), copy.getPrice());
        assertEquals(p.getSpecs(), copy.getSpecs());
    }

    // La copia NO arrastra imágenes ni amenities: solo los datos base.
    @Test
    void duplicate_doesNotCopyImagesOrAmenities() {
        Property p = newRental();
        p.replaceAmenities(List.of("wifi"));
        Property copy = p.duplicate();
        assertTrue(copy.getAmenities().isEmpty());
        assertTrue(copy.getImages().isEmpty());
    }

    // Las 4 colecciones hijas se devuelven de solo lectura: agregarles algo
    // desde afuera tira UnsupportedOperationException (refuerza el aggregate root).
    @Test
    @DisplayName("las colecciones no se pueden modificar desde afuera")
    void collections_areUnmodifiable() {
        Property p = newRental();
        assertThrows(UnsupportedOperationException.class, () -> p.getImages().add(new PropertyImage()));
        assertThrows(UnsupportedOperationException.class, () -> p.getAmenities().add(new PropertyAmenity()));
        assertThrows(UnsupportedOperationException.class, () -> p.getSeasonPrices().add(new PropertySeasonPrice()));
        assertThrows(UnsupportedOperationException.class, () -> p.getAvailability().add(new PropertyAvailability()));
    }
}
