/**
 * Mapas entre los enums del backend y los textos/rutas del frontend.
 *
 * OJO con el contrato: el back (Java, portado de .NET) maneja las categorías y
 * los tipos como enteros (enum int), NO como strings. Estos objetos traducen
 * en ambas direcciones: del slug de la URL al int que espera la API, y del int
 * que devuelve la API al label que ve el usuario. Los números tienen que
 * coincidir exacto con el enum del back.
 */

// Categorías de propiedades. slug de URL -> int del enum del back.
export const CATEGORY_MAP = { alquileres: 0, intercambios: 1, compras: 2 }

export const CATEGORY_LABEL = { 0: "Alquiler", 1: "Intercambio", 2: "Compra" }

export const CATEGORY_ROUTE = { 0: "alquileres", 1: "intercambios", 2: "compras" }

// Tipos de propiedad
export const PROPERTY_TYPE_MAP  = { "Casa": 0, "Departamento": 1, "Cabaña": 2, "Loft": 3 }
export const PROPERTY_TYPE_IMAP = { 0: "Casa", 1: "Departamento", 2: "Cabaña", 3: "Loft" }
