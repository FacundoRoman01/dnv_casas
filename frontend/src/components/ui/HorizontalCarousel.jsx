import { useState } from "react"

// Botón de flecha (anterior/siguiente) del carrusel. `dir` es "prev" o "next" y
// decide de qué lado se posiciona y hacia dónde apunta; `hover` sólo cambia colores.
function ArrowButton({ dir, hover, onHover, onClick, size = 48, offset = -20 }) {
  const isLeft = dir === "prev"
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      aria-label={isLeft ? "Anterior" : "Siguiente"}
      style={{
        position: "absolute",
        [isLeft ? "left" : "right"]: offset,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 6,
        width: size,
        height: size,
        borderRadius: "50%",
        background: hover ? "#44536A" : "#fff",
        border: "none",
        boxShadow: "0 8px 24px rgba(20,23,27,.18)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        transition: "background .25s",
      }}
    >
      <svg
        width={size * 0.375}
        height={size * 0.375}
        fill="none"
        stroke={hover ? "#fff" : "#44536A"}
        strokeWidth={2}
        viewBox="0 0 24 24"
        style={{ transition: "stroke .25s" }}
      >
        {isLeft
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  )
}

// railGap: gap between cards in the rail (default "gap-6")
// scrollAmount: px to scroll per click
// buttonSize: arrow button diameter in px
// buttonOffset: arrow button distance from edge (negative = outside)
/**
 * Carrusel horizontal reutilizable: un riel scrolleable (los children) con dos
 * flechas superpuestas. Lo usan las secciones de destinos y destacadas del home.
 * `id` es obligatorio y único porque el scroll se hace buscando ese nodo por id
 * en el DOM (no por ref). El resto de las props ajustan tamaño y estilo del riel.
 */
export default function HorizontalCarousel({
  id,
  scrollAmount = 346,
  buttonSize = 48,
  buttonOffset = -20,
  railClass = "flex gap-6 overflow-x-auto pb-4",
  children,
}) {
  const [prevHover, setPrevHover] = useState(false)
  const [nextHover, setNextHover] = useState(false)

  // Scrollea el riel `scrollAmount` px hacia dir (-1 izquierda, +1 derecha).
  // Ubica el nodo por getElementById(id): por eso cada carrusel necesita id único.
  const scroll = (dir) => {
    document.getElementById(id)?.scrollBy({ left: dir * scrollAmount, behavior: "smooth" })
  }

  return (
    <div style={{ position: "relative" }}>
      <ArrowButton
        dir="prev" hover={prevHover} onHover={setPrevHover}
        onClick={() => scroll(-1)} size={buttonSize} offset={buttonOffset}
      />
      <ArrowButton
        dir="next" hover={nextHover} onHover={setNextHover}
        onClick={() => scroll(1)} size={buttonSize} offset={buttonOffset}
      />
      <div id={id} className={railClass} style={{ scrollbarWidth: "none" }}>
        {children}
      </div>
    </div>
  )
}
