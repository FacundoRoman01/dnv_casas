package com.dnvcasas.api.contract;

import com.dnvcasas.api.config.JacksonConfig;
import com.dnvcasas.application.dto.*;
import com.dnvcasas.application.dto.PropertyDto.PropertyAvailabilityDto;
import com.dnvcasas.application.dto.PropertyDto.PropertyImageDto;
import com.dnvcasas.application.dto.PropertyDto.PropertySeasonPriceDto;
import com.dnvcasas.domain.enums.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.context.annotation.Import;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JsonContractTest: protege el contrato JSON campo por campo, sin necesidad de
 * levantar toda la app ni una base (solo prueba la serialización con la config
 * de Jackson real, JacksonConfig).
 *
 * Vigila los detalles finos que tienen que salir EXACTAMENTE como el .NET, o el
 * frontend se rompe: createdAt sin la "Z", el precio conservando su escala
 * (85000.00 y no 85000) y sin notación científica, los enums como número, el
 * prefijo "is" en isFeatured/isCover, y sobre todo el ORDEN exacto de los campos
 * de cada DTO.
 */
@JsonTest
@Import(JacksonConfig.class)
class JsonContractTest {

    @Autowired
    private ObjectMapper mapper;

    // Fábrica de una propiedad de ejemplo, parametrizando fecha y precio (los dos
    // campos más delicados del contrato). El resto de tests la reutilizan.
    private static PropertyDto unaPropiedad(LocalDateTime createdAt, BigDecimal price) {
        return new PropertyDto(
                1, "Cabaña en el bosque", "Linda cabaña",
                PropertyCategory.ALQUILER, PropertyType.CABANIA,
                1, "Bariloche", "Colonia Suiza",
                price, "por noche", "ARS",
                2, 1, new BigDecimal("65.00"), "", 4,
                PropertyStatus.ACTIVE,
                "Hola! Me interesa la cabaña", createdAt,
                "https://x/foto.jpg",
                List.of(new PropertyImageDto(1, "https://x/foto.jpg", 0, true)),
                List.of("wifi"),
                List.of(new PropertySeasonPriceDto(1, "Alta", new BigDecimal("100.00"),
                        LocalDate.of(2027, 1, 1), LocalDate.of(2027, 2, 1))),
                List.of(new PropertyAvailabilityDto(LocalDate.of(2027, 1, 5), AvailabilityStatus.UNAVAILABLE)),
                false);
    }

