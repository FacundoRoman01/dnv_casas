package com.dnvcasas.domain.entity;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Destino: la ubicación/zona a la que pertenece una propiedad (ej. una ciudad o
 * región). Una propiedad apunta a un destino; un destino tiene muchas propiedades
 * (relación uno-a-muchos, ver el campo properties).
 *
 * A diferencia de {@link Property}, es una entidad "anémica" (con setters simples):
 * no tiene reglas de negocio propias, es básicamente datos de catálogo.
 */
@Entity
@Table(name = "Destinations")
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private int id;

    @Column(name = "Name", length = 100, nullable = false)
    private String name = "";

    @Column(name = "Country", length = 100, nullable = false)
    private String country = "";

    @Column(name = "ImageUrl", length = 500, nullable = false)
    private String imageUrl = "";

    @Column(name = "IsActive", nullable = false)
    private boolean isActive = true;

    @OneToMany(mappedBy = "destination")
    private List<Property> properties = new ArrayList<>();

    public int getId()            { return id; }
    public String getName()       { return name; }
    public String getCountry()    { return country; }
    public String getImageUrl()   { return imageUrl; }
    public boolean isActive()     { return isActive; }
    public List<Property> getProperties() { return properties; }

    public void setId(int id)                 { this.id = id; }
    public void setName(String name)          { this.name = name; }
    public void setCountry(String country)    { this.country = country; }
    public void setImageUrl(String imageUrl)  { this.imageUrl = imageUrl; }
    public void setActive(boolean active)     { this.isActive = active; }
}
