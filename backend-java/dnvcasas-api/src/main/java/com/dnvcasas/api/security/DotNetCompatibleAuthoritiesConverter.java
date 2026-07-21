package com.dnvcasas.api.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Extrae los roles del JWT y los convierte en authorities de Spring Security.
 *
 * El detalle importante: los tokens que emitía el backend .NET guardan el rol en
 * un claim con un nombre larguísimo (el "schemas.microsoft.com/..."), no en un
 * simple "role". Para que un token viejo de .NET siga funcionando en este backend,
 * miramos LOS DOS nombres de claim. Es parte de mantener el contrato compatible.
 */
public class DotNetCompatibleAuthoritiesConverter
        implements Converter<Jwt, Collection<GrantedAuthority>> {

    // Nombre "corto/moderno" del claim de rol.
    private static final String CLAIM_CORTO = "role";
    // Nombre "largo" que usa ASP.NET Identity para el mismo rol.
    private static final String CLAIM_DOTNET =
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

    // Spring Security espera que los roles vengan con el prefijo "ROLE_"; el
    // hasRole("Admin") de SecurityConfig por dentro busca "ROLE_Admin".
    private static final String PREFIJO = "ROLE_";

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        agregar(authorities, jwt.getClaim(CLAIM_CORTO));
        agregar(authorities, jwt.getClaim(CLAIM_DOTNET));
        return authorities;
    }

    // Un claim de rol puede venir de dos formas: como un string (uno o varios
    // roles separados por espacio) o como una lista. Contemplamos ambas.
    private static void agregar(List<GrantedAuthority> destino, Object claim) {
        if (claim == null) return;
        if (claim instanceof String s) {
            if (!s.isBlank())
                for (String rol : s.split(" "))
                    destino.add(new SimpleGrantedAuthority(PREFIJO + rol));
        } else if (claim instanceof Collection<?> col) {
            for (Object rol : col)
                if (rol != null) destino.add(new SimpleGrantedAuthority(PREFIJO + rol));
        }
    }
}
