-- Agrega el enlace opcional de Google Maps de cada propiedad.
-- Nullable para conservar sin cambios todas las propiedades existentes.
ALTER TABLE Properties
    ADD COLUMN GoogleMapsUrl VARCHAR(1000) NULL;
