-- Flyway V2 ya carga el catálogo de ejemplo. El contrato histórico incluye
-- únicamente esta imagen adicional, ausente de la semilla de producción.
-- Este script sólo se ejecuta en la MySQL temporal de los tests de integración.
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`)
VALUES (18, 1, '/uploads/59e78814-3023-46c0-8e61-25a6e9ae6166.png', 999, 0);
