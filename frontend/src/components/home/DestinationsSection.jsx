import { Link, useNavigate } from "react-router-dom"
import HorizontalCarousel from "../ui/HorizontalCarousel"

function LocationIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  )
}

/**
 * Sección "Destinos" del home: carrusel horizontal con las tarjetas de destinos.
 * Recibe `destinations` (ya traídas por el padre desde la API). Mientras la lista
 * está vacía muestra 4 skeletons; cuando llegan, cada tarjeta linkea al catálogo
 * filtrado por ese destino.
 */
export default function DestinationsSection({ destinations }) {
  const navigate = useNavigate()

  return (
    <section className="bg-[#f5f5f3] py-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header responsive: en mobile pasa a columna (texto arriba, botón
            abajo, ancho completo) para que "Ver todas las propiedades" no
            quede apretado al lado del título y se desborde de la pantalla.
            En md+ vuelve al layout en fila original. */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-5 mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: "#C9AB55" }}>
              Explorá nuestros destinos destacados
            </p>
            <h2 className="text-5xl md:text-6xl font-light text-gray-900" style={{ marginTop: 14 }}>Destinos</h2>
            <p className="text-gray-500 mt-2">
              De los lagos del sur a la costa tropical: casas elegidas a mano en los rincones que más nos gustan.
            </p>
          </div>
          <Link to="/alquileres" className="self-start md:self-auto md:whitespace-nowrap hover:bg-gray-50 transition" style={{ border: "1.5px solid #DCE2E9", color: "#44536A", padding: "10px 22px", borderRadius: 999, fontSize: 15, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
            Ver todas las propiedades
            <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <HorizontalCarousel id="dest-rail" scrollAmount={324} buttonSize={54} buttonOffset={22} railClass="flex gap-4 overflow-x-auto pb-2">
          {destinations.length === 0
            ? [1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-200 flex-shrink-0 animate-pulse" style={{ width: "300px", height: "420px", borderRadius: "36px" }} />
              ))
            : destinations.map(dest => (
                // Click en la tarjeta: navega al catálogo filtrado por este destino.
                <div key={dest.id} className="flex-shrink-0 overflow-hidden relative cursor-pointer group" style={{ width: "300px", height: "420px", borderRadius: "36px" }} onClick={() => navigate(`/alquileres?destinationId=${dest.id}`)}>
                  <img src={dest.imageUrl || "https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=500"} alt={dest.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
                  <div className="absolute bottom-6 left-5 right-5">
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-3" style={{ border: "1px solid rgba(255,255,255,.3)" }}>
                      <LocationIcon />
                      {dest.propertyCount != null ? `${dest.propertyCount} ${dest.propertyCount === 1 ? "propiedad" : "propiedades"}` : "–"}
                    </span>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-white leading-tight" style={{ fontSize: "27px", fontWeight: 400, letterSpacing: "-0.02em" }}>{dest.name}</div>
                        <div className="mt-1" style={{ fontSize: "13.5px", color: "rgba(255,255,255,.82)" }}>{dest.country || "Argentina"}</div>
                      </div>
                      <div className="flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5" style={{ width: "42px", height: "42px", borderRadius: "50%", background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.25)", backdropFilter: "blur(10px)" }}>
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </HorizontalCarousel>
      </div>
    </section>
  )
}