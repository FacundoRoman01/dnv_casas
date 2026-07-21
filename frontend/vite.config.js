import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * El número de WhatsApp es el negocio entero: 16 CTAs en todas las páginas
 * salen de acá y no hay checkout ni formulario de contacto que lo supla.
 *
 * Vite hornea import.meta.env en build time, así que un valor malo se compila
 * sin ruido y wa.me abre "número inválido". Antes el fallback en whatsapp.js
 * ERA el placeholder, con lo cual olvidarse de la variable fallaba en silencio
 * y el sitio salía a producción con todos los botones muertos.
 *
 * Ahora el build revienta. Es molesto a propósito.
 */
const PLACEHOLDERS = ['5491100000000', '5491112345678']

function validarWhatsapp(mode) {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const numero = env.VITE_WHATSAPP

  const problema =
    !numero ? 'falta VITE_WHATSAPP'
    : PLACEHOLDERS.includes(numero) ? `VITE_WHATSAPP sigue siendo un placeholder (${numero})`
    : !/^\d{10,15}$/.test(numero) ? `VITE_WHATSAPP no parece un número válido (${numero}) — va sin +, sin espacios y sin guiones, con código de país. Ej: 5491155551234`
    : null

  if (!problema) return

  // Válvula para buildear en local mientras no esté el número real. El deploy
  // simplemente no setea la variable, así que el placeholder no llega a
  // producción ni por olvido ni por accidente.
  if (process.env.ALLOW_PLACEHOLDER_WHATSAPP === '1') {
    console.warn(
      `\n  ⚠ ${problema}\n` +
      `    Se buildea igual porque ALLOW_PLACEHOLDER_WHATSAPP=1.\n` +
      `    Los 16 botones de WhatsApp de este build NO funcionan.\n`
    )
    return
  }

  throw new Error(
    `\n\n  ✖ ${problema}\n\n` +
    `    Los botones de WhatsApp son la única forma de contacto del sitio:\n` +
    `    sin un número real, las 16 CTAs abren "número inválido".\n\n` +
    `    Poné el número en frontend/.env (o en el .env de la raíz si usás\n` +
    `    docker compose) antes de buildear:\n\n` +
    `      VITE_WHATSAPP=549XXXXXXXXXX\n\n` +
    `    Para buildear igual en local: ALLOW_PLACEHOLDER_WHATSAPP=1\n\n`
  )
}

export default defineConfig(({ mode, command }) => {
  // Solo en build: en dev conviene poder levantar sin configurar nada.
  if (command === 'build') validarWhatsapp(mode)

  return {
    plugins: [react()],
    server: {
      port: parseInt(process.env.PORT) || 5173,
      strictPort: false,
    },
  }
})
