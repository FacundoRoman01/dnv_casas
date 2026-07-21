import { useEffect } from "react"

/**
 * Hook de SEO básico: setea el <title> y la meta description del documento
 * según la página. No hay SSR ni librería de head, lo hacemos a mano tocando
 * el DOM. Cada página lo llama con su título y descripción.
 */
export function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} — ¿Dónde nos vamos?` : "¿Dónde nos vamos?"
    const meta = document.querySelector('meta[name="description"]')
    if (meta && description) meta.setAttribute("content", description)
  }, [title, description])
}
