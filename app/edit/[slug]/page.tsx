'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { useToast } from '@/components/Toast/ToastProvider'
import RecipeForm from '@/components/RecipeForm/RecipeForm'
import { getRecipe, updateRecipe, recipeToFormValues, type RecipeFormValues } from '@/lib/recipes'
import type { Recipe } from '@/models/recipe'
import styles from './page.module.scss'

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { showToast } = useToast()
  const [recipe, setRecipe] = useState<Recipe | null>(null)

  useEffect(() => {
    if (!loading && !user) router.replace('/login?message=You must be signed in to edit a recipe.')
  }, [user, loading])

  useEffect(() => {
    params.then(({ slug }) => {
      getRecipe(slug).then(r => {
        if (!r) router.replace('/')
        else setRecipe(r)
      })
    })
  }, [params])

  if (loading || !user || !recipe) return null

  async function handleSubmit(values: RecipeFormValues) {
    await updateRecipe(recipe!.slug, values)
    showToast('Recipe updated!')
    router.push(`/recipes/${recipe!.slug}`)
  }

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>Edit Recipe</h1>
        <p>{recipe.title}</p>
      </div>
      <RecipeForm
        initialValues={recipeToFormValues(recipe)}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  )
}
