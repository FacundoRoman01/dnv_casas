package com.dnvcasas.application.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTOs de autenticación. Un DTO es un simple "paquete de datos" para entrar/salir de la
 * API, sin lógica de negocio. Esta clase es solo un contenedor de los records de auth;
 * es final y con constructor privado para que nadie la instancie (se usa como namespace).
 */
public final class AuthDto {

    // Constructor privado: esta clase no se instancia, solo agrupa los records de adentro.
    private AuthDto() { }

    // Cuerpo del request de login. Las anotaciones @NotBlank/@Email hacen que Spring
    // valide la entrada y devuelva 400 automáticamente si el email/password vienen mal.
    public record LoginRequest(
        @NotBlank(message = "El email es requerido")
        @Email(message = "Email inválido")
        String email,

        @NotBlank(message = "La contraseña es requerida")
        String password
    ) { }

    // Respuesta del login. El @JsonPropertyOrder fija el orden de los campos en el JSON:
    // el contrato REST se portó byte a byte desde .NET, así que el orden no es cosmético.
    @JsonPropertyOrder({ "token", "email" })
    public record LoginResponse(String token, String email) { }

    // Sobre genérico para respuestas simples de tipo {"message": "..."}.
    public record MessageBody(String message) { }
}
