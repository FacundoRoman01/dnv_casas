package com.dnvcasas.domain.entity;

import com.dnvcasas.domain.enums.PropertyCategory;
import com.dnvcasas.domain.enums.PropertyStatus;
import com.dnvcasas.domain.enums.PropertyType;
import com.dnvcasas.domain.exception.DomainException;
import com.dnvcasas.domain.vo.DateRange;
import com.dnvcasas.domain.vo.Money;
import com.dnvcasas.domain.vo.PropertySpecs;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Aggregate root del catálogo: la pieza central del dominio. Una propiedad (casa,
 * depto, cabaña...) que se alquila, intercambia o vende.
 *
 * Punto clave para un junior: esta clase NO tiene setters públicos. No se modifica
 * "seteando campos desde afuera", sino a través de sus métodos de negocio
 * ({@link #create}, {@link #update}, {@link #feature()}, {@link #pause()},
 * {@link #replaceSeasonPrices}...). Cada uno valida las reglas antes de cambiar el
 * estado. Así es imposible dejar una propiedad en un estado inválido: las reglas
 * viven acá adentro, no desperdigadas por los services.
 *
 * Cuando una regla se viola, se lanza {@link DomainException}, que la capa api
 * traduce a HTTP 400.
 *
 * Como aggregate root, también es dueña de sus colecciones hijas (imágenes,
 * amenities, precios por temporada, disponibilidad): se guardan y borran en cascada
 * con ella (cascade = ALL, orphanRemoval = true).
 */
@Entity
@Table(name = "Properties")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private int id;

    @Column(name = "Title", length = 200, nullable = false)
    private String title = "";

    @Column(name = "Description", columnDefinition = "longtext", nullable = false)
    private String description = "";

    // Los enums se guardan como número (0,1,2...), no como texto. Es una decisión
    // heredada del backend .NET original: la base ya tenía los enteros. Por eso el
    // orden de los enums es sagrado (ver los comentarios en cada enum).
    @Enumerated(EnumType.ORDINAL)
    @Column(name = "Category", nullable = false)
    private PropertyCategory category;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "PropertyType", nullable = false)
    private PropertyType propertyType = PropertyType.CASA;

    @Column(name = "DestinationId", nullable = false)
    private int destinationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DestinationId", insertable = false, updatable = false)
    private Destination destination;

    @Column(name = "Neighborhood", length = 100, nullable = false)
    private String neighborhood = "";

    @Embedded
    private Money price;

    @Embedded
    private PropertySpecs specs;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "Status", nullable = false)
    private PropertyStatus status = PropertyStatus.ACTIVE;

    @Column(name = "IsFeatured", nullable = false)
    private boolean isFeatured;

    @Column(name = "WhatsAppMessage", columnDefinition = "longtext", nullable = false)
    private String whatsAppMessage = "";

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt;

    // Imágenes ordenadas por displayOrder: la portada (isCover) va primero.
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<PropertyImage> images = new ArrayList<>();

    // El @OrderBy("id ASC") es IMPORTANTE y no es cosmético: el backend .NET original
    // no ordenaba y el orden que devolvía dependía del pageSize de la consulta. Al
    // portar se fijó "por id" para que el JSON salga siempre igual (lo verifica GoldenIT).
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<PropertyAmenity> amenities = new ArrayList<>();

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PropertySeasonPrice> seasonPrices = new ArrayList<>();

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PropertyAvailability> availability = new ArrayList<>();

    // Constructor sin argumentos exigido por JPA. protected: para crear una
    // propiedad se usa la fábrica create(), que valida las reglas.
    protected Property() { }

    /**
     * Fábrica para crear una propiedad nueva. Valida las reglas básicas (título,
     * descripción, precio) antes de construirla, la deja ACTIVE y sella el createdAt.
     *
     * @throws DomainException si el título/descr. faltan o si un intercambio trae precio.
     */
    public static Property create(String title, String description,
                                  PropertyCategory category, PropertyType propertyType,
                                  int destinationId, String neighborhood,
                                  Money price, PropertySpecs specs,
                                  String whatsAppMessage) {
        validar(title, description, category, price);

        Property p = new Property();
        p.title = title.trim();
        p.description = description.trim();
        p.category = category;
        p.propertyType = propertyType;
        p.destinationId = destinationId;
        p.neighborhood = neighborhood == null ? "" : neighborhood;
        p.price = price;
        p.specs = specs;
        p.whatsAppMessage = whatsAppMessage == null ? "" : whatsAppMessage;
        p.status = PropertyStatus.ACTIVE;
        p.isFeatured = false;
        // createdAt siempre en UTC: el contrato JSON con el frontend espera la fecha
        // sin zona horaria, y guardar en UTC evita ambigüedades de horario de verano.
        p.createdAt = LocalDateTime.now(ZoneOffset.UTC);
        return p;
    }

    /**
     * Edita los datos de una propiedad existente. No se puede editar una borrada.
     * @throws DomainException si está DELETED o si los datos violan las reglas.
     */
    public void update(String title, String description, PropertyCategory category,
                       PropertyType propertyType, int destinationId, String neighborhood,
                       Money price, PropertySpecs specs, String whatsAppMessage) {
        if (status == PropertyStatus.DELETED)
            throw new DomainException("No se puede modificar una propiedad eliminada");
        validar(title, description, category, price);

        this.title = title.trim();
        this.description = description.trim();
        this.category = category;
        this.propertyType = propertyType;
        this.destinationId = destinationId;
        this.neighborhood = neighborhood == null ? "" : neighborhood;
        this.price = price;
        this.specs = specs;
        this.whatsAppMessage = whatsAppMessage == null ? "" : whatsAppMessage;
    }

    // --- Métodos de la máquina de estados. Cada uno valida desde qué estado se
    // --- puede hacer la transición. Son la única forma de cambiar status/isFeatured.

    /** Marca la propiedad como destacada. Solo se permite si está ACTIVE. */
    public void feature() {
        if (status != PropertyStatus.ACTIVE)
            throw new DomainException("Solo se pueden destacar propiedades activas");
        isFeatured = true;
    }

    /** Quita el destacado. Sin restricciones: quitar siempre es válido. */
    public void unfeature() {
        isFeatured = false;
    }

    /** Pausa la publicación (queda oculta). Al pausar deja de estar destacada. */
    public void pause() {
        if (status == PropertyStatus.DELETED)
            throw new DomainException("No se puede pausar una propiedad eliminada");
        status = PropertyStatus.PAUSED;
        isFeatured = false;
    }

    /** Reactiva una propiedad pausada. No se puede reactivar una borrada. */
    public void activate() {
        if (status == PropertyStatus.DELETED)
            throw new DomainException("No se puede activar una propiedad eliminada");
        status = PropertyStatus.ACTIVE;
    }

    /** Borrado lógico: marca DELETED (la fila no se elimina) y quita el destacado. */
    public void delete() {
        status = PropertyStatus.DELETED;
        isFeatured = false;
    }

    /**
     * Reemplaza por completo la lista de amenities (comodidades: wifi, pileta...).
     * Borra las que había y agrega las nuevas. Ignora claves vacías o en blanco.
     */
    public void replaceAmenities(Iterable<String> keys) {
        amenities.clear();
        for (String key : keys) {
            if (isBlank(key)) continue;
            PropertyAmenity a = new PropertyAmenity();
            a.setProperty(this);
            a.setAmenityKey(key);
            amenities.add(a);
        }
    }

    /**
     * Reemplaza los precios por temporada. Antes de guardar, valida que ninguna
     * temporada se solape con otra (usando {@link DateRange#overlaps}).
     *
     * El doble for compara cada temporada contra todas las siguientes (todos los
     * pares, sin repetir). Es O(n²), pero n es chico (un puñado de temporadas).
     *
     * @throws DomainException si dos temporadas se pisan en fechas.
     */
    public void replaceSeasonPrices(List<SeasonPriceInput> seasons) {
        for (int i = 0; i < seasons.size(); i++)
            for (int j = i + 1; j < seasons.size(); j++)
                if (seasons.get(i).range().overlaps(seasons.get(j).range()))
                    throw new DomainException("La temporada '" + seasons.get(j).label()
                            + "' se superpone con '" + seasons.get(i).label() + "'");

        seasonPrices.clear();
        for (SeasonPriceInput s : seasons) {
            PropertySeasonPrice sp = new PropertySeasonPrice();
            sp.setProperty(this);
            sp.setLabel(s.label());
            sp.setPricePerNight(s.pricePerNight());
            sp.setDateFrom(s.range().from());
            sp.setDateTo(s.range().to());
            seasonPrices.add(sp);
        }
    }

    /** Reemplaza el calendario de disponibilidad completo por la lista de días dada. */
    public void setAvailability(List<AvailabilityDay> days) {
        availability.clear();
        for (AvailabilityDay d : days) {
            PropertyAvailability a = new PropertyAvailability();
            a.setProperty(this);
            a.setDate(d.date());
            a.setStatus(d.status());
            availability.add(a);
        }
    }

    /**
     * Crea una copia de esta propiedad (funcionalidad "Duplicar" del admin).
     * La copia arranca PAUSED y sin destacar, con "(copia)" en el título y un
     * createdAt nuevo. NO copia las colecciones hijas (imágenes, precios, etc.):
     * solo los datos base; el id queda en 0 para que se genere uno nuevo al guardar.
     *
     * Nota histórica: el bug más grave que tuvo este código fue el botón "Duplicar"
     * devolviendo HTTP 400. Vivía en la costura dominio/persistencia y lo cubre el
     * test WriteFlowIT, no los tests de dominio en memoria.
     */
    public Property duplicate() {
        Property c = new Property();
        c.title = title + " (copia)";
        c.description = description;
        c.category = category;
        c.propertyType = propertyType;
        c.destinationId = destinationId;

        c.destination = destination;
        c.neighborhood = neighborhood;
        c.price = price;
        c.specs = specs;
        c.whatsAppMessage = whatsAppMessage;
        c.status = PropertyStatus.PAUSED;
        c.isFeatured = false;
        c.createdAt = LocalDateTime.now(ZoneOffset.UTC);
        return c;
    }

    // Validaciones comunes a create() y update(). Centralizadas acá para no repetir.
    private static void validar(String title, String description,
                                PropertyCategory category, Money price) {
        if (isBlank(title))
            throw new DomainException("El título es requerido");
        if (title.length() < 3)
            throw new DomainException("El título debe tener al menos 3 caracteres");
        if (isBlank(description))
            throw new DomainException("La descripción es requerida");
        if (category == PropertyCategory.INTERCAMBIO && price.getAmount() != null)
            throw new DomainException("Una propiedad de intercambio no puede tener precio");
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    public int getId()                    { return id; }
    public String getTitle()              { return title; }
    public String getDescription()        { return description; }
    public PropertyCategory getCategory() { return category; }
    public PropertyType getPropertyType() { return propertyType; }
    public int getDestinationId()         { return destinationId; }
    public Destination getDestination()   { return destination; }
    public String getNeighborhood()       { return neighborhood; }
    public PropertyStatus getStatus()     { return status; }
    public boolean isFeatured()           { return isFeatured; }
    public String getWhatsAppMessage()    { return whatsAppMessage; }
    public LocalDateTime getCreatedAt()   { return createdAt; }

    // Si no hay precio guardado, devolvemos "a consultar" en vez de null, así
    // el resto del código nunca tiene que chequear null.
    public Money getPrice() {
        return price != null ? price : Money.consult();
    }

    // Igual que getPrice: specs por defecto en vez de null.
    public PropertySpecs getSpecs() {
        return specs != null ? specs : new PropertySpecs(0, 0, 0, null, "");
    }

    // Las colecciones se devuelven como "solo lectura": nadie de afuera puede
    // agregar/quitar hijos salteándose las reglas. Para modificarlas hay que usar
    // los métodos replace*/setAvailability de arriba. Refuerza el aggregate root.
    public List<PropertyImage> getImages()             { return Collections.unmodifiableList(images); }
    public List<PropertyAmenity> getAmenities()        { return Collections.unmodifiableList(amenities); }
    public List<PropertySeasonPrice> getSeasonPrices() { return Collections.unmodifiableList(seasonPrices); }
    public List<PropertyAvailability> getAvailability(){ return Collections.unmodifiableList(availability); }

    // Records auxiliares para pasar datos a los métodos replace*: son solo
    // "paquetes de datos" inmutables de entrada, no entidades persistidas.
    public record SeasonPriceInput(String label, BigDecimal pricePerNight, DateRange range) { }

    public record AvailabilityDay(LocalDate date, com.dnvcasas.domain.enums.AvailabilityStatus status) { }
}
