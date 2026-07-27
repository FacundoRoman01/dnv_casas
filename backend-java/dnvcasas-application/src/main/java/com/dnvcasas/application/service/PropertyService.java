package com.dnvcasas.application.service;

import com.dnvcasas.application.dto.*;
import com.dnvcasas.application.dto.CreateUpdatePropertyDto.UpdateAvailabilityDto;
import com.dnvcasas.application.dto.PropertyDto.PropertyAvailabilityDto;
import com.dnvcasas.application.dto.PropertyDto.PropertyImageDto;
import com.dnvcasas.application.dto.PropertyDto.PropertySeasonPriceDto;
import com.dnvcasas.application.port.PropertyRepository;
import com.dnvcasas.domain.entity.Property;
import com.dnvcasas.domain.entity.PropertyImage;
import com.dnvcasas.domain.enums.PropertyStatus;
import com.dnvcasas.domain.vo.DateRange;
import com.dnvcasas.domain.vo.Money;
import com.dnvcasas.domain.vo.PropertySpecs;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Service central de la capa de aplicación: orquesta todos los casos de uso del catálogo
 * de propiedades (listar, ver detalle, crear, editar, cambiar estado, destacar, duplicar,
 * borrar, disponibilidad). Coordina el aggregate root de dominio {@link Property} con el
 * puerto {@link PropertyRepository}, y traduce en ambos sentidos entre DTOs (contrato de la
 * API) y objetos de dominio.
 *
 * Regla importante para un junior: este service NO valida reglas de negocio a mano ni setea
 * campos de la propiedad; delega en los métodos del dominio ({@code Property.create/update/
 * feature/pause/...}), que son los que validan las invariantes y lanzan DomainException. Acá
 * solo armamos los value objects que esos métodos piden y encadenamos los pasos.
 */
@Service
public class PropertyService {

    // Topes de paginado: el frontend puede pedir cualquier pageSize, pero lo acotamos a
    // [1, 100] para no permitir traer la base entera de una.
    private static final int MAX_PAGE_SIZE = 100;
    private static final int MIN_PAGE_SIZE = 1;

    private final PropertyRepository repo;

    public PropertyService(PropertyRepository repo) {
        this.repo = repo;
    }

    /**
     * Listado público con filtros y paginado. Normaliza page/pageSize a rangos válidos,
     * consulta el repositorio y mapea cada propiedad a su DTO reducido de listado.
     * @return la página de items (como {@link PropertyListItemDto}) más total/page/pageSize.
     */
    public PagedResult<PropertyListItemDto> getAll(PropertyFilter filter) {

        int page = normalizarPage(filter.page());
        int pageSize = normalizarPageSize(filter.pageSize());

        // Reconstruimos el filtro con page/pageSize ya acotados. PropertyFilter es un record
        // inmutable, así que no se "setea": se crea uno nuevo copiando el resto de los campos.
        PropertyFilter normalizado = new PropertyFilter(
                filter.category(), filter.destinationId(), filter.neighborhood(),
                filter.dateFrom(), filter.dateTo(), filter.guests(), filter.bedrooms(),
                filter.maxPrice(), filter.propertyType(), filter.featured(),
                page, pageSize, filter.sortBy());

        PropertyRepository.PageResult result = repo.findAll(normalizado);
        return new PagedResult<>(
                result.items().stream().map(PropertyService::toListItem).toList(),
                result.total(), page, pageSize);
    }

    /**
     * Listado del panel admin (sin filtros de negocio; incluye pausadas/borradas).
     * @return la página pedida como DTOs de listado, más total/page/pageSize normalizados.
     */
    public PagedResult<PropertyListItemDto> getAllAdmin(int page, int pageSize) {
        int p = normalizarPage(page);
        int ps = normalizarPageSize(pageSize);
        PropertyRepository.PageResult result = repo.findAllAdmin(p, ps);
        return new PagedResult<>(
                result.items().stream().map(PropertyService::toListItem).toList(),
                result.total(), p, ps);
    }

    // page mínimo 1: la paginación arranca en 1, no en 0.
    private static int normalizarPage(int page) {
        return Math.max(page, 1);
    }

