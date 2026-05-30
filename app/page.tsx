import { getAllRecipes } from '@/lib/recipes'
import RecipeListSection from '@/components/RecipeListSection/RecipeListSection'

export default async function HomePage() {
  const recipes = await getAllRecipes()

  return (
    <div className="container">
      <div className="title">
        <h1>Recipes</h1>
        <p>A personal collection of to-the-point recipes.</p>
      </div>
      <RecipeListSection recipes={recipes} />
    </div>
  )
}
