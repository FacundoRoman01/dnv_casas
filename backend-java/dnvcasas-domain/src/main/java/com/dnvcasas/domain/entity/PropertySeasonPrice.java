package com.dnvcasas.domain.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Precio por temporada de una propiedad: una etiqueta (ej "Verano"), un precio por
 * noche y el rango de fechas [dateFrom, dateTo] en que aplica.
 *
 * Hija de {@link Property}: se administra vía {@code Property.replaceSeasonPrices(...)},
 * que además valida que las temporadas no se solapen. Setters de paquete.
 */
@Entity
@Table(name = "PropertySeasonPrices")
public class PropertySeasonPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private int id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "PropertyId", nullable = false)
    private Property property;

    @Column(name = "Label", length = 100, nullable = false)
    private String label = "";

    @Column(name = "PricePerNight", precision = 10, scale = 2, nullable = false)
    private BigDecimal pricePerNight;

    @Column(name = "DateFrom", nullable = false)
    private LocalDate dateFrom;

    @Column(name = "DateTo", nullable = false)
    private LocalDate dateTo;

    public int getId()                    { return id; }
    public Property getProperty()         { return property; }
    public String getLabel()              { return label; }
    public BigDecimal getPricePerNight()  { return pricePerNight; }
    public LocalDate getDateFrom()        { return dateFrom; }
    public LocalDate getDateTo()          { return dateTo; }

    void setProperty(Property property)  { this.property = property; }
    void setLabel(String label)          { this.label = label; }
    void setPricePerNight(BigDecimal p)  { this.pricePerNight = p; }
    void setDateFrom(LocalDate dateFrom) { this.dateFrom = dateFrom; }
    void setDateTo(LocalDate dateTo)     { this.dateTo = dateTo; }
}
