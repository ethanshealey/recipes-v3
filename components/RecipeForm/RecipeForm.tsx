'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import UnitCombobox from './UnitCombobox'
import {
  EMPTY_FORM_VALUES,
  type RecipeFormValues,
  type IngredientDraft,
} from '@/lib/recipes'
import styles from './RecipeForm.module.scss'

interface Props {
  initialValues?: RecipeFormValues
  onSubmit: (values: RecipeFormValues) => Promise<void>
  submitLabel?: string
}

const EMPTY_INGREDIENT: IngredientDraft = { quantity: '', unit: '', name: '', notes: '' }

export default function RecipeForm({ initialValues = EMPTY_FORM_VALUES, onSubmit, submitLabel = 'Save Recipe' }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<RecipeFormValues>(initialValues)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Top-level field helpers ────────────────────────────

  function setField<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setValues(v => ({ ...v, [key]: value }))
  }

  // ── Ingredient helpers ─────────────────────────────────

  function setIngredientGroupTitle(gi: number, title: string) {
    setValues(v => ({
      ...v,
      ingredients: v.ingredients.map((g, i) => i === gi ? { ...g, title } : g),
    }))
  }

  function setIngredientField(gi: number, ii: number, field: keyof IngredientDraft, val: string) {
    setValues(v => ({
      ...v,
      ingredients: v.ingredients.map((g, i) => i !== gi ? g : {
        ...g,
        items: g.items.map((item, j) => j === ii ? { ...item, [field]: val } : item),
      }),
    }))
  }

  function addIngredient(gi: number) {
    setValues(v => ({
      ...v,
      ingredients: v.ingredients.map((g, i) => i !== gi ? g : {
        ...g,
        items: [...g.items, { ...EMPTY_INGREDIENT }],
      }),
    }))
  }

  function removeIngredient(gi: number, ii: number) {
    setValues(v => ({
      ...v,
      ingredients: v.ingredients.map((g, i) => i !== gi ? g : {
        ...g,
        items: g.items.filter((_, j) => j !== ii),
      }),
    }))
  }

  function addIngredientGroup() {
    setValues(v => ({
      ...v,
      ingredients: [...v.ingredients, { title: '', items: [{ ...EMPTY_INGREDIENT }] }],
    }))
  }

  function removeIngredientGroup(gi: number) {
    setValues(v => ({
      ...v,
      ingredients: v.ingredients.filter((_, i) => i !== gi),
    }))
  }

  // ── Instruction helpers ────────────────────────────────

  function setInstructionGroupTitle(gi: number, title: string) {
    setValues(v => ({
      ...v,
      instructions: v.instructions.map((g, i) => i === gi ? { ...g, title } : g),
    }))
  }

  function setStep(gi: number, si: number, val: string) {
    setValues(v => ({
      ...v,
      instructions: v.instructions.map((g, i) => i !== gi ? g : {
        ...g,
        steps: g.steps.map((s, j) => j === si ? val : s),
      }),
    }))
  }

  function addStep(gi: number) {
    setValues(v => ({
      ...v,
      instructions: v.instructions.map((g, i) => i !== gi ? g : {
        ...g,
        steps: [...g.steps, ''],
      }),
    }))
  }

  function removeStep(gi: number, si: number) {
    setValues(v => ({
      ...v,
      instructions: v.instructions.map((g, i) => i !== gi ? g : {
        ...g,
        steps: g.steps.filter((_, j) => j !== si),
      }),
    }))
  }

  function addInstructionGroup() {
    setValues(v => ({
      ...v,
      instructions: [...v.instructions, { title: '', steps: [''] }],
    }))
  }

  function removeInstructionGroup(gi: number) {
    setValues(v => ({
      ...v,
      instructions: v.instructions.filter((_, i) => i !== gi),
    }))
  }

  // ── Submit ─────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit(values)
    } catch {
      setError('Failed to save recipe. Please try again.')
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <form className={styles.form} onSubmit={handleSubmit}>

      {/* ── Basic info ── */}
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="title">Title</label>
        <input
          id="title"
          className={styles.input}
          type="text"
          value={values.title}
          onChange={e => setField('title', e.target.value)}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="description">Description</label>
        <textarea
          id="description"
          className={styles.textarea}
          value={values.description}
          onChange={e => setField('description', e.target.value)}
          placeholder="A short description of the recipe…"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="servings">Servings</label>
          <input
            id="servings"
            className={styles.input}
            type="number"
            min="1"
            value={values.servings}
            onChange={e => setField('servings', e.target.value)}
            placeholder="4"
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="prepTime">Prep time (min)</label>
          <input
            id="prepTime"
            className={styles.input}
            type="number"
            min="0"
            value={values.prepTime}
            onChange={e => setField('prepTime', e.target.value)}
            placeholder="30"
          />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="cookTime">Cook time (min)</label>
          <input
            id="cookTime"
            className={styles.input}
            type="number"
            min="0"
            value={values.cookTime}
            onChange={e => setField('cookTime', e.target.value)}
            placeholder="50"
          />
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tags">Tags</label>
        <input
          id="tags"
          className={styles.input}
          type="text"
          value={values.tags}
          onChange={e => setField('tags', e.target.value)}
          placeholder="Baking, Dessert, Vegetarian…"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="source">Source</label>
        <input
          id="source"
          className={styles.input}
          type="text"
          value={values.source}
          onChange={e => setField('source', e.target.value)}
          placeholder="URL or attribution"
        />
      </div>

      {/* ── Ingredients ── */}
      <div className={styles.sectionTitle}>Ingredients</div>

      {values.ingredients.map((group, gi) => (
        <div key={gi} className={styles.ingredientBlock}>
          <input
            className={styles.groupTitleInput}
            type="text"
            value={group.title}
            onChange={e => setIngredientGroupTitle(gi, e.target.value)}
            placeholder="Group name (optional)…"
          />
          {group.items.map((item, ii) => (
            <div key={ii} className={styles.ingredientRow}>
              <input
                className={styles.input}
                type="text"
                value={item.quantity}
                onChange={e => setIngredientField(gi, ii, 'quantity', e.target.value)}
                placeholder="Qty"
              />
              <UnitCombobox
                value={item.unit}
                onChange={val => setIngredientField(gi, ii, 'unit', val)}
              />
              <input
                className={styles.input}
                type="text"
                value={item.name}
                onChange={e => setIngredientField(gi, ii, 'name', e.target.value)}
                placeholder="Ingredient"
              />
              <input
                className={styles.input}
                type="text"
                value={item.notes}
                onChange={e => setIngredientField(gi, ii, 'notes', e.target.value)}
                placeholder="Note"
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeIngredient(gi, ii)}
                aria-label="Remove ingredient"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={() => addIngredient(gi)}>
            + Add ingredient
          </button>
          {values.ingredients.length > 1 && (
            <button type="button" className={styles.addGroupBtn} onClick={() => removeIngredientGroup(gi)}>
              − Remove group
            </button>
          )}
        </div>
      ))}

      <button type="button" className={styles.addGroupBtn} onClick={addIngredientGroup}>
        + Add ingredient group
      </button>

      {/* ── Instructions ── */}
      <div className={styles.sectionTitle}>Instructions</div>

      {values.instructions.map((group, gi) => {
        const stepOffset = values.instructions.slice(0, gi).reduce((n, g) => n + g.steps.length, 0)
        return (
          <div key={gi} className={styles.instructionBlock}>
            <input
              className={styles.groupTitleInput}
              type="text"
              value={group.title}
              onChange={e => setInstructionGroupTitle(gi, e.target.value)}
              placeholder="Group name (optional)…"
            />
            {group.steps.map((step, si) => (
              <div key={si} className={styles.stepRow}>
                <span className={styles.stepNum}>{stepOffset + si + 1}.</span>
                <textarea
                  className={styles.textarea}
                  style={{ minHeight: '72px' }}
                  value={step}
                  onChange={e => setStep(gi, si, e.target.value)}
                  placeholder="Describe this step…"
                />
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeStep(gi, si)}
                  aria-label="Remove step"
                  style={{ paddingTop: '0.5rem' }}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={() => addStep(gi)}>
              + Add step
            </button>
            {values.instructions.length > 1 && (
              <button type="button" className={styles.addGroupBtn} onClick={() => removeInstructionGroup(gi)}>
                − Remove group
              </button>
            )}
          </div>
        )
      })}

      <button type="button" className={styles.addGroupBtn} onClick={addInstructionGroup}>
        + Add instruction group
      </button>

      {/* ── Actions ── */}
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button className={styles.btnPrimary} type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button className={styles.btnSecondary} type="button" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  )
}
