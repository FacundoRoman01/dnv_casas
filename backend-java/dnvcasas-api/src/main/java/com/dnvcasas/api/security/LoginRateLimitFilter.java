package com.dnvcasas.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limit del login: frena los intentos de fuerza bruta contra
 * POST /api/auth/login. Cuenta los intentos por IP y, si se pasan del límite,
 * responde 429 (Too Many Requests) con el header Retry-After indicando en
 * cuántos segundos puede reintentar. Lo cubre LoginRateLimitFilterTest.
 *
 * Es un OncePerRequestFilter: corre una vez por request, antes de la
 * autenticación (ver el addFilterBefore en SecurityConfig).
 *
 * Implementación de "ventana fija" en memoria: simple y suficiente para un solo
 * nodo. Si la app escalara a varias instancias, habría que mover esto a algo
 * compartido (Redis), porque cada instancia cuenta por su lado.
 */
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimitFilter.class);

    // Hasta 5 intentos por IP dentro de una ventana de 15 minutos.
    private static final int LIMITE = 5;
    private static final long VENTANA_MS = Duration.ofMinutes(15).toMillis();

    // Tope de IPs distintas que guardamos, para que el mapa no crezca infinito
    // (protección básica contra que alguien lo llene con IPs falsas).
    private static final int MAX_IPS = 10_000;

    // abiertaEn = cuándo arrancó la ventana de esa IP; consumidos = intentos hechos.
    private record Ventana(long abiertaEn, int consumidos) { }

    // Estado compartido entre requests, por eso es concurrente (varios hilos a la vez).
    private final Map<String, Ventana> porIp = new ConcurrentHashMap<>();

    // Optimización: si NO es el POST del login, ni filtramos. Todo lo demás pasa derecho.
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return !("POST".equals(request.getMethod())
                && "/api/auth/login".equals(request.getServletPath()));
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        long ahora = System.currentTimeMillis();
        String ip = request.getRemoteAddr();

        // Si todavía tiene cupo, dejamos pasar la request al login normal.
        if (permitir(ip, ahora)) {
            chain.doFilter(request, response);
            return;
        }

        log.warn("Rate limit de login alcanzado por {}", ip);

        // Se pasó: cortamos acá con 429 y le decimos cuántos segundos esperar.
        response.setStatus(429);
        response.setHeader("Retry-After", String.valueOf(segundosParaReintentar(ip, ahora)));
        response.setContentLength(0);
    }

    // Registra un intento y devuelve true si todavía está dentro del límite.
    private boolean permitir(String ip, long ahora) {
        if (porIp.size() >= MAX_IPS) limpiarVencidas(ahora);

        // compute() es atómico: suma el intento sin condiciones de carrera. Si no
        // había ventana o ya venció, arranca una nueva; si no, suma uno más.
        Ventana resultado = porIp.compute(ip, (k, v) -> {
            if (v == null || ahora - v.abiertaEn() >= VENTANA_MS)
                return new Ventana(ahora, 1);
            return new Ventana(v.abiertaEn(), v.consumidos() + 1);
        });
        return resultado.consumidos() <= LIMITE;
    }

    private long segundosParaReintentar(String ip, long ahora) {
        Ventana v = porIp.get(ip);
        if (v == null) return 0;
        return Math.max(0, (VENTANA_MS - (ahora - v.abiertaEn())) / 1000);
    }

    // Barre y saca del mapa las ventanas ya vencidas, para liberar memoria.
    private void limpiarVencidas(long ahora) {
        porIp.entrySet().removeIf(e -> ahora - e.getValue().abiertaEn() >= VENTANA_MS);
    }
}
