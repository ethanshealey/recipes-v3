import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore'
import type { Recipe } from '../models/recipe'
import type { Ingredient, IngredientGroup } from '../models/ingredient'
import type { InstructionGroup } from '../models/instruction'

const app = getApps().length === 0
  ? initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    })
  : getApps()[0]

const db = getFirestore(app)

// ── Old schema ────────────────────────────────────────────
interface OldRecipe {
  cook_time: string
  date_modified: string
  id: number
  ingredients: string[]
  instructions: string[]
  name: string
  source: string
}

// ── Ingredient parsing ────────────────────────────────────

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '¼': 0.25, '¾': 0.75,
  '⅓': 1 / 3, '⅔': 2 / 3,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
}

function parseFraction(s: string): number | null {
  if (s in UNICODE_FRACTIONS) return UNICODE_FRACTIONS[s]
  const slash = s.match(/^(\d+)\/(\d+)$/)
  if (slash) return parseInt(slash[1]) / parseInt(slash[2])
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

const KNOWN_UNITS = new Set([
  'tsp', 'tbsp',
  'cup', 'cups',
  'oz', 'ounce', 'ounces',
  'fl',                          // "fl oz" — handled specially below
  'g', 'gram', 'grams',
  'lb', 'lbs', 'pound', 'pounds',
  'kg',
  'ml', 'l', 'L', 'liter', 'liters',
  'pinch', 'dash',
  'clove', 'cloves',
  'sprig', 'sprigs',
  'slice', 'slices',
  'piece', 'pieces',
  'handful', 'handfuls',
  'can', 'cans',
  'bunch', 'bunches',
  'head', 'heads',
  'stalk', 'stalks',
  'strip', 'strips',
  'sheet', 'sheets',
  'pkg', 'package', 'packages',
])

const UNIT_NORMALIZE: Record<string, string> = {
  cups: 'cup',
  ounce: 'oz', ounces: 'oz',
  gram: 'g', grams: 'g',
  lbs: 'lb', pound: 'lb', pounds: 'lb',
  l: 'L', liter: 'L', liters: 'L',
  cloves: 'clove',
  sprigs: 'sprig',
  slices: 'slice',
  pieces: 'piece',
  handfuls: 'handful',
  cans: 'can',
  bunches: 'bunch',
  heads: 'head',
  stalks: 'stalk',
  strips: 'strip',
  sheets: 'sheet',
  package: 'pkg', packages: 'pkg',
}

function parseIngredient(raw: string): Ingredient {
  const tokens = raw.trim().split(/\s+/)
  let i = 0
  let quantity = 0

  const first = parseFraction(tokens[0])
  if (first !== null) {
    quantity = first
    i = 1
    // Mixed numbers like "1 1/2"
    if (i < tokens.length) {
      const second = parseFraction(tokens[i])
      if (second !== null && second < 1) {
        quantity += second
        i++
      }
    }
  }

  let unit = ''
  if (i < tokens.length && KNOWN_UNITS.has(tokens[i].toLowerCase())) {
    const raw_unit = tokens[i]
    unit = UNIT_NORMALIZE[raw_unit] ?? raw_unit
    i++
    // Handle "fl oz"
    if (unit === 'fl' && i < tokens.length && tokens[i].toLowerCase() === 'oz') {
      unit = 'fl oz'
      i++
    }
  }

  const name = tokens.slice(i).join(' ')
  return { quantity, unit, name }
}

// ── Grouping ──────────────────────────────────────────────

function groupIngredients(items: string[]): IngredientGroup[] {
  const groups: IngredientGroup[] = []
  let current: IngredientGroup = { items: [] }

  for (const item of items) {
    if (!item.trim()) continue
    if (item.startsWith('*')) {
      if (current.items.length > 0) groups.push(current)
      current = { title: item.slice(1).trim(), items: [] }
    } else {
      current.items.push(parseIngredient(item))
    }
  }
  if (current.items.length > 0) groups.push(current)
  return groups
}

function groupInstructions(steps: string[]): InstructionGroup[] {
  const groups: InstructionGroup[] = []
  let current: InstructionGroup = { steps: [] }

  for (const step of steps) {
    if (!step.trim()) continue
    if (step.startsWith('*')) {
      if (current.steps.length > 0) groups.push(current)
      current = { title: step.slice(1).trim(), steps: [] }
    } else {
      current.steps.push(step)
    }
  }
  if (current.steps.length > 0) groups.push(current)
  return groups
}

// ── Helpers ───────────────────────────────────────────────

function parseCookTime(s: string): number | undefined {
  if (!s?.trim()) return undefined
  let minutes = 0
  const hours = s.match(/(\d+)\s*h(r|our)?s?/i)
  const mins = s.match(/(\d+)\s*m(in|inute)?s?/i)
  if (hours) minutes += parseInt(hours[1]) * 60
  if (mins) minutes += parseInt(mins[1])
  return minutes || undefined
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T
}

// ── Migration ─────────────────────────────────────────────

async function migrate() {
  console.log('Fetching recipes from "recipes" collection…\n')

  const snap = await getDocs(collection(db, 'recipes'))
  const usedSlugs = new Set<string>()
  let migrated = 0
  let skipped = 0

  for (const oldDoc of snap.docs) {
    const old = oldDoc.data() as OldRecipe

    if (!old.name?.trim()) {
      console.warn(`  SKIP  (no name, id: ${old.id})`)
      skipped++
      continue
    }

    let slug = toSlug(old.name)
    if (usedSlugs.has(slug)) {
      let n = 2
      while (usedSlugs.has(`${slug}-${n}`)) n++
      slug = `${slug}-${n}`
    }
    usedSlugs.add(slug)

    const recipe: Recipe = {
      slug,
      title: old.name.trim(),
      servings: 1,                         // not in old schema — adjust manually
      cookTime: parseCookTime(old.cook_time),
      source: old.source?.trim() || undefined,
      ingredients: groupIngredients(old.ingredients ?? []),
      instructions: groupInstructions(old.instructions ?? []),
      createdAt: old.date_modified ? new Date(old.date_modified) : new Date(),
      updatedAt: new Date(),
    }

    await setDoc(doc(db, 'recipes-v3', slug), stripUndefined(recipe))
    console.log(`  OK    ${old.name} → /recipes/${slug}`)
    migrated++
  }

  console.log(`\nDone. ${migrated} migrated, ${skipped} skipped.`)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
