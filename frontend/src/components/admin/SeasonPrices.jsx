/**
 * SeasonPrices: editor de precios por temporada de la propiedad.
 * Recibe el array `seasons` (cada una { label, pricePerNight, dateFrom, dateTo })
 * y `onChange` para devolver el array editado al form padre (no guarda al back,
 * eso lo hace la página que lo contiene al submitear).
 */
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

  return (
    <div className="space-y-3">
      {seasons.map((s, i) => (
        <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end bg-gray-50 rounded-xl p-3">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-500 block mb-1">Nombre temporada</label>
            <input type="text" placeholder="Alta temporada" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              value={s.label} onChange={e => update(i, "label", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Desde</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              value={s.dateFrom} onChange={e => update(i, "dateFrom", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Hasta</label>
            <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
              value={s.dateTo} onChange={e => update(i, "dateTo", e.target.value)} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">$/noche</label>
              <input type="number" placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
                value={s.pricePerNight} onChange={e => update(i, "pricePerNight", e.target.value)} />
            </div>
            <button type="button" onClick={() => remove(i)} className="self-end mb-0.5 text-red-400 hover:text-red-600 p-2">✕</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add}
        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-sm text-gray-400 hover:border-accent hover:text-accent transition-colors">
        + Agregar temporada
      </button>
    </div>
  )
}
