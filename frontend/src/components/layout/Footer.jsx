import { Link } from "react-router-dom"
import { useDestinations } from "../../hooks/useProperties"
import { whatsappLink } from "../../lib/whatsapp"

const INSTAGRAM_URL = import.meta.env.VITE_INSTAGRAM

/**
 * Footer público del sitio, presente en todas las páginas. Cuatro columnas:
 * marca (con CTA a WhatsApp), lista de destinos (traídos de la API con
 * useDestinations), los "caminos" del sitio y datos de contacto.
 * Los links de WhatsApp abren wa.me: ahí se cierra la operación, no hay pago online.
 */
export default function Footer() {
  const { destinations } = useDestinations()

  return (
    <footer style={{ background: "#2A3340" }} className="text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* top grid — unequal columns matching boceto 1.6fr 1fr 1fr 1.2fr */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
          {/* col 1: brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-[#C9AB55] rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-[#1a1a2e] rounded-full" />
              </div>
              <span className="text-white font-medium" style={{ fontSize: "21px" }}>¿Dónde nos vamos?</span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-5" style={{ lineHeight: "1.8" }}>
              Alquiler temporal, intercambio de casas y venta de propiedades en los destinos que querés volver a ver. Cierre humano por WhatsApp.
            </p>
            <a
              href={whatsappLink("Hola, me gustaría consultar sobre sus propiedades")}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition"
              style={{ background: "#6BB595", color: "#0e3326" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Escribinos
            </a>
          </div>

          {/* col 2: destinos */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Destinos</h4>
            <ul style={{ lineHeight: "2.1" }}>
              {destinations.map(dest => (
                <li key={dest.id}>
                  <Link
                    to={`/alquileres?destinationId=${dest.id}`}
                    className="text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {dest.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* col 3: caminos */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Caminos</h4>
            <ul style={{ lineHeight: "2.1" }}>
              {[
                { label: "Alquilar", to: "/alquileres" },
                { label: "Intercambiar", to: "/intercambios" },
                { label: "Comprar", to: "/compras" },
                { label: "Quiénes somos", to: "/#quienes-somos" },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-white/70 hover:text-white text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* col 4: contacto */}
          <div>
            <h4 className="text-white text-sm font-medium mb-4">Contacto</h4>
            <ul style={{ lineHeight: "2.1" }}>
              <li>
                <a href={whatsappLink("Hola, me gustaría consultar sobre sus propiedades")} target="_blank" rel="noreferrer"
                  className="text-white/70 hover:text-white text-sm transition-colors">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:hola@dondenosvamos.com"
                  className="text-white/70 hover:text-white text-sm transition-colors">
                  hola@dondenosvamos.com
                </a>
              </li>
              {/* Apuntaba a https://instagram.com — la home de Instagram, no una
                  cuenta. Ahora sale de VITE_INSTAGRAM y si no está, no se muestra:
                  mejor sin link que con uno que no lleva a ningún lado. */}
              {INSTAGRAM_URL && (
                <li>
                  <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer"
                    className="text-white/70 hover:text-white text-sm transition-colors">
                    Instagram
                  </a>
                </li>
              )}
              <li>
                <a href={whatsappLink("Hola 👋 Me gustaría publicar mi propiedad en ¿Dónde nos vamos?")} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white text-sm transition-colors">
                  Publicá tu casa
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* bottom bar */}
        <div className="border-t border-white/10 pt-7 flex flex-col lg:flex-row justify-between items-center gap-4" style={{ marginTop: "64px" }}>
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} ¿Dónde nos vamos? · Hecho con cariño en Argentina.
          </p>
          <p className="text-white/50 text-sm">
            Reservas humanas, sin pago online.
          </p>
        </div>
      </div>
    </footer>
  )
}
