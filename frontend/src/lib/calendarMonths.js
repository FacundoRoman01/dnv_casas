export const CALENDAR_HORIZON_MONTHS = 12

export function getMaxMonthOffset(visibleMonthCount) {
  return Math.max(0, CALENDAR_HORIZON_MONTHS - visibleMonthCount)
}

export function getVisibleMonths(now, monthOffset, visibleMonthCount) {
  const baseMonthIndex = now.getFullYear() * 12 + now.getMonth() + monthOffset
  return Array.from({ length: visibleMonthCount }, (_, index) => {
    const monthIndex = baseMonthIndex + index
    return { year: Math.floor(monthIndex / 12), month: monthIndex % 12 }
  })
}

export function getMonthCells(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells = Array(startDow).fill(null)
  for (let day = 1; day <= lastDay.getDate(); day++) {
    cells.push(new Date(year, month, day))
  }
  while (cells.length < 42) cells.push(null)
  return cells
}
