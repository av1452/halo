import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { Plugin } from 'vite'

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? listFiles(path) : [path]
  })
}

/**
 * Emits sw.js with the exact build output to precache. Paths are relative
 * to the worker so the same build works at / or a GitHub Pages /repo/ base.
 * The cache name hashes every precached file, so any change ships a new
 * worker and old caches are cleaned up on activation.
 */
export function serviceWorker(options: { template: string; publicDir: string; version: string }): Plugin {
  return {
    name: 'halo-service-worker',
    apply: 'build',
    // Run after Vite has emitted index.html into the bundle
    enforce: 'post',
    generateBundle(_, bundle) {
      const hash = createHash('sha256')
      const files: string[] = []

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (fileName.endsWith('.map')) continue
        files.push(fileName)
        hash.update(fileName).update(chunk.type === 'chunk' ? chunk.code : chunk.source)
      }
      for (const path of listFiles(options.publicDir)) {
        const fileName = relative(options.publicDir, path).split('\\').join('/')
        if (fileName.startsWith('.')) continue
        files.push(fileName)
        hash.update(fileName).update(readFileSync(path))
      }

      if (!files.includes('index.html')) this.error('index.html was not in the bundle; the app shell would not be precached')

      const cacheName = `halo-v${options.version}-${hash.digest('hex').slice(0, 12)}`
      const source = readFileSync(options.template, 'utf8')
        .replace('__HALO_CACHE__', cacheName)
        .replace('__HALO_PRECACHE__', JSON.stringify(files.sort(), null, 2))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}
