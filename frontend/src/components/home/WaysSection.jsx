import { Link } from "react-router-dom"

// Las 3 "maneras de viajar" (Alquilar / Intercambiar / Comprar). Datos fijos:
// cada una tiene su color, ícono y ruta al catálogo correspondiente.
const WAYS = [
  {
    title: "Alquilar",
    desc: "Casas y departamentos por temporada, fin de semana o la escapada que necesites. Precio claro por noche.",
    cta: "Ver alquileres",
    to: "/alquileres",
    stripe: "#c8a96e",
    iconBg: "rgba(201,171,85,.16)",
    iconColor: "#8a6e2f",
    linkColor: "#8a6e2f",
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>,
  },
  {
    title: "Intercambiar",
    desc: "Prestá tu casa y quedate en la de otra familia. Viajás más, gastás menos y conocés gente que cuida igual que vos.",
    cta: "Cómo funciona",
    to: "/intercambios",
    stripe: "#6bb595",
    iconBg: "rgba(107,181,149,.18)",
    iconColor: "#0e6e44",
    linkColor: "#0e6e44",
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>,
  },
  {
    title: "Comprar",
    desc: "Casas, departamentos y lotes en venta en cada destino. Te acompañamos en la operación de principio a fin.",
    cta: "Ver en venta",
    to: "/compras",
    stripe: "#1a1a2e",
    iconBg: "rgba(68,83,106,.12)",
    iconColor: "#1a1a2e",
    linkColor: "#1a1a2e",
    icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.5 1.5 0 012.092 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
  },
]

/**
 * Sección "Elegí tu camino" del home: grilla de 3 tarjetas-link (Alquilar,
 * Intercambiar, Comprar) que salen del array WAYS. Estática, sin props.
 */
export default function WaysSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-14" style={{ maxWidth: "680px", margin: "0 auto 56px" }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#B5933F" }}>Tres maneras de viajar</p>
          <h2 className="text-gray-900 mb-3" style={{ fontSize: "clamp(30px,4vw,52px)", fontWeight: 300, letterSpacing: "-0.025em", lineHeight: 1.04, marginTop: "14px" }}>Elegí tu camino</h2>
          <p className="text-gray-500" style={{ fontSize: "clamp(17px,1.4vw,20px)", lineHeight: 1.6, marginTop: "14px" }}>
            Una misma red de casas y familias. Vos decidís cómo querés vivir tu próximo viaje.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {WAYS.map(({ title, desc, cta, to, stripe, iconBg, iconColor, linkColor, icon }) => (
            <Link key={title} to={to} className="relative overflow-hidden bg-white border border-gray-100 shadow-sm hover:-translate-y-1.5 hover:shadow-md transition-all duration-300 block" style={{ borderRadius: "28px", padding: "38px 34px 32px" }}>
              <div className="absolute top-0 left-0 right-0" style={{ height: "5px", background: stripe, borderRadius: "28px 28px 0 0" }} />
              <div className="flex items-center justify-center mb-6" style={{ width: "60px", height: "60px", borderRadius: "18px", background: iconBg, color: iconColor }}>{icon}</div>
              <h3 className="text-gray-900 mb-3" style={{ fontSize: "25px", fontWeight: 400, letterSpacing: "-0.02em" }}>{title}</h3>
              <p className="text-gray-500 leading-relaxed mb-6 text-[15.5px]">{desc}</p>
              <span className="inline-flex items-center gap-2 font-semibold text-[15px]" style={{ color: linkColor }}>{cta} →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
