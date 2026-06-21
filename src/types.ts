/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Dish {
  id: string; // Stable UUID
  name: string; // Primary English display (e.g. "Afang Soup")
  localNames: string[]; // e.g., ["Miyan Taushe", "Ofe Nsala"]
  region: 'Efik' | 'Ibibio' | 'Igbo' | 'Yoruba' | 'Hausa' | 'National' | 'Bini' | 'Delta/Ijaw' | 'Diaspora';
  mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink')[];
  servingDefinition: { weightGrams: number; description: string }; // e.g., { weightGrams: 450, description: "Standard home plate" }
  calories: number; // Per servingDefinition
  calorieSource: string; // Provenance metadata (e.g., "USDA", "Dietitian Estimate")
  macros: { proteinG: number; carbsG: number; fatG: number; fiberG: number };
  allergens: ('shellfish' | 'nuts' | 'eggs' | 'dairy' | 'gluten' | 'fish' | 'soy')[];
  imageUrl: string; 
  photoUrl?: string;
  description: string;
  isBudgetFriendly: boolean;
  satietyIndex: 'high' | 'medium' | 'low'; // Custom satiety guide
  isLeafyVegHeavy: boolean;
}

export interface UserProfile {
  name: string;
  isDiaspora: boolean;
  goal: 'weight_loss' | 'balance' | 'cholesterol';
  nigerianFoodRatio: number; // 0 to 100%
  breakfastPreference: string[]; // bread-eggs, oats, pap, indomie, swallow, skip
  sex: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  activityLevel: number; // 1.2, 1.375, 1.55, 1.725
  goalMonths: number;
  satietyPreference: 'standard' | 'high';
  budgetLevel: 'lean' | 'steady' | 'flexible';
  preferredRegions: string[];
  avoidIngredients: string[];
  calculatedCalorieTarget: number;
  createdAt: string;
}

export interface MealLogItem {
  id: string;
  dishId: string;
  dishName: string;
  calories: number;
  macros: { proteinG: number; carbsG: number; fatG: number; fiberG: number };
  portionMultiplier: number; // 0.5, 1, 1.5, 2, etc.
  loggedAt: string; // ISO date string (YYYY-MM-DD)
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
}

export interface DayPlan {
  dayName: string; // e.g. "Monday"
  breakfast: string; // DishId or custom string
  lunch: string;
  dinner: string;
  snack: string;
  targetCalories: number;
}
