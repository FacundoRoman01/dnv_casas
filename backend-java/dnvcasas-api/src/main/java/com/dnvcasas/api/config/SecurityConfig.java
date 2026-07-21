package com.dnvcasas.api.config;

import com.dnvcasas.api.security.DotNetCompatibleAuthoritiesConverter;
import com.dnvcasas.api.security.LoginRateLimitFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

/**
 * Configuración de seguridad de la API. Define cómo se validan los JWT y qué
 * rutas requieren login.
 *
 * El esquema es "resource server" con JWT firmado por HMAC (HS256) usando una
 * clave secreta compartida. La app NO emite el token acá (eso lo hace el
 * AuthService al loguear): acá solo se VERIFICAN los tokens entrantes.
 *
 * Todo esto está calcado del backend .NET original para que los tokens sean
 * intercambiables (mismo issuer, audience, claims y tolerancia de reloj).
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final String jwtKey;
    private final String issuer;
    private final String audience;

    public SecurityConfig(@Value("${jwt.key}") String jwtKey,
                          @Value("${jwt.issuer}") String issuer,
                          @Value("${jwt.audience}") String audience) {
        // La clave HS256 tiene que medir al menos 32 bytes; si no, la firma es
        // débil. Fallamos al arrancar antes que levantar una app insegura.
        if (jwtKey == null || jwtKey.length() < 32)
            throw new IllegalStateException("jwt.key debe tener al menos 32 caracteres.");
        this.jwtKey = jwtKey;
        this.issuer = issuer;
        this.audience = audience;
    }

    // Arma el verificador de tokens: valida la firma con la clave secreta y,
    // además, tres cosas del contenido del token.
    @Bean
    public JwtDecoder jwtDecoder() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withSecretKey(new SecretKeySpec(jwtKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"))
                .macAlgorithm(MacAlgorithm.HS256)
                .build();

        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                // Clock skew de 5 minutos: tolera esa diferencia de reloj entre
                // el server que emitió el token y este que lo valida, así un token
                // recién emitido no se rechaza por un desfasaje chico. Lo cubre ClockSkewTest.
                new JwtTimestampValidator(Duration.ofMinutes(5)),
                // El token tiene que venir de nuestro emisor...
                new JwtIssuerValidator(issuer),
                // ...y estar destinado a nuestra audiencia.
                new JwtClaimValidator<List<String>>(JwtClaimNames.AUD,
                        aud -> aud != null && aud.contains(audience)));
        decoder.setJwtValidator(validator);
        return decoder;
    }

    // Traduce los claims del JWT a roles de Spring Security. Usa un converter
    // propio porque .NET escribe el rol en un claim con nombre distinto (ver
    // DotNetCompatibleAuthoritiesConverter).
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(new DotNetCompatibleAuthoritiesConverter());
        return converter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           LoginRateLimitFilter rateLimitFilter) throws Exception {
        http
            // Sin CSRF ni sesiones: la API es stateless, cada request se
            // autentica sola con su token. No hay cookie de sesión que proteger.
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                    // Todo lo de /api/admin/** exige un token con rol Admin.
                    .requestMatchers("/api/admin/**").hasRole("Admin")

                    .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/uploads/**").permitAll()

                    .requestMatchers("/actuator/health").permitAll()
                    // El resto (catálogo público, login) queda abierto.
                    .anyRequest().permitAll())
            .oauth2ResourceServer(oauth -> oauth
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))

                    // Token ausente/inválido -> 401; token válido pero sin permiso -> 403.
                    // Devolvemos solo el status, sin la página de login HTML de Spring.
                    .authenticationEntryPoint((req, res, ex) -> res.setStatus(HttpStatus.UNAUTHORIZED.value()))
                    .accessDeniedHandler((req, res, ex) -> res.setStatus(HttpStatus.FORBIDDEN.value())))
            .exceptionHandling(e -> e
                    .authenticationEntryPoint((req, res, ex) -> res.setStatus(HttpStatus.UNAUTHORIZED.value()))
                    .accessDeniedHandler((req, res, ex) -> res.setStatus(HttpStatus.FORBIDDEN.value())))

            // El filtro de rate limit corre ANTES de la cadena de autenticación,
            // así frena el login por fuerza bruta sin gastar en validar credenciales.
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
