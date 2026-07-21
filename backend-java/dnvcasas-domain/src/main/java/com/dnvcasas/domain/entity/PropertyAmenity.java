package com.dnvcasas.domain.entity;

import jakarta.persistence.*;

/**
 * Una comodidad (amenity) de una propiedad: wifi, pileta, cochera, etc.
 * Guarda solo una "clave" (amenityKey) que el frontend traduce a texto/ícono.
 *
 * Es hija de {@link Property}: se crea y borra a través de
 * {@code Property.replaceAmenities(...)}, no por su cuenta. Por eso los setters
 * son de paquete (package-private): solo Property, que vive en el mismo paquete,
 * puede usarlos.
 */
@Entity
@Table(name = "PropertyAmenities")
public class PropertyAmenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private int id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "PropertyId", nullable = false)
    private Property property;

    @Column(name = "AmenityKey", length = 50, nullable = false)
    private String amenityKey = "";

    public int getId()            { return id; }
    public Property getProperty() { return property; }
    public String getAmenityKey() { return amenityKey; }

    void setProperty(Property property) { this.property = property; }
    void setAmenityKey(String key)      { this.amenityKey = key; }
}
