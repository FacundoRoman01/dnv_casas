import { useNavigate } from "react-router-dom"

/**
 * Las 3 tarjetas del hero salen de la API, no de una lista fija.
 *
 * Estaban hardcodeadas en Bariloche / Punta del Este / Miami — y los dos últimos
 * no tienen ni una propiedad, así que el hero promocionaba como centro visual
 * justo lo que no existe. Se priorizan los destinos CON inventario; si no
 * alcanzan, se completa con el resto antes que mostrar huecos.
 */
function miniCards(destinations) {
  const conStock = destinations.filter(d => (d.propertyCount ?? 0) > 0)
  const resto = destinations.filter(d => (d.propertyCount ?? 0) === 0)
  return [...conStock, ...resto].slice(0, 3)
}

/** El badge también era literal y nombraba los destinos vacíos. */
function badge(destinations) {
  const nombres = miniCards(destinations).map(d => d.name)
  if (!nombres.length) return "Casas elegidas a mano"
  return destinations.length > nombres.length
    ? `${nombres.join(" · ")} y más...`
    : nombres.join(" · ")
}

function LocationIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  )
}

/**
 * Sección hero del home (pantalla completa arriba de todo): imagen de fondo,
 * titular, barra de búsqueda en desktop y CTAs en mobile, más las mini-cards
 * de destinos abajo.
 * Props: `destinations` (de la API, alimenta el select y las mini-cards),
 * `search`/`setSearch` (estado controlado del formulario, vive en el padre) y
 * `onSearch` (handler del submit). Un click en una mini-card navega al catálogo
 * filtrado por ese destino.
 */
