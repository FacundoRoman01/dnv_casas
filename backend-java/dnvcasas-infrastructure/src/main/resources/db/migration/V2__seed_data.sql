-- =====================================================================
-- V2: Datos semilla (seed) del catálogo.
--
-- Qué es: los datos de demo para que, al levantar el proyecto de cero
-- (docker compose up), la app arranque con contenido y no una base vacía.
-- V1 crea las tablas; esta migración las llena.
--
-- Contiene: el admin (admin@dnvcasas.com / admin123), 6 destinos y 10
-- propiedades reales de ejemplo con sus imágenes (URLs de Unsplash) y
-- amenities. Sin datos personales de clientes.
--
-- Flyway la corre una sola vez, en orden, después de V1. Nunca editar una
-- migración ya aplicada: Flyway valida el checksum. Para cambiar la semilla
-- en una base existente, agregar una V3.
--
-- FOREIGN_KEY_CHECKS=0 mientras insertamos: así el orden entre tablas no
-- importa y evitamos errores de clave foránea; al final se reactiva.
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Admin del panel. El hash es de la clave 'admin123' (ya documentada en el README).
INSERT INTO `AdminUsers` VALUES (1,'admin@dnvcasas.com','$2a$11$nPWuGulSD5NSBs5vNd7aSuPmYdU1GBTJWaCex0c0bcpjx/lQme7Ra');

-- Destinos (zonas del catálogo).
INSERT INTO `Destinations` VALUES (1,'Bariloche','Argentina','https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=800',1),(2,'Punta del Este','Uruguay','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',1),(3,'Miami','Estados Unidos','https://images.unsplash.com/photo-1503891450247-ee5f8ec46dc3?w=800',1),(4,'Mendoza','Argentina','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',1),(5,'Patagonia','Argentina','https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',1),(6,'Costa Esmeralda','Argentina','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',1);

