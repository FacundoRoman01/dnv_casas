import { NavLink, useNavigate } from "react-router-dom"

/**
 * AdminLayout: layout con sidebar fijo del backoffice.
 * Envuelve todas las pantallas del panel admin: pinta el menú lateral
 * (Propiedades, Nueva, Destinos) y renderiza el contenido de cada página
 * en {children}, dentro del <main>.
 */

// Items del menú lateral. `end: true` en "/admin" para que NavLink solo lo
// marque activo en la ruta exacta y no en las sub-rutas (/admin/nueva, etc).
const NAV = [
  { to: "/admin", label: "🏠 Propiedades", end: true },
  { to: "/admin/nueva", label: "➕ Nueva propiedad" },
  { to: "/admin/destinos", label: "📍 Destinos" },
]

export default function AdminLayout({ children }) {
  const navigate = useNavigate()

  // Cierra sesión: borra el JWT de localStorage (lo que lee api.js para
  // mandar el Authorization) y manda al login. No pega al back, es local.
  function logout() {
    localStorage.removeItem("token")
    navigate("/admin/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-primary text-white flex flex-col fixed top-0 left-0 h-full z-20">
        <div className="px-5 py-5 border-b border-white/10">
          <p className="font-bold text-base">¿Dónde nos vamos?</p>
          <p className="text-xs text-gray-400 mt-0.5">Panel Admin</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-white/15 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"}`
              }>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors">
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
