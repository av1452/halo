import { useState, type FormEvent } from 'react'
import { AppIcon } from '../../components/AppIcon'
import { Button } from '../../components/Button'
import { SelectField, TextField } from '../../components/Field'
import { GLYPHS } from '../../components/glyphs'
import { Sheet } from '../../components/Sheet'
import { Toggle } from '../../components/Toggle'
import { classifyUrl, normalizeUrl } from '../../utils/url'
import { addShortcut, launcherStore, updateShortcut, type ShortcutDraft } from './launcherStore'
import { TILE_COLORS, type Shortcut } from './model'
import { toForm, validateShortcutForm, type Errors, type FormState } from './shortcutForm'
import styles from './apps.module.css'

interface ShortcutEditorProps {
  open: boolean
  /** Existing shortcut to edit; omit to create a new one */
  shortcut?: Shortcut
  /** Prefills a new shortcut, e.g. from a Discover listing */
  initial?: Partial<ShortcutDraft>
  onClose: () => void
  onSaved?: (s: Shortcut) => void
}

export function ShortcutEditor({ open, shortcut, initial, onClose, onSaved }: ShortcutEditorProps) {
  // Parent remounts this component (via key) for each shortcut, so initial state is enough
  const [form, setForm] = useState<FormState>(() => toForm(shortcut ?? initial))
  const [errors, setErrors] = useState<Errors>({})
  const { folders } = launcherStore.use()
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))
  const isAppScheme = form.url && normalizeUrl(form.url) && classifyUrl(normalizeUrl(form.url)!) === 'app-scheme'

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const { draft, errors: next } = validateShortcutForm(form)
    setErrors(next)
    if (!draft) return
    if (shortcut) {
      updateShortcut(shortcut.id, draft)
      onSaved?.({ ...shortcut, ...draft })
    } else {
      // Add first: onSaved?.(...) would skip evaluating its argument when onSaved is undefined
      const created = addShortcut(draft)
      onSaved?.(created)
    }
    onClose()
  }

  return (
    <Sheet
      open={open}
      title={shortcut ? 'Edit Shortcut' : 'New Shortcut'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="shortcut-form">
            {shortcut ? 'Save' : 'Add'}
          </Button>
        </>
      }
    >
      <form id="shortcut-form" className={styles.form} onSubmit={submit} noValidate>
        <div className={styles.preview}>
          <AppIcon name={form.name || '?'} color={form.color} glyph={form.glyph || undefined} size={72} />
        </div>
        <TextField label="Name" value={form.name} onChange={(v) => set('name', v)} error={errors.name} maxLength={60} data-autofocus required />
        <TextField
          label="Address"
          value={form.url}
          onChange={(v) => set('url', v)}
          error={errors.url}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="example.com or app-name://"
          hint="Websites, Universal Links, mailto:, tel: and app URL schemes are supported."
          required
        />
        {isAppScheme && (
          <p className={styles.note}>
            App links only work if that app is installed. Halo can’t check this in advance, so add a website or App Store link below as a fallback.
          </p>
        )}
        <TextField label="Fallback website (optional)" value={form.fallbackUrl} onChange={(v) => set('fallbackUrl', v)} error={errors.fallbackUrl} inputMode="url" autoCapitalize="none" />
        <TextField
          label="App Store link (optional)"
          value={form.appStoreUrl}
          onChange={(v) => set('appStoreUrl', v)}
          error={errors.appStoreUrl}
          inputMode="url"
          autoCapitalize="none"
          placeholder="https://apps.apple.com/app/…"
        />
        <TextField label="Note (optional)" value={form.description} onChange={(v) => set('description', v)} maxLength={280} />
        <SelectField
          label="Folder"
          value={form.folderId}
          onChange={(v) => set('folderId', v)}
          options={[{ value: '', label: 'None' }, ...folders.map((f) => ({ value: f.id, label: f.name }))]}
        />

        <fieldset className={styles.fieldset}>
          <legend>Color</legend>
          <div className={styles.swatches}>
            {TILE_COLORS.map((c) => (
              <label key={c} className={form.color === c ? `${styles.swatch} ${styles.selected}` : styles.swatch} style={{ background: c }}>
                <input type="radio" name="color" value={c} checked={form.color === c} onChange={() => set('color', c)} aria-label={c} />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Symbol</legend>
          <div className={styles.glyphs}>
            <label className={form.glyph === '' ? `${styles.glyphOption} ${styles.selected}` : styles.glyphOption}>
              <input type="radio" name="glyph" value="" checked={form.glyph === ''} onChange={() => set('glyph', '')} />
              <span aria-hidden="true" className={styles.glyphLetter}>{(form.name.trim()[0] ?? 'A').toUpperCase()}</span>
              <span className="visually-hidden">Letter</span>
            </label>
            {Object.entries(GLYPHS).map(([key, { label, icon: Icon }]) => (
              <label key={key} className={form.glyph === key ? `${styles.glyphOption} ${styles.selected}` : styles.glyphOption} title={label}>
                <input type="radio" name="glyph" value={key} checked={form.glyph === key} onChange={() => set('glyph', key)} />
                <Icon aria-hidden="true" size={20} />
                <span className="visually-hidden">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className={styles.toggleRow}>
          <span>Favorite</span>
          <Toggle checked={form.favorite} onChange={(v) => set('favorite', v)} label="Favorite" />
        </div>
      </form>
    </Sheet>
  )
}
