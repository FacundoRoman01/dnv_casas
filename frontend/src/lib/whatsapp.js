/**
 * Helpers de WhatsApp: acá se cierra el 100% de las operaciones.
 *
 * No hay pagos ni checkout online. Toda la conversión (alquiler, compra,
 * intercambio) termina en un botón que abre un chat de WhatsApp con un texto
 * ya armado. Estos helpers alimentan ~16 botones repartidos por toda la app.
 *
 * El número sale de la env var VITE_WHATSAPP y se congela en build time. Si
 * falta, sigue siendo un placeholder o no parece un número válido, el build
 * FALLA a propósito (ver la validación en vite.config.js). O sea: si compiló,
 * el número es real.
 */

// Número de destino, inyectado por Vite desde VITE_WHATSAPP (solo dígitos,
// con código de país, sin +, ni espacios, ni guiones. Ej: 5491155551234).
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP

// Arma el link wa.me con el mensaje ya URL-encodeado. Sirve para <a href> o
// para abrir en una pestaña nueva.
export function whatsappLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

/**
 * El mensaje que el admin cargó para esta propiedad, o null si no tiene.
 *
 * El campo "Mensaje de WhatsApp" del backoffice está persistido en toda la pila
 * y las 10 propiedades del seed lo tienen cargado con texto específico
 * ("Hola! Me interesa la cabaña en el bosque de Bariloche"), pero no lo usaba
 * nadie: cada CTA armaba su propio texto genérico. Lo que el dueño escribía no
 * aparecía nunca.
 */
export function propertyMessage(property) {
  return property?.whatsAppMessage?.trim() || null
}
