package com.dnvcasas.domain.vo;

import com.dnvcasas.domain.exception.DomainException;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;
import java.util.Objects;

/**
 * Value Object del precio. Junta el monto, la moneda y una etiqueta legible.
 *
 * Es {@code @Embeddable}: no es una tabla propia, sus columnas viven embebidas en
 * la tabla Properties (ver los @Column). Es inmutable y {@code final}, y no tiene
 * setters: se crea con los métodos de fábrica {@link #consult()} y {@link #from}.
 *
 * El precio puede NO existir: una propiedad de intercambio no tiene monto, y ahí se
 * usa {@link #consult()} ("A consultar", monto null). Por eso {@code amount} admite
 * null y todo el resto del código lo contempla.
 */
@Embeddable
public final class Money {

    @Column(name = "Price", precision = 10, scale = 2)
    private BigDecimal amount;   // null = "no tiene precio" (a consultar)

    @Column(name = "Currency", length = 3, nullable = false)
    private String currency;     // código ISO de 3 letras, ej "ARS", "USD"

    @Column(name = "PriceLabel", length = 50, nullable = false)
    private String label;        // texto para mostrar, ej "A consultar"

    // Constructor sin argumentos que exige JPA/Hibernate para reconstruir el
    // objeto desde la base. protected para que nadie lo use desde el código.
    protected Money() { }

    // Privado: se fuerza a crear Money solo por los métodos de fábrica de abajo,
    // que son más expresivos y garantizan que la invariante se valide siempre.
    private Money(BigDecimal amount, String currency, String label) {
        if (amount != null && amount.signum() < 0)
            throw new DomainException("El precio no puede ser negativo");
        this.amount = amount;
        this.currency = currency;
        this.label = label;
    }

    /** Precio "a consultar": sin monto. Se usa para intercambios o cuando no hay precio. */
    public static Money consult() {
        return new Money(null, "ARS", "A consultar");
    }

    /** Precio concreto con monto, moneda y etiqueta. */
    public static Money from(BigDecimal amount, String currency, String label) {
        return new Money(amount, currency, label);
    }

    public BigDecimal getAmount()  { return amount; }
    public String getCurrency()    { return currency; }
    public String getLabel()       { return label; }

    // Al ser un Value Object, dos Money son iguales si tienen el mismo valor
    // (no importa que sean instancias distintas). Por eso redefinimos equals/hashCode.
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money other)) return false;
        return numericEquals(amount, other.amount)
            && Objects.equals(currency, other.currency)
            && Objects.equals(label, other.label);
    }

    // Comparamos montos con compareTo, NO con equals: en BigDecimal, 10.0 y 10.00
    // son equals() distintos (distinta escala) pero compareTo() los da iguales.
    // Para plata queremos que 10.0 == 10.00.
    private static boolean numericEquals(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) return a == b;
        return a.compareTo(b) == 0;
    }

    @Override
    public int hashCode() {
        // stripTrailingZeros por el mismo motivo: 10.0 y 10.00 deben dar el mismo
        // hash para ser coherentes con equals (dos objetos iguales -> mismo hash).
        return Objects.hash(amount == null ? null : amount.stripTrailingZeros(), currency, label);
    }

    @Override
    public String toString() {
        return "Money[amount=" + amount + ", currency=" + currency + ", label=" + label + "]";
    }
}
