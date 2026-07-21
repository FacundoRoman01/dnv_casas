import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../lib/api"

/**
 * Login del admin del backoffice "¿Dónde nos vamos?".
 * Renderiza un formulario simple (email + password) centrado en pantalla.
 * Al loguear con éxito pega a la API, guarda el JWT en localStorage y entra a /admin.
 * No hay refresh token: cuando el token vence, el cliente api patea de vuelta acá.
 */
export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Submit del login: valida credenciales contra el back y, si están OK, guarda el token.
  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const { data } = await api.post("/auth/login", form)
      // Guardamos el JWT en localStorage("token"): el cliente api lo lee y lo manda
      // como Bearer en cada request. Es la única fuente de sesión (no hay cookie ni refresh).
      localStorage.setItem("token", data.token)
      navigate("/admin")
    } catch {
      setError("Credenciales inválidas. Verificá tu email y contraseña.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-primary mb-1">Panel Admin</h1>
        <p className="text-gray-400 text-sm mb-6">¿Dónde nos vamos?</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Email</label>
            <input type="email" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Contraseña</label>
            <input type="password" required className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  )
}
