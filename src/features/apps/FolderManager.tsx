import { useState, type FormEvent } from 'react'
import { FolderPlus, Trash2 } from 'lucide-react'
import { Button, IconButton } from '../../components/Button'
import { Sheet } from '../../components/Sheet'
import { addFolder, launcherStore, removeFolder, renameFolder } from './launcherStore'
import styles from './apps.module.css'

export function FolderManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { folders, shortcuts } = launcherStore.use()
  const [name, setName] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addFolder(name)
    setName('')
  }

  return (
    <Sheet open={open} title="Folders" onClose={onClose}>
      <ul className={styles.folderList}>
        {folders.map((f) => {
          const count = shortcuts.filter((s) => s.folderId === f.id).length
          return (
            <li key={f.id} className={styles.folderRow}>
              <input
                className={styles.folderInput}
                aria-label={`Folder name, ${f.name}`}
                defaultValue={f.name}
                maxLength={40}
                onBlur={(e) => e.target.value.trim() && renameFolder(f.id, e.target.value)}
              />
              <span className={styles.folderCount}>{count}</span>
              <IconButton
                label={`Delete folder ${f.name}`}
                icon={<Trash2 />}
                variant="plain"
                size="sm"
                onClick={() => removeFolder(f.id)}
              />
            </li>
          )
        })}
        {folders.length === 0 && <li className={styles.folderEmpty}>No folders yet.</li>}
      </ul>
      <p className={styles.note}>Deleting a folder keeps its shortcuts.</p>
      <form className={styles.folderAdd} onSubmit={submit}>
        <input className={styles.folderInput} aria-label="New folder name" placeholder="New folder" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" variant="primary" size="sm" icon={<FolderPlus size={16} />} disabled={!name.trim()}>
          Add
        </Button>
      </form>
    </Sheet>
  )
}
