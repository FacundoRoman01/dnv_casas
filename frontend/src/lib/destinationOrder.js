const PREFERRED_DESTINATION_ORDER = [
  "Costa Esmeralda",
  "Chapadmalal",
  "Buenos Aires en barrio cerrado",
  "Punta del Este",
  "Patagonia",
  "Miami",
  "Itamambuca",
]

function normalizeName(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es")
}

const ORDER_BY_NAME = new Map(
  PREFERRED_DESTINATION_ORDER.map((name, index) => [normalizeName(name), index]),
)

export function sortDestinations(destinations = []) {
  return destinations
    .map((destination, originalIndex) => ({ destination, originalIndex }))
    .sort((a, b) => {
      const aOrder = ORDER_BY_NAME.get(normalizeName(a.destination.name))
      const bOrder = ORDER_BY_NAME.get(normalizeName(b.destination.name))
      const aRank = aOrder ?? PREFERRED_DESTINATION_ORDER.length
      const bRank = bOrder ?? PREFERRED_DESTINATION_ORDER.length

      return aRank - bRank || a.originalIndex - b.originalIndex
    })
    .map(({ destination }) => destination)
}
