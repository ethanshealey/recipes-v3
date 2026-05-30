import { IngredientGroup } from './ingredient'
import { InstructionGroup } from './instruction'

export interface Recipe {
  slug: string
  title: string
  description?: string
  servings: number
  prepTime?: number
  cookTime?: number
  tags?: string[]
  source?: string
  ingredients: IngredientGroup[]
  instructions: InstructionGroup[]
  createdAt: Date
  updatedAt: Date
}
