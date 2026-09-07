/**
 * SeasonPrices: editor de precios por temporada de la propiedad.
 * Recibe el array `seasons` (cada una { label, pricePerNight, dateFrom, dateTo })
 * y `onChange` para devolver el array editado al form padre (no guarda al back,
 * eso lo hace la página que lo contiene al submitear).
 */

// Devuelve el conjunto de índices de `seasons` que se solapan con al menos otra
// temporada (mismo criterio que el backend en Property.replaceSeasonPrices: dos
// rangos [dateFrom, dateTo] se pisan si no son estrictamente uno antes del otro).
// Se calcula acá, en el frontend, para avisar ANTES de mandar el submit — el
// backend sigue siendo la validación real y definitiva, esto es solo UX.
function findOverlappingIndexes(seasons) {
  const overlapping = new Set()
  for (let i = 0; i < seasons.length; i++) {
    const a = seasons[i]
    if (!a.dateFrom || !a.dateTo) continue
    for (let j = i + 1; j < seasons.length; j++) {
      const b = seasons[j]
      if (!b.dateFrom || !b.dateTo) continue
      // Se superponen si NO es cierto que uno termine antes de que empiece el otro.
      const seSuperponen = a.dateFrom <= b.dateTo && b.dateFrom <= a.dateTo
      if (seSuperponen) {
        overlapping.add(i)
        overlapping.add(j)
      }
    }
  }
  return overlapping
}

export default function SeasonPrices({ seasons, onChange }) {
  // Agrega una temporada vacía. dateFrom/dateTo son strings "YYYY-MM-DD" del
  // <input type="date"> (fecha local, sin hora ni Z), tal cual espera la API.
  function add() {
    onChange([...seasons, { label: "", pricePerNight: "", dateFrom: "", dateTo: "" }])
  }

  // Edita un campo de la temporada en el índice i (inmutable) y avisa al padre.
  function update(i, field, value) {
    onChange(seasons.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  // Saca la temporada del índice i.
  function remove(i) {
    onChange(seasons.filter((_, idx) => idx !== i))
  }

  const overlapping = findOverlappingIndexes(seasons)
  const hayConflictos = overlapping.size > 0

  return (
    <div className="space-y-3">
      {seasons.map((s, i) => {
        const enConflicto = overlapping.has(i)
        return (
          <div key={i}>
            <div
              className={`grid grid-cols-2 md:grid-cols-5 gap-2 items-end rounded-xl p-3 transition-colors ${
                enConflicto ? "bg-red-50 border border-red-200" : "bg-gray-50"
              }`}
            >
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 block mb-1">Nombre temporada</label>
                <input type="text" placeholder="Alta temporada"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent ${enConflicto ? "border-red-300" : "border-gray-200"}`}
                  value={s.label} onChange={e => update(i, "label", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Desde</label>
                <input type="date"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent ${enConflicto ? "border-red-300" : "border-gray-200"}`}
                  value={s.dateFrom} onChange={e => update(i, "dateFrom", e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Hasta</label>
                <input type="date"
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent ${enConflicto ? "border-red-300" : "border-gray-200"}`}
                  value={s.dateTo} onChange={e => update(i, "dateTo", e.target.value)} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">$/noche</label>
                  <input type="number" placeholder="0"
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent ${enConflicto ? "border-red-300" : "border-gray-200"}`}
                    value={s.pricePerNight} onChange={e => update(i, "pricePerNight", e.target.value)} />
                </div>
                <button type="button" onClick={() => remove(i)} className="self-end mb-0.5 text-red-400 hover:text-red-600 p-2">✕</button>
              </div>
            </div>
            {enConflicto && (
              <p className="text-xs text-red-500 mt-1 px-1">
                ⚠ Esta temporada se superpone con otra. Ajustá las fechas para que no coincidan.
              </p>
            )}
          </div>
        )
      })}
      <button type="button" onClick={add}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 hover:border-accent hover:text-accent transition-colors">
        + Agregar temporada
      </button>
      {hayConflictos && (
        <p className="text-sm text-red-500 font-medium px-1">
          Hay temporadas con fechas superpuestas. No se va a poder guardar hasta que las corrijas.
        </p>
      )}
    </div>
  )
}