package com.dnvcasas.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de la documentación OpenAPI/Swagger. Define el título de la API
 * y declara que usa autenticación por Bearer token (JWT), para que el botón
 * "Authorize" del Swagger UI pida el token y lo mande en las requests de prueba.
 * Es solo documentación: no afecta la seguridad real (esa vive en SecurityConfig).
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI dnvCasasOpenApi() {
        final String bearer = "Bearer";
        return new OpenAPI()
                .info(new Info().title("DnvCasas API").version("v1"))
                .components(new Components().addSecuritySchemes(bearer,
                        new SecurityScheme()
                                .name("Authorization")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(bearer));
    }
}
