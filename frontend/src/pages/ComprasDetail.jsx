import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useProperty, useProperties } from "../hooks/useProperties"
import { usePageMeta } from "../hooks/usePageMeta"
import { whatsappLink, propertyMessage } from "../lib/whatsapp"
import Lightbox from "../components/ui/Lightbox"
import { fmtPrice } from "../lib/format"

/**
 * Detalle de una propiedad en VENTA (categoría compras). Se llega desde
 * /compras/:id. Muestra mosaico de fotos (con Lightbox), specs, descripción,
 * un panel sticky con precio y CTAs, y propiedades relacionadas.
 * El cierre de la operación es siempre por WhatsApp: los botones "Consultar" y
 * "Agendar visita" abren wa.me con el texto ya armado.
 */

/* ── design tokens ─────────────────────────────────────── */
const C = {
  gold: "#C9AB55", goldSoft: "#D8C078", goldDeep: "#B5933F",
  navy: "#44536A", navy700: "#2A3340",
  sage: "#6BB595", sageDeep: "#4F9C7C",
  paper: "#F5F7F9", paper2: "#EDF0F4",
  line: "#DCE2E9", lineSoft: "#E9EDF2",
  ink: "#14171B", muted: "#67717F", muted2: "#8B94A1",
}

/* ── SVG icons ─────────────────────────────────────────── */
const I = {
  bed: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v10M21 7v10M3 12h18M7 8a2 2 0 012-2h6a2 2 0 012 2v4H7V8z"/>
    </svg>
  ),
  bath: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13h18v2a7 7 0 01-7 7H10a7 7 0 01-7-7v-2z"/>
      <path d="M5 13V7a2 2 0 012-2h2a2 2 0 012 2v1"/>
    </svg>
  ),
  ruler: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10v4M10 10v4M14 10v4M18 10v4"/>
    </svg>
  ),
  land: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18M3 12V3h9M21 12v9h-9"/>
    </svg>
  ),
  pin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.goldDeep} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  tag: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <circle cx="7" cy="7" r="1.5" fill={C.navy}/>
    </svg>
  ),
  check: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sageDeep} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  car: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sageDeep} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="9" width="22" height="11" rx="2"/><path d="M5 9l2-4h10l2 4"/>
      <circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>
    </svg>
  ),
  wa: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.373 0 0 5.373 0 12c0 2.04.518 3.959 1.428 5.642L0 24l6.584-1.729A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.576-.48-5.077-1.319l-.366-.218-3.907 1.026 1.043-3.808-.237-.393A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  ),
  cal: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  chevronL: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronR: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  close: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  infoSm: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.sageDeep} strokeWidth={2} strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
    </svg>
  ),
}


const UNSPLASH = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

/* ── Mosaic ────────────────────────────────────────────── */
// Grilla de fotos (5 celdas en desktop, 1 en mobile). Recibe images, el title
// para el alt, y onOpen(i) que abre el Lightbox en la foto i.
function Mosaic({ images, title, onOpen }) {
  const imgs = images.slice(0, 5)
  while (imgs.length < 5) imgs.push(images[imgs.length % images.length] || images[0])

  return (
    <>
      {/* Desktop mosaic */}
      <div className="hidden md:grid" style={{
        gridTemplateColumns: "1.4fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 12, height: 480,
        borderRadius: 28, overflow: "hidden",
      }}>
        {imgs.map((src, i) => (
          <figure
            key={i}
            style={{
              margin: 0, position: "relative", overflow: "hidden", cursor: "pointer",
              ...(i === 0 ? { gridRow: "1/3" } : {}),
            }}
            onClick={() => onOpen(i)}
          >
            <img
              src={src}
              alt={title}
              loading={i === 0 ? "eager" : "lazy"}
              style={{
                width: "100%", height: "100%", objectFit: "cover",
                transition: "transform .8s ease",
              }}
              onMouseEnter={e => e.target.style.transform = "scale(1.05)"}
              onMouseLeave={e => e.target.style.transform = ""}
            />
            {i === 4 && (
              <span style={{
                position: "absolute", right: 16, bottom: 16,
                background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.25)", color: "#fff",
                padding: "11px 18px", borderRadius: 999, fontSize: 14, fontWeight: 600,
              }}>
                Ver las {images.length} fotos
              </span>
            )}
          </figure>
        ))}
      </div>

      {/* Mobile: single cover image */}
      <div
        className="md:hidden relative overflow-hidden cursor-pointer"
        style={{ borderRadius: 20, aspectRatio: "4/3" }}
        onClick={() => onOpen(0)}
      >
        <img src={imgs[0]} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        {images.length > 1 && (
          <span style={{
            position: "absolute", right: 12, bottom: 12,
            background: "rgba(20,23,27,.6)", backdropFilter: "blur(8px)",
            color: "#fff", padding: "7px 14px", borderRadius: 999,
            fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
          }}>
            Ver las {images.length} fotos
          </span>
        )}
      </div>
    </>
  )
}

