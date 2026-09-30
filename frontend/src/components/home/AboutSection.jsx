import { whatsappLink } from "../../lib/whatsapp"
import imgQuienesSomos from "../../assets/images/img-quienessomos-dnvcasas.jpg"

/**
 * Sección "Quiénes somos" del home: contá la historia de la marca (columna de
 * texto) al lado de la foto del equipo con el badge de "+10.000 familias".
 * Es estática, no recibe props ni pega a la API.
 * El botón "Hablar con nosotros" abre WhatsApp: ahí se cierra toda operación,
 * no hay checkout online.
 */
export default function AboutSection() {
  return (
    <section id="quienes-somos" className="py-20" style={{ background: "linear-gradient(180deg,#EFF5F1,#F5F7F9)" }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[3/4] rounded-3xl overflow-hidden">
            <img src={imgQuienesSomos} alt="Equipo" className="object-cover w-full h-full" />
            <div className="absolute text-white" style={{ left: 20, right: 20, bottom: 20, padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,.12)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 28 }}>
              <span style={{ width: 46, height: 46, borderRadius: "50%", background: "#6BB595", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <svg width={22} height={22} fill="none" stroke="#0e3326" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </span>
              <div>
                <b style={{ fontSize: 15, fontWeight: 600, display: "block", lineHeight: 1.1 }}>+10.000 familias</b>
                <small style={{ fontSize: 13, color: "rgba(255,255,255,.85)" }}>ya viajaron con nosotros</small>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#4F9C7C" }}>QUIÉNES SOMOS</p>
            <h2 className="text-4xl font-light text-gray-900 leading-tight mb-6">Empezó como un gesto de generosidad</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              "¿Dónde Nos Vamos?" comenzó como un recurso de creatividad, y claro, generosidad. Siempre quisimos que la gente disfrute de nuestra casa tanto como nosotros lo hacemos. Nos animamos a comenzar con este proyecto y poco a poco familias y grupos de amigos nos empezaron a elegir para crear y vivir momentos inolvidables.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Nos dirigimos a una clientela variada: familias, grupos de amigos/as, jóvenes... A veces son dueños de casas y en otra oportunidad son ellos mismos los que las visitan o alquilan.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">¿Qué hacemos?</h3>
            <p className="text-gray-600 leading-relaxed mb-8">
              Nos encargamos de buscar lugares para tus vacaciones, fines de semana o eventos durante el día. En Buenos Aires, barrios cerrados, campitos, sur argentino, Córdoba, Punta del Este, Costa Esmeralda, Chapadmalal... y cada vez tenemos más destinos.
            </p>
            <a href={whatsappLink("Hola, me gustaría consultar sobre sus propiedades")} target="_blank" rel="noreferrer" className="font-semibold px-6 py-3 rounded-full hover:opacity-90 transition inline-flex items-center gap-2" style={{ background: "#6BB595", color: "#0e3326" }}>
              Hablar con nosotros
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
