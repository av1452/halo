import { useEffect, useState } from 'react'
import { idbDelete, idbGet, idbSet } from '../storage/idb'

const KEY = 'custom-wallpaper'
export const MAX_WALLPAPER_BYTES = 12 * 1024 * 1024
const listeners = new Set<() => void>()

/**
 * Stored as raw bytes + type rather than a Blob: WebKit can fail to store
 * Blobs in IndexedDB ("Error preparing Blob/File data"), notably in private
 * and ephemeral sessions, while ArrayBuffers work everywhere.
 */
interface StoredImage {
  type: string
  bytes: ArrayBuffer
}

function readBytes(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer()
  // Safari < 14 lacks Blob.arrayBuffer()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export async function saveCustomWallpaper(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > MAX_WALLPAPER_BYTES) throw new Error('That image is larger than 12 MB.')
  try {
    await idbSet(KEY, { type: file.type, bytes: await readBytes(file) } satisfies StoredImage)
  } catch {
    throw new Error('This browser couldn’t save the photo. Storage may be full or disabled (for example in private browsing).')
  }
  listeners.forEach((l) => l())
}

export async function removeCustomWallpaper() {
  await idbDelete(KEY)
  listeners.forEach((l) => l())
}

/** Object URL for the saved wallpaper image, or null. Revoked on change. */
export function useCustomWallpaperUrl(enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    listeners.add(bump)
    return () => {
      listeners.delete(bump)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let objectUrl: string | null = null
    let cancelled = false
    idbGet<StoredImage>(KEY)
      .then((stored) => {
        if (cancelled) return
        objectUrl = stored?.bytes instanceof ArrayBuffer ? URL.createObjectURL(new Blob([stored.bytes], { type: stored.type })) : null
        setUrl(objectUrl)
      })
      .catch(() => !cancelled && setUrl(null))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [enabled, version])

  return enabled ? url : null
}
