package com.dnvcasas.api.error;

import com.dnvcasas.domain.exception.DomainException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests del manejador global de errores. Prueban el handler directo (sin levantar
 * la app) para verificar el mapeo excepción -> status HTTP correcto.
 *
 * Invariante clave que protege: los errores "esperables" (URL inexistente,
 * método no permitido, regla de negocio violada) devuelven el status adecuado
 * (404/405/400), y SOLO los bugs de verdad dan 500, sin filtrar detalles
 * internos al cliente.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // Una ruta que no existe tiene que dar 404, no un 500 de "algo explotó".
    @Test
    @DisplayName("una URL inexistente da 404, no 500")
    void urlInexistente() {
        ResponseEntity<?> res = handler.fallback(
                new NoResourceFoundException(org.springframework.http.HttpMethod.GET, "/api/no-existe"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // Pegarle con un verbo HTTP no soportado a una ruta existente -> 405.
    @Test
    @DisplayName("un método no permitido da 405")
    void metodoNoPermitido() {
        ResponseEntity<?> res = handler.fallback(
                new HttpRequestMethodNotSupportedException("DELETE"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    }

    // Mandar un body con content-type que no aceptamos -> 415.
    @Test
    @DisplayName("un content-type no soportado da 415")
    void contentTypeInvalido() {
        ResponseEntity<?> res = handler.fallback(
                new HttpMediaTypeNotSupportedException("text/plain"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    // Un bug inesperado sí da 500, pero el mensaje interno (que podría exponer
    // infra) NO se filtra al cliente: se devuelve un texto genérico.
    @Test
    @DisplayName("una excepción de verdad sí da 500, sin exponer el detalle")
    void excepcionReal() {
        ResponseEntity<?> res = handler.fallback(
                new RuntimeException("connection pool exhausted en el server-3"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);

        assertThat(res.getBody()).isEqualTo(new GlobalExceptionHandler.ErrorBody("Error interno del servidor"));
        assertThat(res.getBody().toString()).doesNotContain("connection pool");
    }

    // Al revés que el bug interno: el mensaje de una DomainException SÍ se muestra,
    // porque está escrito para el usuario final, y va con status 400.
    @Test
    @DisplayName("DomainException expone su mensaje: es texto escrito para el usuario")
    void domainException() {
        ResponseEntity<GlobalExceptionHandler.ErrorBody> res =
                handler.domain(new DomainException("Solo se pueden destacar propiedades activas"));

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody().error()).isEqualTo("Solo se pueden destacar propiedades activas");
    }
}
