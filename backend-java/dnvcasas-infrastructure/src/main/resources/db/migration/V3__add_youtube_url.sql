-- Agrega el campo opcional para el link de YouTube de cada propiedad.
-- Nullable porque no todas las propiedades van a tener video cargado.
ALTER TABLE Properties
    ADD COLUMN YoutubeUrl VARCHAR(500) NULL;
