package com.dnvcasas.api.security;

import com.dnvcasas.api.config.SecurityConfig;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * ClockSkewTest: verifica la validación de JWT del SecurityConfig.
 *
 * El foco es replicar la tolerancia de reloj ("clock skew") de 5 minutos que
 * tenía el .NET: un token vencido hace poco (dentro de esos 5 min) todavía se
 * acepta, para cubrir diferencias de reloj entre servidores. También chequea que
 * se rechacen tokens con firma inválida, issuer o audience equivocados, y que la
 * app no arranque con una clave demasiado corta.
 *
 * Arma los tokens a mano (con Nimbus) para poder falsear la fecha de expiración.
 */
class ClockSkewTest {

    private static final String KEY = "una_clave_de_prueba_de_al_menos_32_caracteres_1234";
    private static final String ISSUER = "DnvCasas";
    private static final String AUDIENCE = "DnvCasas";

    private final JwtDecoder decoder = new SecurityConfig(KEY, ISSUER, AUDIENCE).jwtDecoder();

    // Genera un JWT firmado válido cuya expiración está a expOffsetSegundos de
    // AHORA (positivo = a futuro/vigente; negativo = ya vencido).
    private static String token(long expOffsetSegundos) throws Exception {
        Instant ahora = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .claim("email", "admin@dnvcasas.com")
                .claim("role", "Admin")
                .issuer(ISSUER)
                .audience(AUDIENCE)
                .issueTime(Date.from(ahora.minus(1, ChronoUnit.HOURS)))
                .notBeforeTime(Date.from(ahora.minus(1, ChronoUnit.HOURS)))
                .expirationTime(Date.from(ahora.plusSeconds(expOffsetSegundos)))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(KEY.getBytes(StandardCharsets.UTF_8)));
        return jwt.serialize();
    }

    // Caso feliz: token vigente (expira en 1h) se decodifica y trae sus claims.
    @Test
    @DisplayName("un token válido se acepta")
    void tokenValido() throws Exception {
        assertThat(decoder.decode(token(3600)).getClaimAsString("email"))
                .isEqualTo("admin@dnvcasas.com");
    }

    // Vencido hace 4 min: entra dentro de la tolerancia de 5 -> se acepta igual.
    @Test
    @DisplayName("vencido hace 4 min: DENTRO del skew de 5 — se acepta, igual que el .NET")
    void vencidoDentroDelSkew() throws Exception {

        assertThat(decoder.decode(token(-240)).getSubject()).isNull();
    }

    // Vencido hace 6 min: pasa la tolerancia de 5 -> se rechaza.
    @Test
    @DisplayName("vencido hace 6 min: FUERA del skew — se rechaza, igual que el .NET")
    void vencidoFueraDelSkew() throws Exception {
        String t = token(-360);
        assertThatThrownBy(() -> decoder.decode(t)).isInstanceOf(JwtException.class);
    }

    // Firma con otra clave (token falsificado) -> se rechaza.
    @Test
    @DisplayName("un token firmado con otra clave se rechaza")
    void firmaInvalida() throws Exception {
        Instant ahora = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .claim("role", "Admin").issuer(ISSUER).audience(AUDIENCE)
                .expirationTime(Date.from(ahora.plusSeconds(3600)))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner("otra_clave_distinta_de_al_menos_32_caracteres".getBytes(StandardCharsets.UTF_8)));
        String t = jwt.serialize();

        assertThatThrownBy(() -> decoder.decode(t)).isInstanceOf(JwtException.class);
    }

    // Token de otro emisor (issuer) -> se rechaza aunque la firma sea válida.
    @Test
    @DisplayName("un issuer distinto se rechaza")
    void issuerInvalido() throws Exception {
        Instant ahora = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .claim("role", "Admin").issuer("OtroSitio").audience(AUDIENCE)
                .expirationTime(Date.from(ahora.plusSeconds(3600)))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(KEY.getBytes(StandardCharsets.UTF_8)));
        String t = jwt.serialize();

        assertThatThrownBy(() -> decoder.decode(t)).isInstanceOf(JwtException.class);
    }

    // Token destinado a otra audiencia (aud) -> se rechaza.
    @Test
    @DisplayName("una audiencia distinta se rechaza")
    void audienciaInvalida() throws Exception {
        Instant ahora = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .claim("role", "Admin").issuer(ISSUER).audience("OtraApp")
                .expirationTime(Date.from(ahora.plusSeconds(3600)))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(KEY.getBytes(StandardCharsets.UTF_8)));
        String t = jwt.serialize();

        assertThatThrownBy(() -> decoder.decode(t)).isInstanceOf(JwtException.class);
    }

    // Guardarraíl de arranque: construir SecurityConfig con clave corta explota.
    @Test
    @DisplayName("una clave de menos de 32 caracteres no deja arrancar la app")
    void claveCorta() {
        assertThatThrownBy(() -> new SecurityConfig("corta", ISSUER, AUDIENCE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32");
    }
}
