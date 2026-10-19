import { ACCENTS, applyTheme, contrastRatio, DEFAULT_THEME, findAccent, hexToRgb, resolveAppearance, textOn } from './theme'

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
    expect(root.style.getPropertyValue('--on-accent')).toBe('#000000')
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

describe('accent contrast (WCAG AA)', () => {
  it.each(ACCENTS.map((a) => [a.name, a] as const))('%s meets 4.5:1 in both modes', (_name, accent) => {
    // Text on accent fills
    expect(contrastRatio(textOn(accent.light), accent.light)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(textOn(accent.dark), accent.dark)).toBeGreaterThanOrEqual(4.5)
    // Accent used as text on the base surfaces
    expect(contrastRatio(accent.light, '#f2f2f7')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(accent.dark, '#1c1c1e')).toBeGreaterThanOrEqual(4.5)
  })

  it('computes known ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(textOn('#0a6cd6')).toBe('#ffffff')
  })
})
