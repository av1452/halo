import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { FolderCog, Plus, SearchX } from 'lucide-react'
import { Button, IconButton } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FilterChips } from '../../components/FilterChips'
import { EmptyState, Page, PageSection } from '../../components/Page'
import { SearchField } from '../../components/SearchField'
import { AppGrid } from './AppGrid'
import { FolderManager } from './FolderManager'
import { clearRecents, filterShortcuts, launcherStore, moveShortcut, removeShortcut } from './launcherStore'
import type { Shortcut } from './model'
import { ShortcutDetails } from './ShortcutDetails'
import { ShortcutEditor } from './ShortcutEditor'
import styles from './apps.module.css'

type EditorState = { shortcut?: Shortcut; key: number } | null

export default function AppsPage() {
  const { shortcuts, folders, recents } = launcherStore.use()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const filter = params.get('filter') ?? 'all'
  const [editing, setEditing] = useState(false)
  const [details, setDetails] = useState<Shortcut | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  // Quick actions elsewhere can ask this page to open the editor
  const [editor, setEditor] = useState<EditorState>(() => ((location.state as { addShortcut?: boolean } | null)?.addShortcut ? { key: Date.now() } : null))
  const [foldersOpen, setFoldersOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<Shortcut | null>(null)

  useEffect(() => {
    // Clear the request so Back doesn't reopen the editor
    if ((location.state as { addShortcut?: boolean } | null)?.addShortcut) navigate(location.pathname + location.search, { replace: true, state: null })
  }, [location, navigate])

  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(params)
    if (value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const validFilter = filter === 'all' || filter === 'favorites' || folders.some((f) => f.id === filter) ? filter : 'all'
  const visible = filterShortcuts(shortcuts, query, validFilter)
  const recentShortcuts = recents.map((r) => shortcuts.find((s) => s.id === r.id)).filter((s): s is Shortcut => !!s)
  const showRecents = !editing && !query && validFilter === 'all' && recentShortcuts.length > 0

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'favorites', label: 'Favorites' },
    ...folders.map((f) => ({ value: f.id, label: f.name })),
  ]
  const openEditor = (shortcut?: Shortcut) => {
    setDetails(null)
    setEditor({ shortcut, key: Date.now() })
  }
  const gridHandlers = {
    editing,
    onShowDetails: setDetails,
    onEdit: openEditor,
    onRemove: (s: Shortcut) => {
      setDetails(null)
      setPendingRemove(s)
    },
  }

  return (
    <Page
      title="Apps"
      subtitle={`${shortcuts.length} shortcut${shortcuts.length === 1 ? '' : 's'}`}
      actions={
        <>
          <IconButton label="Manage folders" icon={<FolderCog />} onClick={() => setFoldersOpen(true)} />
          <IconButton label="Add shortcut" icon={<Plus />} onClick={() => openEditor()} />
          <Button variant={editing ? 'primary' : 'secondary'} className={editing ? '' : 'glass-thin'} onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
            {editing ? 'Done' : 'Edit'}
          </Button>
        </>
      }
    >
      <div className={styles.toolbar}>
        <SearchField label="Search shortcuts" placeholder="Search shortcuts" value={query} onChange={(v) => setParam('q', v, '')} />
        <FilterChips label="Filter shortcuts" options={filterOptions} value={validFilter} onChange={(v) => setParam('filter', v, 'all')} />
      </div>

      {showRecents && (
        <PageSection title="Recently Opened" action={<Button size="sm" variant="plain" className={styles.onWallpaper} onClick={clearRecents}>Clear</Button>}>
          <AppGrid shortcuts={recentShortcuts.slice(0, 4)} label="Recently opened" {...gridHandlers} />
        </PageSection>
      )}

      <PageSection title={editing ? 'Arrange Shortcuts' : 'All Shortcuts'}>
        {visible.length > 0 ? (
          <div className={`glass ${styles.gridCard}`}>
            <AppGrid
              shortcuts={visible}
              label="Shortcuts"
              onMove={(s, dir) => moveShortcut(s.id, dir, visible.map((v) => v.id))}
              {...gridHandlers}
            />
          </div>
        ) : (
          <EmptyState
            icon={<SearchX />}
            title={query ? `No results for “${query}”` : 'Nothing here yet'}
            action={<Button variant="primary" icon={<Plus size={18} />} onClick={() => openEditor()}>Add Shortcut</Button>}
          >
            {query ? 'Try a different name or address.' : 'Add a website or app link to get started.'}
          </EmptyState>
        )}
        {!editing && visible.length > 0 && <p className={styles.hint}>Tip: press and hold a shortcut for details.</p>}
      </PageSection>

      <ShortcutDetails shortcut={details} onClose={() => setDetails(null)} onEdit={openEditor} onRemove={gridHandlers.onRemove} />
      {editor && <ShortcutEditor key={editor.key} open shortcut={editor.shortcut} onClose={() => setEditor(null)} />}
      <FolderManager open={foldersOpen} onClose={() => setFoldersOpen(false)} />
      <ConfirmDialog
        open={!!pendingRemove}
        title={`Remove ${pendingRemove?.name ?? ''}?`}
        confirmLabel="Remove"
        destructive
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove) removeShortcut(pendingRemove.id)
          setPendingRemove(null)
        }}
      >
        This removes the shortcut from Halo. It doesn’t affect any app or website.
      </ConfirmDialog>
    </Page>
  )
}
