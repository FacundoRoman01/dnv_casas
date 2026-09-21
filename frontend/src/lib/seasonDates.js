export function formatSeasonDate(isoDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate || "")) return ""
  const [year, month, day] = isoDate.split("-")
  return `${day}/${month}/${year}`
}

export function parseSeasonDate(displayDate) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(displayDate.trim())
  if (!match) return ""

  const [, day, month, year] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() + 1 !== Number(month)
    || date.getUTCDate() !== Number(day)) return ""

  return `${year}-${month}-${day}`
}

export function findOverlappingIndexes(seasons) {
  const overlapping = new Set()
  for (let i = 0; i < seasons.length; i++) {
    const a = seasons[i]
    if (!a.dateFrom || !a.dateTo) continue
    for (let j = i + 1; j < seasons.length; j++) {
      const b = seasons[j]
      if (!b.dateFrom || !b.dateTo) continue
      // Rangos [desde, hasta): compartir el día de salida/entrada es válido.
      if (a.dateFrom < b.dateTo && b.dateFrom < a.dateTo) {
        overlapping.add(i)
        overlapping.add(j)
      }
    }
  }
  return overlapping
}
