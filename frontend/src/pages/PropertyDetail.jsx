import { useState, useEffect, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import { useProperty, useProperties } from "../hooks/useProperties"
import { usePageMeta } from "../hooks/usePageMeta"
import PropertyCard from "../components/ui/PropertyCard"
import Lightbox from "../components/ui/Lightbox"
import HorizontalCarousel from "../components/ui/HorizontalCarousel"
import { whatsappLink, propertyMessage } from "../lib/whatsapp"
import { CATEGORY_LABEL, CATEGORY_ROUTE } from "../lib/constants"

/**
 * Detalle de una propiedad de ALQUILER o INTERCAMBIO (categorías 0 y 1). Se
 * llega desde /alquileres/:id o /intercambios/:id. Muestra galería (Lightbox),
 * specs, amenities, un calendario de disponibilidad, panel sticky con precio o
 * tarifas por temporada, y casas relacionadas. Todo el cierre es por WhatsApp:
 * el CTA arma el mensaje (con fechas si las elegiste) y abre wa.me.
 * Ojo: las propiedades de compra tienen su propia página (ComprasDetail).
 */

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icons = {
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  bed: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>,
  bath: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h.75a2.25 2.25 0 012.25 2.25v3.75a.75.75 0 01-.75.75h-19.5a.75.75 0 01-.75-.75v-3.75A2.25 2.25 0 013.75 12h.75V7.5a2.25 2.25 0 012.25-2.25h2.25"/></svg>,
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>,
  swap: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>,
  wa: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  star: <svg className="w-4 h-4" fill="#C9AB55" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  pin: <svg className="w-4 h-4" fill="none" stroke="#B5933F" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>,
  chevDown: <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>,
  close: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
  arrowL: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>,
  arrowR: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>,
  play: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>,
}

const AMENITY_MAP = {
  wifi:      { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"/></svg>, label: "Wi-Fi" },
  parking:   { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>, label: "Cochera" },
  bbq:       { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"/></svg>, label: "Parrilla" },
  linen:     { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>, label: "Ropa de cama" },
  pets:      { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.909M14.25 9h2.25M5.25 9H7.5m-1.5 6H4.5m-.75 0H2.25"/></svg>, label: "Pet-friendly" },
  fireplace: { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"/></svg>, label: "Estufa a leña" },
  pool:      { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636"/></svg>, label: "Pileta" },
  ac:        { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636"/></svg>, label: "Aire acondicionado" },
  heating:   { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M18.364 5.636l-1.06 1.06M21 12h-1.5M18.364 18.364l-1.06-1.06M12 19.5V21M6.696 17.304l-1.06 1.06M4.5 12H3M6.696 6.696l-1.06-1.06M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>, label: "Calefacción" },
  tv:        { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9zM9 20.25h6"/></svg>, label: "TV / Cable" },
  washer:    { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 6.75v10.5a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25V6.75M3.75 6.75V4.5A2.25 2.25 0 016 2.25h12a2.25 2.25 0 012.25 2.25v2.25M12 15a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"/></svg>, label: "Lavarropas" },
  dishwasher:{ icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h16.5v15H3.75v-15zM3.75 9.75h16.5M8.25 4.5v5.25M8.25 13.5h7.5"/></svg>, label: "Lavavajillas" },
  garden:    { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-7.5M12 13.5c-3.728 0-6.75-3.022-6.75-6.75 0-.414.336-.75.75-.75 3.728 0 6.75 3.022 6.75 6.75zm0 0c3.728 0 6.75-3.022 6.75-6.75 0-.414-.336-.75-.75-.75-3.728 0-6.75 3.022-6.75 6.75z"/></svg>, label: "Jardín" },
  terrace:   { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3.75h15M5.25 3.75v17.25M18.75 3.75v17.25M9 21v-3.75a3 3 0 013-3v0a3 3 0 013 3V21"/></svg>, label: "Terraza / Balcón" },
  quincho:   { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M6.75 10.5v9.75a1.5 1.5 0 001.5 1.5h7.5a1.5 1.5 0 001.5-1.5V10.5"/></svg>, label: "Quincho" },
  jacuzzi:   { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 18h16.5M4.5 18v-3a2.25 2.25 0 012.25-2.25h10.5A2.25 2.25 0 0119.5 15v3M8.25 12.75V9a3.75 3.75 0 117.5 0v3.75"/></svg>, label: "Jacuzzi" },
  gym:       { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"/></svg>, label: "Gimnasio" },
  security:  { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>, label: "Seguridad / Alarma" },
  elevator:  { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75h16.5v16.5H3.75V3.75zM8.25 9.75L10.5 7.5l2.25 2.25m0 4.5l-2.25 2.25-2.25-2.25M15.75 9.75L18 7.5l2.25 2.25"/></svg>, label: "Ascensor" },
  workspace: { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/></svg>, label: "Espacio de trabajo" },
}

const PROPERTY_TYPE_LABELS = { 0: "Casa", 1: "Departamento", 2: "Cabaña", 3: "Loft", 4: "Otro" }

// ─── CALENDAR ─────────────────────────────────────────────────────────────────

// Inserta las transformaciones f_auto,q_auto en una URL de Cloudinary para que
// se sirva en el mejor formato (WebP/AVIF) y con la calidad óptima según el
// caso. No modifica URLs que no sean de Cloudinary (ej. el fallback de Unsplash
// o alguna imagen vieja del storage local).
function optimizeCloudinaryUrl(url) {
  if (!url || !url.includes("res.cloudinary.com")) return url
  return url.replace("/upload/", "/upload/f_auto,q_auto/")
}

// Extrae el ID de un video de YouTube desde cualquiera de sus formatos de URL
// comunes (watch?v=, youtu.be/, embed/), para poder armar la URL de embed que
// pide el iframe. Devuelve null si no matchea ningún formato conocido, así el
// bloque del video simplemente no se muestra en vez de romper con una URL rota.
function extractYoutubeId(url) {
  if (!url) return null
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  )
  return match ? match[1] : null
}

// Fecha -> string "YYYY-MM-DD" en horario LOCAL (no UTC). Usamos esto y no
// toISOString() para que no se corra un día por zona horaria.
function toLocalISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

// Estado de un día según la disponibilidad que viene del back.
function dayStatus(date, availability) {
  if (!availability?.length) return 0
  const key = toLocalISODate(date)
  const entry = availability.find(a => a.date === key)
  if (!entry) return 0
  // API returns AvailabilityStatus as int: 0=Available, 1=InProgress, 2=Unavailable
  return entry.status === 2 ? 2 : entry.status === 1 ? 1 : 0
}

// Renderiza un mes del calendario. sel = {in, out} rango elegido, onPick(key)
// avisa cuando el usuario toca un día disponible.
function CalendarMonth({ year, month, sel, onPick, availability }) {
  const DAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  // getDay() es 0=Domingo; acá arrancamos la semana en lunes, por eso el -1 y el
  // ajuste a 6 cuando cae domingo.
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d))

  const raw = firstDay.toLocaleDateString("es-AR", { month: "long", year: "numeric" }).toLowerCase()
  const monthName = raw.charAt(0).toUpperCase() + raw.slice(1)

  return (
    <div style={{ flex: 1 }}>
      <p className="text-sm font-semibold text-center mb-3 capitalize" style={{ color: "#1a1a2e" }}>{monthName}</p>
      <div className="grid grid-cols-7 gap-px mb-1">
        {DAYS.map(d => <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "#67717F" }}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const key = toLocalISODate(date)
          const status = dayStatus(date, availability)
          const isIn  = sel.in  === key
          const isOut = sel.out === key
          const inRange = sel.in && sel.out && key > sel.in && key < sel.out

          let bg = "hover:bg-[#6BB595]/20 cursor-pointer"
          let textColor = "#1a1a2e"
          let extra = ""

          if (status === 2) { bg = "bg-gray-100 cursor-not-allowed"; textColor = "#ccc"; extra = "line-through" }
          else if (status === 1) { bg = "bg-amber-50 cursor-not-allowed"; textColor = "#d97706" }
          else if (isIn || isOut) { bg = "cursor-pointer"; textColor = "#fff" }
          else if (inRange) { bg = "bg-[#44536A]/10 cursor-pointer" }

          return (
            <button
              type="button"
              key={key}
              onClick={() => status === 0 && onPick(key)}
              disabled={status !== 0}
              className={`aspect-square flex items-center justify-center ${bg}`}
              style={{
                fontSize: "14px",
                borderRadius: "11px",
                color: textColor,
                textDecoration: extra,
                background: isIn || isOut ? "#44536A" : inRange ? "rgba(68,83,106,.10)" : undefined,
                fontWeight: isIn || isOut ? 600 : 500,
                border: "none",
                padding: 0,
              }}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function PropertyDetail() {
  // id de la URL -> useProperty trae la propiedad.
  const { id } = useParams()
  const { property, loading } = useProperty(id)
  usePageMeta(property?.title, property?.description?.slice(0, 155))
  // Relacionadas: otras del mismo destino. Pasamos null hasta tener la property
  // para no disparar el fetch sin destinationId.
  const { data: related } = useProperties(
    property ? { destinationId: property.destinationId, pageSize: 5 } : null
  )

const [lbOpen, setLbOpen]   = useState(false)
  const [lbIdx,  setLbIdx]    = useState(0)
  const [sel,    setSel]      = useState({ in: null, out: null })
  const [ratesOpen, setRatesOpen] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0) // agregado recien por facundo
  const closeLb = useCallback(() => setLbOpen(false), [])

  // Al cambiar de propiedad (mismo componente, otro :id) reseteamos selección de
  // fechas, tarifas y lightbox para no arrastrar estado de la propiedad anterior.
  useEffect(() => {
    setSel({ in: null, out: null })
    setRatesOpen(false)
    setLbOpen(false)
    setMonthOffset(0)
  }, [id])

  if (loading) return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16 animate-pulse space-y-6">
      <div className="h-[480px] bg-gray-200 rounded-[20px]" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-100 rounded w-1/3" />
    </div>
  )

  if (!property) return (
    <div className="max-w-6xl mx-auto px-6 pt-28 text-center py-20 text-gray-400">
      <p className="text-xl mb-4">Propiedad no encontrada.</p>
      <Link to="/" className="text-[#C9AB55] underline">← Volver al inicio</Link>
    </div>
  )

  // gallery images — always build 5 cells for the mosaic
  const rawImages = property.images?.length
    ? [...property.images].sort((a, b) => a.displayOrder - b.displayOrder).map(i => optimizeCloudinaryUrl(i.url))
    : [optimizeCloudinaryUrl(property.coverImageUrl) || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"]
  const fallback = rawImages[0]
  const allImages = rawImages.length >= 5
    ? rawImages
    : [...rawImages, ...Array(5 - rawImages.length).fill(fallback)]
  const displayImages = allImages.slice(0, 5)

  // Video de YouTube (opcional): si youtubeUrl no matchea un formato conocido,
  // youtubeVideoId queda null y la sección de video simplemente no se renderiza.
  const youtubeVideoId = extractYoutubeId(property.youtubeUrl)

  // Noches elegidas (para el mensaje de WhatsApp): diferencia en ms / ms-por-día.
  const nights = sel.in && sel.out
    ? Math.max(1, Math.round((new Date(sel.out) - new Date(sel.in)) / 86400000))
    : null

  // Con fechas elegidas gana el mensaje con fechas: es más útil que cualquier
  // texto fijo. Sin fechas, se usa el que cargó el admin para esta propiedad
  // y recién si no hay, el genérico.
  const consultMsg = sel.in && sel.out
    ? `Hola 👋 Me interesa "${property.title}" en ${property.destinationName}. Fechas: ${sel.in} al ${sel.out} (${nights} noches). ¿Está disponible?`
    : propertyMessage(property) || `Hola 👋 Quería consultar por "${property.title}" en ${property.destinationName}.`
  const swapMsg = propertyMessage(property) || `Hola 👋 Quería proponer un intercambio por "${property.title}" en ${property.destinationName}.`

  // season prices
  const rates = property.seasonPrices || []
  const VISIBLE = 3
  const visibleRates = ratesOpen ? rates : rates.slice(0, VISIBLE)

  // related (exclude self)
  const relatedItems = (related?.items || []).filter(p => String(p.id) !== String(id)).slice(0, 4)

  // calendar — show current + next month
  // const now = new Date()
  // const months = [
  //   { year: now.getFullYear(), month: now.getMonth() },
  //   { year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(), month: (now.getMonth() + 1) % 12 },
  // ]


  // calendar — muestra 2 meses consecutivos, arrancando en (hoy + monthOffset).
// monthOffset se mueve con las flechas ← → y nunca deja ir antes del mes actual.
const now = new Date()
const baseMonthIndex = now.getFullYear() * 12 + now.getMonth() + monthOffset
const months = [0, 1].map(i => {
  const idx = baseMonthIndex + i
  return { year: Math.floor(idx / 12), month: idx % 12 }
})
const canGoBack = monthOffset > 0




  // Lógica de selección del rango en el calendario: el primer toque fija el
  // check-in; el segundo el check-out (y si es anterior, se invierten).
  function handleDayPick(key) {
    if (!sel.in || (sel.in && sel.out)) {
      setSel({ in: key, out: null })
    } else {
      if (key < sel.in) setSel({ in: key, out: sel.in })
      else setSel({ in: sel.in, out: key })
    }
  }

  const sectionStyle = { borderBottom: "1px solid #E9EDF2", paddingTop: "34px", paddingBottom: "34px" }

  return (
    <div>
      <div className="max-w-6xl mx-auto px-6 pb-0" style={{ paddingTop: 108 }}>

        {/* ── BREADCRUMB ── */}
        <nav className="text-[13.5px] mb-6 flex items-center gap-2" style={{ color: "#67717F" }}>
          <Link to="/" className="hover:text-[#1a1a2e] transition">Inicio</Link>
          <span>/</span>
          <Link to={`/${CATEGORY_ROUTE[property.category]}`} className="hover:text-[#1a1a2e] transition">
            {property.destinationName || CATEGORY_LABEL[property.category]}
          </Link>
          <span>/</span>
          <span className="text-[#1a1a2e] font-medium truncate">{property.title}</span>
        </nav>

        {/* ── TITLE + META ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-light mb-2" style={{ fontSize: "clamp(30px,3.5vw,46px)", color: "#1a1a2e", letterSpacing: "-.02em" }}>
              {property.title}
            </h1>
            <div className="flex items-center gap-4 flex-wrap" style={{ color: "#67717F", fontSize: "14px" }}>
              <span className="flex items-center gap-1">{Icons.pin} {property.destinationName}{property.neighborhood ? ` · ${property.neighborhood}` : ""}</span>
              <span className="bg-[#C9AB55]/15 text-[#B5933F] text-xs font-semibold px-3 py-1 rounded-full">
                {CATEGORY_LABEL[property.category]}
              </span>
            </div>
          </div>
        </div>

        {/* ── GALLERY MOSAIC — desktop ── */}
        <div
          className="hidden md:grid mb-10 overflow-hidden"
          style={{
            gridTemplateColumns: "1.4fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            height: "480px",
            borderRadius: "28px",
            gap: "12px",
          }}
        >
          {displayImages.map((src, i) => (
            <div
              key={i}
              className="relative overflow-hidden cursor-pointer group"
              style={{ gridRow: i === 0 ? "1/3" : undefined }}
              onClick={() => { setLbIdx(i); setLbOpen(true) }}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {i === 4 && (
                <span style={{
                  position: "absolute", right: 16, bottom: 16,
                  background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.25)", color: "#fff",
                  padding: "11px 18px", borderRadius: 999, fontSize: 14, fontWeight: 600,
                  whiteSpace: "nowrap", pointerEvents: "none",
                }}>
                  Ver {rawImages.length === 1 ? "la 1 foto" : `las ${rawImages.length} fotos`}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── GALLERY — mobile ── */}
        <div
          className="md:hidden mb-6 relative overflow-hidden cursor-pointer"
          style={{ borderRadius: "20px", aspectRatio: "4/3" }}
          onClick={() => { setLbIdx(0); setLbOpen(true) }}
        >
          <img src={rawImages[0]} alt="" className="w-full h-full object-cover" />
          {rawImages.length > 1 && (
            <span style={{
              position: "absolute", right: 12, bottom: 12,
              background: "rgba(20,23,27,.6)", backdropFilter: "blur(8px)",
              color: "#fff", padding: "7px 14px", borderRadius: 999,
              fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            }}>
              Ver las {rawImages.length} fotos
            </span>
          )}
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_392px] gap-10 lg:gap-[56px] items-start">

          {/* ─ LEFT COLUMN ─ */}
          <div>

            {/* FEATURES */}
            <div style={{ ...sectionStyle, paddingTop: 0 }}>
              <div className="flex gap-6 flex-wrap">
                {[
                  { icon: Icons.users, label: `${property.capacity ?? "–"} huéspedes` },
                  { icon: Icons.bed,   label: `${property.bedrooms ?? "–"} dormitorios` },
                  { icon: Icons.bath,  label: `${property.bathrooms ?? "–"} baños` },
                  { icon: Icons.home,  label: PROPERTY_TYPE_LABELS[property.propertyType] ?? "Casa" },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-11 h-11 flex items-center justify-center flex-shrink-0"
                      style={{ background: "#EDF0F4", borderRadius: "13px", color: "#44536A" }}>
                      {icon}
                    </div>
                    <span style={{ fontSize: "15.5px", color: "#14171B" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SOBRE LA CASA */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: "26px", fontWeight: 400, color: "#1a1a2e", marginBottom: "12px" }}>Sobre la casa</h2>
              <p style={{ fontSize: "16px", color: "#67717F", lineHeight: 1.7 }}>{property.description}</p>
              <div className="mt-4 p-4 text-sm rounded-xl" style={{ borderLeft: "3px solid #6BB595", background: "rgba(107,181,149,.07)", color: "#67717F" }}>
                <strong style={{ color: "#1a1a2e" }}>Te acompañamos en cada paso:</strong> coordinás todo con una persona real por WhatsApp, sin formularios ni pagos online.
              </div>
            </div>

            {/* RECORRÉ LA PROPIEDAD — video de YouTube, solo si la propiedad tiene
                uno cargado y la URL matcheó un formato válido (youtubeVideoId). El
                aspect-ratio 16:9 vía padding-top se usa porque es la técnica clásica
                para mantener proporción en un iframe responsive sin JS adicional. */}
            {youtubeVideoId && (
              <div style={sectionStyle}>
                <h2 style={{ fontSize: "26px", fontWeight: 400, color: "#1a1a2e", marginBottom: "6px", display: "flex", alignItems: "center", gap: 10 }}>
                  {Icons.play}
                  Recorré la propiedad
                </h2>
                <p style={{ fontSize: "14.5px", color: "#67717F", marginBottom: "16px" }}>
                  Un video para que conozcas cada rincón antes de decidir.
                </p>
                <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: "20px", overflow: "hidden", background: "#000" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title={`Video de ${property.title}`}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

      {/* QUÉ OFRECE */}
            {(property.amenities?.length > 0) && (
              <div style={sectionStyle}>
                <h3 style={{ fontSize: "19px", fontWeight: 600, color: "#14171B", marginBottom: "14px" }}>Qué ofrece</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 30px" }}>
                  {property.amenities.map(key => {
                    const a = AMENITY_MAP[key] || { icon: <svg className="w-4 h-4" fill="none" stroke="#4F9C7C" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>, label: key }
                    return (
                      <div key={key} className="flex items-center gap-2" style={{ fontSize: "15px", color: "#44536A" }}>
                        {a.icon}
                        {a.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* INTERCAMBIO */}
            {property.category === 1 && (
              <div style={sectionStyle}>
                <div className="flex gap-4" style={{ background: "rgba(107,181,149,.10)", border: "1px solid rgba(107,181,149,.28)", borderRadius: "20px", padding: "24px 26px" }}>
                  <div className="w-12 h-12 flex items-center justify-center text-white flex-shrink-0" style={{ background: "#6BB595", borderRadius: "14px" }}>
                    {Icons.swap}
                  </div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: "#1a1a2e" }}>Esta casa también está abierta al intercambio</p>
                    <p style={{ fontSize: "14px", color: "#67717F", lineHeight: 1.6 }}>
                      ¿Tenés una propiedad y querés pasar vacaciones en otro destino? Coordinamos el intercambio entre familias. Sin costo de alojamiento, con todo nuestro acompañamiento.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CALENDARIO */}
            <div style={sectionStyle}>
              <h2 style={{ fontSize: "26px", fontWeight: 400, color: "#1a1a2e", marginBottom: "16px" }}>Disponibilidad</h2>
              {/* leyenda */}
              <div className="flex gap-5 mb-6 flex-wrap">
                {[
                  { bg: "rgba(107,181,149,.3)", border: "#6BB595", label: "Disponible" },
                  { bg: "rgba(251,191,36,.25)", border: "#f59e0b", label: "En gestión" },
                  { bg: "#EDF0F4",              border: "#d1d5db", label: "No disponible" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2 text-sm" style={{ color: "#67717F" }}>
                    <div className="w-4 h-4 rounded" style={{ background: l.bg, border: `1.5px solid ${l.border}` }} />
                    {l.label}
                  </div>
                ))}
                {sel.in && (
                  <button onClick={() => setSel({ in: null, out: null })} className="text-sm ml-auto underline" style={{ color: "#B5933F" }}>
                    Limpiar selección
                  </button>
                )}
              </div>
              {/* months */}
{/* months */}
<div className="flex items-center gap-3">
  <button
    type="button"
    onClick={() => canGoBack && setMonthOffset(o => o - 1)}
    disabled={!canGoBack}
    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition"
    style={{
      border: "1px solid #DCE2E9",
      color: canGoBack ? "#44536A" : "#ccc",
      cursor: canGoBack ? "pointer" : "not-allowed",
      background: "#fff",
    }}
    aria-label="Meses anteriores"
  >
    {Icons.arrowL}
  </button>

  <div style={{ display: "flex", gap: "36px", flex: 1 }}>
    {months.map(m => (
      <CalendarMonth
        key={`${m.year}-${m.month}`}
        year={m.year}
        month={m.month}
        sel={sel}
        onPick={handleDayPick}
        availability={property.availability}
      />
    ))}
  </div>

  <button
    type="button"
    onClick={() => setMonthOffset(o => o + 1)}
    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition"
    style={{ border: "1px solid #DCE2E9", color: "#44536A", cursor: "pointer", background: "#fff" }}
    aria-label="Meses siguientes"
  >
    {Icons.arrowR}
  </button>
</div>
              <p className="mt-4 text-xs" style={{ color: "#67717F" }}>
                Tocá los días disponibles para armar tu reserva. El equipo confirma disponibilidad por WhatsApp.
              </p>
            </div>

          </div>

          {/* ─ RIGHT: STICKY PANEL ─ */}
          <div style={{ position: "sticky", top: "104px" }}>
            <div style={{ border: "1px solid #DCE2E9", borderRadius: "28px", boxShadow: "0 14px 40px rgba(42,51,64,.14)", padding: "26px" }}>

              {/* intercambio: OFRECE block */}
              {property.category === 1 ? (
                <div className="mb-5">
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".13em", textTransform: "uppercase", color: "#4F9C7C", display: "block", marginBottom: 6 }}>Ofrece</span>
                  <p style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-.015em", color: "#14171B", lineHeight: 1.2, marginBottom: 4 }}>{property.title}</p>
                  <p style={{ fontSize: 13, color: "#67717F" }}>{property.destinationName}{property.neighborhood ? ` · ${property.neighborhood}` : ""}</p>
                </div>
              ) : (
                /* price — alquiler/compra */
                property.price ? (
                  <div className="flex items-baseline gap-2 mb-4">
                    <span style={{ fontSize: "15px", color: "#67717F" }}>Desde</span>
                    <span style={{ fontSize: "32px", fontWeight: 600, color: "#B5933F", letterSpacing: "-.02em" }}>
                      ${property.price.toLocaleString("es-AR")}
                    </span>
                    <span style={{ fontSize: "15px", color: "#67717F" }}>/ noche</span>
                  </div>
                ) : (
                  <p className="mb-4 text-lg font-semibold" style={{ color: "#1a1a2e" }}>Precio a consultar</p>
                )
              )}

              {/* selected dates display */}
              {sel.in && (
                <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "#EDF0F4", color: "#44536A" }}>
                  {sel.out
                    ? `${sel.in} → ${sel.out} · ${nights} noche${nights !== 1 ? "s" : ""}`
                    : `Check-in: ${sel.in} — elegí check-out`}
                </div>
              )}

              {/* rates — solo alquiler/compra */}
              {property.category !== 1 && rates.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a2e" }}>Tarifas por temporada</span>
                    <span style={{ fontSize: "13px", color: "#67717F" }}>{rates.length} temporadas</span>
                  </div>
                  <div>
                    {visibleRates.map((r, i) => (
                      <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #EDF0F4" }}>
                        <span style={{ fontSize: "14.5px", color: "#67717F" }}>{r.label}</span>
                        <span style={{ fontSize: "16px", fontWeight: 600, color: "#14171B", letterSpacing: "-.01em" }}>
                          <span style={{ color: "#B5933F", fontWeight: 500, fontSize: ".78em", marginRight: ".1em" }}>$</span>
                          {r.pricePerNight?.toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))}
                  </div>
                  {rates.length > VISIBLE && (
                    <button
                      onClick={() => setRatesOpen(o => !o)}
                      className="w-full flex items-center justify-center gap-2 mt-3 py-2 rounded-full text-sm font-semibold transition"
                      style={{ border: "1px solid #EDF0F4", color: "#44536A" }}
                    >
                      {ratesOpen ? "Ver menos" : `Ver todas las tarifas`}
                      <span style={{ transform: ratesOpen ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform .2s" }}>
                        {Icons.chevDown}
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* CTA consultar */}
              <a
                href={whatsappLink(consultMsg)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-full mb-3 hover:opacity-90 transition"
                style={{ background: "#C9AB55", color: "#1a1a2e", fontSize: "15px" }}
              >
                {Icons.wa}
                Consultar disponibilidad
              </a>

              {/* CTA intercambio */}
              {property.category === 1 && (
                <a
                  href={whatsappLink(swapMsg)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-full mb-3 hover:opacity-90 transition"
                  style={{ background: "#6BB595", color: "#0e3326", fontSize: "15px" }}
                >
                  {Icons.swap}
                  Proponer intercambio
                </a>
              )}

              {/* nota */}
              <p className="text-center" style={{ fontSize: "12.5px", color: "#67717F" }}>
                Te confirmamos el valor exacto por WhatsApp
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── OTRAS CASAS CERCA ── */}
      {relatedItems.length > 0 && (
        <section className="mt-16 py-16" style={{ background: "#F5F7F9" }}>
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#B5933F" }}>Quizás también te gusten</p>
                <h2 style={{ fontSize: "clamp(28px,3vw,36px)", fontWeight: 300, color: "#1a1a2e" }}>Otras casas cerca</h2>
              </div>
              <Link to={`/${CATEGORY_ROUTE[property.category]}`} className="text-sm hover:underline" style={{ color: "#67717F" }}>
                Ver todas →
              </Link>
            </div>
            <HorizontalCarousel id="rel-rail">
              {relatedItems.map(p => (
                <div key={p.id} className="flex-shrink-0" style={{ width: "320px" }}>
                  <PropertyCard property={p} />
                </div>
              ))}
            </HorizontalCarousel>
          </div>
        </section>
      )}

      {/* ── LIGHTBOX ── */}
      {lbOpen && <Lightbox images={rawImages} initialIndex={lbIdx} onClose={closeLb} />}
    </div>
  )
}