-- Propiedades de ejemplo (10 listados reales de demo).
INSERT INTO `Properties` VALUES (1,'Cabaña en el bosque','Hermosa cabaña rodeada de pinos a 5 minutos del lago. Cuenta con chimenea, deck con vista al bosque y todos los servicios. Ideal para descansar y desconectarse.',0,1,'Colonia Suiza',85000.00,'por noche',2,4,0,'Hola! Me interesa la cabaña en el bosque de Bariloche','2026-07-13 20:36:28.000000',1,'ARS','',2,65.00,0),(2,'Apartamento frente al lago','Moderno apartamento con vista directa al lago Nahuel Huapi. Balcón, cocina equipada y estacionamiento cubierto. A 10 minutos del centro.',0,1,'Centro',120000.00,'por noche',3,6,0,'Hola! Me interesa el apartamento frente al lago en Bariloche','2026-07-13 20:36:28.000000',2,'ARS','',1,90.00,1),(3,'Loft con jacuzzi','Loft de diseño en el corazón de Bariloche con jacuzzi privado, vista a las montañas y cocina gourmet. Para escapadas románticas.',0,1,'Centro',95000.00,'por noche',1,2,0,'Hola! Me interesa el loft con jacuzzi en Bariloche','2026-07-13 20:36:28.000000',1,'ARS','',3,45.00,0),(4,'Casa con pileta y viñedos','Preciosa casa en Chacras de Coria con pileta climatizada y vistas a los viñedos. Perfecta para grupos. Parrilla, quincho y jardín amplio.',0,4,'Chacras de Coria',75000.00,'por noche',4,8,0,'Hola! Me interesa la casa con pileta en Mendoza','2026-07-13 20:36:28.000000',3,'ARS','',0,180.00,1),(5,'Departamento céntrico','Coqueto departamento en el corazón de Mendoza, a pasos de la peatonal Sarmiento. Totalmente equipado, WiFi de alta velocidad.',0,4,'Centro',55000.00,'por noche',2,4,0,'Hola! Me interesa el departamento céntrico en Mendoza','2026-07-13 20:36:28.000000',1,'ARS','',1,70.00,0),(6,'Refugio con vista a los glaciares','Refugio de montaña con vistas impresionantes a los glaciares patagónicos. Estufa a leña, ropa de cama incluida. Experiencia única.',0,5,'El Calafate',110000.00,'por noche',2,4,0,'Hola! Me interesa el refugio con vista a los glaciares','2026-07-13 20:36:28.000000',1,'ARS','',2,55.00,1),(7,'Casa familiar en Bariloche','Casa de 3 dormitorios en barrio tranquilo de Bariloche. Jardín, parrilla y garage. Disponible para intercambio en temporada alta o baja.',1,1,'Belgrano',NULL,'Intercambio',3,6,0,'Hola! Me interesa intercambiar casa en Bariloche','2026-07-13 20:36:28.000000',2,'ARS','',0,130.00,1),(8,'Departamento en Mendoza para intercambio','Amplio departamento en Mendoza centro para intercambio. Ideal para parejas o familias pequeñas. Todo incluido.',1,4,'Centro',NULL,'Intercambio',2,4,0,'Hola! Me interesa intercambiar departamento en Mendoza','2026-07-13 20:36:28.000000',1,'ARS','',1,75.00,0),(9,'Lote en Costa Esmeralda','Lote de 800m² en barrio cerrado de Costa Esmeralda a 200 metros de la playa. Todos los servicios. Oportunidad única de inversión.',2,6,'Costa Azul',45000.00,'precio total',0,0,0,'Hola! Me interesa el lote en Costa Esmeralda','2026-07-13 20:36:28.000000',0,'USD','800m²',0,NULL,1),(10,'Casa en primera línea al mar','Impresionante casa de 4 dormitorios en primera línea al mar en Costa Esmeralda. Piscina, jardín y acceso directo a la playa.',2,6,'Costa Esmeralda Golf',280000.00,'precio total',4,8,0,'Hola! Me interesa la casa en primera línea al mar','2026-07-13 20:36:28.000000',3,'USD','1200m²',0,320.00,1);

-- Comodidades de cada propiedad (wifi, pileta, etc.).
INSERT INTO `PropertyAmenities` VALUES (1,1,'wifi'),(2,1,'parking'),(3,1,'fireplace'),(4,1,'bbq'),(5,2,'wifi'),(6,2,'parking'),(7,2,'lake_view'),(8,2,'air_conditioning'),(9,3,'wifi'),(10,3,'jacuzzi'),(11,3,'mountain_view'),(12,4,'wifi'),(13,4,'pool'),(14,4,'bbq'),(15,4,'parking'),(16,4,'garden'),(17,5,'wifi'),(18,5,'air_conditioning'),(19,6,'wifi'),(20,6,'mountain_view'),(21,6,'fireplace'),(22,7,'wifi'),(23,7,'parking'),(24,7,'bbq'),(25,7,'garden'),(26,8,'wifi'),(27,8,'air_conditioning'),(28,9,'gated_community'),(29,10,'pool'),(30,10,'garden'),(31,10,'beach_access'),(32,10,'parking');

-- Imágenes de cada propiedad. Son URLs externas de Unsplash: no dependen del
-- volumen de uploads, así que se ven aunque sea una instalación nueva.
INSERT INTO `PropertyImages` VALUES (1,1,'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800',0,1),(2,1,'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800',1,0),(3,2,'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',0,1),(4,2,'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',1,0),(5,3,'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',0,1),(6,4,'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',0,1),(7,4,'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',1,0),(8,5,'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800',0,1),(9,6,'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800',0,1),(10,6,'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',1,0),(11,7,'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',0,1),(12,7,'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800',1,0),(13,8,'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',0,1),(14,9,'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',0,1),(15,9,'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',1,0),(16,10,'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',0,1),(17,10,'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',1,0);

SET FOREIGN_KEY_CHECKS = 1;
