import { useMemo, useState } from 'react'
import { Check, FolderInput, FolderPen, FolderPlus, Heart, Play, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'
import GroupPicker from './GroupPicker'
import type { CustomGroup, Lang, Topic, TopicCategory } from '../data/topics'

interface TopicLibraryProps {
  lang: Lang
  categories: TopicCategory[]
  customGroups: CustomGroup[]
  customTopics: Topic[]
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onUseTopic: (topic: Topic) => void
  onDeleteCustom: (id: string) => void
  onOpenCustom: () => void
  onCreateGroup: (name: string) => string
  onRenameGroup: (id: string, name: string) => void
  onDeleteGroup: (id: string) => void
  onMoveTopic: (topicId: string, groupName: string) => void
}

const copy = {
  zh: {
    eyebrow: '主题库',
    title: '把要练的内容，放进同一个工作台。',
    subtitle: '按场景选题，或搜索关键词。每道题都配有中英内容和表达抓手。',
    all: '全部题目',
    search: '搜索题目、场景或关键词',
    add: '新建自定义题目',
    questionCount: '道题',
    practice: '练习此题',
    noResult: '没有找到匹配题目，换个关键词试试。',
    favorites: '我的收藏',
    favoritesEmpty: '还没有收藏题目。点题目卡片右上角的心形即可加入收藏夹。',
    custom: '自定义',
    builtIn: '内置',
    newGroup: '新建分组',
    groupNamePlaceholder: '输入分组名称',
    create: '创建',
    rename: '重命名',
    deleteGroup: '删除分组',
    moveTopic: '移动题目',
    save: '保存',
    cancel: '取消',
    deleteConfirm: '删除这个分组后，组内题目会移动到“我的新增主题”。确定继续吗？',
  },
  en: {
    eyebrow: 'Topic library',
    title: 'Keep every practice prompt in one workbench.',
    subtitle: 'Browse by context or search a keyword. Every prompt includes a bilingual version and a speaking cue.',
    all: 'All topics',
    search: 'Search topics, contexts, or keywords',
    add: 'Add custom topic',
    questionCount: 'prompts',
    practice: 'Practice this',
    noResult: 'No matching topics. Try a broader keyword.',
    favorites: 'Favorites',
    favoritesEmpty: 'No favorites yet. Tap the heart on a prompt card to save it here.',
    custom: 'Custom',
    builtIn: 'Built-in',
    newGroup: 'New group',
    groupNamePlaceholder: 'Group name',
    create: 'Create',
    rename: 'Rename',
    deleteGroup: 'Delete group',
    moveTopic: 'Move topic',
    save: 'Save',
    cancel: 'Cancel',
    deleteConfirm: 'Deleting this group will move its topics to “My topics”. Continue?',
  },
} as const

export default function TopicLibrary({
  lang,
  categories,
  customGroups,
  customTopics,
  favorites,
  onToggleFavorite,
  onUseTopic,
  onDeleteCustom,
  onOpenCustom,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onMoveTopic,
}: TopicLibraryProps) {
  const t = copy[lang]
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(customGroups[0]?.id ?? categories[0]?.id ?? 'all')
  const [newGroupOpen, setNewGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [editingGroupId, setEditingGroupId] = useState('')
  const [editingGroupName, setEditingGroupName] = useState('')
  const [movingTopicId, setMovingTopicId] = useState('')
  const favoriteSet = useMemo(() => new Set(favorites), [favorites])

  const topicsByCategory = useMemo(() => {
    const customGroupsAsCategories: TopicCategory[] = customGroups.map((group) => ({
      id: group.id,
      name: group.name,
      description: {
        zh: '你自己新增或 Agent 拆解后归入的主题。',
        en: 'Topics you added or extracted with your own Agent.',
      },
      mark: 'MY',
      accent: '#ff5a36',
      topics: customTopics.filter((topic) => topic.categoryId === group.id),
    }))
    const builtInCategories = categories.map((category) => ({
      ...category,
      topics: [...customTopics.filter((topic) => topic.categoryId === category.id), ...category.topics],
    }))
    return [...customGroupsAsCategories, ...builtInCategories]
  }, [categories, customGroups, customTopics])

  const selectedCategory = topicsByCategory.find((category) => category.id === selected)
  const selectedIsCustomGroup = customGroups.some((group) => group.id === selected)
  const normalizedQuery = query.trim().toLowerCase()

  const visibleTopics = useMemo(() => {
    const allTopics = topicsByCategory.flatMap((category) => category.topics)
    const source = selected === 'favorites'
      ? allTopics.filter((topic) => favoriteSet.has(topic.id))
      : selectedCategory?.topics ?? allTopics
    if (!normalizedQuery) return source
    return source.filter((topic) => {
      const category = categories.find((item) => item.id === topic.categoryId)
      return [topic.title.zh, topic.title.en, topic.hint.zh, topic.hint.en, category?.name.zh, category?.name.en, ...(topic.keywords ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [categories, favoriteSet, normalizedQuery, selected, selectedCategory, topicsByCategory])

  const totalCount = topicsByCategory.reduce((total, category) => total + category.topics.length, 0)
  const favoriteCount = favorites.length

  const createGroup = () => {
    const name = newGroupName.trim()
    if (!name) return
    const id = onCreateGroup(name)
    setSelected(id)
    setNewGroupName('')
    setNewGroupOpen(false)
  }

  const startRenameGroup = () => {
    if (!selectedCategory) return
    setEditingGroupId(selectedCategory.id)
    setEditingGroupName(selectedCategory.name[lang])
  }

  const saveGroupName = () => {
    const name = editingGroupName.trim()
    if (!name || !editingGroupId) return
    onRenameGroup(editingGroupId, name)
    setEditingGroupId('')
    setEditingGroupName('')
  }

  const removeSelectedGroup = () => {
    if (!selectedIsCustomGroup || !selectedCategory) return
    if (!window.confirm(t.deleteConfirm)) return
    onDeleteGroup(selectedCategory.id)
    setSelected(customGroups.find((group) => group.id !== selectedCategory.id)?.id ?? 'all')
  }

  return (
    <section className="library-page">
      <header className="page-heading library-heading">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="library-heading-actions">
          <span className="topic-total">{totalCount} {t.questionCount}</span>
          <button className="button button-dark" onClick={onOpenCustom}>
            <Plus size={18} />
            {t.add}
          </button>
        </div>
      </header>

      <div className="library-search">
        <Search size={20} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} />
        {query && <button onClick={() => setQuery('')}>×</button>}
      </div>

      <div className="library-layout">
        <aside className="category-rail">
          <button
            className={`category-rail-item ${selected === 'all' ? 'is-active' : ''}`}
            onClick={() => setSelected('all')}
          >
            <span className="category-mark" style={{ background: '#111820' }}>AL</span>
            <span>
              <b>{t.all}</b>
              <small>{totalCount} {t.questionCount}</small>
            </span>
          </button>
          <button
            className={`category-rail-item category-rail-favorites ${selected === 'favorites' ? 'is-active' : ''}`}
            onClick={() => setSelected('favorites')}
          >
            <span className="category-mark" style={{ background: '#ff5a36' }}><Heart size={16} fill="currentColor" /></span>
            <span>
              <b>{t.favorites}</b>
              <small>{favoriteCount} {t.questionCount}</small>
            </span>
          </button>
          <button className="category-rail-create" onClick={() => setNewGroupOpen((current) => !current)}>
            <FolderPlus size={15} />
            {t.newGroup}
          </button>
          {newGroupOpen && (
            <div className="category-rail-create-form">
              <input
                autoFocus
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') createGroup()
                  if (event.key === 'Escape') setNewGroupOpen(false)
                }}
                placeholder={t.groupNamePlaceholder}
              />
              <button onClick={createGroup} aria-label={t.create}><Check size={15} /></button>
            </div>
          )}
          {topicsByCategory.map((category) => (
            <button
              className={`category-rail-item ${selected === category.id ? 'is-active' : ''} ${customGroups.some((group) => group.id === category.id) ? 'is-custom-group' : ''}`}
              onClick={() => setSelected(category.id)}
              key={category.id}
            >
              <span className="category-mark" style={{ background: category.accent }}>{category.mark}</span>
              <span>
                <b>{category.name[lang]}</b>
                <small>{category.topics.length} {t.questionCount}</small>
              </span>
            </button>
          ))}
        </aside>

        <div className="topic-content">
          <div className="topic-context">
            <div className="topic-context-main">
              <p className="eyebrow">{selected === 'favorites' ? 'FAV' : selectedCategory ? selectedCategory.mark : 'ALL'}</p>
              {editingGroupId === selectedCategory?.id ? (
                <div className="group-rename-form">
                  <input
                    autoFocus
                    value={editingGroupName}
                    onChange={(event) => setEditingGroupName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') saveGroupName()
                      if (event.key === 'Escape') setEditingGroupId('')
                    }}
                  />
                  <button onClick={saveGroupName} aria-label={t.save}><Check size={15} /></button>
                  <button onClick={() => setEditingGroupId('')} aria-label={t.cancel}><X size={15} /></button>
                </div>
              ) : (
                <h2>{selected === 'favorites' ? t.favorites : selectedCategory ? selectedCategory.name[lang] : t.all}</h2>
              )}
              {selected === 'favorites' ? <p>{t.favoritesEmpty}</p> : selectedCategory ? <p>{selectedCategory.description[lang]}</p> : null}
            </div>
            <div className="topic-context-side">
              <span>{visibleTopics.length} {t.questionCount}</span>
              {selectedIsCustomGroup && selected !== 'my-topics' && (
                <div className="group-actions">
                  <button onClick={startRenameGroup}><FolderPen size={14} />{t.rename}</button>
                  <button onClick={removeSelectedGroup}><Trash2 size={14} />{t.deleteGroup}</button>
                </div>
              )}
              {selectedIsCustomGroup && selected === 'my-topics' && (
                <div className="group-actions">
                  <button onClick={startRenameGroup}><FolderPen size={14} />{t.rename}</button>
                </div>
              )}
            </div>
          </div>

          {visibleTopics.length ? (
            <div className="topic-grid">
              {visibleTopics.map((topic) => {
                const category = categories.find((item) => item.id === topic.categoryId)
                const isFavorite = favoriteSet.has(topic.id)
                const isCustom = customTopics.some((item) => item.id === topic.id)
                const currentGroup = customGroups.find((group) => group.id === topic.categoryId)
                const visibleKeyword = topic.keywords?.find((keyword) => !topic.title[lang].includes(keyword))
                return (
                  <article className="topic-card" key={topic.id}>
                    <div className="topic-card-top">
                      <span className="topic-card-index" style={{ color: category?.accent }}>{category?.mark}</span>
                      <div className="topic-card-tags">
                        {visibleKeyword && <span>{visibleKeyword}</span>}
                        {isCustom && <span>{t.custom}</span>}
                        <button
                          className={`favorite-button ${isFavorite ? 'is-active' : ''}`}
                          onClick={() => onToggleFavorite(topic.id)}
                          aria-label="favorite"
                        >
                          <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                    <h3>{topic.title[lang]}</h3>
                    <p>{topic.hint[lang]}</p>
                    <div className="topic-card-actions">
                      <button className="text-button" onClick={() => onUseTopic(topic)}>
                        <Play size={15} fill="currentColor" />
                        {t.practice}
                      </button>
                      {isCustom && (
                        <div className="topic-card-manage">
                          <button
                            className="manage-button"
                            onClick={() => setMovingTopicId((current) => current === topic.id ? '' : topic.id)}
                            aria-label={t.moveTopic}
                          >
                            <FolderInput size={15} />
                          </button>
                          <button className="delete-button" onClick={() => onDeleteCustom(topic.id)} aria-label="delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                    {isCustom && movingTopicId === topic.id && (
                      <div className="topic-move-picker">
                        <GroupPicker
                          lang={lang}
                          groups={customGroups}
                          value={currentGroup?.name[lang] ?? customGroups[0]?.name[lang] ?? ''}
                          onChange={(groupName) => {
                            onMoveTopic(topic.id, groupName)
                            setMovingTopicId('')
                          }}
                          label={t.moveTopic}
                          placeholder={t.groupNamePlaceholder}
                          createLabel={t.newGroup}
                        />
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="empty-state compact">
              <Sparkles size={24} />
              <p>{selected === 'favorites' && favoriteCount === 0 ? t.favoritesEmpty : t.noResult}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
