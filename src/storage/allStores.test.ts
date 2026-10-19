import './allStores'
import { allStores } from './persistedStore'

it('registers every persisted store for backup and reset', () => {
  expect(allStores().map((s) => s.key).sort()).toEqual(
    ['dashboard', 'discover', 'launcher', 'media', 'notes', 'preferences', 'reminders', 'smart-home-demo', 'theme', 'weather'].sort(),
  )
})
