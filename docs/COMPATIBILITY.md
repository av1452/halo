# Browser compatibility

Halo is built for **modern Safari first** and degrades gracefully on older
engines. This is a browser-compatibility goal, not a native iOS deployment
target.

## What was actually tested

| Environment | How | Coverage |
| --- | --- | --- |
| Mobile Safari, **iOS 26.1** (iPhone 17 Pro, iPad Pro 11-inch M5) | Xcode Simulator, production build | Manual visual check of Home and Smart Home: layout, safe areas, glass blur, tab bar against Safari's toolbar. Found and fixed one layout bug (reminder input on iPad). |
| **Playwright WebKit 27.2** at iPhone 15 Pro and iPad Pro 11 sizes | Automated e2e suite | Navigation, deep links, responsive layout, persistence, offline/service worker, manifest, axe WCAG 2.1 AA scans (light and dark), focus management, fallbacks |
| **Chromium 156** (desktop) | Automated e2e suite, plus a manual service-worker update test | Same as above, plus the update prompt and reload flow |
| jsdom | Vitest unit and component tests | Logic, stores, validation, components |

**The oldest browser actually tested is iOS 26.1 Safari / WebKit 27.2.** All
older versions in the matrix below are *expected* behaviour, based on the
features the build uses and published support data. They are **untested**.
Not tested at all: physical devices, Firefox, Android browsers, and "Add to
Home Screen" on a device (it can't be automated).

## Matrix

Legend: ✅ supported · 🟡 works with reduced fidelity · ❌ not available

| Capability | iOS 16.4+ | iOS 15.4–16.3 | iOS 14.0–15.3 | iOS 11.3–13 | iOS 10–11.2 |
| --- | --- | --- | --- | --- | --- |
| App runs (JS bundle targets Safari 14) | ✅ | ✅ | ✅ | ❌ notice shown | ❌ notice shown |
| Responsive layout | ✅ | ✅ | 🟡 flex `gap` needs 14.5; spacing tighter on 14.0–14.4 | — | — |
| Liquid Glass blur (`-webkit-backdrop-filter`) | ✅ | ✅ | ✅ | — | — |
| Opaque fallback without blur / with Reduce Transparency | ✅ | ✅ | ✅ | — | — |
| Safe-area insets (`env()`) | ✅ | ✅ | ✅ | — | — |
| `dvh` viewport units | ✅ | 🟡 falls back to `vh` (15.4+ has `dvh`) | 🟡 `vh` | — | — |
| LocalStorage persistence | ✅ | ✅ | ✅ | — | — |
| IndexedDB (photo wallpaper) | ✅ | ✅ | ✅ (bytes stored as ArrayBuffer for WebKit) | — | — |
| Service worker / offline | ✅ | ✅ | ✅ | — | — |
| Web App Manifest + standalone | ✅ | ✅ | 🟡 iOS uses `apple-mobile-web-app-*` tags | — | 🟡 basic web clip |
| Install prompt (`beforeinstallprompt`) | ❌ use Share → Add to Home Screen | ❌ | ❌ | — | — |
| Media Session (lock-screen controls) | ✅ | ✅ (15+) | 🟡 playback works, no system controls on 14 | — | — |
| `inert` while editing the dashboard | ✅ | 🟡 15.5+; `pointer-events` fallback otherwise | 🟡 fallback | — | — |
| App links (`https`, Universal Links, `mailto:`, `tel:`, schemes) | ✅ | ✅ | ✅ | — | — |
| Smart-home integrations | Demo only on all versions | | | | |

On desktop, current Chrome, Edge and Firefox are expected to work. Chromium is
tested; Firefox isn't.

## Why iOS 10–13 get a notice instead of the app

The brief asked for the widest practical range back to iOS 10. Here's the
trade-off:

- React 19 and the app code rely on modern syntax and APIs. Running on Safari
  10–13 would need a second, transpiled bundle (e.g. `@vitejs/plugin-legacy`
  with core-js and SystemJS), roughly doubling what has to be built, tested and
  maintained.
- Even with that bundle, the layout depends on CSS that Safari 13 and earlier
  lack (above all flexbox `gap`, used throughout, and `aspect-ratio`), so the UI
  would be visibly broken without a parallel set of CSS fallbacks. (`inset` is
  already rewritten to `top/right/bottom/left` by the build.)
- No iOS 10–13 runtime was available to test against, and shipping untested
  support would contradict the project's "don't claim what isn't verified"
  rule.

So `index.html` contains a small **ES5 feature check** that runs before the
bundle. Where it fails, as on Safari 13 and earlier, the page shows "Halo needs
a newer browser" with a short explanation instead of a blank screen. An e2e test
simulates this.

If legacy support becomes important, the path is `@vitejs/plugin-legacy`
targeting Safari 10.3, CSS fallbacks for `gap`, and testing on an older
simulator runtime (installable from Xcode → Settings → Components).

## Progressive enhancement in the code

- Glass surfaces start opaque and become translucent only inside
  `@supports (backdrop-filter)` (`src/design-system/glass.css`).
- `prefers-reduced-motion`, `prefers-reduced-transparency` and
  `prefers-color-scheme` are honoured, and each has a manual override in
  Settings.
- The colour theme is set by an inline script before first paint, so there's no
  light flash in dark mode.
- Storage access is wrapped so that blocked or full storage (e.g. old Safari
  private mode) degrades to an in-memory session instead of crashing.
- `matchMedia` listeners fall back to the older `addListener` API (Safari < 14).
- `Blob.arrayBuffer` falls back to `FileReader` (Safari < 14).
- The service worker and install features are feature-detected and optional.
