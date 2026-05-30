import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore'

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

const DRY_RUN = process.argv.includes('--dry-run')

// ── Tag rules ─────────────────────────────────────────────
// Each keyword is matched as a whole word (word-boundary safe).
// Include both singular and plural where needed.

const TAG_RULES: Array<{ tag: string; keywords: string[] }> = [
  {
    tag: 'Baking',
    keywords: [
      'cake', 'cupcake', 'cupcakes',
      'cookie', 'cookies',
      'brownie', 'brownies',
      'muffin', 'muffins',
      'pie',
      'bread', 'sourdough', 'focaccia',
      'bun', 'buns',
      'roll', 'rolls',
      'scone', 'scones',
      'tart', 'pastry',
      'pancake', 'pancakes',
      'crepe', 'crepes', 'crêpe', 'crêpes',
    ],
  },
  {
    tag: 'Breakfast',
    keywords: [
      'pancake', 'pancakes',
      'waffle', 'waffles',
      'crepe', 'crepes', 'crêpe', 'crêpes',
      'oatmeal',
      'granola',
      'frittata',
      'omelet', 'omelette',
    ],
  },
  {
    tag: 'Dessert',
    keywords: [
      'cake', 'cupcake', 'cupcakes',
      'cookie', 'cookies',
      'brownie', 'brownies',
      'pie',
      'pudding',
      'cheesecake',
      'tiramisu',
      'sorbet', 'gelato',
      'fudge',
    ],
  },
  {
    tag: 'Pasta',
    keywords: [
      'pasta',
      'mac n cheese', 'mac and cheese', 'macaroni',
      'spaghetti', 'linguine', 'fettuccine', 'penne', 'rigatoni',
      'lasagna', 'lasagne',
      'carbonara', 'bolognese', 'alfredo',
      'gnocchi',
    ],
  },
  {
    tag: 'Soup',
    keywords: [
      'soup', 'stew', 'chili', 'chilli',
      'chowder', 'bisque', 'ramen', 'broth', 'gumbo', 'minestrone',
    ],
  },
  {
    tag: 'Chicken',
    keywords: [
      'chicken',
      'wing', 'wings',
      'nugget', 'nuggets',
      'katsu',
    ],
  },
  {
    tag: 'Beef',
    keywords: [
      'beef', 'steak',
      'burger', 'burgers',
      'bulgogi',
      'brisket',
      'prime rib',
      'jerky',
      'meatball', 'meatballs',
      'meatloaf',
    ],
  },
  {
    tag: 'Seafood',
    keywords: [
      'shrimp', 'prawn', 'prawns',
      'salmon', 'fish', 'tuna',
      'lobster', 'crab',
      'scallop', 'scallops',
      'cod', 'halibut',
    ],
  },
  {
    tag: 'Pork',
    keywords: [
      'pork', 'bacon', 'ham', 'sausage',
      'chashu', 'carnitas',
    ],
  },
  {
    tag: 'Turkey',
    keywords: ['turkey'],
  },
  {
    tag: 'Appetizer',
    keywords: [
      'dip',
      'popper', 'poppers',
      'bites',
    ],
  },
  {
    tag: 'Snack',
    keywords: [
      'jerky',
      'peanut', 'peanuts',
    ],
  },
  {
    tag: 'Drink',
    keywords: [
      'tea', 'lemonade', 'smoothie', 'cocktail', 'juice', 'punch',
    ],
  },
  {
    tag: 'Side Dish',
    keywords: [
      'potato', 'potatoes',
    ],
  },
  {
    tag: 'Sauce',
    keywords: [
      'sauce', 'cream sauce',
    ],
  },
  {
    tag: 'Condiment',
    keywords: [
      'confit', 'ghee', 'sauce',
    ],
  },
  {
    tag: 'Darkroom',
    keywords: [
      'remjet',
    ],
  },
]

// ── Matching ──────────────────────────────────────────────

function matchesKeyword(title: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(title)
}

function deriveTags(title: string): string[] {
  const tags = new Set<string>()
  for (const { tag, keywords } of TAG_RULES) {
    if (keywords.some(k => matchesKeyword(title, k))) {
      tags.add(tag)
    }
  }
  return [...tags].sort()
}

// ── Main ──────────────────────────────────────────────────

async function run() {
  if (DRY_RUN) console.log('DRY RUN — no writes will be made\n')

  const snap = await getDocs(collection(db, 'recipes-v3'))
  let updated = 0
  let skipped = 0

  for (const docSnap of snap.docs) {
    const { title, tags: existing = [] } = docSnap.data() as { title: string; tags?: string[] }
    const derived = deriveTags(title)

    if (derived.length === 0) {
      console.log(`  --    ${title}`)
      skipped++
      continue
    }

    const newTags = derived.filter(t => !existing.includes(t))
    if (newTags.length === 0) {
      console.log(`  OK    ${title}  (already tagged: ${existing.join(', ')})`)
      skipped++
      continue
    }

    console.log(`  TAG   ${title}`)
    console.log(`        + ${newTags.join(', ')}`)

    if (!DRY_RUN) {
      await updateDoc(doc(db, 'recipes-v3', docSnap.id), {
        tags: arrayUnion(...derived),
      })
    }

    updated++
  }

  console.log(`\nDone. ${updated} ${DRY_RUN ? 'would be updated' : 'updated'}, ${skipped} skipped.`)
}

run().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
