import { useRef, type CSSProperties } from 'react'
import { FolderOpen, Music2, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react'
import { Button, IconButton } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Slider } from '../../components/Slider'
import { showToast } from '../../components/toastStore'
import { usePlayer } from '../../hooks/usePlayer'
import { player } from '../../services/player'
import { formatTime } from '../../utils/format'
import styles from './media.module.css'

/** Stable hue from a string, used for generated artwork. */
function hueOf(text: string) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

export function FilePickerButton({ compact = false }: { compact?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="audio/*"
        multiple
        hidden
        data-testid="audio-input"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          const count = player.loadFiles(files)
          if (files.length && !count) showToast({ tone: 'warning', message: 'Those files aren’t audio files Halo can play.' })
          e.target.value = ''
        }}
      />
      <Button variant={compact ? 'secondary' : 'primary'} size={compact ? 'sm' : 'md'} icon={<FolderOpen size={18} />} onClick={() => input.current?.click()}>
        Play files from this device
      </Button>
    </>
  )
}

export function NowPlayingCard({ compact = false }: { compact?: boolean }) {
  const state = usePlayer()
  const track = state.queue[state.index]

  if (!track) {
    return (
      <GlassCard padding="lg" className={`${styles.nowPlaying} ${styles.empty} ${compact ? styles.compact : ''}`}>
        <span className={styles.emptyArt} aria-hidden="true"><Music2 /></span>
        <div className={styles.emptyText}>
          <h3>Nothing playing in Halo</h3>
          <p>Halo can play audio files from your device. It can’t see or control music playing in other apps.</p>
        </div>
        <FilePickerButton compact={compact} />
      </GlassCard>
    )
  }

  const playing = state.status === 'playing' || state.status === 'loading'
  const art = { '--hue': hueOf(track.title + (track.artist ?? '')) } as CSSProperties

  return (
    <GlassCard padding="lg" className={`${styles.nowPlaying} ${compact ? styles.compact : ''}`} aria-label="Now playing">
      <div className={styles.art} style={art} aria-hidden="true"><Music2 /></div>
      <div className={styles.meta}>
        <p className={styles.eyebrow}>Now Playing · Track {state.index + 1} of {state.queue.length}</p>
        <h3 className={styles.title}>{track.title}</h3>
        <p className={styles.artist}>{track.artist ?? 'Local file'}</p>
      </div>
      {state.error && <p className={styles.error} role="alert">{state.error}</p>}
      <div className={styles.scrub}>
        <Slider
          label="Playback position"
          min={0}
          max={Math.max(state.duration, 1)}
          step={1}
          value={Math.min(state.currentTime, state.duration || 0)}
          formatValue={(v) => `${formatTime(v)} of ${formatTime(state.duration)}`}
          onChange={(v) => player.seek(v)}
          disabled={!state.duration}
        />
        <div className={styles.times}>
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
      </div>
      <div className={styles.controls}>
        <IconButton label="Previous track" icon={<SkipBack fill="currentColor" />} variant="plain" size="lg" onClick={() => player.skip(-1)} />
        <IconButton label={playing ? 'Pause' : 'Play'} icon={playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />} variant="filled" size="lg" onClick={player.toggle} />
        <IconButton label="Next track" icon={<SkipForward fill="currentColor" />} variant="plain" size="lg" disabled={state.index >= state.queue.length - 1} onClick={() => player.skip(1)} />
        {!compact && <IconButton label="Stop and clear queue" icon={<X />} variant="plain" size="md" onClick={player.clear} />}
      </div>
    </GlassCard>
  )
}
