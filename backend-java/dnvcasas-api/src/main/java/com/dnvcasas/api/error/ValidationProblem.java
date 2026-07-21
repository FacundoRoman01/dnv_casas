package com.dnvcasas.api.error;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Cuerpo de un 400 por errores de validación, en formato "problem+json".
 * Replica exactamente el ValidationProblemDetails de ASP.NET: mismo orden de
 * campos, nombres de campo en PascalCase, y errores agrupados por campo.
 *
 * El @JsonPropertyOrder fija el orden del JSON por el contrato byte a byte.
 */
@JsonPropertyOrder({ "type", "title", "status", "errors" })
public record ValidationProblem(String type, String title, int status, Map<String, List<String>> errors) {

    private static final String RFC_400 = "https://tools.ietf.org/html/rfc9110#section-15.5.1";
    private static final MediaType PROBLEM_JSON =
            new MediaType("application", "problem+json", java.nio.charset.StandardCharsets.UTF_8);

    // Orden de prioridad para mostrar los errores de un mismo campo. .NET los
    // devolvía en este orden y el frontend muestra el primero, así que hay que
    // respetarlo (ej: si falta el campo, "NotNull" gana sobre "Size").
    private static final List<String> PRIORIDAD =
            List.of("NotNull", "NotBlank", "NotEmpty", "Size", "Min", "Max", "Email");

    // Transforma la excepción de validación de Spring en nuestro cuerpo de error.
    public static ResponseEntity<ValidationProblem> from(MethodArgumentNotValidException ex) {
        Map<String, List<FieldError>> porCampo = new LinkedHashMap<>();
        for (FieldError err : ex.getBindingResult().getFieldErrors())
            porCampo.computeIfAbsent(pascalCase(err.getField()), k -> new ArrayList<>()).add(err);

        Map<String, List<String>> errors = new LinkedHashMap<>();
        porCampo.forEach((campo, errs) -> errors.put(campo, errs.stream()
                .sorted(Comparator.comparingInt(ValidationProblem::prioridad))
                .map(FieldError::getDefaultMessage)
                .toList()));

        return ResponseEntity.status(400)
                .contentType(PROBLEM_JSON)
                .body(new ValidationProblem(RFC_400, "One or more validation errors occurred.", 400, errors));
    }

    private static int prioridad(FieldError err) {
        int i = PRIORIDAD.indexOf(err.getCode());
        return i < 0 ? PRIORIDAD.size() : i;
    }

    // .NET nombraba los campos en PascalCase (Title, Description); Spring los usa
    // en camelCase (title). Capitalizamos la inicial para que coincida el contrato.
    private static String pascalCase(String field) {
        if (field == null || field.isEmpty()) return field;
        return Character.toUpperCase(field.charAt(0)) + field.substring(1);
    }
}
