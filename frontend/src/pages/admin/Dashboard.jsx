import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import AdminLayout from "../../components/admin/AdminLayout"
import { useAdminProperties } from "../../hooks/useAdmin"
import api from "../../lib/api"
import { CATEGORY_LABEL } from "../../lib/constants"

// Mapa estado (int del back) -> clases de color del badge. 0=Activa, 1=Pausada, 2=Eliminada.
const STATUS_BADGE = {
  0: "bg-green-100 text-green-700",
  1: "bg-yellow-100 text-yellow-700",
  2: "bg-red-100 text-red-700",
}

// Inserta las transformaciones f_auto,q_auto en una URL de Cloudinary para que
// se sirva en el mejor formato (WebP/AVIF) y con la calidad óptima según el
// caso. No modifica URLs que no sean de Cloudinary (ej. el fallback de Unsplash).
function optimizeCloudinaryUrl(url) {
  if (!url || !url.includes("res.cloudinary.com")) return url
  return url.replace("/upload/", "/upload/f_auto,q_auto/")
}
const STATUS_LABEL = { 0: "Activa", 1: "Pausada", 2: "Eliminada" }

/**
 * Dashboard del backoffice: grilla (tabla) de todas las propiedades del sitio.
 * Trae la data con el hook useAdminProperties y permite filtrar por texto, categoría y estado.
 * Desde cada fila se puede ver en el sitio público, editar, duplicar, pausar/activar,
 * marcar como destacada y eliminar. Es la home del panel admin.
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, refetch } = useAdminProperties()
  const [filter, setFilter] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [actionError, setActionError] = useState("")
  const [loadingId, setLoadingId] = useState(null)

  // Filtrado en memoria sobre lo que ya trajo el hook: los filtros de select comparan
  // como String porque p.category / p.status son ints del enum del back.
  const items = data.items
    ?.filter(p => catFilter === "" || String(p.category) === catFilter)
    ?.filter(p => statusFilter === "" || String(p.status) === statusFilter)
    ?.filter(p =>
      p.title.toLowerCase().includes(filter.toLowerCase()) ||
      p.destinationName?.toLowerCase().includes(filter.toLowerCase())
    ) || []

  // Pausa/activa la propiedad: PATCH mandando el nuevo estado (int) como body crudo.
  async function toggleStatus(p) {
    setLoadingId(p.id)
    try {
      const newStatus = p.status === 0 ? 1 : 0
      // El back espera el int pelado en el body, por eso forzamos Content-Type JSON
      // (si no, axios no serializa un número suelto como JSON válido).
      await api.patch(`/admin/properties/${p.id}/status`, newStatus, {
        headers: { "Content-Type": "application/json" }
      })
      refetch()
    } catch {
      setActionError("No se pudo cambiar el estado. Intentá de nuevo.")
      setTimeout(() => setActionError(""), 5000)
    } finally {
      setLoadingId(null)
    }
  }

  // Borra la propiedad (DELETE) previa confirmación del navegador.
  async function deleteProperty(id) {
    if (!confirm("¿Eliminás esta propiedad?")) return
    setLoadingId(id)
    try {
      await api.delete(`/admin/properties/${id}`)
      refetch()
    } catch {
      setActionError("No se pudo eliminar la propiedad.")
      setTimeout(() => setActionError(""), 5000)
    } finally {
      setLoadingId(null)
    }
  }

  // Marca/desmarca "destacada": PATCH con el booleano invertido como body crudo (mismo motivo del Content-Type).
  async function toggleFeatured(p) {
    setLoadingId(p.id)
    try {
      await api.patch(`/admin/properties/${p.id}/featured`, !p.isFeatured, {
        headers: { "Content-Type": "application/json" }
      })
      refetch()
    } catch {
      setActionError("No se pudo actualizar el estado destacado.")
      setTimeout(() => setActionError(""), 5000)
    } finally {
      setLoadingId(null)
    }
  }

  // Duplica la propiedad: POST que devuelve la copia (queda pausada) y navega a su edición.
  async function duplicateProperty(p) {
    if (!confirm(`¿Duplicás "${p.title}"? La copia quedará pausada.`)) return
    setLoadingId(p.id)
    try {
      const { data: copy } = await api.post(`/admin/properties/${p.id}/duplicate`)
      refetch()
      // Vamos directo a editar la copia recién creada usando el id que devolvió el back.
      navigate(`/admin/editar/${copy.id}`)
    } catch {
      setActionError("No se pudo duplicar la propiedad.")
      setTimeout(() => setActionError(""), 5000)
    } finally {
      setLoadingId(null)
    }
  }

  if (!loading && !data.items) return (
    <AdminLayout>
      <p className="p-8 text-red-500">Error al cargar las propiedades. Recargá la página.</p>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Propiedades</h1>
          <p className="text-gray-400 text-sm">{items.length} de {data.total} en total</p>
        </div>
        <Link to="/admin/nueva"
          className="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
          + Nueva propiedad
        </Link>
      </div>

      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          {actionError}
          <button onClick={() => setActionError("")} className="ml-4 font-bold hover:opacity-70">✕</button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input type="text" placeholder="Buscar por nombre o destino..."
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent w-full max-w-xs"
          value={filter} onChange={e => setFilter(e.target.value)} />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-white">
          <option value="">Todas las categorías</option>
          <option value="0">Alquileres</option>
          <option value="1">Intercambios</option>
          <option value="2">Compras</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-white">
          <option value="">Todos los estados</option>
          <option value="0">Activas</option>
          <option value="1">Pausadas</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏠</p>
          <p>{data.total > 0 ? "Ninguna propiedad coincide con los filtros." : "No hay propiedades todavía."}</p>
          {data.total === 0 && (
            <Link to="/admin/nueva" className="mt-4 inline-block text-accent font-medium">Crear la primera →</Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Propiedad</th>
                <th className="px-4 py-3 text-left">Categoría</th>
                <th className="px-4 py-3 text-left">Destino</th>
                <th className="px-4 py-3 text-left">Precio</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-center">★</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.coverImageUrl && (
                        <img src={optimizeCloudinaryUrl(p.coverImageUrl)} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <span className="font-medium text-primary">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{CATEGORY_LABEL[p.category]}</td>
                  <td className="px-4 py-3 text-gray-500">{p.destinationName}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {p.price ? `$${p.price.toLocaleString()}` : "A consultar"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleFeatured(p)}
                      disabled={loadingId === p.id}
                      title={p.isFeatured ? "Quitar de destacadas" : "Marcar como destacada"}
                      className={`text-lg leading-none transition-colors disabled:opacity-40 ${p.isFeatured ? "text-yellow-400 hover:text-yellow-300" : "text-gray-200 hover:text-yellow-300"}`}>
                      ★
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={`/propiedad/${p.id}`} target="_blank" rel="noreferrer"
                        className="text-xs font-medium text-blue-500 hover:underline">
                        Ver ↗
                      </a>
                      <Link to={`/admin/editar/${p.id}`}
                        className="text-xs font-medium text-primary hover:underline">
                        Editar
                      </Link>
                      <button onClick={() => duplicateProperty(p)}
                        disabled={loadingId === p.id}
                        className="text-xs font-medium text-gray-400 hover:text-gray-600 hover:underline disabled:opacity-40">
                        {loadingId === p.id ? "..." : "Duplicar"}
                      </button>
                      <button onClick={() => toggleStatus(p)}
                        disabled={loadingId === p.id}
                        className="text-xs font-medium text-yellow-600 hover:underline disabled:opacity-40">
                        {loadingId === p.id ? "..." : p.status === 0 ? "Pausar" : "Activar"}
                      </button>
                      <button onClick={() => deleteProperty(p.id)}
                        disabled={loadingId === p.id}
                        className="text-xs font-medium text-red-500 hover:underline disabled:opacity-40">
                        {loadingId === p.id ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
