import { type NextRequest } from 'next/server'
import { getAllRecipes } from '@/lib/recipes'

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag') ?? undefined

  try {
    const recipes = await getAllRecipes({ tag })
    return Response.json(recipes)
  } catch (err) {
    console.error('[GET /api/recipes]', err)
    return Response.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}
