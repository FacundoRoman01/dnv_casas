import axios from "axios"

/**
 * Cliente HTTP centralizado contra el backend REST (Java, portado de .NET,
 * contrato byte a byte). Todas las llamadas a la API pasan por acá.
 *
 * Trae dos interceptores:
 *  - request: pega el token JWT del admin en el header Authorization.
 *  - response: si el back devuelve 401 (token vencido/inválido), limpia el
 *    token y patea al login del backoffice.
 */

// baseURL apunta al back. En dev cae al localhost:5254/api del backend Java.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5254/api",
})

// Antes de cada request: si hay token guardado, lo mandamos como Bearer.
// Las rutas públicas ignoran el header; las de /admin lo exigen.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Después de cada response: un 401 significa sesión caída. Borramos el token
// y redirigimos al login. Es un logout forzado, no un refresh: este proyecto
// no renueva el token, cuando vence hay que loguearse de nuevo.
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/admin/login"
    }
    return Promise.reject(err)
  }
)

export default api
