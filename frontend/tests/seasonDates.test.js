import test from "node:test"
import assert from "node:assert/strict"
import { findOverlappingIndexes, formatSeasonDate, parseSeasonDate } from "../src/lib/seasonDates.js"

test("permite temporadas consecutivas que comparten salida y entrada", () => {
  const overlaps = findOverlappingIndexes([
    { dateFrom: "2027-01-01", dateTo: "2027-02-01" },
    { dateFrom: "2027-02-01", dateTo: "2027-02-16" },
  ])
  assert.deepEqual([...overlaps], [])
})

test("rechaza temporadas que comparten noches", () => {
  const overlaps = findOverlappingIndexes([
    { dateFrom: "2027-01-01", dateTo: "2027-02-02" },
    { dateFrom: "2027-02-01", dateTo: "2027-02-16" },
  ])
  assert.deepEqual([...overlaps], [0, 1])
})

test("presenta DD/MM/AAAA y conserva AAAA-MM-DD para la API", () => {
  assert.equal(formatSeasonDate("2026-12-26"), "26/12/2026")
  assert.equal(parseSeasonDate("26/12/2026"), "2026-12-26")
  assert.equal(parseSeasonDate("29/02/2028"), "2028-02-29")
  assert.equal(parseSeasonDate("29/02/2027"), "")
  assert.equal(parseSeasonDate("31/04/2027"), "")
})
