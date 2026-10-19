import { applyTheme, DEFAULT_THEME, findAccent, hexToRgb, resolveAppearance } from './theme'

describe('theme', () => {
  it('resolves system appearance from the media preference', () => {
    expect(resolveAppearance('system', true)).toBe('dark')
    expect(resolveAppearance('system', false)).toBe('light')
    expect(resolveAppearance('light', true)).toBe('light')
  })

  it('converts hex to an rgb triplet', () => {
    expect(hexToRgb('#0a84ff')).toBe('10, 132, 255')
    expect(hexToRgb('#fff')).toBe('255, 255, 255')
  })

  it('falls back to the default accent for unknown ids', () => {
    expect(findAccent('nope').id).toBe('blue')
  })

  it('writes theme attributes and accent variables to the root', () => {
    const root = document.createElement('html')
    applyTheme({ ...DEFAULT_THEME, appearance: 'dark', accent: 'pink', glass: 'vivid', reduceMotion: true }, false, root)
    expect(root.dataset.theme).toBe('dark')
    expect(root.dataset.glass).toBe('vivid')
    expect(root.dataset.motion).toBe('reduced')
    expect(root.style.getPropertyValue('--accent')).toBe('#ff375f')
  })
})

describe('custom wallpaper', () => {
  it('layers the image over the gradient fallback', () => {
    const root = document.createElement('html')
    applyTheme({ ...DEFAULT_THEME, wallpaper: 'custom' }, false, root, 'blob:abc')
    expect(root.style.getPropertyValue('--wallpaper')).toMatch(/^url\("blob:abc"\) center \/ cover no-repeat, /)
  })

  it('falls back to a gradient when no image is stored', () => {
    const root = document.createElement('html')
    applyTheme({ ...DEFAULT_THEME, wallpaper: 'custom' }, false, root, null)
    expect(root.style.getPropertyValue('--wallpaper')).not.toContain('url(')
  })
})
