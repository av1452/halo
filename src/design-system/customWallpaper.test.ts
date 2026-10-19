import { idbGet } from '../storage/idb'
import { MAX_WALLPAPER_BYTES, saveCustomWallpaper } from './customWallpaper'

describe('custom wallpaper storage', () => {
  it('stores image bytes and type rather than a Blob', async () => {
    await saveCustomWallpaper(new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' }))
    const stored = await idbGet<{ type: string; bytes: ArrayBuffer }>('custom-wallpaper')
    expect(stored?.type).toBe('image/png')
    expect(new Uint8Array(stored!.bytes)).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('rejects non-images and oversized files', async () => {
    await expect(saveCustomWallpaper(new File(['x'], 'a.txt', { type: 'text/plain' }))).rejects.toThrow('Choose an image')
    const big = { type: 'image/jpeg', size: MAX_WALLPAPER_BYTES + 1 } as File
    await expect(saveCustomWallpaper(big)).rejects.toThrow('larger than 12 MB')
  })
})
