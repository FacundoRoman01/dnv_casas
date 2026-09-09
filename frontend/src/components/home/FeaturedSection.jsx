import { Link } from "react-router-dom"
import PropertyCard from "../ui/PropertyCard"
import HorizontalCarousel from "../ui/HorizontalCarousel"

/**
 * Sección "Propiedades destacadas" del home: carrusel horizontal de PropertyCard.
 * Recibe `featured` (respuesta paginada de la API, con `featured.items`) y `loading`.
 * Con loading true muestra 3 skeletons; si no, renderiza las cards. El "Ver todas"
 * lleva al catálogo completo.
 */
export default function FeaturedSection({ featured, loading }) {
  return (
    <section className="bg-white py-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header responsive: en mobile pasa a columna (texto arriba, botón
            abajo, ancho completo) para que "Ver todas" no quede apretado al
            lado del título y se desborde de la pantalla. En md+ vuelve al
            layout en fila original. */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-5 mb-10">
          <div>
            <p className="text-[#c8a96e] text-xs font-semibold tracking-widest uppercase mb-2">RECIÉN ELEGIDAS</p>
            <h2 className="text-5xl font-light text-gray-900">Propiedades destacadas</h2>
          </div>
          <Link to="/alquileres" className="self-start md:self-auto md:whitespace-nowrap hover:bg-gray-50 transition" style={{ border: "1.5px solid #DCE2E9", color: "#44536A", padding: "10px 22px", borderRadius: 999, fontSize: 15, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
            Ver todas
            <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>

        <HorizontalCarousel id="feat-rail" scrollAmount={350} railClass="flex gap-5 overflow-x-auto pb-4">
          {loading
            ? [1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 rounded-[28px] bg-gray-100 animate-pulse" style={{ width: "340px", height: "460px" }} />
              ))
            : (featured?.items || []).map(property => (
                <div key={property.id} className="flex-shrink-0" style={{ width: "340px" }}>
                  <PropertyCard property={property} />
                </div>
              ))}
        </HorizontalCarousel>
      </div>
    </section>
  )
}