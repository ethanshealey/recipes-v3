'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Auth/AuthProvider'
import { useToast } from '@/components/Toast/ToastProvider'
import RecipeForm from '@/components/RecipeForm/RecipeForm'
import { createRecipe, type RecipeFormValues } from '@/lib/recipes'
import styles from './page.module.scss'

export default function AddPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { showToast } = useToast()

  useEffect(() => {
    if (!loading && !user) router.replace('/login?message=You must be signed in to add a recipe.')
  }, [user, loading])

  if (loading || !user) return null

  async function handleSubmit(values: RecipeFormValues) {
    const slug = await createRecipe(values)
    showToast('Recipe added!')
    router.push(`/recipes/${slug}`)
  }

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>New Recipe</h1>
      </div>
      <RecipeForm onSubmit={handleSubmit} submitLabel="Add Recipe" />
    </div>
  )
}
