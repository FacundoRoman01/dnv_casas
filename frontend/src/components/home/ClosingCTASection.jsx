import { Link } from "react-router-dom"
import { whatsappLink } from "../../lib/whatsapp"
import imgfouter from "../../assets/images/imagen_fouter.webp";

// Ícono de WhatsApp inline (SVG). Se repite en varios componentes porque no hay
// un set de íconos compartido; className deja ajustar el tamaño desde afuera.
function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/**
 * Banda de cierre del home ("Entonces... ¿dónde nos vamos?"): la última llamada
 * a la acción antes del footer. Estática, sin props.
 * Dos caminos: "Buscar mi casa" lleva al catálogo (/alquileres) y "Consultar por
 * WhatsApp" abre wa.me, que es donde se cierra la operación (no hay pago online).
 */
export default function ClosingCTASection() {
  return (
    <section className="bg-white" style={{ paddingTop: 0, paddingBottom: 80 }}>
      <div className="max-w-7xl mx-auto px-4">
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 36, textAlign: "center", padding: "clamp(48px,7vw,88px) clamp(24px,6vw,80px)", color: "#fff" }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <img src={imgfouter} alt="Lago y montañas" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(34,40,49,.55),rgba(34,40,49,.78))" }} />
          </div>
          <div style={{ position: "relative", zIndex: 2 }}>
            <h2 style={{ fontWeight: 200, fontSize: "clamp(34px,5vw,68px)", lineHeight: 1, letterSpacing: "-.03em", marginBottom: 18 }}>
              Entonces… <em style={{ fontStyle: "normal", color: "#D8C078" }}>¿dónde nos vamos?</em>
            </h2>
            <p style={{ maxWidth: 520, margin: "0 auto 32px", fontSize: 18, color: "rgba(255,255,255,.88)" }}>
              Contanos qué fechas tenés en mente y nosotros nos encargamos del resto.
            </p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <Link to="/alquileres" className="hover:opacity-90 transition" style={{ background: "#C9AB55", color: "#1a1a2e", fontWeight: 600, fontSize: 16, padding: "14px 28px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 9 }}>
                <svg style={{ width: 19, height: 19 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                Buscar mi casa
              </Link>
              <a href={whatsappLink("Hola, me gustaría consultar sobre sus propiedades")} target="_blank" rel="noreferrer" className="hover:opacity-90 transition" style={{ background: "#6BB595", color: "#0e3326", fontWeight: 600, fontSize: 16, padding: "14px 28px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 9 }}>
                <WhatsAppIcon className="w-5 h-5" />
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
