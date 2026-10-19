import { watchHandoff, type HandoffEnv } from './handoff'

function fakeEnv() {
  const handlers = new Map<string, () => void>()
  let visibility: (() => void) | null = null
  let timer: (() => void) | null = null
  let hidden = false
  const env: HandoffEnv = {
    addEventListener: (t, fn) => handlers.set(t, fn),
    removeEventListener: (t) => handlers.delete(t),
    onVisibilityChange: (fn) => {
      visibility = fn
      return () => (visibility = null)
    },
    isHidden: () => hidden,
    setTimeout: (fn) => (timer = fn),
  }
  return {
    env,
    blur: () => handlers.get('blur')?.(),
    hide: () => {
      hidden = true
      visibility?.()
    },
    elapse: () => timer?.(),
  }
}

describe('watchHandoff', () => {
  it('confirms when the page loses focus', async () => {
    const f = fakeEnv()
    const result = watchHandoff(100, f.env)
    f.blur()
    await expect(result).resolves.toBe(true)
  })

  it('confirms when the page becomes hidden', async () => {
    const f = fakeEnv()
    const result = watchHandoff(100, f.env)
    f.hide()
    await expect(result).resolves.toBe(true)
  })

  it('reports unconfirmed when nothing happens before the timeout', async () => {
    const f = fakeEnv()
    const result = watchHandoff(100, f.env)
    f.elapse()
    await expect(result).resolves.toBe(false)
  })
})
