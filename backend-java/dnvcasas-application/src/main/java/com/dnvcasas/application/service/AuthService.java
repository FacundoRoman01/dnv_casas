package com.dnvcasas.application.service;

import com.dnvcasas.application.dto.AuthDto.LoginRequest;
import com.dnvcasas.application.dto.AuthDto.LoginResponse;
import com.dnvcasas.application.port.AdminUserRepository;
import com.dnvcasas.application.port.PasswordHasher;
import com.dnvcasas.application.port.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service de la capa de aplicación: orquesta el caso de uso de login. Un service coordina
 * el dominio y los puertos, pero no implementa detalles técnicos: acá delega en los puertos
 * {@link AdminUserRepository} (buscar el admin), {@link PasswordHasher} (verificar la clave)
 * y {@link TokenService} (emitir el token). La infraestructura provee las implementaciones.
 * Es la única capa donde vive la lógica de "cómo se encadena" un caso de uso.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AdminUserRepository users;
    private final PasswordHasher hasher;
    private final TokenService tokens;

    public AuthService(AdminUserRepository users, PasswordHasher hasher, TokenService tokens) {
        this.users = users;
        this.hasher = hasher;
        this.tokens = tokens;
    }

    /**
     * Intenta loguear a un admin. Busca por email, y solo si la contraseña verifica emite
     * un token. Logueamos éxito/fallo para poder auditar intentos.
     *
     * Detalle de seguridad: se devuelve Optional vacío tanto si el email no existe como si
     * la contraseña no coincide (el .filter() descarta ambos casos por igual). Así el que
     * ataca no puede distinguir "email inexistente" de "clave incorrecta".
     *
     * @return el token + email envueltos en Optional si las credenciales son válidas; vacío si no.
     */
    public Optional<LoginResponse> login(LoginRequest request) {
        Optional<LoginResponse> resultado = users.findByEmail(request.email())
                .filter(u -> hasher.verify(request.password(), u.getPasswordHash()))
                .map(u -> new LoginResponse(tokens.generate(u.getEmail()), u.getEmail()));

        if (resultado.isPresent()) log.info("Login exitoso: {}", request.email());
        else log.warn("Login fallido: {}", request.email());

        return resultado;
    }
}
