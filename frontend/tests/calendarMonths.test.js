import test from "node:test"
import assert from "node:assert/strict"
import { getMaxMonthOffset, getMonthCells, getVisibleMonths } from "../src/lib/calendarMonths.js"

test("todos los meses reservan seis semanas", () => {
  for (let month = 0; month < 12; month++) {
    assert.equal(getMonthCells(2027, month).length, 42)
  }
})

test("el horizonte contiene doce meses en desktop y mobile", () => {
  assert.equal(getMaxMonthOffset(2), 10)
  assert.equal(getMaxMonthOffset(1), 11)

  const now = new Date(2026, 8, 15)
  assert.deepEqual(getVisibleMonths(now, 10, 2), [
    { year: 2027, month: 6 },
    { year: 2027, month: 7 },
  ])
  assert.deepEqual(getVisibleMonths(now, 11, 1), [
    { year: 2027, month: 7 },
  ])
})

test("el cálculo atraviesa diciembre sin romper el año", () => {
  const months = getVisibleMonths(new Date(2026, 11, 1), 0, 2)
  assert.deepEqual(months, [
    { year: 2026, month: 11 },
    { year: 2027, month: 0 },
  ])
})
