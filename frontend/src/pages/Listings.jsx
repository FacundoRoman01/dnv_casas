import { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useProperties, useDestinations, useNeighborhoods } from "../hooks/useProperties"
import PropertyCard from "../components/ui/PropertyCard"
import { whatsappLink } from "../lib/whatsapp"
import { CATEGORY_MAP, PROPERTY_TYPE_MAP, PROPERTY_TYPE_IMAP } from "../lib/constants"
import { usePageMeta } from "../hooks/usePageMeta"
import Modal from "../components/ui/Modal"

/**
 * Página del catálogo de ALQUILERES e INTERCAMBIOS (una sola página que sirve
 * a las dos categorías según la prop `type`). Compras tiene su propia página
 * aparte. Muestra hero con buscador, sidebar de filtros (sheet en mobile),
 * grilla de resultados paginada y estados vacíos. El contacto se cierra por
 * WhatsApp.
 */

// Config por tipo de página. La clave (alquileres/intercambios/compras) define
// textos y palabras de conteo. type llega como prop desde el router.
const CONFIG = {
  alquileres: {
    label: "Alquileres",
    breadcrumb: "Alquilar",
    title: "Encontrá tu próxima casa",
    subtitle: "Elegí destino y fechas para ver precios por noche.",
    countWord: "propiedades",
    metaTitle: "Alquileres temporales",
    metaDescription: "Encontrá tu casa ideal para alquilar en los mejores destinos de Argentina.",
  },
  intercambios: {
    label: "Intercambios",
    breadcrumb: "Intercambiar",
    title: "Intercambio de casas",
    subtitle: "Prestá la tuya y quedate en la de otra familia.",
    countWord: "familias",
    metaTitle: "Intercambio de casas",
    metaDescription: "Intercambiá tu casa con otras familias en destinos únicos de Argentina.",
  },
  compras: {
    label: "Compras",
    breadcrumb: "Comprar",
    title: "Propiedades en venta",
    subtitle: "Casas, departamentos y lotes en los destinos que más te gustan.",
    countWord: "propiedades",
  },
}

