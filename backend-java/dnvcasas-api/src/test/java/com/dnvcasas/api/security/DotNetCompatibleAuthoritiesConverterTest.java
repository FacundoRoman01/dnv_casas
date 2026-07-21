package com.dnvcasas.api.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifica el converter que saca los roles del JWT. La invariante que protege:
 * un token emitido por el .NET viejo (que guarda el rol en un claim con nombre
 * de URI larga) tiene que seguir dando el mismo rol que un token nuevo de Java
 * (claim corto "role"). Así los dos backends son intercambiables.
 * También cubre los bordes: sin rol, rol como lista, y rol vacío.
 */
class DotNetCompatibleAuthoritiesConverterTest {

    private static final String CLAIM_DOTNET =
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

    private final DotNetCompatibleAuthoritiesConverter converter =
            new DotNetCompatibleAuthoritiesConverter();

    private static Jwt jwtCon(Map<String, Object> claims) {
        Jwt.Builder b = Jwt.withTokenValue("fake")
                .header("alg", "HS256")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600));
        claims.forEach(b::claim);
        return b.build();
    }

    private static List<String> nombres(Iterable<GrantedAuthority> as) {
        List<String> out = new java.util.ArrayList<>();
        as.forEach(a -> out.add(a.getAuthority()));
        return out;
    }

    // Token estilo .NET: el rol viene en el claim de URI larga -> ROLE_Admin.
    @Test
    @DisplayName("un token del .NET (claim con URI de schema XML) da ROLE_Admin")
    void tokenDelDotNet() {
        var authorities = converter.convert(jwtCon(Map.of(
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "admin@dnvcasas.com",
                CLAIM_DOTNET, "Admin")));

        assertThat(nombres(authorities)).containsExactly("ROLE_Admin");
    }

    // Token estilo Java: rol en el claim corto "role" -> mismo ROLE_Admin.
    @Test
    @DisplayName("un token de Java (claim corto 'role') da ROLE_Admin")
    void tokenDeJava() {
        var authorities = converter.convert(jwtCon(Map.of(
                "email", "admin@dnvcasas.com",
                "role", "Admin")));

        assertThat(nombres(authorities)).containsExactly("ROLE_Admin");
    }

    // Sin claim de rol -> lista vacía de authorities (después Spring devuelve 403).
    @Test
    @DisplayName("sin claim de rol no hay authorities — el endpoint de admin da 403")
    void sinRol() {
        assertThat(converter.convert(jwtCon(Map.of("email", "x@y.com")))).isEmpty();
    }

    // El rol puede venir como lista (varios roles) -> un authority por cada uno.
    @Test
    @DisplayName("el claim también puede venir como lista")
    void rolComoLista() {
        var authorities = converter.convert(jwtCon(Map.of("role", List.of("Admin", "Editor"))));
        assertThat(nombres(authorities)).containsExactly("ROLE_Admin", "ROLE_Editor");
    }

    // Borde: un claim de rol vacío no debe generar un authority "ROLE_" pelado.
    @Test
    @DisplayName("un claim vacío no genera un ROLE_ pelado")
    void rolVacio() {
        assertThat(converter.convert(jwtCon(Map.of("role", "")))).isEmpty();
    }
}
