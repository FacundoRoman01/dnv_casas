import { useState } from "react"

// Los estados vienen del back como enum int (0/1/2), no como string.
// Acá mapeamos ese int a color y etiqueta para pintar cada día.
const STATUS_COLORS = {
  0: "bg-green-400",   // Available
  1: "bg-yellow-400",  // InProgress
  2: "bg-red-400",     // Unavailable
}
const STATUS_LABELS = { 0: "Disponible", 1: "En gestión", 2: "No disponible" }

// Cantidad de días del mes: día 0 del mes siguiente = último día de este mes.
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

// Día de la semana (0=Do..6=Sa) en que arranca el mes, para calcular cuántas
// celdas vacías dejar antes del día 1 en la grilla.
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

// Arma la clave de fecha "YYYY-MM-DD" que usa el contrato con la API.
// OJO: es fecha local sin hora ni Z (no es un timestamp UTC), justo lo que
// espera el back para availability. month es 0-based, por eso el +1.
function toDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

/**
 * AvailabilityCalendar: calendario de disponibilidad de la propiedad.
 * Recibe `availability` (array de { date: "YYYY-MM-DD", status: int }) y
 * `onChange` para devolver el array modificado al form padre (no pega al back
 * directo, el guardado lo hace la página que lo contiene).
 * Deja elegir un estado y pintar días clickeándolos.
 */
export default function AvailabilityCalendar({ availability, onChange }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedStatus, setSelectedStatus] = useState(2)

  // Índice date -> status para poder consultar O(1) al pintar cada día.
  const availMap = {}
  availability.forEach(a => { availMap[a.date] = a.status })

  // Click en un día: si ya tenía el estado seleccionado lo saca (vuelve a
  // "sin marcar"); si no, lo agrega/pisa. Devuelve el nuevo array por onChange.
  function toggleDay(dateKey) {
    const exists = availMap[dateKey]
    let newAvail
    if (exists === selectedStatus) {
      newAvail = availability.filter(a => a.date !== dateKey)
    } else {
      newAvail = [...availability.filter(a => a.date !== dateKey), { date: dateKey, status: selectedStatus }]
    }
    onChange(newAvail)
  }

  // Navegación de meses: al cruzar el borde (enero/diciembre) ajusta el año.
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const days = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

  return (
    <div>
      {/* Selector de estado */}
      <div className="flex gap-2 mb-4">
        {Object.entries(STATUS_LABELS).map(([s, label]) => (
          <button key={s} onClick={() => setSelectedStatus(Number(s))}
            className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${Number(s) === selectedStatus ? "border-primary bg-primary text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${STATUS_COLORS[s]}`} />
            {label}
          </button>
        ))}
      </div>

      {/* Navegación mes */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">←</button>
        <span className="font-semibold text-primary text-sm">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">→</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {["Do","Lu","Ma","Mi","Ju","Vi","Sa"].map(d => (
          <div key={d} className="font-semibold text-gray-400 py-1">{d}</div>
        ))}
        {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
        {[...Array(days)].map((_, i) => {
          const day = i + 1
          const key = toDateKey(viewYear, viewMonth, day)
          const status = availMap[key]
          return (
            <button key={day} onClick={() => toggleDay(key)}
              className={`py-1.5 rounded-lg font-medium transition-all hover:scale-105 ${status !== undefined ? `${STATUS_COLORS[status]} text-white` : "hover:bg-gray-100 text-gray-600"}`}>
              {day}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mt-4 text-xs text-gray-400">
        {Object.entries(STATUS_LABELS).map(([s, label]) => (
          <span key={s} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded-full ${STATUS_COLORS[s]}`} />{label}
          </span>
        ))}
      </div>
    </div>
  )
}
