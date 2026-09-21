import { useEffect, useRef, useState } from "react"
import { findOverlappingIndexes, formatSeasonDate, parseSeasonDate } from "../../lib/seasonDates"

/**
 * SeasonPrices: editor de precios por temporada de la propiedad.
 * Recibe el array `seasons` (cada una { label, pricePerNight, dateFrom, dateTo })
 * y `onChange` para devolver el array editado al form padre (no guarda al back,
 * eso lo hace la página que lo contiene al submitear).
 */

function SeasonDateInput({ value, onChange, invalidBorder }) {
  const [text, setText] = useState(() => formatSeasonDate(value))
  const editing = useRef(false)
  const picker = useRef(null)

  useEffect(() => {
    if (!editing.current) setText(formatSeasonDate(value))
  }, [value])

  const invalid = text !== "" && !parseSeasonDate(text)

  function updateText(nextText) {
    setText(nextText)
    onChange(parseSeasonDate(nextText))
  }

  function openPicker() {
    if (picker.current?.showPicker) picker.current.showPicker()
    else picker.current?.focus()
  }

  return (
    <div>
      <div className="flex gap-1">
        <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA"
          aria-label="Fecha en formato día, mes y año" aria-invalid={invalid}
          className={`w-full min-w-0 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent ${invalid || invalidBorder ? "border-red-300" : "border-gray-200"}`}
          value={text} onFocus={() => { editing.current = true }}
          onBlur={() => { editing.current = false }}
          onChange={e => updateText(e.target.value)} />
        <button type="button" aria-label="Elegir fecha del calendario" onClick={openPicker}
          className="border border-gray-200 rounded-lg px-2 text-sm" title="Abrir calendario">📅</button>
      </div>
      <input ref={picker} type="date" className="sr-only" tabIndex={-1}
        aria-hidden="true" value={value || ""}
        onChange={e => {
          onChange(e.target.value)
          setText(formatSeasonDate(e.target.value))
        }} />
      {invalid && <p className="text-xs text-red-500 mt-1">Usá DD/MM/AAAA con una fecha válida.</p>}
    </div>
  )
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
                <SeasonDateInput value={s.dateFrom} invalidBorder={enConflicto}
                  onChange={value => update(i, "dateFrom", value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Hasta</label>
                <SeasonDateInput value={s.dateTo} invalidBorder={enConflicto}
                  onChange={value => update(i, "dateTo", value)} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Total del período</label>
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
