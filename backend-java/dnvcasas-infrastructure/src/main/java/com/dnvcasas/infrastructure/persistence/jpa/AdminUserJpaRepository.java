package com.dnvcasas.infrastructure.persistence.jpa;

import com.dnvcasas.domain.entity.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repositorio Spring Data JPA para los usuarios admin. Spring genera la implementación
 * en runtime a partir de esta interfaz: nosotros solo declaramos qué queremos.
 *
 * En arquitectura hexagonal, este NO es el "port": el port es {@code AdminUserRepository}
 * de la capa application. Esta interfaz es una pieza técnica de infraestructura que usa
 * el adapter para hablar con la base.
 */
public interface AdminUserJpaRepository extends JpaRepository<AdminUser, Integer> {

    /** Busca un admin por email (login). Spring deriva la query del nombre del método. */
    Optional<AdminUser> findByEmail(String email);
}
