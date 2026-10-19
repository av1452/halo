/** Weeks for a month view, Monday-first or Sunday-first. Null cells are padding. */
export function monthMatrix(year: number, month: number, weekStartsOn: 0 | 1 = 0): (Date | null)[][] {
  const first = new Date(year, month, 1)
  const lead = (first.getDay() - weekStartsOn + 7) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))]
  while (cells.length % 7) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
}
