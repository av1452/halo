import { formatTemp } from './format'

it('formats temperatures in the chosen unit', () => {
  expect(formatTemp(21, 'celsius')).toBe('21°C')
  expect(formatTemp(21, 'fahrenheit')).toBe('70°F')
  expect(formatTemp(19.5, 'celsius', 1)).toBe('19.5°C')
})
