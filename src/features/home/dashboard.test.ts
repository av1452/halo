import { addWidget, dashboardStore, DEFAULT_LAYOUT, moveWidget, removeWidget, toggleWidgetSize } from './dashboardStore'
import { monthMatrix } from './widgets/calendar'
import { addReminder, localDateKey, remindersStore } from './widgetStores'

describe('dashboard store', () => {
  afterEach(() => dashboardStore.reset())

  it('adds, removes, reorders and resizes widgets', () => {
    removeWidget('w-clock')
    expect(dashboardStore.get().some((w) => w.type === 'clock')).toBe(false)
    addWidget('clock')
    addWidget('clock')
    expect(dashboardStore.get().filter((w) => w.type === 'clock')).toHaveLength(1)
    const first = dashboardStore.get()[0].id
    moveWidget(first, 1)
    expect(dashboardStore.get()[1].id).toBe(first)
    toggleWidgetSize(first)
    expect(dashboardStore.get()[1].size).toBe('wide')
  })

  it('drops unknown and duplicate widgets from saved layouts', () => {
    const valid = dashboardStore.load([{ id: 'a', type: 'notes', size: 'regular' }, { id: 'b', type: 'notes', size: 'wide' }, { id: 'c', type: 'bogus', size: 'regular' }])
    expect(valid).toBe(true)
    expect(dashboardStore.get()).toEqual([{ id: 'a', type: 'notes', size: 'regular' }])
    expect(DEFAULT_LAYOUT.length).toBeGreaterThan(0)
  })
})

describe('calendar', () => {
  it('builds a padded month matrix', () => {
    const weeks = monthMatrix(2026, 1) // February 2026 starts on a Sunday
    expect(weeks[0][0]?.getDate()).toBe(1)
    expect(weeks.flat().filter(Boolean)).toHaveLength(28)
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(monthMatrix(2026, 1, 1)[0][6]?.getDate()).toBe(1) // Monday-first
  })

  it('formats local date keys', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('reminders', () => {
  afterEach(() => remindersStore.reset())
  it('ignores empty text and invalid dates', () => {
    addReminder('   ')
    addReminder('Water plants', 'tomorrow')
    expect(remindersStore.get()).toEqual([expect.objectContaining({ text: 'Water plants', due: undefined })])
  })
})
