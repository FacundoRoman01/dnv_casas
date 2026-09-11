import { useState } from "react"
import { Link } from "react-router-dom"
import { useProperties, useDestinations } from "../hooks/useProperties"
import { whatsappLink } from "../lib/whatsapp"
import { fmtPrice } from "../lib/format"
import { usePageMeta } from "../hooks/usePageMeta"
import comprarcasas from "../assets/images/dnvcasas-comprarcasas.jpg"
import ventacasas from "../assets/images/hero_venta.webp"


/**
 * Página del catálogo de COMPRAS (categoría "compras" = int 2 en el back).
 * Es su propia página, separada de Listings (que maneja alquileres/intercambios).
 * Muestra un hero, chips para filtrar por destino, la grilla de propiedades en
 * venta y una sección de "acompañamiento". Toda operación se cierra por WhatsApp:
 * no hay checkout ni pagos online.
 */

/* ── SVG icons ─────────────────────────────────────────── */
const Bed = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#44536A" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v10M21 7v10M3 12h18M7 8a2 2 0 012-2h6a2 2 0 012 2v4H7V8z"/>
  </svg>
)
const Bath = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#44536A" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13h18v2a7 7 0 01-7 7H10a7 7 0 01-7-7v-2z"/>
    <path d="M5 13V7a2 2 0 012-2h2a2 2 0 012 2v1"/>
  </svg>
)
const Ruler = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#44536A" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10v4M10 10v4M14 10v4M18 10v4"/>
  </svg>
)
const Land = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#44536A" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l18 18M3 12V3h9M21 12v9h-9"/>
  </svg>
)
const ArrowR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
)
const WaIco = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.373 0 0 5.373 0 12c0 2.04.518 3.959 1.428 5.642L0 24l6.584-1.729A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.576-.48-5.077-1.319l-.366-.218-3.907 1.026 1.043-3.808-.237-.393A10 10 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
)


