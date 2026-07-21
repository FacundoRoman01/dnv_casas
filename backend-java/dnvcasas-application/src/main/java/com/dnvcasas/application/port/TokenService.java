package com.dnvcasas.application.port;

/**
 * Puerto (arquitectura hexagonal): la aplicación necesita generar un token de sesión
 * para el admin logueado, pero no le importa la tecnología (JWT, otra cosa). Define el
 * "qué" acá; la infraestructura pone el "cómo". Lo usa {@link com.dnvcasas.application.service.AuthService}.
 */
public interface TokenService {

    /**
     * Genera un token de acceso para el email dado (el admin que acaba de loguearse).
     * @return el token ya firmado, listo para devolverle al frontend.
     */
    String generate(String email);
}
