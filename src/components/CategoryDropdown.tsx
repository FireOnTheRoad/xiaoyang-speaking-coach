import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { Lang, TopicCategory } from '../data/topics'

interface CategoryDropdownProps {
  lang: Lang
  categories: TopicCategory[]
  value: string
  counts: Record<string, number>
  onChange: (id: string) => void
  disabled?: boolean
  label: string
}

export default function CategoryDropdown({
  lang,
  categories,
  value,
  counts,
  onChange,
  disabled = false,
  label,
}: CategoryDropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedIndex = useMemo(
    () => categories.findIndex((category) => category.id === value),
    [categories, value],
  )
  const selected = categories[selectedIndex] ?? categories[0]

  useEffect(() => {
    if (!open) return
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, selectedIndex])

  useEffect(() => {
    if (!open || !listRef.current) return
    const active = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  const commit = (id: string) => {
    onChange(id)
    setOpen(false)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      setActiveIndex((current) => {
        const next = event.key === 'ArrowDown' ? current + 1 : current - 1
        return (next + categories.length) % categories.length
      })
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      const category = categories[activeIndex]
      if (category) commit(category.id)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    }
    if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(categories.length - 1)
    }
  }

  return (
    <div className={`category-dropdown ${open ? 'is-open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="category-dropdown-trigger"
        onClick={() => setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="category-select-mark" style={{ background: selected?.accent }}>{selected?.mark}</span>
        <span className="category-dropdown-value">
          <b>{selected?.name[lang]}</b>
          <small>{counts[selected?.id ?? ''] ?? 0} {lang === 'zh' ? '道题' : 'prompts'}</small>
        </span>
        <ChevronDown className="category-dropdown-chevron" size={17} />
      </button>

      {open && (
        <div className="category-dropdown-menu" role="listbox" ref={listRef}>
          {categories.map((category, index) => {
            const isActive = index === activeIndex
            const isSelected = category.id === value
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                data-index={index}
                key={category.id}
                className={`category-dropdown-option ${isActive ? 'is-active' : ''} ${isSelected ? 'is-selected' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(category.id)}
              >
                <span className="category-select-mark" style={{ background: category.accent }}>{category.mark}</span>
                <span className="category-dropdown-option-text">
                  <b>{category.name[lang]}</b>
                  <small>{counts[category.id] ?? 0} {lang === 'zh' ? '道题' : 'prompts'}</small>
                </span>
                {isSelected && <Check size={16} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
