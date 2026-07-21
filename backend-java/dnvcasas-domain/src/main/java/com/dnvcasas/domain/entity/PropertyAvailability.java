package com.dnvcasas.domain.entity;

import com.dnvcasas.domain.enums.AvailabilityStatus;
import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Un día del calendario de disponibilidad de una propiedad: fecha + estado
 * ({@link AvailabilityStatus}). Un registro = un día.
 *
 * Hija de {@link Property}: se administra vía {@code Property.setAvailability(...)}.
 * Setters de paquete (solo Property los usa).
 */
@Entity
@Table(name = "PropertyAvailabilities")
public class PropertyAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private int id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "PropertyId", nullable = false)
    private Property property;

    @Column(name = "Date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "Status", nullable = false)
    private AvailabilityStatus status;

    public int getId()                    { return id; }
    public Property getProperty()         { return property; }
    public LocalDate getDate()            { return date; }
    public AvailabilityStatus getStatus() { return status; }

    void setProperty(Property property)       { this.property = property; }
    void setDate(LocalDate date)              { this.date = date; }
    void setStatus(AvailabilityStatus status) { this.status = status; }
}
