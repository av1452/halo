/**
 * Halo's own audio player. It plays files the user picks from their device,
 * entirely in the browser; nothing is uploaded. This is the only playback
 * Halo reports as "Now Playing" because it is the only playback a web page
 * can actually observe and control.
 */

export interface Track {
  id: string
  title: string
  artist?: string
  src: string
}

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface PlayerState {
  queue: Track[]
  index: number
  status: PlayerStatus
  currentTime: number
  duration: number
  error?: string
}

/** The subset of HTMLAudioElement the player uses; injectable for tests. */
export interface AudioLike {
  src: string
  currentTime: number
  duration: number
  paused: boolean
  play(): Promise<void>
  pause(): void
  addEventListener(type: string, fn: () => void): void
  removeAttribute(name: string): void
  load(): void
}

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|webm)$/i

/** "Artist - Title.mp3" → { artist, title }; otherwise the file name. */
export function trackInfoFromFileName(name: string): { title: string; artist?: string } {
  const base = name.replace(AUDIO_EXTENSIONS, '').replace(/_/g, ' ').trim()
  const parts = base.split(' - ')
  if (parts.length >= 2 && parts[0].trim() && parts.slice(1).join(' - ').trim()) {
    return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() }
  }
  return { title: base || 'Untitled' }
}

export function isAudioFile(file: { name: string; type: string }) {
  return file.type.startsWith('audio/') || AUDIO_EXTENSIONS.test(file.name)
}

interface PlayerDeps {
  createAudio: () => AudioLike
  createObjectURL: (file: File) => string
  revokeObjectURL: (url: string) => void
  mediaSession?: MediaSession
}

export function createPlayer(deps: PlayerDeps) {
  let state: PlayerState = { queue: [], index: 0, status: 'idle', currentTime: 0, duration: 0 }
  const listeners = new Set<() => void>()
  let audio: AudioLike | null = null

  const set = (patch: Partial<PlayerState>) => {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  }

  function ensureAudio(): AudioLike {
    if (audio) return audio
    const a = deps.createAudio()
    a.addEventListener('playing', () => set({ status: 'playing', error: undefined }))
    a.addEventListener('pause', () => state.status !== 'idle' && set({ status: 'paused' }))
    a.addEventListener('timeupdate', () => set({ currentTime: a.currentTime }))
    a.addEventListener('durationchange', () => set({ duration: Number.isFinite(a.duration) ? a.duration : 0 }))
    a.addEventListener('ended', () => (state.index < state.queue.length - 1 ? player.skip(1) : set({ status: 'paused', currentTime: 0 })))
    a.addEventListener('error', () => set({ status: 'error', error: 'This file couldn’t be played. The format may not be supported by this browser.' }))
    audio = a
    return a
  }

  function updateSession() {
    const session = deps.mediaSession
    const track = state.queue[state.index]
    if (!session || !track || typeof MediaMetadata === 'undefined') return
    session.metadata = new MediaMetadata({ title: track.title, artist: track.artist ?? '', album: 'Halo' })
  }

  function registerSessionHandlers() {
    const session = deps.mediaSession
    if (!session) return
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => void player.play()],
      ['pause', () => player.pause()],
      ['previoustrack', () => player.skip(-1)],
      ['nexttrack', () => player.skip(1)],
      ['seekto', (d) => d.seekTime != null && player.seek(d.seekTime)],
    ]
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler)
      } catch {
        // Older Safari versions reject some actions
      }
    }
  }

  async function startCurrent() {
    const track = state.queue[state.index]
    if (!track) return
    const a = ensureAudio()
    a.src = track.src
    set({ status: 'loading', currentTime: 0, duration: 0, error: undefined })
    updateSession()
    try {
      await a.play()
    } catch {
      // Autoplay policies can block play() outside a user gesture
      set({ status: 'paused' })
    }
  }

  const player = {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    /** Replaces the queue with local audio files and starts the first one. */
    loadFiles(files: File[]) {
      const audioFiles = files.filter(isAudioFile)
      if (audioFiles.length === 0) return 0
      state.queue.forEach((t) => deps.revokeObjectURL(t.src))
      const queue = audioFiles.map((file, i) => ({
        id: `${Date.now()}-${i}`,
        ...trackInfoFromFileName(file.name),
        src: deps.createObjectURL(file),
      }))
      set({ queue, index: 0 })
      registerSessionHandlers()
      void startCurrent()
      return audioFiles.length
    },
    async play() {
      if (!state.queue.length) return
      try {
        await ensureAudio().play()
      } catch {
        set({ status: 'paused' })
      }
    },
    pause() {
      audio?.pause()
    },
    toggle() {
      if (state.status === 'playing' || state.status === 'loading') player.pause()
      else void player.play()
    },
    skip(delta: 1 | -1) {
      // "Previous" restarts the track if we're more than 3s in, like most players
      if (delta === -1 && state.currentTime > 3 && audio) {
        player.seek(0)
        return
      }
      const next = state.index + delta
      if (next < 0 || next >= state.queue.length) return
      set({ index: next })
      void startCurrent()
    },
    seek(seconds: number) {
      if (!audio) return
      audio.currentTime = Math.max(0, Math.min(seconds, state.duration || seconds))
      set({ currentTime: audio.currentTime })
    },
    clear() {
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
      state.queue.forEach((t) => deps.revokeObjectURL(t.src))
      if (deps.mediaSession) deps.mediaSession.metadata = null
      set({ queue: [], index: 0, status: 'idle', currentTime: 0, duration: 0, error: undefined })
    },
  }
  return player
}

export type Player = ReturnType<typeof createPlayer>

export const player: Player = createPlayer({
  createAudio: () => new Audio(),
  createObjectURL: (file) => URL.createObjectURL(file),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
  mediaSession: typeof navigator !== 'undefined' && 'mediaSession' in navigator ? navigator.mediaSession : undefined,
})
