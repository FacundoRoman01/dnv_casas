/**
 * Formateo de precios para la UI.
 *
 * Devuelve el símbolo y el número separados ({ cur, num }) así cada componente
 * los maqueta como quiera (por ejemplo el símbolo más chico que el número).
 */
// price: número o falsy. currency: puede venir como string "USD"/"ARS" o como
// int del enum del back (1 = USD). Cubrimos las dos formas por el contrato.
export function fmtPrice(price, currency) {
  // Sin precio cargado mostramos "A consultar" (el cierre es por WhatsApp igual).
  if (!price) return { cur: "", num: "A consultar" }
  // Dólares: separador de miles en formato en-US (1,000).
  if (currency === "USD" || currency === 1) return { cur: "US$", num: Number(price).toLocaleString("en-US") }
  // Por defecto pesos argentinos, formato es-AR (1.000).
  return { cur: "$", num: Number(price).toLocaleString("es-AR") }
}
