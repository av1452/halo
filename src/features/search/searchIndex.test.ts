import { demoHome } from '../../integrations/smart-home/demoData'
import { defaultLauncher } from '../apps/defaults'
import { DEFAULT_LAYOUT } from '../home/dashboardStore'
import { Globe } from 'lucide-react'
import { buildIndex, scoreItem, search, type SearchItem } from './searchIndex'

const index = buildIndex({ launcher: defaultLauncher(), home: demoHome(), dashboard: DEFAULT_LAYOUT })

describe('unified search', () => {
  it('indexes every kind of Halo content', () => {
    const groups = new Set(index.map((i) => i.group))
    expect([...groups].sort()).toEqual(['Apps', 'Dashboard', 'Discover', 'Media', 'Sections', 'Settings', 'Smart Home'])
  })

  it('ranks exact and prefix title matches above keyword matches', () => {
    const item = (title: string, keywords = ''): SearchItem => ({ id: title, group: 'Apps', title, keywords, icon: Globe, action: { kind: 'navigate', to: '/' } })
    expect(scoreItem(item('Notes'), 'notes')).toBeGreaterThan(scoreItem(item('Notes App'), 'notes'))
    expect(scoreItem(item('Notes App'), 'notes')).toBeGreaterThan(scoreItem(item('Day One', 'journal notes'), 'notes'))
    expect(scoreItem(item('Anything'), '')).toBe(0)
  })

  it('groups results in a stable order and finds content by keyword', () => {
    const results = search(index, 'dark')
    expect(results.map((g) => g.group)).toEqual(['Discover', 'Settings']) // Darkroom, then Appearance via keywords
    expect(results[1].items[0].title).toBe('Appearance')
    const lamp = search(index, 'lamp')
    expect(lamp.map((g) => g.group)).toEqual(['Smart Home'])
    expect(lamp[0].items.map((i) => i.title)).toEqual(expect.arrayContaining(['Floor Lamp', 'Bedside Lamp']))
  })

  it('finds shortcuts by URL and scenes by name', () => {
    expect(search(index, 'ycombinator')[0].items[0].title).toBe('Hacker News')
    expect(search(index, 'movie').flatMap((g) => g.items).some((i) => i.action.kind === 'scene')).toBe(true)
  })
})
