import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Folder, FolderPlus, Plus } from 'lucide-react'
import type { CustomGroup, Lang } from '../data/topics'

interface GroupPickerProps {
  lang: Lang
  groups: CustomGroup[]
  value: string
  onChange: (name: string) => void
  label: string
  placeholder: string
  createLabel: string
}

export default function GroupPicker({
  lang,
  groups,
  value,
  onChange,
  label,
  placeholder,
  createLabel,
}: GroupPickerProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const selectGroup = (name: string) => {
    onChange(name)
    setOpen(false)
    setCreating(false)
  }

  const createGroup = () => {
    const name = draft.trim()
    if (!name) return
    onChange(name)
    setDraft('')
    setCreating(false)
    setOpen(false)
  }

  return (
    <div className={`group-picker ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="group-picker-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={label}
      >
        <span className="group-picker-icon"><Folder size={16} /></span>
        <span className="group-picker-value">
          <b>{value}</b>
          <small>{groups.length} {lang === 'zh' ? '个自定义分组' : 'custom groups'}</small>
        </span>
        <ChevronDown size={17} className="group-picker-chevron" />
      </button>

      {open && (
        <div className="group-picker-menu">
          {groups.map((group) => {
            const name = group.name[lang]
            const selected = name === value
            return (
              <button
                type="button"
                className={`group-picker-option ${selected ? 'is-selected' : ''}`}
                onClick={() => selectGroup(name)}
                key={group.id}
              >
                <Folder size={15} />
                <span>{name}</span>
                {selected && <Check size={15} />}
              </button>
            )
          })}

          {!creating ? (
            <button type="button" className="group-picker-create" onClick={() => setCreating(true)}>
              <FolderPlus size={15} />
              <span>{createLabel}</span>
            </button>
          ) : (
            <div className="group-picker-create-form">
              <input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    createGroup()
                  }
                  if (event.key === 'Escape') {
                    setCreating(false)
                    setDraft('')
                  }
                }}
                placeholder={placeholder}
              />
              <button type="button" onClick={createGroup} aria-label={createLabel}>
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
