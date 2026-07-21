package com.dnvcasas.api.config;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;

/**
 * Configuración de Jackson (la librería que convierte objetos Java <-> JSON).
 *
 * Todo lo de acá existe para que el JSON salga IDÉNTICO al del backend .NET
 * original (System.Text.Json, de ahí el prefijo "Stj"). El contrato REST se
 * mantiene byte a byte, y eso lo verifican GoldenIT y los tests de contrato.
 */
@Configuration
public class JacksonConfig {

    // Formato de fecha que imitaba .NET: "yyyy-MM-ddTHH:mm:ss" con hasta 7
    // decimales de segundo, SIN la "Z" del final ni offset de zona. Un formatter
    // estándar de Java pondría la Z; por eso se arma a mano.
    private static final DateTimeFormatter STJ_DATETIME = new DateTimeFormatterBuilder()
            .appendPattern("yyyy-MM-dd'T'HH:mm:ss")
            .appendFraction(ChronoField.NANO_OF_SECOND, 0, 7, true)
            .toFormatter();

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer dotnetCompatibleJson() {
        return builder -> {
            SimpleModule module = new SimpleModule();
            module.addSerializer(LocalDateTime.class, new StjLocalDateTimeSerializer());
            builder.modules(new JavaTimeModule(), module);

            builder.featuresToEnable(

                    // El precio se escribe como número plano (12500.00) y no en
                    // notación científica (1.25E4), que es lo que haría por defecto.
                    com.fasterxml.jackson.databind.SerializationFeature.WRITE_BIGDECIMAL_AS_PLAIN,

                    // Los enums salen como su índice numérico (0,1,2...), NO como
                    // texto. Coincide con cómo se guardan en la base (EnumType.ORDINAL).
                    com.fasterxml.jackson.databind.SerializationFeature.WRITE_ENUMS_USING_INDEX);
            builder.featuresToDisable(
                    // Las fechas van como string con formato, no como timestamp numérico.
                    com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        };
    }

    // Serializador propio que aplica el formato STJ_DATETIME a cada LocalDateTime.
    private static final class StjLocalDateTimeSerializer extends JsonSerializer<LocalDateTime> {
        @Override
        public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider serializers)
                throws IOException {
            gen.writeString(STJ_DATETIME.format(value));
        }
    }
}
