/**
 * FitTrack Scientific Calorie & Macronutrient Calculator
 * Uses the scientifically accepted Mifflin-St Jeor equation.
 */

export const ACTIVITY_LEVELS = {
  sedentary: {
    id: 'sedentary',
    label: 'Sedentary',
    multiplier: 1.2,
    description: 'Little or no exercise, desk job',
  },
  light: {
    id: 'light',
    label: 'Lightly Active',
    multiplier: 1.375,
    description: 'Light exercise or sports 1–3 days/week',
  },
  moderate: {
    id: 'moderate',
    label: 'Moderately Active',
    multiplier: 1.55,
    description: 'Moderate exercise or sports 3–5 days/week',
  },
  very: {
    id: 'very',
    label: 'Very Active',
    multiplier: 1.725,
    description: 'Hard exercise or sports 6–7 days/week',
  },
  extra: {
    id: 'extra',
    label: 'Extremely Active',
    multiplier: 1.9,
    description: 'Very hard exercise, physical job, or 2x daily training',
  },
};

export const FITNESS_GOALS = {
  lose: {
    id: 'lose',
    label: 'Lose Weight',
    deficit: 500, // standard 0.5 kg/week deficit
    proteinPerKg: 2.2, // higher protein to preserve lean muscle during deficit
    description: 'Burn fat while preserving lean muscle mass',
  },
  maintain: {
    id: 'maintain',
    label: 'Maintain Weight',
    deficit: 0,
    proteinPerKg: 1.8,
    description: 'Optimize energy levels and maintain body composition',
  },
  gain: {
    id: 'gain',
    label: 'Gain Weight',
    deficit: -400, // surplus
    proteinPerKg: 2.0,
    description: 'Healthy caloric surplus to support body weight gain',
  },
  build_muscle: {
    id: 'build_muscle',
    label: 'Build Muscle',
    deficit: -300, // lean surplus
    proteinPerKg: 2.2,
    description: 'Lean bulk to maximize hypertrophy with minimal fat gain',
  },
  fitness: {
    id: 'fitness',
    label: 'Improve Fitness',
    deficit: 0,
    proteinPerKg: 2.0,
    description: 'Fuel athletic performance, stamina, and recovery',
  },
};

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
export function calculateBMR(weightKg, heightCm, ageYears, gender = 'male') {
  const w = Number(weightKg) || 70;
  const h = Number(heightCm) || 175;
  const a = Number(ageYears) || 25;
  const base = 10 * w + 6.25 * h - 5 * a;

  if (gender === 'female') {
    return Math.round(base - 161);
  }
  return Math.round(base + 5);
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
export function calculateTDEE(bmr, activityLevel = 'moderate') {
  const level = ACTIVITY_LEVELS[activityLevel] || ACTIVITY_LEVELS.moderate;
  return Math.round(bmr * level.multiplier);
}

/**
 * Calculate recommended Daily Calorie & Macronutrient targets
 * @param {Object} params
 * @param {number} params.weight - Current weight in kg
 * @param {number} params.height - Height in cm
 * @param {number} params.age - Age in years
 * @param {string} params.gender - 'male' | 'female'
 * @param {string} params.activityLevel - Key of ACTIVITY_LEVELS
 * @param {string} params.goal - Key of FITNESS_GOALS
 * @param {number} [params.weeklyRate] - Optional custom weekly weight change (kg/week)
 */
export function calculateNutritionTargets({
  weight,
  height,
  age,
  gender = 'male',
  activityLevel = 'moderate',
  goal = 'maintain',
  weeklyRate,
}) {
  const w = Math.max(30, Number(weight) || 70);
  const h = Math.max(100, Number(height) || 175);
  const a = Math.max(12, Number(age) || 25);

  const bmr = calculateBMR(w, h, a, gender);
  const tdee = calculateTDEE(bmr, activityLevel);

  const goalConfig = FITNESS_GOALS[goal] || FITNESS_GOALS.maintain;

  // Calorie adjustments
  let calorieAdjustment = 0;
  if (typeof weeklyRate === 'number' && weeklyRate !== 0) {
    // 1 kg fat ~= 7700 kcal -> daily change = (rate * 7700) / 7
    calorieAdjustment = Math.round((weeklyRate * 7700) / 7);
  } else {
    // Default adjustment from goal
    calorieAdjustment = -goalConfig.deficit; // deficit of 500 means adjustment is -500
  }

  let calories = Math.round(tdee + calorieAdjustment);

  // Safety floor: never recommend below essential minimums (1200 kcal female, 1500 kcal male)
  const safetyFloor = gender === 'female' ? 1200 : 1500;
  if (calories < safetyFloor) {
    calories = safetyFloor;
  }

  // Macronutrient calculation:
  // 1. Protein: 1.8 to 2.2 g per kg of bodyweight (4 kcal/g)
  let protein = Math.round(w * goalConfig.proteinPerKg);

  // 2. Fat: 25% of total calories (minimum 0.8 g/kg for healthy hormonal function, 9 kcal/g)
  const fatFromPercent = Math.round((calories * 0.25) / 9);
  const minFatFromWeight = Math.round(w * 0.8);
  const fat = Math.max(fatFromPercent, minFatFromWeight);

  // 3. Carbohydrates: remainder of energy (4 kcal/g)
  const caloriesFromProteinAndFat = protein * 4 + fat * 9;
  let remainingCalories = calories - caloriesFromProteinAndFat;
  if (remainingCalories < 0) {
    // If protein and fat consume all calories, adjust protein slightly
    protein = Math.round(w * 1.6);
    remainingCalories = calories - (protein * 4 + fat * 9);
  }
  const carbs = Math.max(30, Math.round(remainingCalories / 4));

  // Recalculate true calories from macros to match perfectly
  const calculatedTotalCalories = protein * 4 + carbs * 4 + fat * 9;

  return {
    bmr,
    tdee,
    calories: calculatedTotalCalories,
    protein,
    carbs,
    fat,
  };
}
