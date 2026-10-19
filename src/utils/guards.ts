/** Small runtime type guards for validating persisted and imported data. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isOneOf<T extends string>(options: readonly T[]) {
  return (value: unknown): value is T => typeof value === 'string' && (options as readonly string[]).includes(value)
}

export function isArrayOf<T>(guard: (v: unknown) => v is T) {
  return (value: unknown): value is T[] => Array.isArray(value) && value.every(guard)
}

/** Keeps only the array items that pass the guard, dropping corrupt entries. */
export function filterValid<T>(value: unknown, guard: (v: unknown) => v is T): T[] {
  return Array.isArray(value) ? value.filter(guard) : []
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
