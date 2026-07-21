package com.dnvcasas.api.controller;

import com.dnvcasas.application.dto.AuthDto.LoginRequest;
import com.dnvcasas.application.dto.AuthDto.MessageBody;
import com.dnvcasas.application.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoint de autenticación. Expone el recurso REST /api/auth.
 * Capa de entrada HTTP: delega el chequeo de credenciales y la emisión del JWT
 * en el AuthService.
 *
 * OJO: además de este controller, el login está protegido por rate limit por IP
 * (ver LoginRateLimitFilter), que actúa ANTES de llegar acá.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    /**
     * POST /api/auth/login — valida usuario/contraseña y devuelve el token.
     * Si las credenciales son correctas: 200 con el JWT.
     * Si son inválidas: 401 con un mensaje genérico (no se aclara si falló el
     * usuario o la clave, para no dar pistas a un atacante).
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        return service.login(request)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(401)
                        .body(new MessageBody("Credenciales inválidas")));
    }
}
