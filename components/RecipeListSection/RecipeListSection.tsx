'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import SearchBar from '@/components/SearchBar/SearchBar'
import type { RecipeSummary } from '@/lib/recipes'
import styles from './RecipeListSection.module.scss'

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`
}

interface Props {
  recipes: RecipeSummary[]
}

export default function RecipeListSection({ recipes }: Props) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const r of recipes) r.tags?.forEach(t => set.add(t))
    return [...set].sort()
  }, [recipes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter(r => {
      if (activeTag && !r.tags?.includes(activeTag)) return false
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.tags?.some(t => t.toLowerCase().includes(q))
      )
    })
  }, [recipes, query, activeTag])

  return (
    <>
      <SearchBar value={query} onChange={setQuery} />
      <div className={styles.tagFilters}>
        <button
          className={`${styles.filterTag} ${activeTag === null ? styles.filterTagActive : ''}`}
          onClick={() => setActiveTag(null)}
        >
          All
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            className={`${styles.filterTag} ${activeTag === tag ? styles.filterTagActive : ''}`}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <ul className={styles.list}>
        {filtered.map(recipe => {
          const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)
          return (
            <li key={recipe.slug}>
              <Link href={`/recipes/${recipe.slug}`} className={styles.item}>
                <div className={styles.left}>
                  <span className={styles.title}>{recipe.title}</span>
                  {recipe.tags && recipe.tags.length > 0 && (
                    <div className={styles.tags}>
                      {recipe.tags.map(tag => (
                        <span key={tag} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {totalTime > 0 && (
                  <span className={styles.meta}>{formatTime(totalTime)}</span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
      {filtered.length === 0 && (
        <p className={styles.empty}>No recipes found.</p>
      )}
    </>
  )
}
