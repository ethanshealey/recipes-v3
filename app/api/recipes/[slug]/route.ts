import { type NextRequest } from 'next/server'
import { getRecipe } from '@/lib/recipes'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const recipe = await getRecipe(slug)
    if (!recipe) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(recipe)
  } catch (err) {
    console.error('[GET /api/recipes/:slug]', err)
    return Response.json({ error: 'Failed to fetch recipe' }, { status: 500 })
  }
}
