'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Recipe } from '@/models/recipe'
import { useAuth } from '@/components/Auth/AuthProvider'
import styles from './page.module.scss'

const FRACTIONS: Record<number, string> = {
  0.125: '⅛', 0.25: '¼', 0.33: '⅓', 0.5: '½', 0.67: '⅔', 0.75: '¾',
}

function formatQty(n: number): string {
  if (n === 0) return ''
  const whole = Math.floor(n)
  const frac = Math.round((n - whole) * 100) / 100
  const fracStr = FRACTIONS[frac] ?? (frac > 0 ? String(frac).replace(/^0\./, '.') : '')
  return (whole > 0 ? String(whole) : '') + fracStr || String(n)
}

function formatTime(minutes?: number): string | null {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`
}

const RecipePage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [servings, setServings] = useState(1)

  useEffect(() => {
    params.then(({ slug }) => fetchRecipe(slug))
  }, [params])

  const fetchRecipe = async (slug: string) => {
    const res = await fetch(`/api/recipes/${slug}`)
    if (!res.ok) return
    const data: Recipe = await res.json()
    console.log(data)
    setRecipe(data)
    setServings(data.servings)
  }

  const { user } = useAuth()

  if (!recipe) return null

  const scale = servings / recipe.servings
  const totalTime = (recipe.prepTime ?? 0) + (recipe.cookTime ?? 0)

  let globalStep = 0

  return (
    <div className="container">
      <div className={styles.recipeHeader}>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className={styles.headerTags}>
            {recipe.tags.map(tag => (
              <span key={tag} className={styles.recipeTag}>{tag}</span>
            ))}
          </div>
        )}
        <div className={styles.titleRow}>
          <h1>{recipe.title}</h1>
          {user && (
            <Link href={`/edit/${recipe.slug}`} className={styles.editLink} title="Edit recipe">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/>
              </svg>
            </Link>
          )}
        </div>
        {recipe.description && (
          <p className={styles.description}>{recipe.description}</p>
        )}
      </div>

      <div className={styles.metaBar}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Prep</span>
          <span className={styles.metaValue}>{formatTime(recipe.prepTime) ?? '--'}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Cook</span>
          <span className={styles.metaValue}>{formatTime(recipe.cookTime) ?? '--'}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Total</span>
          <span className={styles.metaValue}>{totalTime > 0 ? formatTime(totalTime) : '--'}</span>
        </div>
        <div className={styles.servingScaler}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Servings</span>
          </div>
          <div className={styles.scalerControls}>
            <button className={styles.scalerBtn} onClick={() => setServings(s => Math.max(1, s - 1))}>−</button>
            <input className={styles.scalerCount} value={servings} readOnly />
            <button className={styles.scalerBtn} onClick={() => setServings(s => s + 1)}>+</button>
          </div>
        </div>
      </div>

      <div className={styles.recipeBody}>
        <div>
          <div className={styles.colHeading}>Ingredients</div>
          {recipe.ingredients.map((group, gi) => (
            <div key={gi} className={styles.ingredientGroup}>
              {group.title && (
                <div className={styles.ingredientGroupTitle}>{group.title}</div>
              )}
              {group.items.map((item, ii) => (
                <div key={ii} className={styles.ingredientItem}>
                  <span className={styles.ingredientQty}>
                    {formatQty(item.quantity * scale)}
                  </span>
                  <span>
                    {item.unit ? `${item.unit} ` : ''}{item.name}
                    {item.notes && (
                      <span className={styles.ingredientNotes}>, {item.notes}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div>
          <div className={styles.colHeading}>Instructions</div>
          {recipe.instructions.map((group, gi) => (
            <div key={gi} className={styles.instructionGroup}>
              {group.title && (
                <div className={styles.instructionGroupTitle}>{group.title}</div>
              )}
              {group.steps.map((step) => {
                globalStep++
                const n = globalStep
                return (
                  <div key={n} className={styles.instructionStep}>
                    <span className={styles.stepNum}>{n}.</span>
                    <p className={styles.stepText}>{step}</p>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RecipePage
