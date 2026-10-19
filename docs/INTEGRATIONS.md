# Integrations

Halo works fully offline-first with no accounts or keys. This document lists
every external service it can contact, what needs extra setup, and what would
need a native app.

## Built-in web integrations

| Integration | Code | Needs setup? | Notes |
| --- | --- | --- | --- |
| **Weather** (Open-Meteo forecast and geocoding) | `src/services/weather.ts` | Choose a location in the Weather widget | Free for non-commercial use, no key, CORS enabled. Coordinates are rounded to 3 decimals (~100 m) before sending. Cached for 30 minutes. For commercial use, Open-Meteo requires a paid plan. |
| **App Store details and search** (iTunes Search API) | `src/services/appStore.ts` | None | Public and documented, no key. Apple asks for roughly ≤20 requests per minute; Halo caches responses and searches only on submit. Rate-limit responses are shown as a friendly error. |
| **Hacker News** (official Firebase API) | `src/services/news.ts` | Add the widget on Home | Off by default. Cached in memory for 15 minutes. |
| **Device location** (Geolocation API) | `PlaceSheet.tsx` | Browser permission prompt | Used once to set the weather location; never stored beyond the rounded coordinates you choose. |
| **Media Session API** | `src/services/player.ts` | None | Lock-screen and Control Center controls for audio Halo itself is playing. |

None of these requests carry personal identifiers. The service worker never
caches cross-origin responses.

## Smart home

### Today: demo mode

`src/integrations/smart-home/` defines the `SmartHomeProvider` contract:

```ts
interface SmartHomeProvider {
  readonly id: string
  readonly name: string
  readonly simulated: boolean     // the UI labels simulated devices
  getSnapshot(): HomeSnapshot     // rooms, devices, scenes
  subscribe(listener: () => void): () => void
  updateDevice(id: string, patch: DevicePatch): void
  activateScene(id: string): void
  reset(): void
}
```

The only implementation is `demoProvider`, a simulated home persisted in
LocalStorage. Every UI surface reads `smartHome.simulated` and labels devices
as Demo or Simulated.

### Why not HomeKit?

Apple Home (HomeKit) is a native-only framework. Web pages, including installed
PWAs, can't access it. Controlling HomeKit accessories directly would need a
native iOS companion app, which requires the Apple Developer Program.

### Planned: a self-hosted bridge

Platforms such as **Home Assistant** expose documented REST and WebSocket APIs,
and can themselves bridge many HomeKit-compatible devices. A real provider would
work like this:

```
Halo (browser) ──HTTPS──▶ your bridge on the home network or a secure tunnel
                              │  holds the long-lived access token
                              ▼
                        Home Assistant API ──▶ devices
```

Requirements and safeguards:

- **Never put the token in Halo's frontend code or LocalStorage.** Anything in a
  static site is public. The bridge (a small server you run, or Home
  Assistant's own auth flow) holds the credential.
- **HTTPS is mandatory.** Halo is served over HTTPS, and browsers block
  mixed-content calls to `http://` addresses on the local network.
- **CORS** must allow Halo's origin on the bridge.
- **Don't expose an unauthenticated control endpoint to the internet.** Use
  Home Assistant's OAuth-style login or a VPN/tunnel with authentication.
- The provider maps Home Assistant entities (`light.*`, `switch.*`,
  `climate.*`, `lock.*`, `sensor.*`, `binary_sensor.*`, `camera.*`, `scene.*`)
  onto Halo's `Device` and `Scene` types, and sets `simulated: false`.

Nothing in the current release connects to real hardware.

## Calendar and reminders

Reminders are stored locally. Reading iCloud, Google or Outlook calendars would
need OAuth plus a backend to hold refresh tokens, or a native app with EventKit.
A practical web-only next step is importing `.ics` files (on the roadmap).

## Capabilities that need a future native companion app

| Capability | Why the web can't do it |
| --- | --- |
| HomeKit control | Native-only framework |
| Home Screen / Lock Screen widgets (WidgetKit) | Native-only |
| Siri, Shortcuts actions (App Intents) | Native-only |
| Listing installed apps, launching arbitrary apps reliably | Not exposed to web pages |
| Reading what other apps are playing | Not exposed to web pages |
| Apple Watch extensions | Native-only |
| Background execution, overlays over other apps | Not allowed for web apps |
