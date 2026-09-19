package com.dnvcasas.api.write;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * WriteFlowIT: cubre el flujo de ESCRITURA del admin de punta a punta, por HTTP
 * y contra una MySQL real (Testcontainers). Crear, leer, editar, duplicar,
 * destacar, pausar, borrar.
 *
 * Por qué existe además de GoldenIT y los tests de dominio: el bug más grave del
 * proyecto (el botón "Duplicar" devolviendo 400) vivía en la costura entre el
 * dominio y la persistencia. Los tests de dominio corren en memoria y no lo
 * cazaban; el oráculo tampoco. Solo se ve yendo a la base de verdad. De ahí el
 * @Order(4) con el warning: es el caso que blinda ese bug histórico.
 *
 * Los tests corren EN ORDEN (@TestMethodOrder) porque cuentan una historia: la
 * propiedad que crea el @Order(1) la usan los siguientes.
 */
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.profiles.active=test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@Sql(scripts = "/db/contract-extra-image.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class WriteFlowIT {

    @Container
    @SuppressWarnings("resource")
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("dnvcasas")
            .withUsername("root")
            .withPassword("test");

    private static final String CLAVE_DE_TEST = "clave_solo_para_tests_de_al_menos_32_chars";

    @DynamicPropertySource
    static void propiedades(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> MYSQL.getJdbcUrl()
                + "?useUnicode=true&characterEncoding=utf8&serverTimezone=UTC");
        r.add("spring.datasource.username", MYSQL::getUsername);
        r.add("spring.datasource.password", MYSQL::getPassword);
        r.add("jwt.key", () -> CLAVE_DE_TEST);
    }

    @Autowired TestRestTemplate rest;
    @Autowired ObjectMapper mapper;

    private static String token;
    private static final List<Integer> creadas = new ArrayList<>();

    @BeforeEach
    void clienteQueSoportaPatch() {
        rest.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
    }

    private String token() throws Exception {
        if (token == null) {
            ResponseEntity<String> res = rest.postForEntity("/api/auth/login",
                    Map.of("email", "admin@dnvcasas.com", "password", "admin123"), String.class);
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
            token = mapper.readTree(res.getBody()).get("token").asText();
        }
        return token;
    }

    private ResponseEntity<String> admin(HttpMethod metodo, String path, Object body) throws Exception {
        HttpHeaders h = new HttpHeaders();
        h.setBearerAuth(token());
        h.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange(path, metodo, new HttpEntity<>(body, h), String.class);
    }

    // Arma el payload de una propiedad válida completa, reutilizado en varios
    // tests (cada uno lo modifica según lo que quiera probar).
    private static Map<String, Object> nueva() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("title", "Casa de prueba");
        m.put("description", "Creada por WriteFlowIT");
        m.put("category", 0);
        m.put("propertyType", 0);
        m.put("destinationId", 1);
        m.put("neighborhood", "Centro");
        m.put("price", 123456.78);
        m.put("priceLabel", "por noche");
        m.put("currency", "ARS");
        m.put("bedrooms", 3);
        m.put("bathrooms", 2);
        m.put("squareMeters", 99.5);
        m.put("landSize", "500m2");
        m.put("capacity", 6);
        m.put("whatsAppMessage", "Hola");
        m.put("amenities", List.of("wifi", "pool"));
        m.put("seasonPrices", List.of(Map.of(
                "label", "Alta", "pricePerNight", 200,
                "dateFrom", "2027-01-01", "dateTo", "2027-02-01")));
        return m;
    }

    // Al terminar, borra las propiedades creadas durante la corrida para no
    // dejar basura en la base.
    @AfterAll
    static void limpiar(@Autowired TestRestTemplate rest) {
        creadas.forEach(id -> {
            HttpHeaders h = new HttpHeaders();
            h.setBearerAuth(token);
            rest.exchange("/api/admin/properties/" + id, HttpMethod.DELETE,
                    new HttpEntity<>(h), String.class);
        });
    }

    // Crea una propiedad y verifica que vuelve 201 con el header Location y el
    // DTO completo (título, status activo, precio con escala, colecciones).
    @Test @Order(1)
    @DisplayName("POST devuelve 201 con Location y el DTO completo")
    void crear() throws Exception {
        ResponseEntity<String> res = admin(HttpMethod.POST, "/api/admin/properties", nueva());

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode body = mapper.readTree(res.getBody());
        creadas.add(body.get("id").asInt());

        assertThat(res.getHeaders().getLocation().toString())
                .isEqualTo("/api/admin/properties/" + body.get("id").asInt());
        assertThat(body.get("title").asText()).isEqualTo("Casa de prueba");
        assertThat(body.get("status").asInt()).isZero();
        assertThat(body.get("isFeatured").asBoolean()).isFalse();
        assertThat(body.get("price").asText()).isEqualTo("123456.78");
        assertThat(body.get("amenities")).hasSize(2);
        assertThat(body.get("seasonPrices")).hasSize(1);
    }

    // Vuelve a leer por GET lo que se creó y confirma que persistió bien,
    // incluyendo el nombre del destino (join) y la temporada guardada.
    @Test @Order(2)
    @DisplayName("lo creado se puede leer con los mismos datos")
    void leerLoCreado() throws Exception {
        ResponseEntity<String> res = admin(HttpMethod.GET,
                "/api/admin/properties/" + creadas.get(0), null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = mapper.readTree(res.getBody());
        assertThat(body.get("title").asText()).isEqualTo("Casa de prueba");
        assertThat(body.get("destinationName").asText()).isEqualTo("Bariloche");
        assertThat(body.get("seasonPrices").get(0).get("label").asText()).isEqualTo("Alta");
    }

    // Edita el título y reduce los amenities; verifica que el PUT devuelve 200 y
    // los cambios quedaron aplicados.
    @Test @Order(3)
    @DisplayName("PUT actualiza y devuelve 200")
    void editar() throws Exception {
        Map<String, Object> dto = nueva();
        dto.put("title", "Casa EDITADA");
        dto.put("amenities", List.of("wifi"));

        ResponseEntity<String> res = admin(HttpMethod.PUT,
                "/api/admin/properties/" + creadas.get(0), dto);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = mapper.readTree(res.getBody());
        assertThat(body.get("title").asText()).isEqualTo("Casa EDITADA");
        assertThat(body.get("amenities")).hasSize(1);
    }

    // EL test del bug histórico: duplicar tiene que dar 201, con un id nuevo,
    // título "(copia)", status pausado y SIN copiar imágenes. Antes esto daba 400.
    @Test @Order(4)
    @DisplayName("⚠️ POST /duplicate funciona — el bug que el oráculo y los tests de dominio no cazaban")
    void duplicar() throws Exception {
        ResponseEntity<String> res = admin(HttpMethod.POST,
                "/api/admin/properties/" + creadas.get(0) + "/duplicate", null);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode copia = mapper.readTree(res.getBody());
        creadas.add(copia.get("id").asInt());

        assertThat(copia.get("id").asInt()).isNotEqualTo(creadas.get(0));
        assertThat(copia.get("title").asText()).isEqualTo("Casa EDITADA (copia)");
        assertThat(copia.get("status").asInt()).isEqualTo(1);
        assertThat(copia.get("isFeatured").asBoolean()).isFalse();
        assertThat(copia.get("destinationName").asText()).isEqualTo("Bariloche");

        assertThat(copia.get("amenities")).hasSize(1);
        assertThat(copia.get("seasonPrices")).hasSize(1);
        assertThat(copia.get("images")).isEmpty();
    }

    // La copia quedó pausada: destacarla debe dar 400 con el mensaje del dominio.
    // Verifica que la invariante de negocio viaja intacta hasta la respuesta HTTP.
    @Test @Order(5)
    @DisplayName("destacar una PAUSADA da 400 — la invariante del dominio llega hasta el HTTP")
    void destacarPausadaDa400() throws Exception {
        int copiaPausada = creadas.get(1);

        ResponseEntity<String> res = admin(HttpMethod.PATCH,
                "/api/admin/properties/" + copiaPausada + "/featured", true);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(mapper.readTree(res.getBody()).get("error").asText())
                .isEqualTo("Solo se pueden destacar propiedades activas");
    }

    // El caso feliz del anterior: destacar una activa devuelve 204.
    @Test @Order(6)
    @DisplayName("destacar una ACTIVA da 204")
    void destacarActiva() throws Exception {
        assertThat(admin(HttpMethod.PATCH,
                "/api/admin/properties/" + creadas.get(0) + "/featured", true).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
    }

    // Pausar una propiedad destacada debe también quitarle el destacado
    // (regla: solo las activas pueden estar destacadas). Al final la reactiva.
    @Test @Order(7)
    @DisplayName("pausar limpia el destacado: isFeatured=true implica Activa")
    void pausarLimpiaDestacado() throws Exception {
        int id = creadas.get(0);
        assertThat(admin(HttpMethod.PATCH, "/api/admin/properties/" + id + "/status", 1)
                .getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        JsonNode body = mapper.readTree(admin(HttpMethod.GET, "/api/admin/properties/" + id, null).getBody());
        assertThat(body.get("status").asInt()).isEqualTo(1);
        assertThat(body.get("isFeatured").asBoolean()).isFalse();

        admin(HttpMethod.PATCH, "/api/admin/properties/" + id + "/status", 0);
    }

    // Editar con dos temporadas que se pisan da 400, y ADEMÁS no rompe las que
    // ya estaban guardadas: la validación falla antes de tocar el estado.
    @Test @Order(8)
    @DisplayName("temporadas superpuestas dan 400 y NO tocan las que ya estaban")
    void temporadasSuperpuestas() throws Exception {
        int id = creadas.get(0);
        Map<String, Object> dto = nueva();
        dto.put("title", "Casa EDITADA");
        dto.put("seasonPrices", List.of(
                Map.of("label", "Alta",  "pricePerNight", 100, "dateFrom", "2027-06-01", "dateTo", "2027-07-01"),
                Map.of("label", "Media", "pricePerNight", 80,  "dateFrom", "2027-06-15", "dateTo", "2027-08-01")));

        ResponseEntity<String> res = admin(HttpMethod.PUT, "/api/admin/properties/" + id, dto);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(mapper.readTree(res.getBody()).get("error").asText()).contains("se superpone");

        JsonNode body = mapper.readTree(admin(HttpMethod.GET, "/api/admin/properties/" + id, null).getBody());
        assertThat(body.get("seasonPrices")).hasSize(1);
        assertThat(body.get("seasonPrices").get(0).get("label").asText()).isEqualTo("Alta");
    }

    // Regla de dominio: una propiedad de intercambio no puede tener precio -> 400.
    @Test @Order(9)
    @DisplayName("intercambio con precio da 400")
    void intercambioConPrecio() throws Exception {
        Map<String, Object> dto = nueva();
        dto.put("category", 1);
        dto.put("price", 5000);

        ResponseEntity<String> res = admin(HttpMethod.POST, "/api/admin/properties", dto);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(mapper.readTree(res.getBody()).get("error").asText()).contains("intercambio");
    }

    // Faltan colecciones obligatorias: tiene que ser un 400 de validación con el
    // detalle por campo (Amenities, SeasonPrices), nunca un 500.
    @Test @Order(10)
    @DisplayName("crear sin seasonPrices da 400 de validación, no 500")
    void sinColecciones() throws Exception {
        Map<String, Object> dto = nueva();
        dto.remove("seasonPrices");
        dto.remove("amenities");

        ResponseEntity<String> res = admin(HttpMethod.POST, "/api/admin/properties", dto);

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        JsonNode errores = mapper.readTree(res.getBody()).get("errors");
        assertThat(errores.has("Amenities")).isTrue();
        assertThat(errores.has("SeasonPrices")).isTrue();
    }

    // Repite el mismo POST inválido 4 veces y verifica que los mensajes de error
    // salen siempre en el mismo orden (el contrato depende de ese orden estable).
    @Test @Order(11)
    @DisplayName("los mensajes de validación salen SIEMPRE en el mismo orden")
    void ordenDeValidacionesEstable() throws Exception {
        Map<String, Object> dto = nueva();
        dto.put("title", "");

        List<String> primero = null;
        for (int i = 0; i < 4; i++) {
            ResponseEntity<String> res = admin(HttpMethod.POST, "/api/admin/properties", dto);
            assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

            List<String> mensajes = new ArrayList<>();
            mapper.readTree(res.getBody()).get("errors").get("Title").forEach(n -> mensajes.add(n.asText()));

            if (primero == null) primero = mensajes;
            else assertThat(mensajes).as("orden en el intento %d", i).isEqualTo(primero);
        }

        assertThat(primero).containsExactly(
                "El título es requerido", "El título debe tener al menos 3 caracteres");
    }

    // Borrado lógico: DELETE devuelve 204 y después el GET da 404 (aunque la fila
    // sigue en la base marcada como DELETED, no se ve más por la API).
    @Test @Order(12)
    @DisplayName("DELETE da 204 y después el GET da 404: es soft delete")
    void borrar() throws Exception {
        int id = creadas.get(0);

        assertThat(admin(HttpMethod.DELETE, "/api/admin/properties/" + id, null).getStatusCode())
                .isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(admin(HttpMethod.GET, "/api/admin/properties/" + id, null).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    // Después de todo el trajín, las 10 propiedades del seed siguen ahí: los
    // tests no ensuciaron el listado público.
    @Test @Order(13)
    @DisplayName("las 10 del seed siguen intactas después de todo esto")
    void elSeedNoSeToco() throws Exception {
        JsonNode body = mapper.readTree(
                rest.getForEntity("/api/properties?pageSize=50", String.class).getBody());
        assertThat(body.get("total").asInt()).isEqualTo(10);
    }

    // Reordenar imágenes: el primer id de la lista queda en displayOrder 0 y pasa
    // a ser la portada (isCover=true); los demás la pierden.
    @Test @Order(14)
    @DisplayName("PUT /images/reorder reordena y mueve la portada a la primera de la lista")
    void reordenarImagenes() throws Exception {

        ResponseEntity<String> res = admin(HttpMethod.PUT,
                "/api/admin/properties/1/images/reorder", List.of(18, 1, 2));
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        JsonNode imgs = mapper.readTree(
                admin(HttpMethod.GET, "/api/admin/properties/1", null).getBody()).get("images");

        assertThat(imgs).hasSize(3);
        assertThat(imgs.get(0).get("id").asInt()).isEqualTo(18);
        assertThat(imgs.get(0).get("displayOrder").asInt()).isZero();
        assertThat(imgs.get(0).get("isCover").asBoolean()).isTrue();

        assertThat(imgs.get(1).get("id").asInt()).isEqualTo(1);
        assertThat(imgs.get(1).get("displayOrder").asInt()).isEqualTo(1);
        assertThat(imgs.get(1).get("isCover").asBoolean()).isFalse();

        assertThat(imgs.get(2).get("id").asInt()).isEqualTo(2);
        assertThat(imgs.get(2).get("isCover").asBoolean()).isFalse();
    }
}