// Tarjeta de una propiedad en venta dentro de la grilla. Recibe la property y
// arma el precio formateado (fmtPrice) y el link de WhatsApp para agendar visita.
function VCard({ property }) {
  const f = fmtPrice(property.price, property.currency)
  // Link a WhatsApp con el mensaje ya armado: acá se cierra la operación (visita).
  const waVisit = whatsappLink(
    `Hola 👋 ¿Puedo coordinar una *visita* a *${property.title}* (${property.destinationName})?`
  )
  const cover = property.coverImageUrl ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"

  return (
    <article
      style={{
        background: "#fff", border: "1px solid #E9EDF2",
        borderRadius: 28, overflow: "hidden",
        boxShadow: "0 4px 14px rgba(20,23,27,.08)",
        transition: "transform .4s ease, box-shadow .4s ease",
        display: "flex", flexDirection: "column",
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
      {/* Media */}
      <div style={{ position: "relative", aspectRatio: "16/11", overflow: "hidden" }}>
        <img src={cover} alt={property.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .9s ease" }}
        />
        {/* Glass tag */}
        <div style={{ position: "absolute", top: 14, left: 14 }}>
          <span style={{
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.25)", color: "#fff",
            padding: "5px 13px", borderRadius: 999, fontSize: 13, fontWeight: 600,
          }}>En venta</span>
        </div>
        {/* Price badge */}
        {property.price > 0 && (
          <div style={{
            position: "absolute", left: 14, bottom: 14,
            background: "#2A3340", color: "#fff",
            padding: "9px 16px", borderRadius: 999,
            fontWeight: 600, fontSize: 18,
            boxShadow: "0 14px 40px rgba(42,51,64,.14)",
          }}>
            <span style={{ color: "#D8C078", fontWeight: 500, fontSize: ".72em", marginRight: ".15em" }}>{f.cur}</span>
            {f.num}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "22px 24px 24px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Location */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#67717F", marginBottom: 7 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B5933F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {property.destinationName}
          {property.neighborhood ? ` · ${property.neighborhood}` : ""}
        </div>

        {/* Title */}
        <Link to={`/compras/${property.id}`} style={{ color: "inherit", textDecoration: "none" }}>
          <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-.015em", marginBottom: 10, lineHeight: 1.2 }}>
            {property.title}
          </h3>
        </Link>

        {/* Description */}
        {property.description && (
          <p style={{ fontSize: 14.5, color: "#67717F", lineHeight: 1.55, marginBottom: 18, flex: "none" }}>
            {property.description.length > 100 ? property.description.slice(0, 100) + "…" : property.description}
          </p>
        )}

        {/* Specs */}
        <div style={{
          display: "flex", gap: 18, flexWrap: "wrap",
          padding: "16px 0",
          borderTop: "1px solid #E9EDF2",
          borderBottom: "1px solid #E9EDF2",
          marginBottom: 18,
        }}>
          {property.bedrooms > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "#14171B", fontWeight: 500 }}>
              <Bed /> {property.bedrooms} <small style={{ color: "#67717F", fontWeight: 400 }}>dorm</small>
            </span>
          )}
          {property.bathrooms > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "#14171B", fontWeight: 500 }}>
              <Bath /> {property.bathrooms} <small style={{ color: "#67717F", fontWeight: 400 }}>baños</small>
            </span>
          )}
          {property.squareMeters > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "#14171B", fontWeight: 500 }}>
              <Ruler /> {property.squareMeters} <small style={{ color: "#67717F", fontWeight: 400 }}>m²</small>
            </span>
          )}
          {property.landSize && property.landSize !== "—" && (
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "#14171B", fontWeight: 500 }}>
              <Land /> {property.landSize} <small style={{ color: "#67717F", fontWeight: 400 }}>lote</small>
            </span>
          )}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
          <Link
            to={`/compras/${property.id}`}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "13px 18px", fontSize: 14.5, fontWeight: 600,
              borderRadius: 999, background: "#C9AB55", color: "#1a1a2e", textDecoration: "none",
            }}
          >
            Ver propiedad <ArrowR />
          </Link>
          <a
            href={waVisit} target="_blank" rel="noopener noreferrer"
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              padding: "13px 18px", fontSize: 14.5, fontWeight: 600,
              borderRadius: 999, background: "transparent", color: "#14171B",
              border: "1.5px solid #DCE2E9", textDecoration: "none",
            }}
          >
            Agendar visita
          </a>
        </div>
      </div>
    </article>
  )
}

export default function Compras() {
  usePageMeta("Propiedades en venta", "Casas y terrenos en venta en los mejores destinos de Argentina.")
  // activeId = destino elegido en los chips (null = "Todos").
  const [activeId, setActiveId] = useState(null)
  const { destinations } = useDestinations()
  // Traemos la data vía hook useProperties. category: 2 = compras (enum int del back).
  // Si hay destino elegido, lo agregamos como destinationId. pageSize alto para
  // traer todo el inventario de compras de una (sin paginar en esta página).
  const { data, loading } = useProperties({
    category: 2,
    ...(activeId ? { destinationId: activeId } : {}),
    pageSize: 100,
  })
  const properties = data.items || []
  const filtered = properties

  // Link de arranque: acá se cierra la operación, la primera charla es por WhatsApp.
  const waStart = whatsappLink("Hola 👋 Quiero comprar una propiedad. ¿Me ayudan a encontrarla?")

  return (
   <div className="overflow-x-hidden">
      {/* ── Hero banner ───────────────────────────────────── */}
      <section style={{ position: "relative", padding: "150px 0 56px", overflow: "hidden", color: "#fff" }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <img
            src={ventacasas}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          /> 
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg,rgba(34,40,49,.62),rgba(34,40,49,.86))",
          }} />
        </div>