    // Deja el pageSize dentro de [MIN_PAGE_SIZE, MAX_PAGE_SIZE] (recorta valores fuera de rango).
    private static int normalizarPageSize(int pageSize) {
        return Math.min(Math.max(pageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE);
    }

    /**
     * Trae el detalle completo de una propiedad por id.
     * @return el {@link PropertyDto} completo, o vacío si no existe.
     */
    public Optional<PropertyDto> getById(int id) {
        return repo.findById(id).map(PropertyService::toDto);
    }

    /**
     * Lista los barrios existentes, opcionalmente acotados a un destino.
     * @param destinationId destino para filtrar, o null para todos.
     */
    public List<String> getNeighborhoods(Integer destinationId) {
        return repo.findNeighborhoods(destinationId);
    }

    /**
     * Crea una propiedad nueva. Delega la construcción y validación en {@code Property.create}
     * (que lanza DomainException si algo viola las reglas), le agrega amenities y precios por
     * temporada, y la persiste.
     * @return el detalle de la propiedad creada como DTO.
     */
    public PropertyDto create(CreateUpdatePropertyDto dto) {
        Property property = Property.create(
                dto.title(), dto.description(), dto.category(), dto.propertyType(),
                dto.destinationId(), dto.neighborhood(),
                money(dto), specs(dto), dto.whatsAppMessage());

        property.replaceAmenities(dto.amenities() == null ? List.of() : dto.amenities());
        property.replaceSeasonPrices(seasons(dto));

        return toDto(repo.create(property));
    }

    /**
     * Edita una propiedad existente. Si no existe, no hace nada. Reemplaza también amenities
     * y precios por temporada (el update de esas colecciones es "reemplazo total", no merge).
     * @return el detalle actualizado como DTO, o vacío si no había propiedad con ese id.
     */
    public Optional<PropertyDto> update(int id, CreateUpdatePropertyDto dto) {
        return repo.findById(id).map(entity -> {
            entity.update(dto.title(), dto.description(), dto.category(), dto.propertyType(),
                    dto.destinationId(), dto.neighborhood(),
                    money(dto), specs(dto), dto.whatsAppMessage());
            entity.replaceAmenities(dto.amenities() == null ? List.of() : dto.amenities());
            entity.replaceSeasonPrices(seasons(dto));
            repo.update(entity);
            return toDto(entity);
        });
    }

    /**
     * Cambia el estado de publicación de una propiedad: ACTIVE la reactiva, cualquier otro
     * valor la pausa. La transición la valida el dominio (activate/pause lanzan si está borrada).
     * @return true si existía y se actualizó, false si no había propiedad con ese id.
     */
     @Transactional
    public boolean updateStatus(int id, PropertyStatus status) {
        return repo.findById(id).map(entity -> {
            // Solo ACTIVE reactiva; el resto de los estados se traducen a "pausar".
            if (status == PropertyStatus.ACTIVE) entity.activate();
            else entity.pause();
            repo.update(entity);
            return true;
        }).orElse(false);
    }

    /**
     * Destaca o quita el destacado de una propiedad. Destacar solo se permite si está ACTIVE
     * (lo controla {@code Property.feature}); quitar siempre es válido.
     * @return true si existía y se actualizó, false si no había propiedad con ese id.
     */
    @Transactional
    public boolean setFeatured(int id, boolean featured) {
        return repo.findById(id).map(entity -> {
            if (featured) entity.feature();
            else entity.unfeature();
            repo.update(entity);
            return true;
        }).orElse(false);
    }

    /**
     * Duplica una propiedad (funcionalidad "Duplicar" del admin). El dominio hace la copia
     * base (arranca PAUSED, título con "(copia)") pero NO copia las colecciones hijas; por eso
     * acá le volvemos a cargar a mano amenities y precios por temporada desde el original.
     * @return el detalle de la copia recién creada, o vacío si el original no existe.
     */
    @Transactional
    public Optional<PropertyDto> duplicate(int id) {
        return repo.findById(id).map(original -> {
            Property copy = original.duplicate();
            // duplicate() del dominio no arrastra hijos: los reponemos desde el original.
            copy.replaceAmenities(original.getAmenities().stream().map(a -> a.getAmenityKey()).toList());
            copy.replaceSeasonPrices(original.getSeasonPrices().stream()
                    .map(s -> new Property.SeasonPriceInput(s.getLabel(), s.getPricePerNight(),
                            new DateRange(s.getDateFrom(), s.getDateTo())))
                    .toList());
            return toDto(repo.create(copy));
        });
    }

    /**
     * Borrado lógico de una propiedad (marca DELETED, no elimina la fila).
     * @return true si existía y se borró, false si no había propiedad con ese id.
     */
    @Transactional
    public boolean delete(int id) {
        return repo.findById(id).map(entity -> {
            entity.delete();
            repo.update(entity);
            return true;
        }).orElse(false);
    }

    /**
     * Reemplaza por completo el calendario de disponibilidad de una propiedad.
     * @return true si existía y se actualizó, false si no había propiedad con ese id.
     */
@Transactional
public boolean updateAvailability(int id, UpdateAvailabilityDto dto) {
    return repo.findById(id).map(entity -> {
        entity.setAvailability(dto.days().stream()
                .map(d -> new Property.AvailabilityDay(d.date(), d.status()))
                .toList());
        repo.update(entity);
        return true;
    }).orElse(false);
}

    // Arma el value object Money desde el DTO. Defaults heredados del contrato .NET:
    // moneda "ARS" si no viene, y etiqueta "" si no viene (no null).
    @Transactional
    private static Money money(CreateUpdatePropertyDto dto) {
        return Money.from(dto.price(),
                dto.currency() == null ? "ARS" : dto.currency(),
                dto.priceLabel() == null ? "" : dto.priceLabel());
    }

    // Arma el value object PropertySpecs (dormitorios, baños, capacidad, m2, tamaño de lote).
    private static PropertySpecs specs(CreateUpdatePropertyDto dto) {
        return new PropertySpecs(dto.bedrooms(), dto.bathrooms(), dto.capacity(),
                dto.squareMeters(), dto.landSize());
    }

    // Traduce los precios por temporada del DTO a los objetos de entrada que espera el dominio.
    // Cada par (dateFrom, dateTo) se envuelve en un DateRange, que valida el rango.
    private static List<Property.SeasonPriceInput> seasons(CreateUpdatePropertyDto dto) {
        if (dto.seasonPrices() == null) return List.of();
        return dto.seasonPrices().stream()
                .map(s -> new Property.SeasonPriceInput(s.label(), s.pricePerNight(),
                        new DateRange(s.dateFrom(), s.dateTo())))
                .toList();
    }

    // Mapea la entidad de dominio a su DTO reducido de listado. destinationName sale del
    // Destination asociado (o "" si no está cargado); price/specs usan los getters del dominio
    // que ya devuelven defaults en vez de null.
    private static PropertyListItemDto toListItem(Property p) {
        return new PropertyListItemDto(
                p.getId(),
                p.getTitle(),
                p.getCategory(),
                p.getPropertyType(),
                p.getDestinationId(),
                p.getDestination() != null ? p.getDestination().getName() : "",
                p.getNeighborhood(),
                p.getPrice().getAmount(),
                p.getPrice().getLabel(),
                p.getPrice().getCurrency(),
                p.getSpecs().getBedrooms(),
                p.getSpecs().getBathrooms(),
                p.getSpecs().getSquareMeters(),
                p.getSpecs().getLandSize(),
                p.getSpecs().getCapacity(),
                coverImageUrl(p),
                p.getAmenities().stream().map(a -> a.getAmenityKey()).toList(),
                p.getStatus(),
                p.isFeatured());
    }

    // Mapea la entidad de dominio a su DTO completo de detalle, aplanando también las
    // colecciones hijas (imágenes, amenities, precios por temporada, disponibilidad).
    // Las imágenes se ordenan por displayOrder antes de mapearlas para que el JSON salga estable.
    private static PropertyDto toDto(Property p) {
        return new PropertyDto(
                p.getId(),
                p.getTitle(),
                p.getDescription(),
                p.getCategory(),
                p.getPropertyType(),
                p.getDestinationId(),
                p.getDestination() != null ? p.getDestination().getName() : "",
                p.getNeighborhood(),
                p.getPrice().getAmount(),
                p.getPrice().getLabel(),
                p.getPrice().getCurrency(),
                p.getSpecs().getBedrooms(),
                p.getSpecs().getBathrooms(),
                p.getSpecs().getSquareMeters(),
                p.getSpecs().getLandSize(),
                p.getSpecs().getCapacity(),
                p.getStatus(),
                p.getWhatsAppMessage(),
                p.getCreatedAt(),
                coverImageUrl(p),
                p.getImages().stream()
                        .sorted(Comparator.comparingInt(PropertyImage::getDisplayOrder))
                        .map(i -> new PropertyImageDto(i.getId(), i.getUrl(), i.getDisplayOrder(), i.isCover()))
                        .toList(),
                p.getAmenities().stream().map(a -> a.getAmenityKey()).toList(),
                p.getSeasonPrices().stream()
                        .map(s -> new PropertySeasonPriceDto(s.getId(), s.getLabel(),
                                s.getPricePerNight(), s.getDateFrom(), s.getDateTo()))
                        .toList(),
                p.getAvailability().stream()
                        .map(a -> new PropertyAvailabilityDto(a.getDate(), a.getStatus()))
                        .toList(),
                p.isFeatured());
    }

    // Elige la URL de portada: primero la imagen marcada isCover; si ninguna lo está, cae a
    // la de menor displayOrder; si no hay imágenes, null. Este fallback replica el comportamiento
    // del backend .NET original.
    private static String coverImageUrl(Property p) {
        return p.getImages().stream()
                .filter(PropertyImage::isCover)
                .findFirst()
                .or(() -> p.getImages().stream().min(Comparator.comparingInt(PropertyImage::getDisplayOrder)))
                .map(PropertyImage::getUrl)
                .orElse(null);
    }
}
