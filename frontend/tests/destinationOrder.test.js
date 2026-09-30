import test from "node:test"
import assert from "node:assert/strict"
import { sortDestinations } from "../src/lib/destinationOrder.js"

test("ordena los destinos de Lucila y conserva los desconocidos al final", () => {
  const destinations = [
    { id: 1, name: "Miami" },
    { id: 2, name: "Destino nuevo" },
    { id: 3, name: "Costa Esmeralda" },
    { id: 4, name: "Punta del Este" },
    { id: 5, name: "Chapadmalal" },
  ]

  assert.deepEqual(
    sortDestinations(destinations).map(destination => destination.name),
    ["Costa Esmeralda", "Chapadmalal", "Punta del Este", "Miami", "Destino nuevo"],
  )
})

test("el ordenamiento no modifica el array recibido", () => {
  const destinations = [
    { id: 1, name: "Miami" },
    { id: 2, name: "Costa Esmeralda" },
  ]

  sortDestinations(destinations)

  assert.deepEqual(destinations.map(destination => destination.name), ["Miami", "Costa Esmeralda"])
})