export default function HeroSection({ destinations = [], search, setSearch, onSearch }) {
  const navigate = useNavigate()
  return (
    <section className="relative min-h-screen flex flex-col" style={{ color: "#fff" }}>
      {/* bg */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=2100&q=80"
          alt="Patagonia"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 0%, rgba(20,23,27,.50), transparent 55%), linear-gradient(180deg, rgba(20,23,27,.34) 0%, rgba(20,23,27,.05) 26%, rgba(34,40,49,.30) 62%, rgba(34,40,49,.72) 100%)" }} />
      </div>

      <div className="relative z-10 flex-1 flex flex-col w-full">
        {/* headline + search */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6" style={{ padding: "clamp(70px,10vh,130px) 24px 8px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 999, fontSize: 13.5, fontWeight: 500, background: "rgba(255,255,255,.12)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.25)", color: "rgba(255,255,255,.92)" }}>
            {badge(destinations)}
          </span>

          <h1 style={{ letterSpacing: "-0.03em", textShadow: "0 2px 40px rgba(20,23,27,.35)", lineHeight: 0.96, fontWeight: 200, fontSize: "clamp(44px,7.2vw,116px)", margin: 0 }}>
            <span style={{ color: "#D8C078", fontWeight: 300 }}>¿Dónde</span>
            <span className="text-white"> nos vamos</span>
            <span style={{ color: "#D8C078", fontWeight: 300 }}>?</span>
            <br />
            <span className="text-white" style={{ fontWeight: 300 }}>Tu próxima casa lejos de casa.</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,.9)", fontSize: "clamp(16px,1.5vw,20px)", lineHeight: 1.55, maxWidth: 600, textAlign: "center", margin: 0, fontWeight: 400 }}>
            Alquilá, intercambiá o comprá casas en los lugares que querés volver a ver. Sin pagos online: cerramos todo, de igual a igual, por WhatsApp.
          </p>

          {/* search bar desktop */}
          <form onSubmit={onSearch} className="hidden lg:grid w-full max-w-[1100px]" style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto", alignItems: "stretch", padding: "10px", borderRadius: "26px", gap: "4px", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "12px 20px", borderRadius: "18px", position: "relative" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}>Destino</label>
              <select style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", fontWeight: 500, outline: "none", width: "100%" }} value={search.destination} onChange={e => setSearch({ ...search, destination: e.target.value })}>
                <option value="" style={{ color: "#14171B" }}>¿A dónde vamos?</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id} style={{ color: "#14171B" }}>{d.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "12px 20px", borderRadius: "18px", borderLeft: "1px solid rgba(255,255,255,.18)" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}>Check-in</label>
              <input type="date" style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", fontWeight: 500, outline: "none", width: "100%", colorScheme: "dark" }} value={search.dateFrom} onChange={e => setSearch({ ...search, dateFrom: e.target.value })} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "12px 20px", borderRadius: "18px", borderLeft: "1px solid rgba(255,255,255,.18)" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}>Check-out</label>
              <input type="date" style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", fontWeight: 500, outline: "none", width: "100%", colorScheme: "dark" }} value={search.dateTo} onChange={e => setSearch({ ...search, dateTo: e.target.value })} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "12px 20px", borderRadius: "18px", borderLeft: "1px solid rgba(255,255,255,.18)" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.72)" }}>Huéspedes</label>
              <select style={{ background: "transparent", border: "none", color: "#fff", fontSize: "16px", fontWeight: 500, outline: "none", width: "100%" }} value={search.guests} onChange={e => setSearch({ ...search, guests: e.target.value })}>
                <option value="" style={{ color: "#14171B" }}>2 huéspedes</option>
                {[1, 2, 4, 6, 8].map(n => (
                  <option key={n} value={n} style={{ color: "#14171B" }}>{n} {n === 1 ? "huésped" : "huéspedes"}</option>
                ))}
              </select>
            </div>
            <div style={{ alignSelf: "stretch", display: "grid", placeItems: "center", padding: "0 14px" }}>
              <button type="submit" style={{ width: "100%", height: "100%", minWidth: "130px", borderRadius: "18px", background: "#C9AB55", color: "#2A3340", fontWeight: 600, fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", boxShadow: "0 10px 30px rgba(201,171,85,.45)", border: "none", cursor: "pointer" }}>
                <svg style={{ width: 19, height: 19, stroke: "#1a1a2e", fill: "none" }} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                Buscar
              </button>
            </div>
          </form>

          {/* mobile CTAs */}
          <div className="lg:hidden flex gap-3 mt-2">
            <a href="/alquileres" className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm" style={{ background: "#C9AB55", color: "#2A3340" }}>
              <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              Explorar casas
            </a>
            <a href="/intercambios" className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm" style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.25)" }}>
              Intercambiar
            </a>
          </div>
        </div>

        {/* bottom band */}
        <div className="hidden lg:flex items-end justify-between" style={{ gap: 24, padding: "0 max(24px,4vw) 46px", marginTop: 46 }}>
          <div style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,.25)", borderRadius: 28, padding: "24px 26px", maxWidth: 360 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div style={{ display: "flex" }}>
                {[{ bg: "#C9AB55", color: "#1a1a2e", text: "M" }, { bg: "#6BB595", color: "#0e3326", text: "L" }, { bg: "#44536A", color: "#fff", text: "F" }, { bg: "#B5933F", color: "#fff", text: "R" }].map((a, i) => (
                  <div key={i} style={{ width: 40, height: 40, borderRadius: "50%", fontSize: 14, fontWeight: 600, display: "grid", placeItems: "center", background: a.bg, color: a.color, border: "2px solid rgba(255,255,255,.55)", marginLeft: i !== 0 ? -12 : 0 }}>{a.text}</div>
                ))}
              </div>
              <div>
                <b style={{ fontSize: 20, fontWeight: 600, color: "#fff", display: "block", lineHeight: 1.1 }}>+1.200 familias</b>
                <small style={{ fontSize: 13, color: "rgba(255,255,255,.8)" }}>ya viajaron con nosotros</small>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "rgba(255,255,255,.86)" }}>
              Te acompañamos por WhatsApp de principio a fin: una persona real, no un formulario.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
            {miniCards(destinations).map((dest, i) => (
              <div
                key={dest.id}
                onClick={() => navigate(`/alquileres?destinationId=${dest.id}`)}
                className="overflow-hidden relative flex-shrink-0 transition-transform duration-500 hover:-translate-y-2 cursor-pointer"
                style={{ width: 128, height: i === 0 || i === 2 ? 200 : 172, borderRadius: 22, border: "1px solid rgba(255,255,255,.4)", boxShadow: "0 18px 40px rgba(20,23,27,.4)" }}
              >
                <img src={dest.imageUrl} alt={dest.name} className="w-full h-full object-cover" />
                <span className="absolute text-white font-semibold" style={{ left: 10, bottom: 10, right: 10, fontSize: 12, textShadow: "0 1px 8px rgba(0,0,0,.6)" }}>{dest.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