    @Test
    @DisplayName("createdAt NO lleva Z — la columna es datetime(6), sin zona")
    void createdAt_sinZ() throws Exception {
        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.of(2026, 7, 13, 20, 36, 28), BigDecimal.ONE));

        assertThat(json).contains("\"createdAt\":\"2026-07-13T20:36:28\"");
        assertThat(json).doesNotContain("2026-07-13T20:36:28Z");
    }

    @Test
    @DisplayName("createdAt trima los ceros de la fracción, como System.Text.Json")
    void createdAt_fraccionTrimada() throws Exception {

        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.of(2026, 7, 13, 10, 30, 0, 100_000_000), BigDecimal.ONE));
        assertThat(json).contains("\"createdAt\":\"2026-07-13T10:30:00.1\"");
    }

    @Test
    @DisplayName("createdAt sin fracción omite el punto entero")
    void createdAt_sinFraccion() throws Exception {
        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.of(2026, 7, 13, 20, 36, 28, 0), BigDecimal.ONE));
        assertThat(json).contains("\"createdAt\":\"2026-07-13T20:36:28\"");
    }

    @Test
    @DisplayName("el precio conserva la escala de decimal(10,2): 85000.00, no 85000")
    void price_conservaEscala() throws Exception {
        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.now(), new BigDecimal("85000.00")));
        assertThat(json).contains("\"price\":85000.00");
    }

    @Test
    @DisplayName("el precio no sale en notación científica")
    void price_sinNotacionCientifica() throws Exception {

        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.now(), new BigDecimal("85000.00")));
        assertThat(json).doesNotContain("E+");
        assertThat(json).doesNotContain("8.5E");
    }

    @Test
    @DisplayName("un precio null sale como null, no se omite")
    void price_null() throws Exception {
        String json = mapper.writeValueAsString(unaPropiedad(LocalDateTime.now(), null));
        assertThat(json).contains("\"price\":null");
    }

    @Test
    @DisplayName("los 4 enums salen como int: el .NET no tiene JsonStringEnumConverter")
    void enums_comoInt() throws Exception {
        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.now(), BigDecimal.ONE));
        assertThat(json).contains("\"category\":0");
        assertThat(json).contains("\"propertyType\":2");
        assertThat(json).contains("\"status\":0");
        assertThat(json).contains("\"status\":2");
        assertThat(json).doesNotContain("\"ALQUILER\"");
        assertThat(json).doesNotContain("\"CABANIA\"");
    }

    @Test
    @DisplayName("isFeatured conserva el prefijo is — Jackson lo strippearía y emitiría 'featured'")
    void isFeatured_conservaPrefijo() throws Exception {
        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.now(), BigDecimal.ONE));
        assertThat(json).contains("\"isFeatured\":false");

        assertThat(json).doesNotContain("\"featured\":");
    }

    @Test
    @DisplayName("whatsAppMessage: el serializador baja SOLO la primera mayúscula, no es whatsappMessage")
    void whatsAppMessage_camelCaseParcial() throws Exception {
        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.now(), BigDecimal.ONE));
        assertThat(json).contains("\"whatsAppMessage\":");
        assertThat(json).doesNotContain("\"whatsappMessage\":");
    }

    @Test
    @DisplayName("isCover también conserva el prefijo is")
    void isCover_conservaPrefijo() throws Exception {
        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.now(), BigDecimal.ONE));
        assertThat(json).contains("\"isCover\":true");
        assertThat(json).doesNotContain("\"cover\":");
    }

    // El corazón del contrato: los 25 campos del detalle tienen que salir en este
    // orden exacto. Si alguien agrega/mueve un campo del DTO, este test lo caza.
    @Test
    @DisplayName("PropertyDto: los 25 campos en el orden exacto del .NET")
    void propertyDto_ordenDeCampos() throws Exception {
        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.now(), BigDecimal.ONE));

        assertThat(nombresEnOrden(json)).containsExactly(
                "id", "title", "description", "category", "propertyType",
                "destinationId", "destinationName", "neighborhood",
                "price", "priceLabel", "currency",
                "bedrooms", "bathrooms", "squareMeters", "landSize", "capacity",
                "status", "whatsAppMessage", "createdAt", "coverImageUrl",
                "images", "amenities", "seasonPrices", "availability", "isFeatured");
    }

    @Test
    @DisplayName("PropertyListItemDto: 19 campos, distinto de PropertyDto — es el que más usa el frontend")
    void propertyListItemDto_ordenDeCampos() throws Exception {
        PropertyListItemDto item = new PropertyListItemDto(
                1, "Cabaña", PropertyCategory.ALQUILER, PropertyType.CABANIA,
                1, "Bariloche", "Centro",
                new BigDecimal("85000.00"), "por noche", "ARS",
                2, 1, new BigDecimal("65.00"), "", 4,
                "https://x/foto.jpg", List.of("wifi"), PropertyStatus.ACTIVE, true);

        assertThat(nombresEnOrden(mapper.writeValueAsString(item))).containsExactly(
                "id", "title", "category", "propertyType",
                "destinationId", "destinationName", "neighborhood",
                "price", "priceLabel", "currency",
                "bedrooms", "bathrooms", "squareMeters", "landSize", "capacity",
                "coverImageUrl", "amenities", "status", "isFeatured");
    }

    @Test
    @DisplayName("PagedResult: items, total, page, pageSize")
    void pagedResult_ordenDeCampos() throws Exception {
        String json = mapper.writeValueAsString(new PagedResult<>(List.of(), 10, 1, 12));
        assertThat(nombresEnOrden(json)).containsExactly("items", "total", "page", "pageSize");
        assertThat(json).isEqualTo("{\"items\":[],\"total\":10,\"page\":1,\"pageSize\":12}");
    }

    @Test
    @DisplayName("DestinationDto: propertyCount al final")
    void destinationDto_ordenDeCampos() throws Exception {
        String json = mapper.writeValueAsString(
                new DestinationDto(1, "Bariloche", "Argentina", "https://x/b.jpg", 4));
        assertThat(nombresEnOrden(json))
                .containsExactly("id", "name", "country", "imageUrl", "propertyCount");
    }

    @Test
    @DisplayName("DateOnly → LocalDate sale como yyyy-MM-dd")
    void localDate_formatoIso() throws Exception {
        String json = mapper.writeValueAsString(
                unaPropiedad(LocalDateTime.now(), BigDecimal.ONE));
        assertThat(json).contains("\"dateFrom\":\"2027-01-01\"");
        assertThat(json).contains("\"date\":\"2027-01-05\"");
    }

    // Helper: devuelve los nombres de los campos del JSON en el orden en que aparecen.
    private List<String> nombresEnOrden(String json) throws Exception {
        List<String> nombres = new java.util.ArrayList<>();
        mapper.readTree(json).fieldNames().forEachRemaining(nombres::add);
        return nombres;
    }
}
