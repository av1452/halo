export interface HandoffEnv {
  addEventListener: (type: 'blur' | 'pagehide', fn: () => void) => void
  removeEventListener: (type: 'blur' | 'pagehide', fn: () => void) => void
  onVisibilityChange: (fn: () => void) => () => void
  isHidden: () => boolean
  setTimeout: (fn: () => void, ms: number) => unknown
}

const browserEnv = (): HandoffEnv => ({
  addEventListener: (t, fn) => window.addEventListener(t, fn),
  removeEventListener: (t, fn) => window.removeEventListener(t, fn),
  onVisibilityChange: (fn) => {
    document.addEventListener('visibilitychange', fn)
    return () => document.removeEventListener('visibilitychange', fn)
  },
  isHidden: () => document.visibilityState === 'hidden',
  setTimeout: (fn, ms) => window.setTimeout(fn, ms),
})

/**
 * After following an app URL scheme, watches whether the page lost focus or
 * visibility, which is the only signal a web page gets that another app took
 * over. Resolves false when nothing happened: the app may be missing, or the
 * user may have dismissed a prompt. Halo reports that as "not confirmed"
 * rather than guessing either way.
 */
export function watchHandoff(timeoutMs = 1600, env: HandoffEnv = browserEnv()): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (result: boolean) => {
      if (settled) return
      settled = true
      env.removeEventListener('blur', onLeave)
      env.removeEventListener('pagehide', onLeave)
      stopVisibility()
      resolve(result)
    }
    const onLeave = () => finish(true)
    env.addEventListener('blur', onLeave)
    env.addEventListener('pagehide', onLeave)
    const stopVisibility = env.onVisibilityChange(() => env.isHidden() && finish(true))
    env.setTimeout(() => finish(env.isHidden()), timeoutMs)
  })
}
