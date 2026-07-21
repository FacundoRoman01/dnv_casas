package com.dnvcasas.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Clase main de Spring Boot: el punto de arranque de toda la aplicación.
 *
 * El scanBasePackages = "com.dnvcasas" es importante: le dice a Spring que
 * escanee TODOS los módulos (domain, application, infrastructure, api), no solo
 * el paquete de esta clase. Sin eso, no encontraría los @Service, @Repository,
 * etc. de los otros módulos y la app no levantaría.
 */
@SpringBootApplication(scanBasePackages = "com.dnvcasas")
public class DnvCasasApplication {
    public static void main(String[] args) {
        SpringApplication.run(DnvCasasApplication.class, args);
    }
}
