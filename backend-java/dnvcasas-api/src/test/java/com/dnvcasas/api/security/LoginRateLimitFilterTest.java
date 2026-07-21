package com.dnvcasas.api.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests del filtro de rate limit del login. Usa requests mockeadas (sin levantar
 * la app) para simular intentos por IP.
 *
 * Invariantes que protege: los primeros 5 intentos por IP pasan y el 6º da 429
 * con Retry-After; el conteo es POR IP (una IP bloqueada no afecta a otra: bug que
 * tenía el .NET); y solo se limita POST /api/auth/login, nada más.
 */
class LoginRateLimitFilterTest {

    private final LoginRateLimitFilter filtro = new LoginRateLimitFilter();

    // Simula un POST de login desde la IP dada y devuelve la respuesta. Como el
    // MockFilterChain no hace nada, si el filtro deja pasar, el status queda 200.
    private MockHttpServletResponse intentarLogin(String ip) throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
        req.setServletPath("/api/auth/login");
        req.setRemoteAddr(ip);
        MockHttpServletResponse res = new MockHttpServletResponse();
        filtro.doFilter(req, res, new MockFilterChain());
        return res;
    }

    // Los 5 intentos que permite el límite pasan sin bloqueo.
    @Test
    @DisplayName("los primeros 5 intentos de una IP pasan")
    void cincoIntentosPasan() throws Exception {
        for (int i = 1; i <= 5; i++)
            assertThat(intentarLogin("10.0.0.1").getStatus())
                    .as("intento %d", i).isEqualTo(200);
    }

    // El 6º ya se pasa: 429 con el header Retry-After indicando cuánto esperar.
    @Test
    @DisplayName("el 6º intento de la misma IP da 429 con Retry-After")
    void sextoIntentoBloqueado() throws Exception {
        for (int i = 0; i < 5; i++) intentarLogin("10.0.0.2");

        MockHttpServletResponse res = intentarLogin("10.0.0.2");

        assertThat(res.getStatus()).isEqualTo(429);
        assertThat(res.getHeader("Retry-After")).isNotNull();
        assertThat(Long.parseLong(res.getHeader("Retry-After"))).isBetween(1L, 900L);
    }

    // Aunque una IP esté bloqueada, otra IP legítima tiene que poder entrar.
    // El .NET original tenía el contador global y bloqueaba a todos: acá no.
    @Test
    @DisplayName("una IP agotada NO bloquea a las demás — el bug que tenía el .NET")
    void unaIpNoBloqueaALasOtras() throws Exception {

        for (int i = 0; i < 10; i++) intentarLogin("66.66.66.66");
        assertThat(intentarLogin("66.66.66.66").getStatus()).isEqualTo(429);

        assertThat(intentarLogin("10.0.0.99").getStatus())
                .as("el admin legítimo tiene que poder entrar")
                .isEqualTo(200);
    }

    // Otras rutas (ej. el catálogo) no se limitan: 20 requests seguidas pasan.
    @Test
    @DisplayName("solo limita POST /api/auth/login")
    void noLimitaOtrasRutas() throws Exception {
        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/properties");
            req.setServletPath("/api/properties");
            req.setRemoteAddr("10.0.0.3");
            MockHttpServletResponse res = new MockHttpServletResponse();
            FilterChain chain = new MockFilterChain();
            filtro.doFilter(req, res, chain);
            assertThat(res.getStatus()).isEqualTo(200);
        }
    }

    // Solo el POST del login cuenta: 20 GET a la misma ruta no gastan cupo, y
    // después el primer POST sigue pasando.
    @Test
    @DisplayName("un GET al login tampoco cuenta: el .NET solo limitaba el POST")
    void soloElPost() throws Exception {
        for (int i = 0; i < 20; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/auth/login");
            req.setServletPath("/api/auth/login");
            req.setRemoteAddr("10.0.0.4");
            MockHttpServletResponse res = new MockHttpServletResponse();
            filtro.doFilter(req, res, new MockFilterChain());
            assertThat(res.getStatus()).isEqualTo(200);
        }

        assertThat(intentarLogin("10.0.0.4").getStatus()).isEqualTo(200);
    }
}
