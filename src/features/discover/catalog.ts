/**
 * Curated, manually maintained Discover listings. App Store IDs were checked
 * against Apple's public lookup API on 2026-10-19. Descriptions are Halo's
 * own summaries, not App Store copy. Live details (icons, screenshots,
 * ratings, prices) are fetched from Apple only when a listing is opened.
 */

export type DiscoverCategory = 'productivity' | 'listening' | 'learning' | 'photo' | 'health' | 'travel' | 'security' | 'smart-home' | 'social'

export interface Listing {
  /** App Store track ID */
  id: number
  name: string
  developer: string
  category: DiscoverCategory
  summary: string
  website?: string
  featured?: boolean
}

export const CATEGORY_LABELS: Record<DiscoverCategory, string> = {
  productivity: 'Productivity',
  listening: 'Podcasts & Music',
  learning: 'Learning & Reading',
  photo: 'Photo & Video',
  health: 'Health & Fitness',
  travel: 'Maps & Travel',
  security: 'Privacy & Security',
  'smart-home': 'Smart Home',
  social: 'Social & Web',
}

export const appStoreUrl = (id: number) => `https://apps.apple.com/app/id${id}`

export const CATALOG: readonly Listing[] = [
  { id: 904237743, name: 'Things 3', developer: 'Cultured Code', category: 'productivity', summary: 'A calm, beautifully designed task manager built around Today, Upcoming and projects.', website: 'https://culturedcode.com/things/', featured: true },
  { id: 1232780281, name: 'Notion', developer: 'Notion Labs', category: 'productivity', summary: 'Notes, docs, wikis and databases in one flexible workspace.', website: 'https://www.notion.so/' },
  { id: 572688855, name: 'Todoist', developer: 'Doist', category: 'productivity', summary: 'Cross-platform to-do lists with natural-language dates.', website: 'https://todoist.com/' },
  { id: 718043190, name: 'Fantastical', developer: 'Flexibits', category: 'productivity', summary: 'A calendar and tasks app with quick natural-language event entry.', website: 'https://flexibits.com/fantastical' },
  { id: 1044867788, name: 'Day One', developer: 'Bloom Built', category: 'productivity', summary: 'A private journal with photos, locations and end-to-end encrypted sync.', website: 'https://dayoneapp.com/' },
  { id: 888422857, name: 'Overcast', developer: 'Overcast Radio', category: 'listening', summary: 'A podcast player known for Smart Speed and Voice Boost.', website: 'https://overcast.fm/', featured: true },
  { id: 414834813, name: 'Pocket Casts', developer: 'Automattic', category: 'listening', summary: 'A podcast player that syncs across phone, web and desktop.', website: 'https://pocketcasts.com/' },
  { id: 284993459, name: 'Shazam', developer: 'Apple', category: 'listening', summary: 'Identify the song that’s playing around you.', website: 'https://www.shazam.com/' },
  { id: 570060128, name: 'Duolingo', developer: 'Duolingo', category: 'learning', summary: 'Short, game-like lessons for learning a new language.', website: 'https://www.duolingo.com/', featured: true },
  { id: 1076402606, name: 'Libby', developer: 'OverDrive', category: 'learning', summary: 'Borrow ebooks and audiobooks free with a library card.', website: 'https://libbyapp.com/' },
  { id: 302584613, name: 'Kindle', developer: 'Amazon', category: 'learning', summary: 'Read Kindle books on iPhone and iPad.', website: 'https://read.amazon.com/' },
  { id: 324715238, name: 'Wikipedia', developer: 'Wikimedia Foundation', category: 'learning', summary: 'The free encyclopedia, with offline reading lists.', website: 'https://www.wikipedia.org/' },
  { id: 885697368, name: 'Halide', developer: 'Lux Optics', category: 'photo', summary: 'A pro camera with manual controls and RAW capture.', website: 'https://halide.cam/', featured: true },
  { id: 953286746, name: 'Darkroom', developer: 'Bergen Co.', category: 'photo', summary: 'Photo and video editing that works directly on your library.', website: 'https://darkroom.co/' },
  { id: 493145008, name: 'Headspace', developer: 'Headspace', category: 'health', summary: 'Guided meditation, sleep sounds and mindfulness courses.', website: 'https://www.headspace.com/' },
  { id: 426826309, name: 'Strava', developer: 'Strava', category: 'health', summary: 'Track runs and rides and follow friends’ activities.', website: 'https://www.strava.com/' },
  { id: 585027354, name: 'Google Maps', developer: 'Google', category: 'travel', summary: 'Maps, directions, transit and place reviews.', website: 'https://maps.google.com/' },
  { id: 469463298, name: 'Citymapper', developer: 'Citymapper', category: 'travel', summary: 'Real-time transit directions for major cities.', website: 'https://citymapper.com/' },
  { id: 1511601750, name: '1Password', developer: 'AgileBits', category: 'security', summary: 'A password manager with passkeys and secure sharing.', website: 'https://1password.com/' },
  { id: 1137397744, name: 'Bitwarden', developer: 'Bitwarden', category: 'security', summary: 'An open-source password manager with a free tier.', website: 'https://bitwarden.com/', featured: true },
  { id: 874139669, name: 'Signal', developer: 'Signal Messenger', category: 'security', summary: 'End-to-end encrypted messaging and calls.', website: 'https://signal.org/' },
  { id: 1099568401, name: 'Home Assistant', developer: 'Nabu Casa', category: 'smart-home', summary: 'Companion app for the open-source Home Assistant platform.', website: 'https://www.home-assistant.io/', featured: true },
  { id: 1055281310, name: 'Philips Hue', developer: 'Signify', category: 'smart-home', summary: 'Control Hue lights, scenes and automations.', website: 'https://www.philips-hue.com/' },
  { id: 1480640210, name: 'NetNewsWire', developer: 'Brent Simmons', category: 'social', summary: 'A free, open-source RSS reader.', website: 'https://netnewswire.com/' },
  { id: 989804926, name: 'Firefox', developer: 'Mozilla', category: 'social', summary: 'Mozilla’s browser with tracking protection and sync.', website: 'https://www.mozilla.org/firefox/' },
  { id: 6444602274, name: 'Ivory', developer: 'Tapbots', category: 'social', summary: 'A polished Mastodon client.', website: 'https://tapbots.com/ivory/' },
]

export function matchesListing(l: Listing, q: string) {
  const needle = q.trim().toLowerCase()
  return !needle || [l.name, l.developer, l.summary, CATEGORY_LABELS[l.category]].some((s) => s.toLowerCase().includes(needle))
}
