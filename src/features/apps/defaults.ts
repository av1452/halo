import type { LauncherState } from './model'

/**
 * Starter shortcuts. All are public websites or Apple-documented links so they
 * work without any setup; users can edit or delete every one of them.
 */
export function defaultLauncher(): LauncherState {
  return {
    folders: [
      { id: 'f-work', name: 'Productivity' },
      { id: 'f-play', name: 'Entertainment' },
    ],
    shortcuts: [
      { id: 's-mail', name: 'Gmail', url: 'https://mail.google.com/', glyph: 'mail', color: '#ff375f', folderId: 'f-work', favorite: true, createdAt: 0 },
      { id: 's-calendar', name: 'Calendar', url: 'https://calendar.google.com/', glyph: 'calendar', color: '#0a84ff', folderId: 'f-work', favorite: true, createdAt: 0 },
      { id: 's-maps', name: 'Apple Maps', url: 'https://maps.apple.com/', description: 'Opens the Maps app on iPhone and iPad via a Universal Link.', glyph: 'map', color: '#30b158', folderId: null, favorite: true, createdAt: 0 },
      { id: 's-youtube', name: 'YouTube', url: 'https://www.youtube.com/', glyph: 'play', color: '#ff3b30', folderId: 'f-play', favorite: false, createdAt: 0 },
      { id: 's-spotify', name: 'Spotify', url: 'https://open.spotify.com/', appStoreUrl: 'https://apps.apple.com/app/id324684580', glyph: 'music', color: '#1db954', folderId: 'f-play', favorite: true, createdAt: 0 },
      { id: 's-github', name: 'GitHub', url: 'https://github.com/', glyph: 'code', color: '#1c1c1e', folderId: 'f-work', favorite: false, createdAt: 0 },
      { id: 's-wikipedia', name: 'Wikipedia', url: 'https://www.wikipedia.org/', glyph: 'book', color: '#8e8e93', folderId: null, favorite: false, createdAt: 0 },
      {
        id: 's-shortcuts',
        name: 'Shortcuts',
        url: 'shortcuts://',
        description: 'Uses the Shortcuts URL scheme. Works only on Apple devices with the Shortcuts app installed.',
        fallbackUrl: 'https://support.apple.com/guide/shortcuts/welcome/ios',
        appStoreUrl: 'https://apps.apple.com/app/id915249334',
        glyph: 'sparkles',
        color: '#5e5ce6',
        folderId: 'f-work',
        favorite: false,
        createdAt: 0,
      },
      { id: 's-news', name: 'Hacker News', url: 'https://news.ycombinator.com/', glyph: 'newspaper', color: '#ff6b35', folderId: null, favorite: false, createdAt: 0 },
    ],
    recents: [],
  }
}
