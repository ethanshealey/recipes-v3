import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Recipe } from '@/models/recipe'
import type { IngredientGroup } from '@/models/ingredient'
import type { InstructionGroup } from '@/models/instruction'

export interface RecipeSummary {
  slug: string
  title: string
  description?: string
  tags?: string[]
  cookTime?: number
  prepTime?: number
}

const COLLECTION = 'recipes-v3'

function docToSummary(doc: QueryDocumentSnapshot<DocumentData>): RecipeSummary {
  const d = doc.data()
  return {
    slug: d.slug as string,
    title: d.title as string,
    ...(d.description != null && { description: d.description as string }),
    ...(d.tags != null && { tags: d.tags as string[] }),
    ...(d.cookTime != null && { cookTime: d.cookTime as number }),
    ...(d.prepTime != null && { prepTime: d.prepTime as number }),
  }
}

export async function getRecipe(slug: string): Promise<Recipe | null> {
  const snap = await getDoc(doc(db, COLLECTION, slug))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    slug: d.slug as string,
    title: d.title as string,
    servings: d.servings as number,
    ingredients: d.ingredients,
    instructions: d.instructions,
    createdAt: (d.createdAt as { toDate(): Date }).toDate(),
    updatedAt: (d.updatedAt as { toDate(): Date }).toDate(),
    ...(d.description != null && { description: d.description as string }),
    ...(d.prepTime != null && { prepTime: d.prepTime as number }),
    ...(d.cookTime != null && { cookTime: d.cookTime as number }),
    ...(d.tags != null && { tags: d.tags as string[] }),
    ...(d.source != null && { source: d.source as string }),
  }
}

export async function getAllRecipes({ tag }: { tag?: string } = {}): Promise<RecipeSummary[]> {
  let q = query(collection(db, COLLECTION), orderBy('title'))
  if (tag) q = query(q, where('tags', 'array-contains', tag))
  const snap = await getDocs(q)
  return snap.docs.map(docToSummary)
}

// ── Form draft types ──────────────────────────────────────

export interface IngredientDraft {
  quantity: string
  unit: string
  name: string
  notes: string
}

export interface IngredientGroupDraft {
  title: string
  items: IngredientDraft[]
}

export interface InstructionGroupDraft {
  title: string
  steps: string[]
}

export interface RecipeFormValues {
  title: string
  description: string
  servings: string
  prepTime: string
  cookTime: string
  tags: string
  source: string
  ingredients: IngredientGroupDraft[]
  instructions: InstructionGroupDraft[]
}

export const EMPTY_FORM_VALUES: RecipeFormValues = {
  title: '',
  description: '',
  servings: '',
  prepTime: '',
  cookTime: '',
  tags: '',
  source: '',
  ingredients: [{ title: '', items: [{ quantity: '', unit: '', name: '', notes: '' }] }],
  instructions: [{ title: '', steps: [''] }],
}

// ── Helpers ───────────────────────────────────────────────

export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseIngredientGroups(groups: IngredientGroupDraft[]): IngredientGroup[] {
  return groups
    .map(g => ({
      ...(g.title.trim() && { title: g.title.trim() }),
      items: g.items
        .filter(item => item.name.trim())
        .map(item => ({
          quantity: parseFloat(item.quantity) || 0,
          unit: item.unit.trim(),
          name: item.name.trim(),
          ...(item.notes.trim() && { notes: item.notes.trim() }),
        })),
    }))
    .filter(g => g.items.length > 0)
}

function parseInstructionGroups(groups: InstructionGroupDraft[]): InstructionGroup[] {
  return groups
    .map(g => ({
      ...(g.title.trim() && { title: g.title.trim() }),
      steps: g.steps.filter(s => s.trim()),
    }))
    .filter(g => g.steps.length > 0)
}

export function recipeToFormValues(recipe: Recipe): RecipeFormValues {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    servings: String(recipe.servings),
    prepTime: recipe.prepTime != null ? String(recipe.prepTime) : '',
    cookTime: recipe.cookTime != null ? String(recipe.cookTime) : '',
    tags: recipe.tags?.join(', ') ?? '',
    source: recipe.source ?? '',
    ingredients: recipe.ingredients.map(g => ({
      title: g.title ?? '',
      items: g.items.map(item => ({
        quantity: item.quantity ? String(item.quantity) : '',
        unit: item.unit,
        name: item.name,
        notes: item.notes ?? '',
      })),
    })),
    instructions: recipe.instructions.map(g => ({
      title: g.title ?? '',
      steps: [...g.steps],
    })),
  }
}

export async function createRecipe(values: RecipeFormValues): Promise<string> {
  const slug = toSlug(values.title)
  const now = new Date()
  await setDoc(doc(db, COLLECTION, slug), {
    slug,
    title: values.title.trim(),
    servings: parseInt(values.servings) || 1,
    ingredients: parseIngredientGroups(values.ingredients),
    instructions: parseInstructionGroups(values.instructions),
    createdAt: now,
    updatedAt: now,
    ...(values.description.trim() && { description: values.description.trim() }),
    ...(values.prepTime && { prepTime: parseInt(values.prepTime) }),
    ...(values.cookTime && { cookTime: parseInt(values.cookTime) }),
    ...(values.tags.trim() && { tags: values.tags.split(',').map(t => t.trim()).filter(Boolean) }),
    ...(values.source.trim() && { source: values.source.trim() }),
  })
  return slug
}

export async function updateRecipe(slug: string, values: RecipeFormValues): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(doc(db, COLLECTION, slug), {
    title: values.title.trim(),
    servings: parseInt(values.servings) || 1,
    ingredients: parseIngredientGroups(values.ingredients),
    instructions: parseInstructionGroups(values.instructions),
    updatedAt: new Date(),
    description: values.description.trim() || deleteField(),
    prepTime: values.prepTime ? parseInt(values.prepTime) : deleteField(),
    cookTime: values.cookTime ? parseInt(values.cookTime) : deleteField(),
    tags: values.tags.trim() ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : deleteField(),
    source: values.source.trim() || deleteField(),
  } as any)
}
