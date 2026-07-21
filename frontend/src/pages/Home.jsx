import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useDestinations, useProperties } from "../hooks/useProperties"
import HeroSection from "../components/home/HeroSection"
import DestinationsSection from "../components/home/DestinationsSection"
import WaysSection from "../components/home/WaysSection"
import AboutSection from "../components/home/AboutSection"
import StatsSection from "../components/home/StatsSection"
import FeaturedSection from "../components/home/FeaturedSection"
import ClosingCTASection from "../components/home/ClosingCTASection"

/**
 * Landing / home del sitio. Solo compone las secciones (hero, destinos, cómo
 * funciona, sobre nosotros, stats, destacados, CTA final) y les pasa la data.
 * El hero tiene un buscador cuyo submit lleva a /alquileres con los filtros.
 */
export default function Home() {
  const navigate = useNavigate()
  const { destinations } = useDestinations()
  // Propiedades destacadas para la sección "featured" (hook de fetch, 6 máx).
  const { data: featured, loading: loadingProps } = useProperties({ featured: true, pageSize: 6 })
  // Estado del buscador del hero (destino + fechas + huéspedes).
  const [search, setSearch] = useState({ destination: "", dateFrom: "", dateTo: "", guests: "" })

  // Submit del buscador: arma la query string con lo que haya cargado el usuario
  // y navega al catálogo de alquileres con esos filtros ya aplicados.
  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.destination) params.set("destinationId", search.destination)
    if (search.dateFrom) params.set("dateFrom", search.dateFrom)
    if (search.dateTo) params.set("dateTo", search.dateTo)
    if (search.guests) params.set("guests", search.guests)
    navigate(`/alquileres?${params.toString()}`)
  }

  return (
    <div>
      <HeroSection destinations={destinations} search={search} setSearch={setSearch} onSearch={handleSearch} />
      <DestinationsSection destinations={destinations} />
      <WaysSection />
      <AboutSection />
      <StatsSection destinations={destinations} />
      <FeaturedSection featured={featured} loading={loadingProps} />
      <ClosingCTASection />
    </div>
  )
}
