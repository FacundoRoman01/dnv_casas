package com.dnvcasas.application.service;

import com.dnvcasas.application.dto.CreateUpdateDestinationDto;
import com.dnvcasas.application.dto.DestinationDto;
import com.dnvcasas.application.port.DestinationRepository;
import com.dnvcasas.domain.entity.Destination;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service de la capa de aplicación para el ABM de destinos. Orquesta los casos de uso
 * (listar, crear, editar, borrar) coordinando el puerto {@link DestinationRepository} con
 * la entidad de dominio {@link Destination}, y traduce entre DTOs (lo que entra/sale de la
 * API) y entidades. No sabe nada de base de datos: eso lo resuelve la implementación del puerto.
 */
@Service
public class DestinationService {

    private final DestinationRepository repo;

    public DestinationService(DestinationRepository repo) {
        this.repo = repo;
    }

    /** Lista todos los destinos activos, cada uno con su cantidad de propiedades, como DTOs. */
    public List<DestinationDto> getAll() {
        return repo.findAllActive().stream()
                .map(d -> new DestinationDto(
                        d.destination().getId(),
                        d.destination().getName(),
                        d.destination().getCountry(),
                        d.destination().getImageUrl(),
                        d.count()))
                .toList();
    }

    /**
     * Crea un destino nuevo a partir del DTO de entrada.
     * @return el destino creado como DTO (ya con su id asignado).
     */
    public DestinationDto create(CreateUpdateDestinationDto dto) {
        Destination entity = new Destination();
        entity.setName(dto.name());
        entity.setCountry(dto.country());
        entity.setImageUrl(dto.imageUrl());
        Destination created = repo.create(entity);
        return new DestinationDto(created.getId(), created.getName(),
                created.getCountry(), created.getImageUrl());
    }

    /**
     * Edita un destino existente. Si no existe, no hace nada.
     * @return el destino actualizado como DTO, o vacío si no había ninguno con ese id.
     */
    public Optional<DestinationDto> update(int id, CreateUpdateDestinationDto dto) {
        return repo.findById(id).map(entity -> {
            entity.setName(dto.name());
            entity.setCountry(dto.country());
            entity.setImageUrl(dto.imageUrl());
            repo.update(entity);
            return new DestinationDto(entity.getId(), entity.getName(),
                    entity.getCountry(), entity.getImageUrl());
        });
    }

    /**
     * Borrado lógico de un destino (soft delete: no se elimina la fila).
     * @return true si existía y se borró, false si no había destino con ese id.
     */
    public boolean delete(int id) {
        if (repo.findById(id).isEmpty()) return false;
        repo.softDelete(id);
        return true;
    }
}
