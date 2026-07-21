package com.dnvcasas.api.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;
import java.util.List;

/**
 * Configuración web transversal (Spring MVC). Junta cuatro cosas:
 *  - servir los archivos subidos (imágenes) desde el disco como URLs estáticas,
 *  - registrar el converter de enums que acepta número o nombre en la URL,
 *  - forzar que las respuestas JSON salgan en UTF-8 (tildes, ñ),
 *  - habilitar CORS para que el frontend (otro puerto) pueda pegarle a la API.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final String frontendUrl;
    private final String uploadsPath;
    private final String uploadsUrl;

    public WebConfig(@Value("${frontend.url:http://localhost:5173}") String frontendUrl,
                     @Value("${uploads.physical-path:}") String uploadsPath,
                     @Value("${uploads.url-path:/uploads}") String uploadsUrl) {
        this.frontendUrl = frontendUrl;
        this.uploadsPath = uploadsPath;
        this.uploadsUrl = uploadsUrl;
    }

    // Mapea la URL /uploads/** a una carpeta física del disco. Si no se configuró
    // una ruta, usa <directorio-de-trabajo>/wwwroot/uploads (igual que el .NET).
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String dir = (uploadsPath == null || uploadsPath.isBlank())
                ? Paths.get(System.getProperty("user.dir"), "wwwroot", "uploads").toString()
                : uploadsPath;
        registry.addResourceHandler(uploadsUrl + "/**")
                .addResourceLocations(Paths.get(dir).toUri().toString());
    }

    @Override
    public void addFormatters(@NonNull FormatterRegistry registry) {
        registry.addConverterFactory(new IntOrNameEnumConverterFactory());
    }

    @Override
    public void extendMessageConverters(@NonNull List<HttpMessageConverter<?>> converters) {
        var utf8 = java.nio.charset.StandardCharsets.UTF_8;
        for (HttpMessageConverter<?> converter : converters)
            if (converter instanceof MappingJackson2HttpMessageConverter jackson)
                jackson.setSupportedMediaTypes(List.of(
                        new MediaType("application", "json", utf8),
                        new MediaType("application", "problem+json", utf8),
                        new MediaType("application", "*+json", utf8)));
    }

    // CORS: permite que el frontend (que corre en otro origen/puerto) haga
    // requests a la API desde el navegador. La URL del front es configurable;
    // los localhost extra son para levantar varias instancias de Vite en dev.
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(frontendUrl, "http://localhost:5174", "http://localhost:5175")
                .allowedHeaders("*")
                .allowedMethods("*");
    }
}
