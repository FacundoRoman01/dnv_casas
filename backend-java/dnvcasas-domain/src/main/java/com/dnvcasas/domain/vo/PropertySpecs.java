package com.dnvcasas.domain.vo;

import com.dnvcasas.domain.exception.DomainException;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.math.BigDecimal;
import java.util.Objects;

/**
 * Value Object con las características físicas de la propiedad: dormitorios, baños,
 * capacidad, superficie y tamaño del terreno.
 *
 * Igual que {@link Money}, es {@code @Embeddable} (sus columnas van embebidas en la
 * tabla Properties), inmutable y {@code final}. Valida en el constructor que las
 * cantidades no sean negativas: no puede existir un PropertySpecs inválido.
 */
@Embeddable
public final class PropertySpecs {

    @Column(name = "Bedrooms", nullable = false)
    private int bedrooms;

    @Column(name = "Bathrooms", nullable = false)
    private int bathrooms;

    @Column(name = "Capacity", nullable = false)
    private int capacity;

    @Column(name = "SquareMeters", precision = 10, scale = 2)
    private BigDecimal squareMeters;

    @Column(name = "LandSize", length = 50)
    private String landSize;

    // Constructor sin argumentos exigido por JPA/Hibernate. No usar desde el código.
    protected PropertySpecs() { }

    public PropertySpecs(int bedrooms, int bathrooms, int capacity,
                         BigDecimal squareMeters, String landSize) {
        // Invariantes: ninguna cantidad puede ser negativa.
        if (bedrooms < 0)  throw new DomainException("Dormitorios no puede ser negativo");
        if (bathrooms < 0) throw new DomainException("Baños no puede ser negativo");
        if (capacity < 0)  throw new DomainException("Capacidad no puede ser negativa");
        this.bedrooms = bedrooms;
        this.bathrooms = bathrooms;
        this.capacity = capacity;
        this.squareMeters = squareMeters;
        this.landSize = landSize == null ? "" : landSize;
    }

    public int getBedrooms()           { return bedrooms; }
    public int getBathrooms()          { return bathrooms; }
    public int getCapacity()           { return capacity; }
    public BigDecimal getSquareMeters(){ return squareMeters; }
    public String getLandSize()        { return landSize; }

    // Value Object: igualdad por valor (mismos atributos = iguales). Ver la nota
    // sobre numericEquals/compareTo en Money: aplica el mismo criterio para squareMeters.
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PropertySpecs other)) return false;
        return bedrooms == other.bedrooms
            && bathrooms == other.bathrooms
            && capacity == other.capacity
            && numericEquals(squareMeters, other.squareMeters)
            && Objects.equals(landSize, other.landSize);
    }

    private static boolean numericEquals(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) return a == b;
        return a.compareTo(b) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(bedrooms, bathrooms, capacity,
                squareMeters == null ? null : squareMeters.stripTrailingZeros(), landSize);
    }

    @Override
    public String toString() {
        return "PropertySpecs[bedrooms=" + bedrooms + ", bathrooms=" + bathrooms
             + ", capacity=" + capacity + ", squareMeters=" + squareMeters
             + ", landSize=" + landSize + "]";
    }
}
