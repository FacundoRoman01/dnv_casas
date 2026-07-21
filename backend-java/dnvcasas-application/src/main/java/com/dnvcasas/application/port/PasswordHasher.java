package com.dnvcasas.application.port;

/**
 * Puerto (arquitectura hexagonal): abstrae el hasheo de contraseñas. La aplicación
 * pide "hasheá esto" o "verificá si coincide" sin atarse al algoritmo concreto
 * (BCrypt, Argon2, etc.), que vive en infraestructura. Lo usa {@link com.dnvcasas.application.service.AuthService}.
 */
public interface PasswordHasher {

    /** Hashea una contraseña en texto plano para poder guardarla. */
    String hash(String password);

    /**
     * Verifica que una contraseña en texto plano corresponda a un hash guardado.
     * @return true si coinciden, false si no.
     */
    boolean verify(String password, String hash);
}
