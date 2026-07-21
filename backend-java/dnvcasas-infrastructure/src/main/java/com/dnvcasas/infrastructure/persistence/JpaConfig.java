package com.dnvcasas.infrastructure.persistence;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Configuración de JPA. Le dice a Spring dónde buscar dos cosas que viven en paquetes
 * distintos (por la separación en capas de la arquitectura hexagonal):
 *
 * - {@code @EntityScan}: las entidades JPA están en la capa domain
 *   ({@code com.dnvcasas.domain.entity}), no acá en infrastructure.
 * - {@code @EnableJpaRepositories}: las interfaces de repositorio Spring Data están en
 *   {@code com.dnvcasas.infrastructure.persistence.jpa}.
 *
 * Sin estas anotaciones, Spring no escanearía esos paquetes porque no cuelgan del
 * paquete de la clase principal de la app.
 */
@Configuration
@EntityScan("com.dnvcasas.domain.entity")
@EnableJpaRepositories("com.dnvcasas.infrastructure.persistence.jpa")
public class JpaConfig {
}
