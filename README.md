# Halo

**Your digital world, beautifully unified.**

Halo is a Liquid Glass–inspired home hub that runs in the browser and installs as a
Progressive Web App (PWA) on iPhone, iPad and desktop. It brings app shortcuts,
smart-home controls, media destinations, widgets and search into one cohesive
interface.

> Halo is an independent personal project. It is not an Apple product, is not
> affiliated with Apple, does not replace the iOS Home Screen, and does not use
> any private iOS APIs. "Halo" is a provisional name pending availability and
> trademark checks.

## Status

Early development. See the [Roadmap](#roadmap) for what exists today and what is
planned. Anything not ticked there has not been built yet.

## Tech stack

| Concern | Choice |
| --- | --- |
| UI | React 19, TypeScript (strict) |
| Build | Vite |
| Routing | React Router |
| Icons | Lucide (open source) |
| Styling | Plain CSS with design tokens and CSS Modules |
| Persistence | LocalStorage (preferences), IndexedDB (structured data) |
| Tests | Vitest, Testing Library, jsdom |
| Lint | oxlint |
| Hosting | GitHub Pages (static, HTTPS, free) |

No backend, account, or paid API is required for the core app.

## Getting started

Requires Node.js 20+ and npm.

```sh
npm install
npm run dev        # start the dev server
npm run check      # typecheck, lint, test and production build
npm run preview    # serve the production build locally
```

| Script | Purpose |
| --- | --- |
| `dev` | Vite dev server with hot reload |
| `build` | Type-check and produce `dist/` |
| `typecheck` | `tsc -b` with no emit |
| `lint` | oxlint |
| `test` | Run unit and component tests once |
| `check` | Everything CI runs, in order |

## Implementation plan

1. Scaffold, tooling and docs.
2. Design system: tokens, glass surfaces, fallbacks, light/dark themes.
3. App shell: six sections (Home, Apps, Smart Home, Media, Discover, Settings),
   bottom tab bar on iPhone, sidebar on iPad/desktop, safe-area handling.
4. Storage layer: versioned LocalStorage preferences, IndexedDB for user data,
   export/import with validation.
5. Apps launcher: shortcuts, folders, favorites, edit/reorder, custom URLs.
6. Home dashboard: customizable widgets (clock, weather, favorites, scenes,
   media, notes), edit mode, persistence.
7. Smart Home demo mode behind a `SmartHomeProvider` interface.
8. Media destinations and a Now Playing card that only reports real sessions.
9. Discover: curated listings with App Store links, optional live lookup.
10. Unified search across Halo's own content.
11. Settings: appearance, wallpaper, accent, glass intensity, data, about.
12. PWA: manifest, icons, service worker, offline fallback, update prompt.
13. Tests, accessibility pass, deployment workflow and docs.

## Browser compatibility constraints

Halo targets **modern Safari first** and degrades gracefully on older engines.
This is a browser compatibility goal, not a native deployment target.

| Capability | Safari 16.4+ (iOS 16.4+) | Safari 14–16.3 | Safari 11.3–13 | iOS 10–11.2 |
| --- | --- | --- | --- | --- |
| Core app (JS bundle) | Full | Full | Not supported by the modern bundle | Not supported |
| Backdrop blur glass | Yes (`-webkit-` prefix ≤ 17) | Yes | Yes | Opaque fallback |
| Responsive layout & safe areas | Yes | Yes | Yes | Partial |
| LocalStorage | Yes | Yes | Yes | Yes |
| IndexedDB | Yes | Yes | Buggy before 14 | Buggy |
| Service worker / offline | Yes | Yes | Yes (11.3+) | No |
| Add to Home Screen standalone | Yes | Yes | Yes | Basic web clip |
| Web App Manifest | Yes | Partial | Partial (11.3+) | No |

Notes:

- The production bundle targets `es2020` / `safari14`. React 19 and React Router 7
  rely on syntax and APIs that iOS 10–13 lack, so supporting them fully would
  require a separate legacy bundle plus polyfills. This is tracked on the roadmap
  rather than promised.
- Glass effects use `@supports` feature detection with solid fallbacks, so text
  stays legible regardless of engine support.
- The "tested" column will be filled in only with versions actually exercised.

### Tested environments

None yet beyond jsdom unit tests. This section will list real devices and
browser versions once they have been checked.

## Platform limitations

A web app cannot:

- Enumerate installed iOS apps or guarantee a native app opens from a link.
- Access HomeKit, WidgetKit, App Intents, Siri or other native-only frameworks.
- Read or control playback in other apps.
- Run in the background or draw over other apps.

Halo uses standard links, Universal Links and explicitly configured URL schemes,
and falls back to websites or App Store listings when those cannot be verified.

## Roadmap

- [x] Project scaffold and tooling
- [ ] Design system and glass surfaces
- [ ] App shell and navigation
- [ ] Storage and data export/import
- [ ] Apps launcher
- [ ] Home dashboard
- [ ] Smart Home demo mode
- [ ] Media
- [ ] Discover
- [ ] Unified search
- [ ] Settings and personalization
- [ ] PWA manifest, icons and offline support
- [ ] Deployment workflow
- [ ] Legacy Safari bundle (investigation)

## Privacy

Halo stores everything locally in your browser. No analytics, accounts or
tracking. Any external data source added later will be listed here along with
what it receives.
