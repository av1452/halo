import { classifyUrl, displayHost, isAppStoreUrl, normalizeUrl } from './url'

describe('normalizeUrl', () => {
  it('adds https to bare domains', () => {
    expect(normalizeUrl('github.com')).toBe('https://github.com/')
    expect(normalizeUrl('  news.ycombinator.com/item?id=1 ')).toBe('https://news.ycombinator.com/item?id=1')
    expect(normalizeUrl('localhost:5173')).toBe('https://localhost:5173/')
  })

  it('keeps web, contact and app-scheme URLs', () => {
    expect(normalizeUrl('http://example.com/a')).toBe('http://example.com/a')
    expect(normalizeUrl('mailto:hi@example.com')).toBe('mailto:hi@example.com')
    expect(normalizeUrl('tel:5551234')).toBe('tel:5551234')
    expect(normalizeUrl('example.com:8080/x')).toBe('https://example.com:8080/x')
    expect(normalizeUrl('shortcuts://')).toBe('shortcuts://')
    expect(normalizeUrl('spotify:album:123')).toBe('spotify:album:123')
  })

  it('rejects unsafe or malformed input', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeUrl('JavaScript:alert(1)')).toBeNull()
    expect(normalizeUrl('data:text/html,<b>hi</b>')).toBeNull()
    expect(normalizeUrl('file:///etc/passwd')).toBeNull()
    expect(normalizeUrl('not a url')).toBeNull()
    expect(normalizeUrl('word')).toBeNull()
    expect(normalizeUrl('')).toBeNull()
    expect(normalizeUrl('tel:')).toBeNull()
  })
})

describe('url helpers', () => {
  it('classifies URLs', () => {
    expect(classifyUrl('https://a.com')).toBe('web')
    expect(classifyUrl('tel:123')).toBe('contact')
    expect(classifyUrl('spotify:home')).toBe('app-scheme')
  })

  it('recognises App Store links', () => {
    expect(isAppStoreUrl('https://apps.apple.com/app/id1')).toBe(true)
    expect(isAppStoreUrl('https://apps.apple.com.evil.example/app')).toBe(false)
  })

  it('formats hosts for display', () => {
    expect(displayHost('https://www.github.com/x')).toBe('github.com')
    expect(displayHost('shortcuts://run')).toBe('shortcuts:')
  })
})
