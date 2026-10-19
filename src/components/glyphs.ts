import {
  BookOpen, Calendar, Camera, Cloud, Code, Film, Gamepad2, Globe, Heart, House, Mail, Map, MessageCircle,
  Music, Newspaper, Play, Podcast, ShoppingBag, Sparkles, Tv, Wallet, type LucideIcon,
} from 'lucide-react'

/** Generic glyphs users can pick for tiles. No third-party logos. */
export const GLYPHS: Record<string, { label: string; icon: LucideIcon }> = {
  globe: { label: 'Website', icon: Globe },
  mail: { label: 'Mail', icon: Mail },
  calendar: { label: 'Calendar', icon: Calendar },
  map: { label: 'Map', icon: Map },
  message: { label: 'Messages', icon: MessageCircle },
  music: { label: 'Music', icon: Music },
  play: { label: 'Video', icon: Play },
  tv: { label: 'TV', icon: Tv },
  film: { label: 'Film', icon: Film },
  podcast: { label: 'Podcast', icon: Podcast },
  book: { label: 'Reading', icon: BookOpen },
  newspaper: { label: 'News', icon: Newspaper },
  code: { label: 'Code', icon: Code },
  cloud: { label: 'Cloud', icon: Cloud },
  camera: { label: 'Camera', icon: Camera },
  shopping: { label: 'Shopping', icon: ShoppingBag },
  wallet: { label: 'Finance', icon: Wallet },
  game: { label: 'Games', icon: Gamepad2 },
  health: { label: 'Health', icon: Heart },
  home: { label: 'Home', icon: House },
  sparkles: { label: 'Automation', icon: Sparkles },
}
