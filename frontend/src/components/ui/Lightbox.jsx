import { useState, useEffect, useCallback } from "react"

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const ArrowLIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const ArrowRIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const glassStyle = {
  background: "rgba(255,255,255,0.18)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
}

/**
 * Visor de imágenes a pantalla completa (modal) para las galerías de propiedad.
 * Props: `images` (array de URLs), `initialIndex` (por cuál abrir) y `onClose`
 * (callback para cerrar, lo controla el padre que decide si se muestra o no).
 */
export default function Lightbox({ images, initialIndex = 0, onClose }) {
  const [idx, setIdx] = useState(initialIndex)
  // Avanza n posiciones con wrap-around (el módulo + images.length evita índices negativos).
  const nav = useCallback((n) => setIdx(i => (i + n + images.length) % images.length), [images.length])

  // Navegación por teclado: Escape cierra, flechas cambian de imagen.
  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") nav(-1)
      if (e.key === "ArrowRight") nav(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [nav, onClose])

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(20,23,27,.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 40,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <button
        onClick={onClose}
        style={{ ...glassStyle, position: "absolute", top: 24, right: 28, width: 46, height: 46 }}
      >
        <CloseIcon />
      </button>

      <button
        onClick={() => nav(-1)}
        style={{ ...glassStyle, position: "absolute", left: 28, top: "50%", transform: "translateY(-50%)", width: 52, height: 52 }}
      >
        <ArrowLIcon />
      </button>

      <img
        src={images[idx]}
        alt=""
        style={{ maxWidth: "92vw", maxHeight: "88vh", borderRadius: 14, objectFit: "contain" }}
        onClick={e => e.stopPropagation()}
      />

      <button
        onClick={() => nav(1)}
        style={{ ...glassStyle, position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)", width: 52, height: 52 }}
      >
        <ArrowRIcon />
      </button>

      <p style={{ position: "absolute", bottom: 20, color: "rgba(255,255,255,.6)", fontSize: 14 }}>
        {idx + 1} / {images.length}
      </p>
    </div>
  )
}
