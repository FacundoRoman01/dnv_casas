package com.dnvcasas.application.port;

import com.dnvcasas.domain.entity.AdminUser;

import java.util.Optional;

/**
 * Puerto (arquitectura hexagonal): interfaz que la capa de aplicación DEFINE y la
 * infraestructura implementa. Acá decimos "necesito buscar un admin por email"; el
 * cómo (JPA, otra base, un mock en tests) queda del otro lado. Así la aplicación no
 * depende de la persistencia sino al revés: inversión de dependencias.
 *
 * Este puerto lo usa {@link com.dnvcasas.application.service.AuthService} para el login.
 */
public interface AdminUserRepository {

    /**
     * Busca el usuario admin por su email.
     * @return el admin envuelto en Optional, o vacío si no existe ninguno con ese email.
     */
    Optional<AdminUser> findByEmail(String email);
}
