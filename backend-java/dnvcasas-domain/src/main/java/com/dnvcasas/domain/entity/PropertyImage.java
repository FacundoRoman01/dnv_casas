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
     * Crea una imagen recién subida, ubicándola al final de la lista actual.
     *
     * BUGFIX: antes esto hardcodeaba displayOrder = 999 para TODAS las fotos
     * nuevas. Si nadie usaba el drag & drop para reordenar manualmente (caso
     * común: alguien sube 10 fotos y nunca las reordena), todas quedaban
     * empatadas en 999. Con el empate, MySQL no garantiza qué fila devuelve
     * primero al ordenar por displayOrder — así que la portada (que cae a la
     * de menor displayOrder cuando ninguna es isCover) podía terminar siendo
     * cualquiera, incluida la última subida, en vez de la primera como se
     * esperaba visualmente.
     *
     * Ahora quien llama pasa `cantidadActual` (cuántas fotos tiene ya la
     * propiedad, ANTES de esta) y esa pasa a ser el displayOrder de la nueva:
     * la 1ª foto entra en 0, la 2ª en 1, la 3ª en 2, etc. Nunca hay empates
     * entre fotos nuevas, y el orden de subida se respeta desde el primer
     * momento — sin depender de que alguien reordene a mano. El drag & drop
     * (reorder/placeAt) sigue pudiendo cambiar el orden después, sin cambios.
     *
     * @param propertyId     id de la propiedad dueña de la imagen.
     * @param url            URL final de la imagen (Cloudinary o local).
     * @param cantidadActual cuántas imágenes tiene la propiedad antes de sumar esta.
     */
    public static PropertyImage uploaded(int propertyId, String url, long cantidadActual) {
        PropertyImage img = new PropertyImage();
        img.propertyId = propertyId;
        img.url = url;
        img.displayOrder = (int) cantidadActual;
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