// Barra de búsqueda del hero (destino, fechas, huéspedes). Recibe los filtros
// actuales y updateFilter para modificarlos. No hace submit real: escribe en el
// estado de filtros que dispara el fetch más arriba.
function SearchBar({ filters, updateFilter, destinations }) {
  const divider = <div className="w-px my-3" style={{ background: "rgba(255,255,255,.18)" }} />
  const labelCls = "text-[10px] font-bold tracking-widest uppercase flex items-center gap-1"
  const labelStyle = { color: "rgba(255,255,255,.55)" }
  const inputCls = "bg-transparent border-none outline-none text-base font-medium w-full"
  const inputStyle = { color: "#fff" }

  return (
    <form
      onSubmit={e => e.preventDefault()}
      className="flex items-stretch w-full overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: "22px",
        maxWidth: "min(1080px,94vw)",
        boxShadow: "0 8px 32px rgba(0,0,0,.28)",
      }}
    >
      <div className="flex-1 flex flex-col gap-0.5 px-6 py-4 min-w-0">
        <span className={labelCls} style={labelStyle}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" style={{ color: "#C9AB55" }}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          Destino
        </span>
        <select className={inputCls} style={{ ...inputStyle, WebkitAppearance: "none" }}
          value={filters.destinationId} onChange={e => updateFilter("destinationId", e.target.value)}>
          <option value="" style={{ background: "#2A3340", color: "#fff" }}>Todos los destinos</option>
          {destinations.map(d => <option key={d.id} value={d.id} style={{ background: "#2A3340", color: "#fff" }}>{d.name}</option>)}
        </select>
      </div>
      {divider}
      <div className="flex flex-col gap-0.5 px-6 py-4 min-w-[155px]">
        <span className={labelCls} style={labelStyle}>
          <svg className="w-3 h-3" fill="none" stroke="#C9AB55" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Check-in
        </span>
        <input type="date" className={inputCls} style={inputStyle}
          value={filters.dateFrom} onChange={e => updateFilter("dateFrom", e.target.value)} />
      </div>
      {divider}
      <div className="flex flex-col gap-0.5 px-6 py-4 min-w-[155px]">
        <span className={labelCls} style={labelStyle}>
          <svg className="w-3 h-3" fill="none" stroke="#C9AB55" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Check-out
        </span>
        <input type="date" className={inputCls} style={inputStyle}
          value={filters.dateTo} onChange={e => updateFilter("dateTo", e.target.value)} />
      </div>
      {divider}
      <div className="flex flex-col gap-0.5 px-6 py-4 min-w-[140px]">
        <span className={labelCls} style={labelStyle}>
          <svg className="w-3 h-3" fill="none" stroke="#C9AB55" strokeWidth={2} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          Huéspedes
        </span>
        <input type="number" min="1" className={inputCls} style={inputStyle}
          placeholder="2 huéspedes" value={filters.guests} onChange={e => updateFilter("guests", e.target.value)} />
      </div>
      <button
        type="submit"
        className="flex items-center gap-2 px-8 font-bold rounded-r-[21px] hover:opacity-90 transition whitespace-nowrap"
        style={{ background: "#C9AB55", color: "#2A3340", minWidth: "130px" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        Buscar
      </button>
    </form>
  )
}
// Bloque explicativo "Cómo funciona" que se muestra solo en intercambios.
function ComoFunciona() {
  const steps = [
    { n: 1, text: "Explorá las casas disponibles" },
    { n: 2, text: "Proponé un intercambio" },
    { n: 3, text: "Nosotros gestionamos el acuerdo" },
    { n: 4, text: "Intercambian y viajan" },
  ]
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div style={{ background: "#fff", border: "1.5px solid rgba(107,181,149,.35)", borderRadius: 20, padding: "22px 24px", marginBottom: 24, boxShadow: "0 2px 10px rgba(107,181,149,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".13em", textTransform: "uppercase", color: "#4F9C7C", margin: 0 }}>Cómo funciona</p>
        <button onClick={() => setModalOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 16px", borderRadius: 999, background: "rgba(107,181,149,.14)", color: "#4F9C7C", fontSize: 13.5, fontWeight: 600, border: "none", cursor: "pointer" }}>
          Conocer más
          <svg width={16} height={16} fill="none" stroke="#4F9C7C" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px 20px" }}>
        {steps.map(s => (
          <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(107,181,149,.15)", color: "#4F9C7C", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#14171B", lineHeight: 1.2, letterSpacing: "-.01em" }}>{s.text}</span>
          </div>
        ))}
      </div>
      <p style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 12.5, color: "#4F9C7C" }}>
        <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        El intercambio puede ser simultáneo o diferido
      </p>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: "#14171B", marginBottom: 12 }}>
            ¿Cómo funciona el intercambio de casas?
          </h2>
          <p style={{ color: "#67717F", lineHeight: 1.6, marginBottom: 24 }}>
            El intercambio de casas te permite disfrutar de vacaciones en nuevos destinos sin costo de alojamiento. Simplemente ofrecés tu casa y elegís otra de la comunidad para tu estadía. Nosotros nos encargamos de conectar a las familias y facilitar el acuerdo para que la experiencia sea segura y transparente.
          </p>
          <Link to="/intercambios" className="inline-block text-white font-semibold rounded-full px-6 py-3" style={{ background: "#6BB595", textDecoration: "none" }}>
            Ver más detalles y preguntas frecuentes
          </Link>
        </Modal>
      )}
    </div>
  )
}

