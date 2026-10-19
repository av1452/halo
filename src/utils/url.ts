export type UrlKind = 'web' | 'contact' | 'app-scheme'

/** Schemes that can run code or read local data; never opened from Halo. */
const BLOCKED_SCHEMES = new Set(['javascript', 'data', 'vbscript', 'file', 'blob', 'about', 'chrome', 'view-source'])
const CONTACT_SCHEMES = new Set(['mailto', 'tel', 'sms', 'facetime', 'facetime-audio'])
const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i

export function schemeOf(url: string): string | null {
  const match = SCHEME_RE.exec(url.trim())
  return match ? match[1].toLowerCase() : null
}

/**
 * Turns user input into a usable URL. Bare domains like "example.com" become
 * https URLs. Returns null for empty, malformed or unsafe input.
 */
export function normalizeUrl(input: string): string | null {
  const value = input.trim()
  if (!value || /\s/.test(value)) return null
  const scheme = schemeOf(value)

  // "localhost:3000" looks like a scheme but is a host:port
  if (!scheme || /^(localhost|[^/:]+\.[^/:]+):\d+(\/|$)/i.test(value)) {
    if (!/^[^./]+(\.[^./]+)+|^localhost/i.test(value)) return null
    return normalizeUrl(`https://${value}`)
  }
  if (BLOCKED_SCHEMES.has(scheme)) return null
  if (scheme === 'http' || scheme === 'https') {
    try {
      const url = new URL(value)
      return url.hostname ? url.href : null
    } catch {
      return null
    }
  }
  // Custom app schemes and contact links must have something after the colon
  return value.length > scheme.length + 1 ? value : null
}

export function classifyUrl(url: string): UrlKind {
  const scheme = schemeOf(url)
  if (scheme === 'http' || scheme === 'https') return 'web'
  if (scheme && CONTACT_SCHEMES.has(scheme)) return 'contact'
  return 'app-scheme'
}

export function isAppStoreUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    return (protocol === 'https:' || protocol === 'itms-apps:') && /(^|\.)apps\.apple\.com$/.test(hostname)
  } catch {
    return false
  }
}

/** A short, human-readable host for display ("github.com"). */
export function displayHost(url: string): string {
  try {
    const { hostname, protocol } = new URL(url)
    if (protocol === 'http:' || protocol === 'https:') return hostname.replace(/^www\./, '')
  } catch {
    // fall through
  }
  return schemeOf(url) ? `${schemeOf(url)}:` : url
}
