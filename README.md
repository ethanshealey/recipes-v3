# Recipes v3

A personal recipe website — public-facing browsing with a private admin section for managing recipes. Text and typography focused; no images.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (email/password) |
| Styling | SCSS modules + CSS custom properties |
| Fonts | Lora (headings), DM Sans (body/UI) |

## Getting started

### 1. Clone and install

```bash
git clone <repo-url>
cd recipes-v3
npm install
```

### 2. Configure Firebase

Copy the example env file and fill in your Firebase project credentials (Project Settings → General → Your apps in the Firebase console):

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### 3. Deploy Firestore security rules

In the Firebase console, go to **Firestore → Rules**, paste the contents of `firestore.rules`, and click **Publish**. Alternatively, use the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
recipes-v3/
├── app/
│   ├── layout.tsx               # Root layout — fonts, Nav, AuthProvider, ToastProvider
│   ├── page.tsx                 # Home — recipe list with search and tag filter
│   ├── login/                   # Sign-in page
│   ├── logout/                  # Signs out and redirects home
│   ├── add/                     # Create a new recipe (auth-protected)
│   ├── edit/[slug]/             # Edit an existing recipe (auth-protected)
│   ├── recipes/[slug]/          # Public recipe detail page
│   └── api/
│       └── recipes/
│           ├── route.ts         # GET /api/recipes
│           └── [slug]/route.ts  # GET /api/recipes/:slug
├── components/
│   ├── Auth/
│   │   └── AuthProvider.tsx     # Firebase auth context + useAuth hook
│   ├── Nav/                     # Site navigation with dark mode toggle
│   ├── RecipeForm/
│   │   ├── RecipeForm.tsx       # Shared add/edit form component
│   │   └── UnitCombobox.tsx     # Custom unit dropdown (free-text + suggestions)
│   ├── RecipeListSection/       # Filterable, searchable recipe list
│   ├── SearchBar/               # Controlled search input
│   └── Toast/
│       └── ToastProvider.tsx    # Toast notification context + useToast hook
├── lib/
│   ├── firebase.ts              # Firebase app init (exports db, auth)
│   └── recipes.ts               # All Firestore logic + form types
├── models/
│   ├── recipe.ts                # Recipe interface
│   ├── ingredient.ts            # Ingredient + IngredientGroup interfaces
│   └── instruction.ts           # InstructionGroup interface
├── scripts/
│   ├── migrate.ts               # One-time migration from recipes → recipes-v3
│   └── tag.ts                   # Auto-tag recipes by title keyword matching
├── styles/
│   ├── globals.scss             # Global styles, body, .container
│   ├── _variables.scss          # CSS custom properties (light + dark theme)
│   └── _reset.scss              # Box-sizing reset
└── firestore.rules              # Firestore security rules
```

## Pages

| Route | Access | Description |
|---|---|---|
| `/` | Public | Recipe list with search and tag filter |
| `/recipes/[slug]` | Public | Recipe detail with live serving scaler |
| `/login` | Public | Email/password sign-in |
| `/logout` | Public | Signs out and redirects to `/` |
| `/add` | Auth only | Create a new recipe |
| `/edit/[slug]` | Auth only | Edit an existing recipe |

## Data model

Recipes are stored in the `recipes-v3` Firestore collection. The document ID is the recipe slug (e.g. `apple-pie`).

```ts
interface Recipe {
  slug: string            // Firestore doc ID and URL segment
  title: string
  description?: string
  servings: number        // Base serving count (used for the live scaler)
  prepTime?: number       // Minutes
  cookTime?: number       // Minutes
  tags?: string[]
  source?: string         // URL or attribution
  ingredients: IngredientGroup[]
  instructions: InstructionGroup[]
  createdAt: Date
  updatedAt: Date
}

interface IngredientGroup {
  title?: string          // e.g. "For the crust"
  items: Ingredient[]
}

interface Ingredient {
  quantity: number        // Stored as decimal (0.5, 1.5) for easy scaling
  unit: string            // e.g. "cup", "tsp"
  name: string
  notes?: string          // e.g. "cold & cubed"
}

interface InstructionGroup {
  title?: string          // e.g. "Make the filling"
  steps: string[]
}
```

## API

### `GET /api/recipes`

Returns all recipes as a `RecipeSummary[]` array, ordered by title. Supports optional tag filtering:

```
GET /api/recipes?tag=Baking
```

### `GET /api/recipes/:slug`

Returns a single full `Recipe` by slug. Returns `404` if not found.

## Auth

Authentication is Firebase email/password. Only signed-in users can create or edit recipes.

Two React contexts are provided at the root layout level:

| Hook | Source | Returns |
|---|---|---|
| `useAuth()` | `AuthProvider` | `{ user: User \| null, loading: boolean }` |
| `useToast()` | `ToastProvider` | `{ showToast: (message: string) => void }` |

Protected pages (`/add`, `/edit/[slug]`) redirect to `/login?message=...` when accessed without a session. The login page reads the `message` param and displays it as a toast on arrival.

## Dark mode

The site supports a warm dark theme controlled by `data-theme="dark"` on `<html>`. A blocking inline script in the root layout reads `localStorage` before first paint to prevent a flash of the wrong theme. The Nav includes a toggle that persists the choice.

Theme tokens live in `styles/_variables.scss`:

```scss
:root {
  --bg: #F7F4EE;
  --text: #1C1916;
  --accent: #8B6F5C;
  --error: #9B2B2B;
  --error-surface: #F9EDED;
  /* ... */
}

[data-theme='dark'] {
  --bg: #17140E;
  --text: #EDE8DE;
  --accent: #C4956A;
  --error: #D97373;
  --error-surface: #2A1A1A;
  /* ... */
}
```

## Utility scripts

Scripts use `tsx` and load env vars via `@next/env`, so they can talk to Firestore directly without running the Next.js server.

### `npm run migrate`

One-time migration from the old `recipes` collection to `recipes-v3`. Parses flat ingredient/instruction strings (with `*Header` group prefixes) into the structured grouped schema. The old collection is left intact and read-only.

### `npm run tag`

Auto-applies tags to every recipe based on title keyword matching. Rules are defined as `{ tag, keywords }` entries in `scripts/tag.ts` and are easy to extend. Supports `--dry-run` to preview changes without writing:

```bash
npm run tag -- --dry-run
npm run tag
```

## Firestore security rules

Defined in `firestore.rules`:

| Collection | Read | Write |
|---|---|---|
| `recipes-v3` | Anyone | Signed-in users only |
| `recipes` (legacy) | Anyone | Denied |
| Everything else | Denied | Denied |