<div className="mx-auto px-6" style={{ position: "relative", zIndex: 2, maxWidth: 680 }}>
  <span style={{
    fontSize: 13, fontWeight: 700, letterSpacing: ".12em",
    textTransform: "uppercase", color: "#D8C078",
  }}>En venta</span>
  <h1 style={{
    fontWeight: 200, fontSize: "clamp(38px,5.4vw,72px)",
    letterSpacing: "-.03em", lineHeight: 1, margin: "16px 0 18px",
    color: "#ffffff"
  }}>
    Comprá tu lugar en{" "}
    <em style={{ fontStyle: "normal", color: "#D8C078" }}>el lugar que amás</em>
  </h1>
  <p style={{ fontSize: 18, color: "rgba(255,255,255,.88)", lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
    Explorá nuestro catálogo de propiedades y encontrá la opción ideal para vos. Nosotros te acompañamos en cada etapa de la compra.
  </p>

  {/* Bloque agregado según la imagen */}
  <div style={{ marginTop: 40 }}>
    <h2 style={{ fontSize: 28, fontWeight: 300, color: "#ffffff", marginBottom: 12 }}>
      ¿Querés vender tu propiedad?
    </h2>
    <p style={{ fontSize: 16, color: "rgba(255,255,255,.8)", lineHeight: 1.6, maxWidth: 520, marginBottom: 24 }}>
      Sumate a nuestro catálogo. Escribinos y te explicamos nuestro proceso de venta.
    </p>
<a 
  href={`https://wa.me/${import.meta.env.VITE_WHATSAPP}?text=Hola,%20quiero%20consultar%20sobre%20la%20venta%20de%20mi%20propiedad`} 
  target="_blank" 
  rel="noopener noreferrer"
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    background: "#D8C078",
    color: "#14171B",
    fontWeight: 600,
    fontSize: 15,
    padding: "14px 28px",
    borderRadius: "9999px",
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
  }}
>
      <svg width={20} height={20} fill="currentColor" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
      Consultar por WhatsApp
    </a>
  </div>

  {/* <div style={{ display: "flex", gap: 40, marginTop: 34, flexWrap: "wrap" }}>
    {[
      [loading ? "—" : properties.length, "propiedades en venta"],
      // Sale de la API: estaba hardcodeado en "5" y hay 6 destinos.
      [destinations.length || "—", "destinos"],
      ["0%", "comisión oculta"],
    ].map(([val, label]) => (
      <div key={label}>
        <b style={{ fontSize: 30, fontWeight: 300, display: "block", letterSpacing: "-.02em" }}>{val}</b>
        <span style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)" }}>{label}</span>
      </div>
    ))}
  </div> */}
</div>
      </section>

      {/* ── Sticky filter chips ───────────────────────────── */}
      <div style={{
        position: "sticky", top: 58, zIndex: 30,
        background: "rgba(245,247,249,.9)", backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid #E9EDF2",
      }}>
      <div className="max-w-7xl mx-auto px-6" style={{ padding: "14px 0" }}>
  {/* Línea 1: label + contador, siempre en una fila (texto corto, no se
      desborda en ningún ancho). */}
  <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
    <span style={{ fontSize: 13.5, fontWeight: 600, color: "#67717F" }}>Destino</span>
    <span style={{ fontSize: 14.5, color: "#67717F" }}>
      <b style={{ color: "#14171B", fontWeight: 600 }}>{filtered.length}</b> resultados
    </span>
  </div>

  {/* Línea 2: chips como carrusel horizontal con scroll táctil (swipe),
      sin wrap — mismo patrón que Airbnb/Booking para filtros en mobile.
      -mx-6 px-6 extiende el área de scroll hasta el borde de la pantalla
      (mejor UX táctil) sin romper el max-w-7xl del contenedor padre. */}
  <div
    className="flex gap-2 overflow-x-auto -mx-6 px-6"
    style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
  >
    {/* "Todos" chip */}
    <button
      onClick={() => setActiveId(null)}
      className="flex-shrink-0 whitespace-nowrap"
      style={{
        padding: "9px 16px", borderRadius: 999, cursor: "pointer",
        border: `1.5px solid ${activeId === null ? "#44536A" : "#DCE2E9"}`,
        background: activeId === null ? "#44536A" : "#fff",
        fontSize: 14, fontWeight: 500,
        color: activeId === null ? "#fff" : "#67717F",
        transition: "all .2s",
      }}
    >Todos</button>
    {destinations.map(d => (
      <button
        key={d.id}
        onClick={() => setActiveId(d.id)}
        className="flex-shrink-0 whitespace-nowrap"
        style={{
          padding: "9px 16px", borderRadius: 999, cursor: "pointer",
          border: `1.5px solid ${activeId === d.id ? "#44536A" : "#DCE2E9"}`,
          background: activeId === d.id ? "#44536A" : "#fff",
          fontSize: 14, fontWeight: 500,
          color: activeId === d.id ? "#fff" : "#67717F",
          transition: "all .2s",
        }}
      >{d.name}</button>
    ))}
  </div>
