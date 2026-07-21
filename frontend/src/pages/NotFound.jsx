import { Link } from "react-router-dom"

/**
 * Página 404. Se renderiza en la ruta catch-all cuando ninguna otra matchea.
 * Solo muestra el mensaje y un link para volver al home.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-8xl font-bold text-primary/10 mb-4">404</p>
      <h1 className="text-2xl font-bold text-primary mb-2">Página no encontrada</h1>
      <p className="text-gray-400 mb-8">La página que buscás no existe o fue movida.</p>
      <Link to="/" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
        Volver al inicio
      </Link>
    </div>
  )
}
