package com.dnvcasas.api.error;

import com.dnvcasas.domain.exception.DomainException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Manejador GLOBAL de excepciones de la API. Con @RestControllerAdvice, Spring
 * enruta acá cualquier excepción que se escape de un controller y la traduce a
 * una respuesta HTTP prolija, en vez de un stacktrace crudo.
 *
 * La regla clave del contrato: cuando el dominio rechaza algo (una regla de
 * negocio violada), eso NO es un error del server (500), es culpa del cliente
 * (400). Por eso DomainException -> HTTP 400.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Cuerpo de error simple: { "error": "mensaje" }.
    public record ErrorBody(String error) { }

    // Regla de negocio violada en el dominio -> 400 con el mensaje de la excepción.
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ErrorBody> domain(DomainException ex) {
        return ResponseEntity.badRequest().body(new ErrorBody(ex.getMessage()));
    }

    // Falló la validación del @Valid del body (campos requeridos, tamaños...)
    // -> 400 con el detalle campo por campo (ver ValidationProblem).
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationProblem> validation(MethodArgumentNotValidException ex) {
        return ValidationProblem.from(ex);
    }

    // Red de contención para cualquier otra excepción.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> fallback(Exception ex) {
        // Si es una excepción de Spring que ya trae su propio status (ej. un 404
        // por ruta inexistente), la respetamos: una URL que no existe debe dar
        // 404, no 500.
        if (ex instanceof ErrorResponse er)
            return ResponseEntity.status(er.getStatusCode()).build();

        // Cualquier otra cosa es un bug inesperado: se loguea completo (para
        // depurar) pero al cliente solo le devolvemos un 500 genérico, sin
        // filtrar detalles internos.
        log.error("Excepción no manejada", ex);
        return ResponseEntity.status(500).body(new ErrorBody("Error interno del servidor"));
    }
}
