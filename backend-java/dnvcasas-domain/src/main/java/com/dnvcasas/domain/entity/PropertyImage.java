package com.dnvcasas.domain.entity;

import jakarta.persistence.*;
import java.util.List;

/**
 * Una imagen de una propiedad. Guarda la URL, el orden en que se muestra
 * (displayOrder) y si es la portada (isCover).
 *
 * Regla del catálogo: la imagen en la posición 0 es la portada. La lógica de
 * ordenar y decidir la portada está en {@link #reorder} / {@link #placeAt},
 * no desperdigada en los services.
 */
@Entity
@Table(name = "PropertyImages")
public class PropertyImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    private int id;

    @Column(name = "PropertyId", nullable = false)
    private int propertyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PropertyId", insertable = false, updatable = false)
    private Property property;

    @Column(name = "Url", length = 500, nullable = false)
    private String url = "";

    @Column(name = "DisplayOrder", nullable = false)
    private int displayOrder;

    @Column(name = "IsCover", nullable = false)
    private boolean isCover;

    protected PropertyImage() { }  // requerido por JPA

    /**
     * Crea una imagen recién subida. Arranca al final (displayOrder = 999, un valor
     * alto a propósito para que quede última) y sin ser portada. El orden real se
     * fija después con {@link #reorder}.
     */
    public static PropertyImage uploaded(int propertyId, String url) {
        PropertyImage img = new PropertyImage();
        img.propertyId = propertyId;
        img.url = url;
        img.displayOrder = 999;
        img.isCover = false;
        return img;
    }

    /**
     * Reordena la lista de imágenes según el orden de ids que manda el admin.
     * A la imagen cuyo id está en la posición i de {@code orderedIds} se le asigna
     * displayOrder = i. La primera (posición 0) queda como portada.
     *
     * @param images     todas las imágenes de la propiedad
     * @param orderedIds los ids en el orden deseado
     */
    public static void reorder(List<PropertyImage> images, List<Integer> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            // index debe ser final para poder usarlo dentro de la lambda de abajo.
            final int index = i;
            images.stream()
                    .filter(img -> img.id == orderedIds.get(index))  // busco la imagen de este id
                    .findFirst()
                    .ifPresent(img -> img.placeAt(index));           // y la ubico en la posición
        }
    }

    // Coloca la imagen en una posición: fija su orden y marca portada si es la 0.
    private void placeAt(int index) {
        this.displayOrder = index;
        this.isCover = (index == 0);
    }

    public int getId()             { return id; }
    public int getPropertyId()     { return propertyId; }
    public String getUrl()         { return url; }
    public int getDisplayOrder()   { return displayOrder; }
    public boolean isCover()       { return isCover; }
}
