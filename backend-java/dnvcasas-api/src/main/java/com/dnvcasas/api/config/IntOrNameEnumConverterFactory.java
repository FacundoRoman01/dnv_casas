package com.dnvcasas.api.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;
import org.springframework.lang.NonNull;

/**
 * Convierte los query params de enum que llegan por URL. Acepta DOS formatos:
 * el número (ej. category=0) o el nombre (ej. category=INTERCAMBIO). El frontend
 * suele mandar el número (mismo esquema ordinal que la base), pero se aceptan
 * ambos por compatibilidad. Se registra en WebConfig.addFormatters.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public class IntOrNameEnumConverterFactory implements ConverterFactory<String, Enum> {

    @Override
    @NonNull
    public <T extends Enum> Converter<String, T> getConverter(@NonNull Class<T> targetType) {
        return source -> {
            if (source == null || source.isBlank()) return null;
            T[] values = targetType.getEnumConstants();

            // Caso 1: viene un número -> lo usamos como índice ordinal del enum.
            if (source.chars().allMatch(Character::isDigit)) {
                int index = Integer.parseInt(source);
                if (index < 0 || index >= values.length)
                    throw new IllegalArgumentException("Valor inválido: " + source);
                return values[index];
            }

            // Caso 2: viene texto -> buscamos el enum cuyo name() coincida (sin
            // distinguir mayúsculas/minúsculas).
            for (T value : values)
                if (value.name().equalsIgnoreCase(source)) return value;

            throw new IllegalArgumentException("Valor inválido: " + source);
        };
    }
}
