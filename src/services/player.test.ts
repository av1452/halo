import { createPlayer, isAudioFile, trackInfoFromFileName, type AudioLike } from './player'

function fakeAudio() {
  const handlers = new Map<string, () => void>()
  const audio: AudioLike & { fire: (t: string) => void } = {
    src: '',
    currentTime: 0,
    duration: 0,
    paused: true,
    play: vi.fn(async () => {
      audio.paused = false
      handlers.get('playing')?.()
    }),
    pause: vi.fn(() => {
      audio.paused = true
      handlers.get('pause')?.()
    }),
    addEventListener: (t, fn) => handlers.set(t, fn),
    removeAttribute: vi.fn(),
    load: vi.fn(),
    fire: (t) => handlers.get(t)?.(),
  }
  return audio
}

function setup() {
  const audio = fakeAudio()
  const revoke = vi.fn()
  let n = 0
  const p = createPlayer({ createAudio: () => audio, createObjectURL: () => `blob:${++n}`, revokeObjectURL: revoke })
  return { p, audio, revoke }
}

const file = (name: string, type = 'audio/mpeg') => new File(['x'], name, { type })

describe('player', () => {
  it('parses track info from file names', () => {
    expect(trackInfoFromFileName('Nina Simone - Feeling Good.mp3')).toEqual({ artist: 'Nina Simone', title: 'Feeling Good' })
    expect(trackInfoFromFileName('voice_memo.m4a')).toEqual({ title: 'voice memo' })
  })

  it('accepts only audio files', () => {
    expect(isAudioFile(file('a.mp3'))).toBe(true)
    expect(isAudioFile(file('a.flac', ''))).toBe(true)
    expect(isAudioFile(file('photo.jpg', 'image/jpeg'))).toBe(false)
  })

  it('loads files, plays the first and reports real status', async () => {
    const { p, audio } = setup()
    expect(p.loadFiles([file('One.mp3'), file('notes.txt', 'text/plain'), file('Two.mp3')])).toBe(2)
    await Promise.resolve()
    expect(audio.src).toBe('blob:1')
    expect(p.getState()).toMatchObject({ status: 'playing', index: 0 })
    p.toggle()
    expect(p.getState().status).toBe('paused')
  })

  it('skips between tracks and advances when a track ends', async () => {
    const { p, audio } = setup()
    p.loadFiles([file('One.mp3'), file('Two.mp3')])
    p.skip(1)
    expect(p.getState().index).toBe(1)
    expect(audio.src).toBe('blob:2')
    p.skip(1) // at the end: stays put
    expect(p.getState().index).toBe(1)
    p.skip(-1)
    expect(p.getState().index).toBe(0)
    audio.fire('ended')
    expect(p.getState().index).toBe(1)
  })

  it('reports playback errors honestly', () => {
    const { p, audio } = setup()
    p.loadFiles([file('broken.mp3')])
    audio.fire('error')
    expect(p.getState()).toMatchObject({ status: 'error' })
  })

  it('releases object URLs when cleared', () => {
    const { p, revoke } = setup()
    p.loadFiles([file('One.mp3')])
    p.clear()
    expect(revoke).toHaveBeenCalledWith('blob:1')
    expect(p.getState()).toMatchObject({ status: 'idle', queue: [] })
  })
})
