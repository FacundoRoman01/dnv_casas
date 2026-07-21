import { Link } from "react-router-dom"

// Colores y etiquetas por categoría. Las claves 0/1/2 son el enum de categoría
// que manda el back como int (0 alquiler, 1 intercambio, 2 compra).
const TAG_STYLES = {
  0: { bg: "#C9AB55", color: "#2A3340" },
  1: { bg: "#6BB595", color: "#0e3326" },
  2: { bg: "#44536A", color: "#fff" },
}
const TAG_LABELS = { 0: "Alquiler", 1: "Intercambio", 2: "Compra" }

const FALLBACK = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600"

/**
 * Card de propiedad del catálogo (alquiler/intercambio/compra) y del carrusel de
 * destacadas del home. Toda la tarjeta es un Link a la ficha.
 * Props: `property` (objeto del back) y `variant`:
 *   - "default": muestra según property.category, con fila de precio.
 *   - "swap": fuerza modo intercambio (acento verde, sin precio), para el listado
 *     de intercambios donde el precio no aplica.
 */
// variant: "default" | "swap"
// "swap" forces intercambio display (green accent, no price row)
export default function PropertyCard({ property, variant = "default" }) {
  const isSwap = variant === "swap"
  const cover = property.coverImageUrl || FALLBACK
  // Categoría efectiva: en modo swap forzamos 1 (intercambio); si no, la del back (default 0).
  const cat = isSwap ? 1 : (property.category ?? 0)
  const tag = TAG_STYLES[cat] ?? TAG_STYLES[0]
  // Compra (cat 2) tiene su propia ruta de ficha; el resto van a /propiedad.
  const detailPath = cat === 2 ? `/compras/${property.id}` : `/propiedad/${property.id}`

  // Sólo mostramos precio si no es swap y viene un número > 0; si no, "A consultar".
  const hasPrice = !isSwap && property.price && property.price > 0
  const priceFmt = hasPrice ? property.price.toLocaleString("es-AR") : null
  const currency = property.currency ?? "ARS"
  const curSymbol = currency === "USD" ? "USD" : "$"
  // En compra el precio es total (sin sufijo); en alquiler/intercambio es por noche.
  const per = cat === 2 ? "" : "/ noche"

  const pinColor = isSwap ? "#6BB595" : "#B5933F"
  const arrowHoverBg = isSwap ? "#6BB595" : "#C9AB55"
  const arrowHoverStroke = isSwap ? "#0e3326" : "#2A3340"

  return (
    <Link
      to={detailPath}
      className="group block"
      style={{
        width: "340px",
        background: "#fff",
        borderRadius: "28px",
        overflow: "hidden",
        border: "1px solid #E9EDF2",
        boxShadow: "0 4px 14px rgba(20,23,27,.08)",
        display: "block",
        transition: "transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s cubic-bezier(.16,1,.3,1)",
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
      <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
        <img
          src={cover}
          alt={property.title}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform .9s cubic-bezier(.16,1,.3,1)",
          }}
          className="group-hover:scale-[1.06]"
        />

        {/* Category tag */}
        <div style={{ position: "absolute", top: 14, left: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 11px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: "rgba(20,23,27,.52)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,.22)",
              color: "#fff",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: tag.bg,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {TAG_LABELS[cat]}
          </span>
        </div>

        {/* Fav button — only on non-swap */}
        {!isSwap && (
          <button
            aria-label="Guardar en favoritos"
            onClick={e => e.preventDefault()}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(255,255,255,.12)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,.25)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <svg width={18} height={18} fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "20px 22px 22px" }}>
        {/* Location */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "#67717F", marginBottom: 8 }}>
          <svg width={15} height={15} fill="none" stroke={pinColor} strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {property.destinationName}
          {property.neighborhood ? ` · ${property.neighborhood}` : ""}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 21, fontWeight: 500, letterSpacing: "-.015em", marginBottom: 14, color: "#14171B", lineHeight: 1.2 }}>
          {property.title}
        </h3>

        {/* Specs */}
        <div style={{ display: "flex", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          {property.capacity > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "#67717F" }}>
              <svg width={17} height={17} fill="none" stroke="#44536A" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              {property.capacity}
            </span>
          )}
          {property.bedrooms > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "#67717F" }}>
              <svg width={17} height={17} fill="none" stroke="#44536A" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {property.bedrooms} dorm
            </span>
          )}
          {property.bathrooms > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 14, color: "#67717F" }}>
              <svg width={17} height={17} fill="none" stroke="#44536A" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {property.bathrooms} baños
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #E9EDF2", paddingTop: 16 }}>
          {isSwap ? (
            <span style={{ fontSize: 14, color: "#4F9C7C", fontWeight: 600 }}>Disponible para intercambio</span>
          ) : (
            <div>
              {hasPrice ? (
                <span style={{ fontSize: 21, color: "#14171B", fontWeight: 500, letterSpacing: "-.01em" }}>
                  <span style={{ color: "#B5933F", fontWeight: 600, fontSize: ".78em", marginRight: ".1em" }}>{curSymbol}</span>
                  {priceFmt}
                  {per && <span style={{ fontSize: 14, fontWeight: 400, color: "#67717F", marginLeft: 4 }}>{per}</span>}
                </span>
              ) : (
                <span style={{ fontSize: 14, color: "#67717F", fontStyle: "italic" }}>A consultar</span>
              )}
            </div>
          )}

          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#EDF0F4",
              display: "grid",
              placeItems: "center",
              transition: "background .3s, transform .4s cubic-bezier(.16,1,.3,1)",
              [`--hover-bg`]: arrowHoverBg,
            }}
            className={isSwap ? "group-hover:bg-[#6BB595] group-hover:translate-x-1" : "group-hover:bg-[#C9AB55] group-hover:translate-x-1"}
          >
            <svg width={18} height={18} fill="none" stroke="#44536A" strokeWidth={2} viewBox="0 0 24 24"
              className={isSwap ? "group-hover:stroke-[#0e3326]" : "group-hover:stroke-[#2A3340]"}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

        {/* Price note (alquiler only) */}
        {!isSwap && cat === 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 13, color: "#67717F" }}>
            <svg width={14} height={14} fill="none" stroke="#B5933F" strokeWidth={1.5} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>El precio varía según la fecha</span>
          </div>
        )}
      </div>
    </Link>
  )
}
