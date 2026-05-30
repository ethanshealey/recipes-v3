export interface Ingredient {
  quantity: number
  unit: string
  name: string
  notes?: string
}

export interface IngredientGroup {
  title?: string
  items: Ingredient[]
}