</div>
      </div>

      {/* ── Grid ─────────────────────────────────────────── */}
      <div style={{ padding: "50px 0 80px", background: "#F5F7F9" }}>
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <p style={{ color: "#67717F", fontSize: 16 }}>Cargando propiedades...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "#67717F", fontSize: 16 }}>No hay propiedades en venta en este destino por el momento.</p>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))",
              gap: 30,
            }}>
              {filtered.map(p => <VCard key={p.id} property={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Acompañamiento ───────────────────────────────── */}
      <section style={{ background: "#2A3340", color: "#fff", padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 md:grid-cols-2" style={{
  gap: 56, alignItems: "center",
}}>
            <div>
              <span style={{
                fontSize: 13, fontWeight: 700, letterSpacing: ".12em",
                textTransform: "uppercase", color: "#D8C078",
              }}>Acompañamiento</span>
              <h2 style={{
                fontWeight: 300, fontSize: "clamp(30px,3.6vw,46px)",
                letterSpacing: "-.025em", lineHeight: 1.05,
                margin: "14px 0 16px",
              }}>
                Comprar lejos de casa,{" "}
                <em style={{ fontStyle: "normal", color: "#D8C078" }}>sin sentirte solo</em>
              </h2>
              <p style={{ color: "rgba(255,255,255,.78)", fontSize: 17, lineHeight: 1.6, marginBottom: 28, maxWidth: 480 }}>
                No somos un portal de avisos. Te acompañamos desde la primera visita virtual hasta la firma, con gente que conoce cada destino.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[
                  ["1", "Charlamos por WhatsApp", "Nos contás qué buscás y tu presupuesto. Sin formularios."],
                  ["2", "Te mostramos opciones reales", "Fotos, videos y visitas. Solo lo que encaja con vos."],
                  ["3", "Coordinamos la operación", "Te acompañamos con escribanía y papeles hasta la firma."],
                ].map(([n, title, desc]) => (
                  <div key={n} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <span style={{
                      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                      background: "rgba(201,171,85,.18)", color: "#D8C078",
                      display: "grid", placeItems: "center", fontWeight: 600, fontSize: 15,
                    }}>{n}</span>
                    <div>
                      <b style={{ fontWeight: 600, display: "block", marginBottom: 3 }}>{title}</b>
                      <span style={{ color: "rgba(255,255,255,.66)", fontSize: 14.5 }}>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href={waStart} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, marginTop: 30,
                  padding: "15px 28px", borderRadius: 999,
                  background: "#C9AB55", color: "#1a1a2e",
                  fontWeight: 700, fontSize: 15.5, textDecoration: "none",
                }}
              >
                <WaIco /> Empezar por WhatsApp
              </a>
            </div>
            <div style={{
              borderRadius: 36, overflow: "hidden",
              boxShadow: "0 30px 80px rgba(42,51,64,.22)", aspectRatio: "4/3",
            }}>
              <img
                src={comprarcasas}
                alt="Casa en venta"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
