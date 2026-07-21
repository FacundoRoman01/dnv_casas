import { useState, useEffect, useMemo } from "react"
import api from "../lib/api"

/**
 * Hooks de data fetching públicos (catálogo). Cada uno pega contra el back REST
 * vía el cliente `api` y devuelve estado listo para renderizar. Todos usan el
 * patrón `cancelled` para no setear estado si el componente se desmontó o los
 * filtros cambiaron mientras la request estaba en vuelo (evita warnings y
 * respuestas viejas pisando a las nuevas).
 */

/**
 * Trae el listado de propiedades filtrado. `filters` se manda tal cual como
 * query params (contrato del back: pageSize, category como int, etc.).
 * Devuelve { data: { items, total }, loading, error }.
 * Truco: si `filters` es null, no dispara la request (sirve para esperar a que
 * estén listos los filtros antes de pedir).
 */
export function useProperties(filters = {}) {
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Serializamos los filtros a string para usarlos como dependencia estable
  // del efecto: un objeto nuevo en cada render dispararía el fetch de más.
  const filterKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  useEffect(() => {
    if (filters === null) return
    let cancelled = false
    setLoading(true)
    api.get("/properties", { params: filters })
      .then(res => { if (!cancelled) setData(res.data) })
      .catch(err => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filterKey])

  return { data, loading, error }
}

// Trae el detalle de una propiedad por id. Devuelve { property, loading }.
// Si no hay id, no pide nada.
export function useProperty(id) {
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setProperty(null)
    setLoading(true)
    api.get(`/properties/${id}`)
      .then(res => { if (!cancelled) setProperty(res.data) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  return { property, loading }
}

// Lista de destinos (ciudades/zonas) para los selects del catálogo.
// Ante error deja el array vacío en vez de romper la UI.
export function useDestinations() {
  const [destinations, setDestinations] = useState([])

  useEffect(() => {
    api.get("/destinations")
      .then(res => setDestinations(res.data))
      .catch(() => setDestinations([]))
  }, [])

  return { destinations }
}

// Barrios de un destino puntual. Depende de destinationId: si no hay, limpia
// la lista. Sirve para el filtro encadenado destino -> barrio.
export function useNeighborhoods(destinationId) {
  const [neighborhoods, setNeighborhoods] = useState([])

  useEffect(() => {
    if (!destinationId) { setNeighborhoods([]); return }
    api.get("/properties/neighborhoods", { params: { destinationId } })
      .then(res => setNeighborhoods(res.data))
      .catch(() => setNeighborhoods([]))
  }, [destinationId])

  return { neighborhoods }
}
