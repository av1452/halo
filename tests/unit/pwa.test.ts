import indexHtml from '../../index.html?raw'
import manifestText from '../../public/manifest.webmanifest?raw'
import swTemplate from '../../src/pwa/sw-template.js?raw'

const manifest = JSON.parse(manifestText)
const publicIcons = Object.keys(import.meta.glob('../../public/icons/*', { query: '?url', eager: true })).map((p) => p.replace('../../public/', ''))

describe('PWA configuration', () => {
  it('has a complete, base-path-independent manifest', () => {
    expect(manifest).toMatchObject({ name: expect.stringContaining('Halo'), short_name: 'Halo', display: 'standalone', start_url: './', scope: './' })
    for (const url of [manifest.start_url, manifest.scope, ...manifest.icons.map((i: { src: string }) => i.src)]) {
      expect(url.startsWith('/')).toBe(false)
    }
  })

  it('ships every icon the manifest and iOS reference', () => {
    const sizes = manifest.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes}:${i.purpose}`)
    expect(sizes).toEqual(expect.arrayContaining(['192x192:any', '512x512:any', '512x512:maskable']))
    for (const icon of manifest.icons) expect(publicIcons).toContain(icon.src)
    expect(publicIcons).toContain('icons/apple-touch-icon.png')
  })

  it('links the manifest and iOS metadata from index.html', () => {
    const html = indexHtml
    expect(html).toContain('rel="manifest"')
    expect(html).toContain('rel="apple-touch-icon"')
    expect(html).toContain('viewport-fit=cover')
    expect(html).toContain('<title>Halo — Your Digital Home Hub</title>')
  })

  it('never caches cross-origin requests in the service worker', () => {
    const sw = swTemplate
    expect(sw).toContain('if (url.origin !== self.location.origin) return')
    // Updates activate only when the user accepts the prompt
    const installHandler = sw.slice(sw.indexOf("addEventListener('install'"), sw.indexOf("addEventListener('activate'"))
    expect(installHandler).not.toContain('self.skipWaiting()')
    expect(sw).toContain("event.data.type === 'SKIP_WAITING'")
  })
})
