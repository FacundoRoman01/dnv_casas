package com.dnvcasas.api.golden;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
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

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * GoldenIT: el test de "oráculo" o "golden master". Es la red de seguridad más
 * fuerte del port desde .NET.
 *
 * Idea: en la carpeta golden/contract hay un montón de archivos .txt, cada uno
 * con una request y la respuesta EXACTA (status, content-type y body JSON) que
 * daba el backend .NET original. Este test levanta la app Java contra una MySQL
 * real (Testcontainers), le pega a cada endpoint y compara la respuesta con la
 * grabada. Si algo cambió en el contrato REST, un escenario falla.
 *
 * O sea: garantiza que el frontend no note ninguna diferencia entre el backend
 * viejo y el nuevo. Es de lectura (GET) principalmente; el flujo de escritura lo
 * cubre WriteFlowIT.
 */
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "spring.profiles.active=test")
@Sql(scripts = "/db/contract-extra-image.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class GoldenIT {

    // Carpeta con los .txt del contrato grabado del .NET (relativa al módulo).
    private static final Path CONTRATO = Paths.get("../../golden/contract");

    // Estos escenarios no se comparan acá: dependen del reloj/estado (rate limit,
    // token recién emitido) y se prueban aparte en tests dedicados.
    private static final Set<String> SALTEADOS = Set.of(
            "login_rate_limit",
            "login_ok"
    );

    // Escenario que a propósito NO manda token: sirve para verificar que un
    // endpoint de admin sin autenticación responde como debe.
    private static final Set<String> SIN_TOKEN = Set.of("admin_sin_token");

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

    // El cliente HTTP por defecto de Java no soporta el método PATCH; se cambia
    // por el de Apache HttpComponents, que sí, para poder probar los endpoints PATCH.
    @BeforeEach
    void clienteQueSoportaPatch() {
        rest.getRestTemplate().setRequestFactory(new HttpComponentsClientHttpRequestFactory());
    }

    // Un caso de prueba parseado desde un .txt del contrato: qué pedir y qué esperar.
    record Escenario(String nombre, String metodo, String path, String body,
                     int status, String contentType, String cuerpoEsperado) {
        @Override public String toString() { return nombre; }
    }

    static Stream<Escenario> escenarios() throws IOException {
        try (var files = Files.list(CONTRATO)) {
            return files.filter(p -> p.toString().endsWith(".txt"))
                    .map(GoldenIT::parsear)
                    .filter(e -> !SALTEADOS.contains(e.nombre()))
                    .sorted(Comparator.comparing(Escenario::nombre))
                    .toList().stream();
        }
    }

    private static Escenario parsear(Path archivo) {
        try {
            String raw = Files.readString(archivo, StandardCharsets.UTF_8);
            String nombre = archivo.getFileName().toString().replace(".txt", "");

            String[] partes = raw.split("--- body ---", 2);
            String cabecera = partes[0];
            String cuerpo = partes.length > 1 ? partes[1].strip() : "";

            String metodo = null, path = null, body = null, contentType = "";
            int status = 0;
            for (String linea : cabecera.split("\n")) {
                linea = linea.strip();
                if (linea.startsWith("### body: ")) body = linea.substring(10);
                else if (linea.startsWith("### ")) {
                    String[] mp = linea.substring(4).split(" ", 2);
                    metodo = mp[0]; path = mp[1];
                } else if (linea.startsWith("HTTP ")) status = Integer.parseInt(linea.substring(5).strip());
                else if (linea.startsWith("content-type:")) contentType = linea.substring(13).strip();
            }
            return new Escenario(nombre, metodo, path, body, status, contentType, cuerpo);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    // Corre una vez por cada .txt del contrato. Verifica que status, content-type
    // y body coincidan exactamente con lo que devolvía el .NET.
    @ParameterizedTest(name = "{0}")
    @MethodSource("escenarios")
    @DisplayName("la respuesta coincide con el contrato")
    void coincideConElContrato(Escenario e) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        if (e.path().contains("/admin/") && !SIN_TOKEN.contains(e.nombre()))
            headers.setBearerAuth(token());
        if (e.body() != null) headers.setContentType(MediaType.APPLICATION_JSON);

        ResponseEntity<String> res = rest.exchange(
                e.path(), HttpMethod.valueOf(e.metodo()),
                new HttpEntity<>(e.body(), headers), String.class);

        assertThat(res.getStatusCode().value())
                .as("status de %s", e.nombre()).isEqualTo(e.status());

        assertThat(normalizarContentType(res.getHeaders().getContentType()))
                .as("content-type de %s", e.nombre()).isEqualTo(e.contentType());

        String actual = res.getBody() == null ? "" : res.getBody();
        if (e.cuerpoEsperado().isEmpty()) {
            assertThat(actual).as("body de %s", e.nombre()).isEmpty();
            return;
        }

        JsonNode esperado = normalizar(mapper.readTree(e.cuerpoEsperado()));
        JsonNode obtenido = normalizar(mapper.readTree(actual));
        // Los golden son anteriores a los campos opcionales de V3/V4. En el
        // detalle se toleran únicamente cuando son null; un valor real sigue
        // siendo un cambio visible que la comparación debe detectar.
        if (esperado.isObject() && esperado.has("images") && esperado.has("isFeatured")
                && obtenido.isObject()) {
            for (String campoOpcional : List.of("youtubeUrl", "googleMapsUrl")) {
                if (!esperado.has(campoOpcional) && obtenido.has(campoOpcional)
                        && obtenido.get(campoOpcional).isNull()) {
                    ((ObjectNode) obtenido).remove(campoOpcional);
                }
            }
        }
        assertThat(obtenido)
                .as("body de %s", e.nombre())
                .isEqualTo(esperado);
    }

    private static String normalizarContentType(MediaType ct) {
        return ct == null ? "" : ct.toString().toLowerCase(Locale.ROOT).replace(" ", "");
    }

    // Normaliza el JSON antes de comparar: saca el traceId (cambia en cada
    // request) y ordena los amenities alfabéticamente (su orden no es parte del
    // contrato). Así la comparación no falla por diferencias irrelevantes.
    private static JsonNode normalizar(JsonNode nodo) {
        if (nodo.isObject()) {
            ObjectNode obj = (ObjectNode) nodo.deepCopy();
            obj.remove("traceId");
            obj.fieldNames().forEachRemaining(campo -> {
                JsonNode v = obj.get(campo);
                if (campo.equals("amenities") && v.isArray()) {
                    List<String> ordenadas = new ArrayList<>();
                    v.forEach(x -> ordenadas.add(x.asText()));
                    Collections.sort(ordenadas);
                    ArrayNode arr = obj.putArray(campo);
                    ordenadas.forEach(arr::add);
                } else {
                    obj.set(campo, normalizar(v));
                }
            });
            return obj;
        }
        if (nodo.isArray()) {
            ArrayNode arr = ((ArrayNode) nodo).deepCopy();
            for (int i = 0; i < arr.size(); i++) arr.set(i, normalizar(arr.get(i)));
            return arr;
        }
        return nodo;
    }

    // Loguea una vez como admin y cachea el token para los escenarios de /admin/.
    private String token() throws Exception {
        if (token == null) {
            ResponseEntity<String> res = rest.postForEntity("/api/auth/login",
                    Map.of("email", "admin@dnvcasas.com", "password", "admin123"), String.class);
            assertThat(res.getStatusCode()).as("login para los escenarios de admin").isEqualTo(HttpStatus.OK);
            token = mapper.readTree(res.getBody()).get("token").asText();
        }
        return token;
    }
}
