import { useState, useEffect, useCallback } from "react"
import api from "../lib/api"

/**
 * Hooks de data fetching del backoffice (rutas /admin/*, que exigen el JWT).
 * Igual que los públicos pero contra los endpoints protegidos. Exponen
 * `refetch` para recargar después de crear/editar/borrar.
 */

// Trae todas las propiedades para la grilla del admin. Pide pageSize 100 de una
// (no hay paginado en el back de admin, se asume que el catálogo es chico).
// Devuelve { data: { items, total }, loading, refetch }.
export function useAdminProperties() {
  const [data, setData] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(() => {
    setLoading(true)
    api.get("/admin/properties", { params: { page: 1, pageSize: 100 } })
      .then(res => setData(res.data))
      .catch(() => setData({ items: [], total: 0 }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, refetch: fetch }
}

// Detalle de una propiedad para el formulario de edición del admin.
export function useAdminProperty(id) {
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    api.get(`/admin/properties/${id}`)
      .then(res => setProperty(res.data))
      .catch(() => setProperty(null))
      .finally(() => setLoading(false))
  }, [id])

  return { property, loading }
}

// Destinos para el ABM del backoffice. `refetch` recarga tras crear/borrar.
export function useAdminDestinations() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(() => {
    setLoading(true)
    api.get("/admin/destinations")
      .then(res => setDestinations(res.data))
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { destinations, loading, refetch: fetch }
}
