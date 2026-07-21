package com.dnvcasas.infrastructure.security;

import com.dnvcasas.application.port.PasswordHasher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Adapter de infraestructura para hashear y verificar contraseñas con BCrypt.
 * Implementa el port {@link PasswordHasher} de la capa application: esta última pide
 * "hasheá" o "verificá" sin saber que abajo hay BCrypt de Spring Security.
 *
 * BCrypt guarda el salt y el "cost" dentro del propio hash resultante, por eso
 * {@link #verify} no necesita el salt aparte: lo lee del hash almacenado.
 */
@Service
public class BcryptPasswordHasher implements PasswordHasher {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    /**
     * Genera el hash BCrypt de una contraseña en texto plano.
     *
     * @param password contraseña en texto plano.
     * @return el hash (incluye salt y cost embebidos) para guardar en la base.
     */
    @Override
    public String hash(String password) {
        return encoder.encode(password);
    }

    /**
     * Verifica una contraseña contra un hash guardado.
     *
     * @param password contraseña en texto plano que ingresó el usuario.
     * @param hash     hash BCrypt guardado en la base.
     * @return true si la contraseña coincide con el hash.
     */
    @Override
    public boolean verify(String password, String hash) {
        return encoder.matches(password, hash);
    }
}
