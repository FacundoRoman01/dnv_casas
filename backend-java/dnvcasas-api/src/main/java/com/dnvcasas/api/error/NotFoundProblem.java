package com.dnvcasas.api.error;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/**
 * Cuerpo estándar de un 404, en formato "problem+json" (RFC 9110). Es la
 * respuesta reutilizable que devuelven los controllers cuando no encuentran un
 * recurso por id.
 *
 * El @JsonPropertyOrder no es cosmético: fija el orden exacto de los campos en
 * el JSON (type, title, status) para replicar byte a byte lo que devolvía .NET.
 * Lo verifican los tests de contrato.
 */
@JsonPropertyOrder({ "type", "title", "status" })
public record NotFoundProblem(String type, String title, int status) {

    private static final String RFC_404 = "https://tools.ietf.org/html/rfc9110#section-15.5.5";
    private static final MediaType PROBLEM_JSON =
            new MediaType("application", "problem+json", java.nio.charset.StandardCharsets.UTF_8);

    // Fábrica que arma el 404 completo (status + content-type + body).
    public static ResponseEntity<NotFoundProblem> response() {
        return ResponseEntity.status(404)
                .contentType(PROBLEM_JSON)
                .body(new NotFoundProblem(RFC_404, "Not Found", 404));
    }
}
