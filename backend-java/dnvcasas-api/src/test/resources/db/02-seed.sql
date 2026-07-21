-- Los mismos datos contra los que se capturó golden/dotnet/.
--
-- Los Id y los createdAt son EXPLÍCITOS y tienen que quedar así: el GoldenTest
-- compara las respuestas byte a byte contra el oráculo, y ahí está
-- "createdAt":"2026-07-13T20:36:28". Si estos valores cambian, el test falla —
-- y correctamente.
--
-- El hash de AdminUsers es bcrypt de "admin123", la contraseña de desarrollo que
-- documenta el README. No es un secreto: es justamente lo que permite verificar
-- que los hashes $2a$ que emite BCrypt.Net validan con BCryptPasswordEncoder,
-- que es una de las cosas que el port tenía que garantizar.

SET NAMES utf8mb4;

LOCK TABLES `Destinations` WRITE;
INSERT INTO `Destinations` (`Id`, `Name`, `Country`, `ImageUrl`, `IsActive`) VALUES (1,'Bariloche','Argentina','https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=800',1);
INSERT INTO `Destinations` (`Id`, `Name`, `Country`, `ImageUrl`, `IsActive`) VALUES (2,'Punta del Este','Uruguay','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',1);
INSERT INTO `Destinations` (`Id`, `Name`, `Country`, `ImageUrl`, `IsActive`) VALUES (3,'Miami','Estados Unidos','https://images.unsplash.com/photo-1503891450247-ee5f8ec46dc3?w=800',1);
INSERT INTO `Destinations` (`Id`, `Name`, `Country`, `ImageUrl`, `IsActive`) VALUES (4,'Mendoza','Argentina','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',1);
INSERT INTO `Destinations` (`Id`, `Name`, `Country`, `ImageUrl`, `IsActive`) VALUES (5,'Patagonia','Argentina','https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',1);
INSERT INTO `Destinations` (`Id`, `Name`, `Country`, `ImageUrl`, `IsActive`) VALUES (6,'Costa Esmeralda','Argentina','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',1);
UNLOCK TABLES;
LOCK TABLES `AdminUsers` WRITE;
INSERT INTO `AdminUsers` (`Id`, `Email`, `PasswordHash`) VALUES (1,'admin@dnvcasas.com','$2a$11$nPWuGulSD5NSBs5vNd7aSuPmYdU1GBTJWaCex0c0bcpjx/lQme7Ra');
UNLOCK TABLES;
LOCK TABLES `Properties` WRITE;
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (1,'Cabaña en el bosque','Hermosa cabaña rodeada de pinos a 5 minutos del lago. Cuenta con chimenea, deck con vista al bosque y todos los servicios. Ideal para descansar y desconectarse.',0,1,'Colonia Suiza',85000.00,'por noche',2,4,0,'Hola! Me interesa la cabaña en el bosque de Bariloche','2026-07-13 20:36:28.000000',1,'ARS','',2,65.00,0);
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (2,'Apartamento frente al lago','Moderno apartamento con vista directa al lago Nahuel Huapi. Balcón, cocina equipada y estacionamiento cubierto. A 10 minutos del centro.',0,1,'Centro',120000.00,'por noche',3,6,0,'Hola! Me interesa el apartamento frente al lago en Bariloche','2026-07-13 20:36:28.000000',2,'ARS','',1,90.00,1);
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (3,'Loft con jacuzzi','Loft de diseño en el corazón de Bariloche con jacuzzi privado, vista a las montañas y cocina gourmet. Para escapadas románticas.',0,1,'Centro',95000.00,'por noche',1,2,0,'Hola! Me interesa el loft con jacuzzi en Bariloche','2026-07-13 20:36:28.000000',1,'ARS','',3,45.00,0);
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (4,'Casa con pileta y viñedos','Preciosa casa en Chacras de Coria con pileta climatizada y vistas a los viñedos. Perfecta para grupos. Parrilla, quincho y jardín amplio.',0,4,'Chacras de Coria',75000.00,'por noche',4,8,0,'Hola! Me interesa la casa con pileta en Mendoza','2026-07-13 20:36:28.000000',3,'ARS','',0,180.00,1);
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (5,'Departamento céntrico','Coqueto departamento en el corazón de Mendoza, a pasos de la peatonal Sarmiento. Totalmente equipado, WiFi de alta velocidad.',0,4,'Centro',55000.00,'por noche',2,4,0,'Hola! Me interesa el departamento céntrico en Mendoza','2026-07-13 20:36:28.000000',1,'ARS','',1,70.00,0);
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (6,'Refugio con vista a los glaciares','Refugio de montaña con vistas impresionantes a los glaciares patagónicos. Estufa a leña, ropa de cama incluida. Experiencia única.',0,5,'El Calafate',110000.00,'por noche',2,4,0,'Hola! Me interesa el refugio con vista a los glaciares','2026-07-13 20:36:28.000000',1,'ARS','',2,55.00,1);
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (7,'Casa familiar en Bariloche','Casa de 3 dormitorios en barrio tranquilo de Bariloche. Jardín, parrilla y garage. Disponible para intercambio en temporada alta o baja.',1,1,'Belgrano',NULL,'Intercambio',3,6,0,'Hola! Me interesa intercambiar casa en Bariloche','2026-07-13 20:36:28.000000',2,'ARS','',0,130.00,1);
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (8,'Departamento en Mendoza para intercambio','Amplio departamento en Mendoza centro para intercambio. Ideal para parejas o familias pequeñas. Todo incluido.',1,4,'Centro',NULL,'Intercambio',2,4,0,'Hola! Me interesa intercambiar departamento en Mendoza','2026-07-13 20:36:28.000000',1,'ARS','',1,75.00,0);
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (9,'Lote en Costa Esmeralda','Lote de 800m² en barrio cerrado de Costa Esmeralda a 200 metros de la playa. Todos los servicios. Oportunidad única de inversión.',2,6,'Costa Azul',45000.00,'precio total',0,0,0,'Hola! Me interesa el lote en Costa Esmeralda','2026-07-13 20:36:28.000000',0,'USD','800m²',0,NULL,1);
INSERT INTO `Properties` (`Id`, `Title`, `Description`, `Category`, `DestinationId`, `Neighborhood`, `Price`, `PriceLabel`, `Bedrooms`, `Capacity`, `Status`, `WhatsAppMessage`, `CreatedAt`, `Bathrooms`, `Currency`, `LandSize`, `PropertyType`, `SquareMeters`, `IsFeatured`) VALUES (10,'Casa en primera línea al mar','Impresionante casa de 4 dormitorios en primera línea al mar en Costa Esmeralda. Piscina, jardín y acceso directo a la playa.',2,6,'Costa Esmeralda Golf',280000.00,'precio total',4,8,0,'Hola! Me interesa la casa en primera línea al mar','2026-07-13 20:36:28.000000',3,'USD','1200m²',0,320.00,1);
UNLOCK TABLES;
LOCK TABLES `PropertyImages` WRITE;
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (1,1,'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (2,1,'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',1,0);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (3,2,'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (4,2,'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',1,0);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (5,3,'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (6,4,'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (7,4,'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',1,0);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (8,5,'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (9,6,'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (10,6,'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',1,0);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (11,7,'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (12,7,'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800',1,0);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (13,8,'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (14,9,'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (15,9,'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',1,0);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (16,10,'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',0,1);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (17,10,'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',1,0);
INSERT INTO `PropertyImages` (`Id`, `PropertyId`, `Url`, `DisplayOrder`, `IsCover`) VALUES (18,1,'/uploads/59e78814-3023-46c0-8e61-25a6e9ae6166.png',999,0);
UNLOCK TABLES;
LOCK TABLES `PropertyAmenities` WRITE;
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (1,1,'wifi');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (2,1,'parking');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (3,1,'fireplace');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (4,1,'bbq');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (5,2,'wifi');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (6,2,'parking');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (7,2,'lake_view');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (8,2,'air_conditioning');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (9,3,'wifi');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (10,3,'jacuzzi');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (11,3,'mountain_view');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (12,4,'wifi');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (13,4,'pool');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (14,4,'bbq');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (15,4,'parking');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (16,4,'garden');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (17,5,'wifi');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (18,5,'air_conditioning');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (19,6,'wifi');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (20,6,'mountain_view');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (21,6,'fireplace');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (22,7,'wifi');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (23,7,'parking');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (24,7,'bbq');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (25,7,'garden');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (26,8,'wifi');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (27,8,'air_conditioning');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (28,9,'gated_community');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (29,10,'pool');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (30,10,'garden');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (31,10,'beach_access');
INSERT INTO `PropertyAmenities` (`Id`, `PropertyId`, `AmenityKey`) VALUES (32,10,'parking');
UNLOCK TABLES;
LOCK TABLES `PropertySeasonPrices` WRITE;
UNLOCK TABLES;
LOCK TABLES `PropertyAvailabilities` WRITE;
UNLOCK TABLES;
