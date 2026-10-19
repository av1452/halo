import { formatTemp } from './format'

it('formats temperatures in the chosen unit', () => {
  expect(formatTemp(21, 'celsius')).toBe('21°C')
  expect(formatTemp(21, 'fahrenheit')).toBe('70°F')
  expect(formatTemp(19.5, 'celsius', 1)).toBe('19.5°C')
})

it('formats playback times', async () => {
  const { formatTime } = await import('./format')
  expect(formatTime(125)).toBe('2:05')
  expect(formatTime(NaN)).toBe('0:00')
})
