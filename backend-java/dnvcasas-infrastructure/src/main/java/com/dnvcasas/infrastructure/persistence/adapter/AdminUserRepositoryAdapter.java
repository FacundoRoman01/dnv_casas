package com.dnvcasas.infrastructure.persistence.adapter;

import com.dnvcasas.application.port.AdminUserRepository;
import com.dnvcasas.domain.entity.AdminUser;
import com.dnvcasas.infrastructure.persistence.jpa.AdminUserJpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Adapter de persistencia para usuarios admin. Implementa el port
 * {@link AdminUserRepository} (capa application) delegando en el repositorio Spring
 * Data {@link AdminUserJpaRepository}. La capa application depende de la interfaz, no
 * de JPA: este adapter es el pegamento entre ambos mundos (arquitectura hexagonal).
 */
@Repository
public class AdminUserRepositoryAdapter implements AdminUserRepository {

    private final AdminUserJpaRepository jpa;

    public AdminUserRepositoryAdapter(AdminUserJpaRepository jpa) {
        this.jpa = jpa;
    }

    /** Busca el admin por email (usado en el login). */
    @Override
    @Transactional(readOnly = true)
    public Optional<AdminUser> findByEmail(String email) {
        return jpa.findByEmail(email);
    }
}
