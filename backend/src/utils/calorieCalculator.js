// Calorie savings calculation helper
// costPerCalorie = totalFoodDiningExpenses / totalCaloriesLogged
// monthlyCaloriesSaved = (foodDiningSpend * reduction%) / costPerCalorie
export const calculateCalorieSavings = (foodDiningSpend, totalCalories, totalFoodExpenses, reductionPercent) => {
  if (totalCalories <= 0 || totalFoodExpenses <= 0 || reductionPercent <= 0) {
    return {
      costPerCalorie: 0, monthlyCaloriesSaved: 0, isZero: true,
      projections: [3, 6, 12].map(m => ({ months: m, totalCaloriesSaved: 0 })),
      calorieYearlyProjection: Array.from({ length: 12 }, (_, i) => ({ month: i+1, caloriesSaved: 0 }))
    };
  }
  const costPerCalorie = totalFoodExpenses / totalCalories;
  const moneySaved = (foodDiningSpend * reductionPercent) / 100;
  const monthlyCaloriesSaved = moneySaved / costPerCalorie;
  return {
    costPerCalorie: Math.round(costPerCalorie * 10000) / 10000,
    monthlyCaloriesSaved: Math.round(monthlyCaloriesSaved),
    isZero: false,
    projections: [3, 6, 12].map(m => ({ months: m, totalCaloriesSaved: Math.round(monthlyCaloriesSaved * m) })),
    calorieYearlyProjection: Array.from({ length: 12 }, (_, i) => ({ month: i+1, caloriesSaved: Math.round(monthlyCaloriesSaved * (i+1)) }))
  };
};