package com.dnvcasas.infrastructure.security;

import com.dnvcasas.application.port.TokenService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * Adapter de infraestructura que emite los JWT del panel admin. Implementa el port
 * {@link TokenService} que define la capa application: acá vive el DETALLE técnico
 * (la librería Nimbus JOSE, el algoritmo de firma), la capa de arriba solo conoce la
 * interfaz. Así, si mañana cambiamos de librería de JWT, no se toca nada de application.
 *
 * El token que sale de acá tiene que ser aceptado por el mismo backend en cada request
 * siguiente. La validación (firma, issuer, audience, expiración con el clock skew de
 * ~5 min, y el converter que lee el rol tanto de "role" como de la URI de schema del
 * .NET) vive del lado de Spring Security, no en esta clase: esta clase SOLO firma y
 * arma los claims. Por eso lo que se emita acá y lo que se valide allá tienen que
 * coincidir en secreto, issuer y audience.
 */
@Service
public class JwtTokenService implements TokenService {

    // Vida del token: 12 horas. Es el mismo valor que usaba el backend .NET original,
    // se mantiene para no cambiar el comportamiento de las sesiones del admin.
    private static final long EXPIRA_EN_HORAS = 12;

    private final byte[] secret;   // clave secreta compartida para firmar (HMAC)
    private final String issuer;   // quién emite el token (debe coincidir con la validación)
    private final String audience; // para quién es el token (idem)

    /**
     * Lee la configuración del JWT desde application.yml / variables de entorno.
     *
     * @param key      clave secreta para la firma HMAC; se exige >= 32 caracteres.
     * @param issuer   emisor esperado (claim "iss").
     * @param audience audiencia esperada (claim "aud").
     * @throws IllegalStateException si la clave es null o más corta que 32 caracteres.
     */
    public JwtTokenService(@Value("${jwt.key}") String key,
                           @Value("${jwt.issuer}") String issuer,
                           @Value("${jwt.audience}") String audience) {

        // HS256 necesita al menos 256 bits (32 bytes) de clave. Con menos, la firma es
        // débil y algunas implementaciones directamente la rechazan. Fallamos al
        // arrancar antes que emitir tokens inseguros.
        if (key == null || key.length() < 32)
            throw new IllegalStateException(
                    "jwt.key debe tener al menos 32 caracteres (variable de entorno o application.yml).");
        this.secret = key.getBytes(StandardCharsets.UTF_8);
        this.issuer = issuer;
        this.audience = audience;
    }

    /**
     * Genera un JWT firmado para el usuario admin recién logueado.
     *
     * @param email email del admin; se guarda en el claim "email".
     * @return el token serializado (formato compacto header.payload.firma), listo
     *         para devolver al frontend.
     * @throws IllegalStateException si la firma falla.
     */
    @Override
    public String generate(String email) {
        Instant now = Instant.now();
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .claim("email", email)
                    // El único rol del sistema es "Admin". Este claim "role" es el que
                    // hereda del backend .NET; del lado de la validación hay un converter
                    // que acepta el rol tanto desde "role" como desde la URI larga de
                    // schema XML que usaba .NET. Acá lo emitimos con el nombre corto.
                    .claim("role", "Admin")
                    .issuer(issuer)
                    .audience(audience)
                    .issueTime(Date.from(now))
                    // notBefore = ahora: el token no vale "desde antes". Con el clock
                    // skew de ~5 min que tolera la validación, esto no rompe aunque los
                    // relojes de dos máquinas estén levemente desfasados.
                    .notBeforeTime(Date.from(now))
                    .expirationTime(Date.from(now.plus(EXPIRA_EN_HORAS, ChronoUnit.HOURS)))
                    .build();

            // HS256 = firma simétrica con HMAC-SHA256 usando la clave secreta. Es el
            // mismo algoritmo que usaba .NET; cambiarlo invalidaría tokens ya emitidos.
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(secret));
            return jwt.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("No se pudo firmar el token", e);
        }
    }
}