/* ── VPanel (sale panel) ───────────────────────────────── */
// Panel sticky de venta. Recibe la property y f (precio ya formateado). Arma
// dos links de WhatsApp (consultar / visita), donde se cierra la operación.
function VPanel({ property, f, sticky = true }) {
  // "Consultar" es el interés genérico: ahí manda el mensaje que cargó el admin.
  // "Coordinar visita" es específico de una acción que ese mensaje no expresa,
  // así que mantiene su texto.
  const waConsultar = whatsappLink(
    propertyMessage(property) ||
    `Hola 👋 Me interesa *${property.title}* (${property.destinationName}), publicada en venta a ${f.cur}${f.num}. ¿Me pasan más información?`
  )
  const waVisita = whatsappLink(
    `Hola 👋 ¿Puedo coordinar una *visita* a *${property.title}* (${property.destinationName})?`
  )

  const specs = []
  if (property.bedrooms > 0) specs.push({ icon: I.bed, k: "Dormitorios", v: property.bedrooms })
  if (property.bathrooms > 0) specs.push({ icon: I.bath, k: "Baños", v: property.bathrooms })
  if (property.squareMeters > 0) specs.push({ icon: I.ruler, k: "Cubiertos", v: `${property.squareMeters} m²` })
  if (property.landSize && property.landSize !== "—") specs.push({ icon: I.land, k: "Terreno", v: property.landSize })

  return (
    <div style={{
      position: sticky ? "sticky" : "static", top: 104,
      border: `1px solid ${C.line}`, borderRadius: 28,
      boxShadow: "0 14px 40px rgba(42,51,64,.14)",
      padding: 26, background: "#fff",
    }}>
      {/* Tag */}
      <div style={{ marginBottom: 14 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px", borderRadius: 999,
          background: C.navy700, color: "#fff", fontSize: 13, fontWeight: 600,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4" fill="#D8C078"/>
          </svg>
          En venta
        </span>
      </div>

      {/* Price */}
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-.025em", color: C.ink }}>
          <span style={{ color: C.goldDeep, fontWeight: 500, fontSize: ".62em", marginRight: ".12em" }}>{f.cur}</span>
          {f.num}
        </span>
      </div>
      <div style={{ fontSize: 14.5, color: C.muted, fontWeight: 500, marginBottom: 22 }}>
        {property.destinationName}
      </div>

      {/* Specs grid */}
      {specs.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
          background: C.lineSoft, border: `1px solid ${C.lineSoft}`,
          borderRadius: 14, overflow: "hidden", marginBottom: 22,
        }}>
          {specs.map(({ icon, k, v }) => (
            <div key={k} style={{ background: "#fff", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{
                fontSize: 11.5, fontWeight: 600, letterSpacing: ".06em",
                textTransform: "uppercase", color: C.muted2,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {icon} {k}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: "-.01em" }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTAs */}
      <a
        href={waConsultar} target="_blank" rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "15px 18px", marginBottom: 10,
          borderRadius: 999, background: C.gold, color: C.navy700,
          fontWeight: 700, fontSize: 15.5, textDecoration: "none",
        }}
      >
        {I.wa} Consultar
      </a>
      <a
        href={waVisita} target="_blank" rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "15px 18px",
          borderRadius: 999, background: "transparent",
          border: `1.5px solid ${C.line}`, color: C.ink,
          fontWeight: 600, fontSize: 15.5, textDecoration: "none",
        }}
      >
        {I.cal} Agendar visita
      </a>

      {/* Note */}
      <div style={{
        marginTop: 16, fontSize: 12.5, color: C.muted,
        textAlign: "center", lineHeight: 1.5,
        display: "flex", gap: 8, alignItems: "center", justifyContent: "center",
      }}>
        {I.infoSm}
        <span>Te acompañamos en toda la operación, sin comisiones ocultas.</span>
      </div>
    </div>
  )
}

/* ── Related card ──────────────────────────────────────── */
// Tarjeta chica de "otras propiedades en venta". Recibe la property y linkea
// a su detalle. fmtPrice arma el precio (moneda + número separados).
function RelCard({ property }) {
  const f = fmtPrice(property.price, property.currency)
  const cover = property.coverImageUrl ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
  return (
    <Link
      to={`/compras/${property.id}`}
      style={{
        width: 320, flexShrink: 0, display: "block", textDecoration: "none", color: "inherit",
        background: "#fff", border: `1px solid ${C.lineSoft}`, borderRadius: 28,
        overflow: "hidden", boxShadow: "0 4px 14px rgba(20,23,27,.08)",
        transition: "transform .4s ease, box-shadow .4s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)"
        e.currentTarget.style.boxShadow = "0 14px 40px rgba(42,51,64,.14)"
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ""
        e.currentTarget.style.boxShadow = "0 4px 14px rgba(20,23,27,.08)"
      }}
    >
      <div style={{ position: "relative", aspectRatio: "16/11", overflow: "hidden" }}>
        <img src={cover} alt={property.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <span style={{
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.25)", color: "#fff",
            padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
          }}>En venta</span>
        </div>
      </div>
      <div style={{ padding: "18px 20px 20px" }}>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
          {I.pin} {property.destinationName}
        </p>
        <h3 style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-.015em", marginBottom: 10, lineHeight: 1.2 }}>
          {property.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 20, fontWeight: 600 }}>
            <span style={{ color: C.goldDeep, fontWeight: 500, fontSize: ".72em" }}>{f.cur}</span>
            {f.num}
          </span>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", background: C.paper2,
            display: "grid", placeItems: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ── Main page ─────────────────────────────────────────── */
export default function ComprasDetail() {
  // id de la URL (/compras/:id) -> hook useProperty trae esa propiedad.
  const { id } = useParams()
  const { property, loading } = useProperty(id)
  usePageMeta(property?.title, property?.description?.slice(0, 155))
  // Traemos otras propiedades de compras (category: 2) para la sección relacionada.
  const { data: relData } = useProperties({ category: 2 })
  // Estado del Lightbox: si está abierto y qué foto mostrar.
  const [lbOpen, setLbOpen] = useState(false)
  const [lbIdx, setLbIdx] = useState(0)

  const related = property
    ? (relData.items || []).filter(p => p.id !== property.id).slice(0, 4)
    : []

  if (loading) {
    return (
      <div style={{ paddingTop: 140, minHeight: "60vh", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <p style={{ color: C.muted, fontSize: 16 }}>Cargando propiedad...</p>
      </div>
    )
  }
  if (!property) {
    return (
      <div style={{ paddingTop: 140, minHeight: "60vh", textAlign: "center" }}>
        <p style={{ color: C.muted }}>Propiedad no encontrada.</p>
        <Link to="/compras" style={{ color: C.goldDeep }}>Volver a Comprar</Link>
      </div>
    )
  }

  const f = fmtPrice(property.price, property.currency)

  // Armamos el array de imágenes ordenado por displayOrder. Si la propiedad no
  // trae fotos, caemos a la de portada (o una de Unsplash como último fallback).
  const rawImgs = property.images?.length
    ? [...property.images].sort((a, b) => a.displayOrder - b.displayOrder).map(img => img.url)
    : [property.coverImageUrl || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"]

  const amenities = (property.amenities || []).map(a => [I.check, a])

  const features = []
  if (property.bedrooms > 0) features.push({ icon: I.bed, label: "dormitorios", value: property.bedrooms })
  if (property.bathrooms > 0) features.push({ icon: I.bath, label: "baños", value: property.bathrooms })
  if (property.squareMeters > 0) features.push({ icon: I.ruler, label: "m² cubiertos", value: property.squareMeters })
  if (property.capacity > 0) features.push({ icon: I.check, label: "huéspedes", value: property.capacity })

  return (
    <>
      <div style={{ paddingTop: 108, background: "#fff" }}>
        <div className="max-w-6xl mx-auto px-6">
          {/* Breadcrumb */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13.5, color: C.muted, marginBottom: 12 }}>
            <Link to="/" style={{ color: C.muted, textDecoration: "none" }}>Inicio</Link>
            <span style={{ opacity: .5 }}>/</span>
            <Link to="/compras" style={{ color: C.muted, textDecoration: "none" }}>Comprar</Link>
            <span style={{ opacity: .5 }}>/</span>
            {property.destinationName && (
              <>
                <span style={{ color: C.muted }}>{property.destinationName}</span>
                <span style={{ opacity: .5 }}>/</span>
              </>
            )}
            <span>{property.title}</span>
          </div>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            gap: 24, flexWrap: "wrap", margin: "14px 0 22px",
          }}>
            <div>
              <h1 style={{
                fontSize: "clamp(30px,3.6vw,46px)", fontWeight: 300,
                letterSpacing: "-.025em", lineHeight: 1.02,
              }}>
                {property.title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12, flexWrap: "wrap", color: C.muted, fontSize: 14.5 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: C.ink, fontWeight: 600 }}>
                  {I.tag} En venta
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {I.pin} {property.destinationName}
                  {property.neighborhood ? ` · ${property.neighborhood}` : ""}
                </span>
                {property.googleMapsUrl && (
                  <a
                    href={property.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Ver ubicación de ${property.title} en Google Maps`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 12px", borderRadius: 999,
                      color: C.goldDeep, background: "rgba(201,171,85,.12)",
                      fontSize: 13, fontWeight: 600, textDecoration: "none",
                    }}
                  >
                    {I.pin} Ver ubicación en Google Maps ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Mosaic */}
          <Mosaic
            images={rawImgs}
            title={property.title}
            onOpen={i => { setLbIdx(i); setLbOpen(true) }}
          />

          {/* 2-col layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_392px]" style={{
            gap: 56, alignItems: "start", padding: "48px 0 90px",
          }}>
            {/* LEFT */}
            <div>
              {/* Features */}
              {features.length > 0 && (
                <div style={{ padding: "0 0 34px", borderBottom: `1px solid ${C.lineSoft}` }}>
                  <div style={{ display: "flex", gap: 30, flexWrap: "wrap" }}>
                    {features.map(({ icon, label, value }) => (
                      <span key={label} style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 15.5, color: C.ink }}>
                        <span style={{
                          width: 44, height: 44, borderRadius: 13,
                          background: C.paper2, display: "grid", placeItems: "center",
                          flexShrink: 0,
                        }}>{icon}</span>
                        <div><b>{value}</b> {label}</div>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sobre la propiedad */}
              <div style={{ padding: "34px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                <h2 style={{ fontSize: 26, fontWeight: 400, letterSpacing: "-.02em", marginBottom: 16 }}>
                  Sobre la propiedad
                </h2>
                {property.description && (
                  <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, margin: "0 0 14px" }}>
                    {property.description}
                  </p>
                )}
                <p style={{ color: C.muted, fontSize: 16, lineHeight: 1.7, margin: 0 }}>
                  Te acompañamos en toda la operación de compra: visita, tasación, escribanía y firma. Coordinás cada paso con una persona real por WhatsApp, sin comisiones ocultas.
                </p>
              </div>

              {/* Características */}
              <div style={{ padding: "34px 0" }}>
                <h3 style={{ fontSize: 19, fontWeight: 600, marginBottom: 14 }}>Características</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 30px" }}>
                  {amenities.map(([icon, text]) => (
                    <span key={text} style={{ display: "flex", alignItems: "center", gap: 10, color: C.ink, fontSize: 15 }}>
                      {icon} {text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — sticky panel */}
            <aside>
              <VPanel property={property} f={f} />
            </aside>
          </div>
        </div>
      </div>

    {/* Related */}
      {related.length > 0 && (
        <section style={{ background: C.paper, padding: "64px 0 80px" }}>
          {/* Mismo cambio de contenedor que arriba, para que la sección de
              relacionadas también respete el ancho máximo y el centrado. */}
          <div className="max-w-6xl mx-auto px-6">
          {/* Mismo patrón que "Otras casas cerca" en PropertyDetail.jsx: el
              título y "Ver todas" van en la misma fila, no un botón suelto
              debajo de las cards. */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 34, gap: 16, flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: C.goldDeep }}>
                  Más oportunidades
                </span>
                <h2 style={{ fontSize: 36, fontWeight: 300, letterSpacing: "-.02em", marginTop: 12, marginBottom: 0 }}>
                  Otras propiedades en venta
                </h2>
              </div>
              <Link
                to="/compras"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "12px 22px", borderRadius: 999,
                  border: `1.5px solid ${C.line}`, color: C.ink,
                  fontWeight: 600, fontSize: 14.5, textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                Ver todas
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
            <div style={{ display: "flex", gap: 26, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
              {related.map(p => <RelCard key={p.id} property={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lbOpen && (
        <Lightbox images={rawImgs} initialIndex={lbIdx} onClose={() => setLbOpen(false)} />
      )}
    </>
  )
}
