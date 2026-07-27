import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"
import Navbar from "./components/layout/Navbar"
import Footer from "./components/layout/Footer"
import Home from "./pages/Home"
import Listings from "./pages/Listings"
import Compras from "./pages/Compras"
import ComprasDetail from "./pages/ComprasDetail"
import PropertyDetail from "./pages/PropertyDetail"
import AdminLogin from "./pages/admin/Login"
import Dashboard from "./pages/admin/Dashboard"
import PropertyForm from "./pages/admin/PropertyForm"
import Destinations from "./pages/admin/Destinations"
import NotFound from "./pages/NotFound"

/**
 * Raíz de la app: define el router y todas las rutas (públicas y de admin).
 * Envuelve las páginas públicas en el layout con Navbar + Footer y protege las
 * de backoffice detrás del login.
 */

// Guard de rutas de admin: si no hay token en localStorage, redirige al login.
// Es un chequeo de presencia, no valida el token (de eso se encarga el back,
// que ante un 401 dispara el logout forzado en lib/api.js).

function ScrollHandler() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.substring(1) // Le saca el "#"
      
      setTimeout(() => {
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      // Opcional: Si cambiás de página y no hay hash, te lleva arriba de todo
      window.scrollTo(0, 0)
    }
  }, [location])

  return null // Es invisible, no rompe el diseño
}



function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token")
  return token ? children : <Navigate to="/admin/login" replace />
}

// Layout público: Navbar arriba, contenido en el medio, Footer abajo.
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>

    <ScrollHandler />

      <Routes>
        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/nueva" element={<ProtectedRoute><PropertyForm /></ProtectedRoute>} />
        <Route path="/admin/editar/:id" element={<ProtectedRoute><PropertyForm /></ProtectedRoute>} />
        <Route path="/admin/destinos" element={<ProtectedRoute><Destinations /></ProtectedRoute>} />

        {/* Público */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/alquileres" element={<PublicLayout><Listings type="alquileres" /></PublicLayout>} />
        <Route path="/intercambios" element={<PublicLayout><Listings type="intercambios" /></PublicLayout>} />
        <Route path="/compras" element={<PublicLayout><Compras /></PublicLayout>} />
        <Route path="/compras/:id" element={<PublicLayout><ComprasDetail /></PublicLayout>} />
        <Route path="/propiedad/:id" element={<PublicLayout><PropertyDetail /></PublicLayout>} />
        <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
      </Routes>
    </BrowserRouter>
  )
}