// Contenido del panel de filtros, reutilizado en el sidebar (desktop) y en el
// bottom-sheet (mobile). Recibe filters + helpers para modificarlos y el type.
// Los tipos de propiedad y categorías se mandan al back como int (ver constants).
function FilterContent({ filters, updateFilter, setFilters, type, destinations }) {
  // Barrios dependen del destino elegido: se piden vía hook con el destinationId.
  const { neighborhoods } = useNeighborhoods(filters.destinationId)

  return (
    <>
      {/* Camino */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-[#1a1a2e] mb-3">Camino</p>
        <div className="flex gap-2 flex-wrap">
          {/* cat 0/1 son los enum int del back (alquiler/intercambio). Al desactivar
              se vuelve a la categoría base de esta página vía CATEGORY_MAP[type]. */}
          {[{ label: "Alquiler", cat: 0 }, { label: "Intercambio", cat: 1 }].map(({ label, cat }) => {
            const isActive = filters.category === cat
            return (
              <button key={cat}
                onClick={() => updateFilter("category", isActive ? CATEGORY_MAP[type] : cat)}
                className="text-sm px-4 py-1.5 rounded-full border transition"
                style={isActive
                  ? cat === 0
                    ? { background: "#C9AB55", color: "#2A3340", borderColor: "#C9AB55" }
                    : { background: "#6BB595", color: "#0e3326", borderColor: "#6BB595" }
                  : { borderColor: "#e5e7eb", color: "#67717F" }}
              >{label}</button>
            )
          })}
        </div>
      </div>

      {/* Destino */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-[#1a1a2e] mb-2">Destino</p>
        <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#c8a96e]"
          value={filters.destinationId}
          onChange={e => setFilters(prev => ({ ...prev, destinationId: e.target.value, neighborhood: "", page: 1 }))}>
          <option value="">Todos los destinos</option>
          {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Barrio — solo si el destino seleccionado tiene barrios */}
      {neighborhoods.length > 0 && (
        <div className="mb-5">
          <p className="text-sm font-semibold text-[#1a1a2e] mb-2">Barrio</p>
          <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#c8a96e]"
            value={filters.neighborhood} onChange={e => updateFilter("neighborhood", e.target.value)}>
            <option value="">Todos los barrios</option>
            {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}

      {/* Precio — oculto para intercambios */}
      {type !== "intercambios" && <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-[#1a1a2e]">Precio máx. / noche</p>
          <span className="text-sm font-semibold" style={{ color: "#B5933F" }}>
            ${(filters.maxPrice || 300000).toLocaleString("es-AR")}
          </span>
        </div>
        <input type="range" min={60000} max={300000} step={10000}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "#B5933F" }}
          value={filters.maxPrice || 300000}
          onChange={e => updateFilter("maxPrice", Number(e.target.value))} />
        <div className="flex justify-between text-xs mt-1" style={{ color: "#67717F" }}>
          <span>$60k</span><span>$300k</span>
        </div>
      </div>}

      {/* Dormitorios */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-[#1a1a2e] mb-2">Dormitorios</p>
        <div className="flex gap-2 flex-wrap">
          {["1", "2", "3", "4+"].map(d => {
            const isActive = filters.bedrooms === d
            return (
              <button key={d}
                onClick={() => updateFilter("bedrooms", isActive ? "" : d)}
                className="text-sm w-10 h-9 rounded-full border transition"
                style={isActive
                  ? { background: "#44536A", color: "#fff", borderColor: "#44536A", fontWeight: 600 }
                  : { borderColor: "#e5e7eb", color: "#67717F" }}
              >{d}</button>
            )
          })}
        </div>
      </div>

      {/* Tipo */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-[#1a1a2e] mb-2">Tipo de propiedad</p>
        <div className="flex flex-col gap-2">
          {["Casa", "Departamento", "Cabaña", "Loft"].map(tipo => (
            <label key={tipo} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: "#67717F" }}>
              <input type="checkbox" className="rounded" style={{ accentColor: "#C9AB55" }}
                checked={filters.propertyType === PROPERTY_TYPE_MAP[tipo]}
                onChange={() => updateFilter("propertyType", filters.propertyType === PROPERTY_TYPE_MAP[tipo] ? "" : PROPERTY_TYPE_MAP[tipo])} />
              {tipo}
            </label>
          ))}
        </div>
      </div>

      {/* Pedir ayuda */}
      <a
        href={whatsappLink("Hola 👋 No encuentro lo que busco, ¿me ayudan?")}
        target="_blank"
        rel="noreferrer"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, width: "100%", padding: "14px 18px", borderRadius: 999, background: "#6BB595", color: "#0e3326", fontSize: 15, fontWeight: 600, textDecoration: "none" }}
      >
        <svg width={18} height={18} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Pedir ayuda
      </a>
    </>
  )
}

// type llega por prop desde el router (alquileres | intercambios). Compras no
// pasa por acá, tiene su propia página.
export default function Listings({ type }) {
  const { destinations } = useDestinations()
  const cfg = CONFIG[type]
  usePageMeta(cfg?.metaTitle, cfg?.metaDescription)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [searchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState("")

  // Estado de filtros. category arranca según el type (CATEGORY_MAP -> int del
  // back). El resto se inicializa desde la query string (venís del buscador del
  // home con destino/fechas ya puestos).
  const [filters, setFilters] = useState({
    category: CATEGORY_MAP[type],
    destinationId: searchParams.get("destinationId") || "",
    neighborhood:  searchParams.get("neighborhood") || "",
    dateFrom:      searchParams.get("dateFrom") || "",
    dateTo:        searchParams.get("dateTo") || "",
    guests:        searchParams.get("guests") || "",
    bedrooms:      searchParams.get("bedrooms") || "",
    propertyType:  "",
    maxPrice:      "",
    page: 1,
    pageSize: 12,
  })

  // BUGFIX: cuando se navega entre /alquileres <-> /intercambios, React Router
  // reutiliza esta misma instancia del componente (no la remonta), así que el
  // useState de arriba NO vuelve a ejecutarse. Sin este efecto, filters.category
  // quedaba "pegado" al valor de la primera vez que se montó el componente: el
  // sidebar mostraba el botón de camino equivocado y las cards no coincidían con
  // la ruta (se veían alquileres en /intercambios y viceversa). Este effect
  // corre cada vez que cambia `type` y resetea category al valor correcto,
  // además del resto de filtros (mismo criterio que clearAllFilters), para no
  // arrastrar filtros de una categoría a la otra.
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: CATEGORY_MAP[type],
      neighborhood: "",
      dateFrom: "",
      dateTo: "",
      guests: "",
      bedrooms: "",
      propertyType: "",
      maxPrice: "",
      page: 1,
    }))
  }, [type])

  // Sacamos los filtros vacíos antes de mandar al back: solo van los que tienen
  // valor. Ese objeto es lo que consume el hook useProperties para hacer el fetch.
  const activeFilters = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== "" && v !== null)
  )
  if (sortBy) activeFilters.sortBy = sortBy
  const { data, loading } = useProperties(activeFilters)

  // Cambiar un filtro siempre resetea a page 1 (si no, quedarías en una página
  // que ya no existe con el nuevo resultado).
  function updateFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  function clearAllFilters() {
    setFilters(prev => ({ ...prev, destinationId: "", neighborhood: "", dateFrom: "", dateTo: "", guests: "", bedrooms: "", propertyType: "", maxPrice: "", page: 1 }))
  }

  function clearFilter(key) {
    updateFilter(key, "")
  }

  const items = data?.items || []
  const total = data?.total || 0

  // El destino elegido no tiene NINGUNA propiedad y no hay otros filtros puestos:
  // el resultado vacío no es culpa de los filtros, es que no hay inventario.
  // Si además hay filtros, no se puede saber cuál de los dos manda — ahí gana el
  // mensaje de filtros, que es accionable.
  const destinoSinInventario = (() => {
    if (!filters.destinationId) return null
    const otrosFiltros = filters.neighborhood || filters.dateFrom || filters.dateTo ||
                         filters.guests || filters.bedrooms || filters.propertyType || filters.maxPrice
    if (otrosFiltros) return null
    const dest = destinations.find(d => String(d.id) === String(filters.destinationId))
    return dest && (dest.propertyCount ?? 0) === 0 ? dest : null
  })()

  const activeChips = []
  if (filters.destinationId) {
    const dest = destinations.find(d => String(d.id) === String(filters.destinationId))
    if (dest) activeChips.push({ label: dest.name, key: "destinationId" })
  }
  if (filters.neighborhood) activeChips.push({ label: filters.neighborhood, key: "neighborhood" })
  if (filters.dateFrom) activeChips.push({ label: `Desde ${filters.dateFrom}`, key: "dateFrom" })
  if (filters.dateTo) activeChips.push({ label: `Hasta ${filters.dateTo}`, key: "dateTo" })
  if (filters.guests) activeChips.push({ label: `${filters.guests} huéspedes`, key: "guests" })
  if (filters.bedrooms) activeChips.push({ label: `${filters.bedrooms} dorm.`, key: "bedrooms" })
  if (filters.propertyType !== "" && PROPERTY_TYPE_IMAP[filters.propertyType]) activeChips.push({ label: PROPERTY_TYPE_IMAP[filters.propertyType], key: "propertyType" })
  if (filters.maxPrice && filters.maxPrice < 300000) activeChips.push({ label: `Máx $${Number(filters.maxPrice).toLocaleString("es-AR")}`, key: "maxPrice" })

  const activeCount = activeChips.length

  return (
    <div>
      {/* ── HERO ── */}
      <section
        className="relative pt-[124px] pb-12"
        style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(20,23,27,.62) 0%,rgba(20,23,27,.30) 45%,rgba(34,40,49,.80) 100%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <p className="text-white/60 text-sm mb-6">
            <Link to="/" className="hover:text-white transition">Inicio</Link>
            {" / "}
            <span className="text-white">{cfg.breadcrumb}</span>
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-white mb-2">{cfg.title}</h1>
          <p className="text-white/70 text-lg mb-8">{cfg.subtitle}</p>
          <div className="hidden md:block">
            <SearchBar filters={filters} updateFilter={updateFilter} destinations={destinations} />
          </div>
        </div>
      </section>

      {/* ── CONTENIDO ── */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-8">

          {/* ── SIDEBAR — oculto en mobile ── */}
          <aside className="hidden md:block flex-shrink-0" style={{ width: "284px" }}>
            <div className="bg-white shadow-sm border border-gray-100 sticky top-24" style={{ borderRadius: "28px", padding: "26px 24px" }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 font-semibold text-[#1a1a2e]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M10 12h4"/>
                  </svg>
                  Filtros
                </div>
                <button onClick={clearAllFilters} className="text-sm font-semibold" style={{ color: "#C9AB55" }}>
                  Limpiar
                </button>
              </div>
              <FilterContent filters={filters} updateFilter={updateFilter} setFilters={setFilters} type={type} destinations={destinations} />
            </div>
          </aside>

          {/* ── RESULTADOS ── */}
          <div className="flex-1 min-w-0">
            {type === "intercambios" && <ComoFunciona />}

            <div className="flex items-center justify-between mb-4">
              <p style={{ fontSize: "22px", fontWeight: 500, letterSpacing: "-.01em", color: "#14171B" }}>
                <span style={{ color: "#B5933F", fontWeight: 600 }}>{total}</span>{" "}
                {cfg.countWord}
              </p>
              <select
                className="text-sm border border-gray-200 rounded-full px-4 py-2 bg-white focus:outline-none"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="">Recomendados</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
              </select>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeChips.map(chip => (
                  <span key={chip.key} className="flex items-center gap-1.5 text-sm rounded-full px-3 py-1"
                    style={{ background: "#EDF0F4", color: "#14171B" }}>
                    {chip.label}
                    <button onClick={() => clearFilter(chip.key)} className="text-gray-400 hover:text-gray-700 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: "460px" }} />
                ))}
              </div>
            ) : items.length === 0 ? (
              destinoSinInventario ? (
                // El destino simplemente no tiene casas todavía. Antes caía en el
                // mensaje de abajo y mandaba a "quitar algún filtro" a alguien que
                // no había puesto ninguno — clickeó una tarjeta en el home.
                <div className="text-center py-24 text-gray-400">
                  <div className="text-5xl mb-4">🧭</div>
                  <p className="text-xl text-[#1a1a2e] font-light mb-2">
                    Todavía no tenemos casas en {destinoSinInventario.name}
                  </p>
                  <p className="text-gray-500 text-sm mb-5">
                    Estamos sumando destinos todo el tiempo. Contanos qué buscás y te avisamos apenas haya algo.
                  </p>
                  <a
                    href={whatsappLink(`Hola! Me interesa ${destinoSinInventario.name}, ¿tienen algo disponible?`)}
                    target="_blank" rel="noreferrer"
                    className="inline-block text-sm font-semibold rounded-full px-6 py-3"
                    style={{ background: "#6bb595", color: "#0e3326" }}
                  >
                    Consultar por WhatsApp
                  </a>
                </div>
              ) : (
                <div className="text-center py-24 text-gray-400">
                  <div className="text-5xl mb-4">🏠</div>
                  <p className="text-xl text-[#1a1a2e] font-light mb-2">No encontramos casas con esos filtros</p>
                  <p className="text-gray-500 text-sm mb-5">Probá ampliar el precio o quitar algún filtro.</p>
                  <button onClick={clearAllFilters} className="text-sm font-semibold underline" style={{ color: "#C9AB55" }}>
                    Limpiar filtros
                  </button>
                </div>
              )
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[26px]">
                  {items.map(p =>
                    type === "intercambios"
                      ? <PropertyCard key={p.id} property={p} variant="swap" />
                      : <PropertyCard key={p.id} property={p} />
                  )}
                </div>

                {total > filters.pageSize && (
                  <div className="flex justify-center gap-2 mt-10">
                    <button disabled={filters.page === 1}
                      onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
                      className="px-5 py-2 rounded-full border text-sm disabled:opacity-40 hover:bg-gray-50 transition">
                      ← Anterior
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">Página {filters.page}</span>
                    <button disabled={filters.page * filters.pageSize >= total}
                      onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                      className="px-5 py-2 rounded-full border text-sm disabled:opacity-40 hover:bg-gray-50 transition">
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE: FAB "Filtros" ── */}
      <div className="md:hidden" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 40 }}>
        <button
          onClick={() => setSheetOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 28px",
            borderRadius: 999,
            background: "#2A3340",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            boxShadow: "0 8px 32px rgba(20,23,27,.38)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M10 12h4"/>
          </svg>
          Filtros
          {activeCount > 0 && (
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "#C9AB55", color: "#2A3340",
              fontSize: 11, fontWeight: 700,
              display: "grid", placeItems: "center",
            }}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── MOBILE: Bottom-sheet overlay ── */}
      {sheetOpen && (
        <div className="md:hidden" style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          {/* Overlay */}
          <div
            onClick={() => setSheetOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(20,23,27,.52)", backdropFilter: "blur(4px)" }}
          />

          {/* Sheet */}
          <div
            style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              background: "#fff",
              borderRadius: "24px 24px 0 0",
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 -8px 40px rgba(20,23,27,.18)",
            }}
          >
            {/* Sheet header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 22px 16px",
              borderBottom: "1px solid #E9EDF2",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 600, color: "#14171B" }}>
                <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M10 12h4"/>
                </svg>
                Filtros
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <button onClick={clearAllFilters} style={{ fontSize: 13.5, fontWeight: 600, color: "#B5933F", border: "none", background: "none", cursor: "pointer" }}>
                  Limpiar
                </button>
                <button
                  onClick={() => setSheetOpen(false)}
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "#F5F7F9", border: "none",
                    display: "grid", placeItems: "center", cursor: "pointer",
                  }}
                >
                  <svg width={16} height={16} fill="none" stroke="#67717F" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable filter content */}
            <div style={{ overflowY: "auto", flex: 1, padding: "20px 22px" }}>
              <FilterContent filters={filters} updateFilter={updateFilter} setFilters={setFilters} type={type} destinations={destinations} />
            </div>

            {/* Apply button */}
            <div style={{ padding: "16px 22px 28px", flexShrink: 0, borderTop: "1px solid #E9EDF2" }}>
              <button
                onClick={() => setSheetOpen(false)}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 999,
                  background: "#C9AB55",
                  color: "#2A3340",
                  fontSize: 15,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Ver {total} {cfg.countWord}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}