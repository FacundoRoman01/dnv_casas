import { useNavigate } from "react-router-dom"
import herohome from "../../assets/images/hero_inicio.webp"

/**
 * Las 3 tarjetas del hero salen de la API, no de una lista fija.
 */
function miniCards(destinations) {
  const conStock = destinations.filter(d => (d.propertyCount ?? 0) > 0)
  const resto = destinations.filter(d => (d.propertyCount ?? 0) === 0)

  return [...conStock, ...resto].slice(0, 3)
}

/**
 * Badge dinámico según los destinos disponibles.
 */
function badge(destinations) {
  const nombres = miniCards(destinations).map(d => d.name)

  if (!nombres.length) return "Casas elegidas a mano"

  return destinations.length > nombres.length
    ? `${nombres.join(" · ")} y más...`
    : nombres.join(" · ")
}

export default function HeroSection({
  destinations = [],
  search,
  setSearch,
  onSearch,
}) {
  const navigate = useNavigate()

  return (
    <section className="relative flex min-h-[100svh] w-full flex-col overflow-hidden text-white">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}
      <div className="absolute inset-0 z-0 overflow-hidden">

        <img
          src={herohome}
          alt="Patagonia"
          className="
            h-full
            w-full
            scale-[1.015]
            object-cover
            object-center
          "
        />

        {/* Overlay general */}
        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(180deg,rgba(15,20,24,0.62)_0%,rgba(15,20,24,0.28)_25%,rgba(20,25,30,0.12)_48%,rgba(18,23,29,0.52)_78%,rgba(18,23,29,0.86)_100%)]
          "
        />

        {/* Luz central */}
        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_50%_32%,rgba(216,192,120,0.16),transparent_42%)]
          "
        />

        {/* Viñeta lateral */}
        <div
          className="
            absolute
            inset-0
            bg-[linear-gradient(90deg,rgba(10,15,20,0.35),transparent_30%,transparent_70%,rgba(10,15,20,0.28))]
          "
        />
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}
      <div className="relative z-10 flex min-h-[100svh] w-full flex-1 flex-col">

        {/* ===================================================
            MAIN HERO
        ==================================================== */}
        <div
          className="
            flex
            flex-1
            flex-col
            items-center
            justify-center
            px-5
            pt-28
            pb-20
            text-center

            sm:px-6
            sm:pt-32
            sm:pb-24

            lg:px-8
            lg:pt-36
            lg:pb-24
          "
        >

          {/* =================================================
              BADGE
          ================================================== */}
          <span
            className="
              mb-5
              inline-flex
              max-w-[90vw]
              items-center
              justify-center
              truncate
              rounded-full
              border
              border-white/20
              bg-white/10
              px-4
              py-2
              text-[12px]
              font-medium
              tracking-wide
              text-white/90
              shadow-lg
              backdrop-blur-xl

              sm:mb-6
              sm:px-5
              sm:text-[13px]
            "
          >
            <span className="truncate">
              {badge(destinations)}
            </span>
          </span>

          {/* =================================================
              TITLE
          ================================================== */}
          <h1
            className="
              m-0
              w-full
              max-w-[1180px]
              text-center
              text-[42px]
              font-extralight
              leading-[0.94]
              tracking-[-0.045em]
              drop-shadow-[0_3px_35px_rgba(0,0,0,0.30)]

              sm:text-[54px]

              md:text-[64px]

              lg:text-[clamp(64px,5.4vw,82px)]
          "
          >
            <span className="font-light text-[#D8C078]">
              ¿Dónde
            </span>

            <span className="text-white">
              {" "}nos vamos
            </span>

            <span className="font-light text-[#D8C078]">
              ?
            </span>

            <br />

            <span className="mt-2 inline-block font-light text-white sm:mt-3">
              Tu próxima casa
              <br className="sm:hidden" />
              {" "}lejos de casa.
            </span>
          </h1>

          {/* =================================================
              DESCRIPTION
          ================================================== */}
          <p
            className="
              mt-6
              mb-0
              max-w-[650px]
              px-2
              text-center
              text-[15px]
              font-normal
              leading-relaxed
              text-white/85
              drop-shadow-[0_2px_18px_rgba(0,0,0,0.25)]

              sm:mt-7
              sm:text-[17px]

              lg:text-[19px]
            "
          >
            Alquilá, intercambiá o comprá casas en los lugares
            que querés volver a ver.

            <br className="hidden sm:block" />

            Sin pagos online: cerramos todo, de igual a igual,
            por WhatsApp.
          </p>

          {/* =================================================
              SEARCH DESKTOP
          ================================================== */}
          <form
            onSubmit={onSearch}
            className="
              mt-10
              hidden
              w-full
              max-w-[1120px]
              grid-cols-[1.45fr_1fr_1fr_1fr_auto]
              items-stretch
              gap-[3px]
              rounded-[24px]
              border
              border-white/20
              bg-white/10
              p-2
              shadow-[0_20px_60px_rgba(0,0,0,0.18)]
              backdrop-blur-2xl

              lg:grid
            "
          >

            {/* DESTINO */}
            <div
              className="
                relative
                flex
                min-w-0
                flex-col
                justify-center
                gap-1
                rounded-[17px]
                px-5
                py-3
              "
            >
              <label
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.13em]
                  text-white/60
                "
              >
                Destino
              </label>

              <select
                className="
                  w-full
                  cursor-pointer
                  appearance-none
                  border-none
                  bg-transparent
                  text-[15px]
                  font-medium
                  text-white
                  outline-none
                "
                value={search.destination}
                onChange={e =>
                  setSearch({
                    ...search,
                    destination: e.target.value,
                  })
                }
              >
                <option
                  value=""
                  className="text-[#14171B]"
                >
                  ¿A dónde vamos?
                </option>

                {destinations.map(d => (
                  <option
                    key={d.id}
                    value={d.id}
                    className="text-[#14171B]"
                  >
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* CHECK-IN */}
            <div
              className="
                flex
                min-w-0
                flex-col
                justify-center
                gap-1
                rounded-[17px]
                border-l
                border-white/10
                px-5
                py-3
              "
            >
              <label
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.13em]
                  text-white/60
                "
              >
                Check-in
              </label>

              <input
                type="date"
                className="
                  w-full
                  cursor-pointer
                  border-none
                  bg-transparent
                  text-[15px]
                  font-medium
                  text-white
                  outline-none
                  [color-scheme:dark]
                "
                value={search.dateFrom}
                onChange={e =>
                  setSearch({
                    ...search,
                    dateFrom: e.target.value,
                  })
                }
              />
            </div>

            {/* CHECK-OUT */}
            <div
              className="
                flex
                min-w-0
                flex-col
                justify-center
                gap-1
                rounded-[17px]
                border-l
                border-white/10
                px-5
                py-3
              "
            >
              <label
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.13em]
                  text-white/60
                "
              >
                Check-out
              </label>

              <input
                type="date"
                className="
                  w-full
                  cursor-pointer
                  border-none
                  bg-transparent
                  text-[15px]
                  font-medium
                  text-white
                  outline-none
                  [color-scheme:dark]
                "
                value={search.dateTo}
                onChange={e =>
                  setSearch({
                    ...search,
                    dateTo: e.target.value,
                  })
                }
              />
            </div>

            {/* HUESPEDES */}
            <div
              className="
                flex
                min-w-0
                flex-col
                justify-center
                gap-1
                rounded-[17px]
                border-l
                border-white/10
                px-5
                py-3
              "
            >
              <label
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.13em]
                  text-white/60
                "
              >
                Huéspedes
              </label>

              <select
                className="
                  w-full
                  cursor-pointer
                  appearance-none
                  border-none
                  bg-transparent
                  text-[15px]
                  font-medium
                  text-white
                  outline-none
                "
                value={search.guests}
                onChange={e =>
                  setSearch({
                    ...search,
                    guests: e.target.value,
                  })
                }
              >
                <option
                  value=""
                  className="text-[#14171B]"
                >
                  2 huéspedes
                </option>

                {[1, 2, 4, 6, 8].map(n => (
                  <option
                    key={n}
                    value={n}
                    className="text-[#14171B]"
                  >
                    {n} {n === 1 ? "huésped" : "huéspedes"}
                  </option>
                ))}
              </select>
            </div>

            {/* BOTÓN BUSCAR */}
            <div className="grid place-items-center px-1">
              <button
                type="submit"
                className="
                  flex
                  h-full
                  min-h-[60px]
                  w-full
                  min-w-[128px]
                  items-center
                  justify-center
                  gap-2
                  rounded-[17px]
                  border-none
                  bg-[#C9AB55]
                  px-5
                  text-[15px]
                  font-semibold
                  text-[#252D37]
                  shadow-[0_8px_25px_rgba(201,171,85,0.28)]
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:shadow-[0_12px_30px_rgba(201,171,85,0.38)]
                  active:translate-y-0
                  cursor-pointer
                "
              >
                <svg
                  className="h-[18px] w-[18px] stroke-[#252D37]"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />

                  <path d="m20 20-3.5-3.5" />
                </svg>

                Buscar
              </button>
            </div>
          </form>

          {/* =================================================
              MOBILE CTA
          ================================================== */}
          <div
            className="
              mt-8
              flex
              w-full
              max-w-[360px]
              flex-col
              gap-3

              sm:flex-row
            "
          >

            {/* EXPLORAR */}
            <a
              href="/alquileres"
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-full
                bg-[#C9AB55]
                px-6
                py-3.5
                text-sm
                font-semibold
                text-[#252D37]
                shadow-[0_10px_28px_rgba(0,0,0,0.16)]
                transition-all
                duration-200
                hover:-translate-y-0.5
              "
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <path d="m20 20-3.5-3.5" />
              </svg>

              Explorar casas
            </a>

            {/* INTERCAMBIAR */}
            <a
              href="/intercambios"
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-full
                border
                border-white/25
                bg-white/10
                px-6
                py-3.5
                text-sm
                font-semibold
                text-white
                backdrop-blur-xl
                transition-all
                duration-200
                hover:bg-white/15
              "
            >
              Intercambiar
            </a>
          </div>
        </div>

        {/* =====================================================
            DESKTOP BOTTOM
        ====================================================== */}
        <div
          className="
            hidden
            w-full
            items-end
            justify-between
            gap-8
            px-[max(28px,4vw)]
            pb-10

            lg:flex
          "
        >

          {/* =================================================
              TRUST CARD
          ================================================== */}
          <div
            className="
              w-full
              max-w-[350px]
              rounded-[24px]
              border
              border-white/20
              bg-white/10
              p-5
              shadow-[0_18px_45px_rgba(0,0,0,0.16)]
              backdrop-blur-xl
            "
          >
            <div className="mb-3 flex items-center gap-3">

              {/* AVATARS */}
              <div className="flex">
                {[
                  {
                    bg: "bg-[#C9AB55]",
                    color: "text-[#1a1a2e]",
                    text: "M",
                  },
                  {
                    bg: "bg-[#6BB595]",
                    color: "text-[#0e3326]",
                    text: "L",
                  },
                  {
                    bg: "bg-[#44536A]",
                    color: "text-white",
                    text: "F",
                  },
                  {
                    bg: "bg-[#B5933F]",
                    color: "text-white",
                    text: "R",
                  },
                ].map((a, i) => (
                  <div
                    key={i}
                    className={`
                      grid
                      h-[38px]
                      w-[38px]
                      place-items-center
                      rounded-full
                      border-2
                      border-white/50
                      text-[13px]
                      font-semibold
                      ${a.bg}
                      ${a.color}
                      ${i !== 0 ? "-ml-[11px]" : ""}
                    `}
                  >
                    {a.text}
                  </div>
                ))}
              </div>

              <div>
                <b className="block text-[18px] font-semibold leading-tight text-white">
                  +1.200 familias
                </b>

                <small className="text-[12.5px] text-white/70">
                  ya viajaron con nosotros
                </small>
              </div>
            </div>

            <p className="m-0 text-[13.5px] leading-relaxed text-white/80">
              Te acompañamos por WhatsApp de principio a fin:
              una persona real, no un formulario.
            </p>
          </div>

          {/* =================================================
              DESTINATION CARDS
          ================================================== */}
          <div className="flex items-end gap-3">

            {miniCards(destinations).map((dest, i) => (
              <div
                key={dest.id}
                onClick={() =>
                  navigate(
                    `/alquileres?destinationId=${dest.id}`
                  )
                }
                className={`
                  group
                  relative
                  flex-shrink-0
                  cursor-pointer
                  overflow-hidden
                  rounded-[20px]
                  border
                  border-white/35
                  shadow-[0_18px_42px_rgba(10,15,20,0.35)]
                  transition-all
                  duration-500
                  hover:-translate-y-2

                  ${i === 1 ? "h-[165px] w-[122px]" : "h-[190px] w-[130px]"}
                `}
              >
                <img
                  src={dest.imageUrl}
                  alt={dest.name}
                  className="
                    h-full
                    w-full
                    object-cover
                    transition-transform
                    duration-700
                    group-hover:scale-105
                  "
                />

                {/* Card overlay */}
                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-b
                    from-transparent
                    via-transparent
                    to-black/70
                  "
                />

                {/* Destination name */}
                <span
                  className="
                    absolute
                    bottom-2.5
                    left-2.5
                    right-2.5
                    text-[12px]
                    font-semibold
                    text-white
                    drop-shadow-[0_1px_8px_rgba(0,0,0,0.65)]
                  "
                >
                  {dest.name}
                </span>
              </div>
            ))}

          </div>
        </div>
      </div>
    </section>
  )
}