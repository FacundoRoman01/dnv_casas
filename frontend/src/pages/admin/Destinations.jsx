import { useState } from "react"
import AdminLayout from "../../components/admin/AdminLayout"
import { useAdminDestinations } from "../../hooks/useAdmin"
import api from "../../lib/api"

const EMPTY = { name: "", country: "Argentina", imageUrl: "" }

/**
 * ABM de destinos del backoffice: a la izquierda el formulario (alta/edición) y a la
 * derecha la lista/tabla de destinos existentes. Los destinos son las localidades que
 * después se asignan a cada propiedad (ej "Mar del Plata"). Data vía useAdminDestinations.
 */
export default function Destinations() {
  const { destinations, loading, refetch } = useAdminDestinations()
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Carga un destino existente en el formulario para editarlo (pasa a modo edición).
  function startEdit(d) {
    setEditId(d.id)
    setForm({ name: d.name, country: d.country, imageUrl: d.imageUrl })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY)
  }

  // Submit del formulario: si hay editId hace PUT (actualiza), si no POST (crea). Mismo form para ambos.
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/admin/destinations/${editId}`, form)
      } else {
        await api.post("/admin/destinations", form)
      }
      refetch()
      cancelEdit()
    } catch {
      setError("Error al guardar el destino. Intentá de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  // Borra un destino (DELETE). El back lo rechaza si tiene propiedades asociadas (por eso el mensaje de error).
  async function handleDelete(id) {
    if (!confirm("¿Eliminás este destino?")) return
    try {
      await api.delete(`/admin/destinations/${id}`)
      refetch()
    } catch {
      setError("No se pudo eliminar. Asegurate de que el destino no tenga propiedades asociadas.")
    }
  }

  if (!loading && !destinations) return (
    <AdminLayout>
      <p className="p-8 text-red-500">Error al cargar los destinos. Recargá la página.</p>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-primary mb-6">Destinos</h1>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="ml-4 font-bold hover:opacity-70">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Formulario */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-primary mb-4">{editId ? "Editar destino" : "Nuevo destino"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Nombre *</label>
              <input required type="text" placeholder="Mar del Plata"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">País</label>
              <input type="text" placeholder="Argentina"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">URL de imagen</label>
              <input type="url" placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
                {saving ? "Guardando..." : editId ? "Guardar" : "Agregar"}
              </button>
              {editId && (
                <button type="button" onClick={cancelEdit}
                  className="border border-gray-200 text-gray-500 text-sm px-4 py-2.5 rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : destinations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No hay destinos todavía.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-400 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Destino</th>
                  <th className="px-4 py-3 text-left">País</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {destinations.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary">
                      <div className="flex items-center gap-2">
                        {d.imageUrl && <img src={d.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />}
                        {d.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{d.country}</td>
                    <td className="px-4 py-3 text-right flex justify-end gap-3">
                      <button onClick={() => startEdit(d)} className="text-xs font-medium text-primary hover:underline">Editar</button>
                      <button onClick={() => handleDelete(d.id)} className="text-xs font-medium text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
