export type MediaCategory = 'music' | 'video' | 'podcasts'

export interface MediaService {
  id: string
  name: string
  category: MediaCategory
  url: string
  glyph: string
  color: string
}

/**
 * Curated, manually maintained list of public web destinations. Many open
 * the native app on iOS via Universal Links when it's installed.
 */
export const MEDIA_SERVICES: readonly MediaService[] = [
  { id: 'apple-music', name: 'Apple Music', category: 'music', url: 'https://music.apple.com/', glyph: 'music', color: '#ff375f' },
  { id: 'spotify', name: 'Spotify', category: 'music', url: 'https://open.spotify.com/', glyph: 'music', color: '#1db954' },
  { id: 'youtube-music', name: 'YouTube Music', category: 'music', url: 'https://music.youtube.com/', glyph: 'music', color: '#ff3b30' },
  { id: 'soundcloud', name: 'SoundCloud', category: 'music', url: 'https://soundcloud.com/', glyph: 'cloud', color: '#ff6b35' },
  { id: 'bandcamp', name: 'Bandcamp', category: 'music', url: 'https://bandcamp.com/', glyph: 'music', color: '#40b3c8' },
  { id: 'youtube', name: 'YouTube', category: 'video', url: 'https://www.youtube.com/', glyph: 'play', color: '#ff3b30' },
  { id: 'netflix', name: 'Netflix', category: 'video', url: 'https://www.netflix.com/', glyph: 'film', color: '#b20710' },
  { id: 'apple-tv', name: 'Apple TV', category: 'video', url: 'https://tv.apple.com/', glyph: 'tv', color: '#1c1c1e' },
  { id: 'disney-plus', name: 'Disney+', category: 'video', url: 'https://www.disneyplus.com/', glyph: 'film', color: '#113ccf' },
  { id: 'prime-video', name: 'Prime Video', category: 'video', url: 'https://www.primevideo.com/', glyph: 'tv', color: '#00a8e1' },
  { id: 'twitch', name: 'Twitch', category: 'video', url: 'https://www.twitch.tv/', glyph: 'game', color: '#9146ff' },
  { id: 'apple-podcasts', name: 'Apple Podcasts', category: 'podcasts', url: 'https://podcasts.apple.com/', glyph: 'podcast', color: '#9b4dff' },
  { id: 'pocket-casts', name: 'Pocket Casts', category: 'podcasts', url: 'https://pocketcasts.com/', glyph: 'podcast', color: '#f43e37' },
  { id: 'overcast', name: 'Overcast', category: 'podcasts', url: 'https://overcast.fm/', glyph: 'podcast', color: '#fc7e0f' },
]

export const CATEGORY_LABELS: Record<MediaCategory, string> = { music: 'Music', video: 'Video', podcasts: 'Podcasts' }
