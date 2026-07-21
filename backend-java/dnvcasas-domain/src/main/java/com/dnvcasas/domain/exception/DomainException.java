package com.dnvcasas.domain.exception;

/**
 * Excepción que se lanza cuando se viola una regla de negocio (una "invariante")
 * del dominio: por ejemplo, poner precio a una propiedad de intercambio, o
 * modificar una propiedad ya borrada.
 *
 * Es una RuntimeException (no chequeada), así que no hace falta declararla con
 * {@code throws} en cada método. El mensaje va en español porque termina llegando
 * al usuario: el handler global de la capa api la traduce a un HTTP 400
 * (Bad Request) con este mismo texto. Ver el manejo de errores en dnvcasas-api.
 */
public class DomainException extends RuntimeException {
    public DomainException(String message) {
        super(message);
    }
}
