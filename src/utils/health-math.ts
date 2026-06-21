/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, MealLogItem } from '../types';

/**
 * Calculates BMR using Mifflin-St Jeor equation
 */
export function calculateBMR(sex: 'male' | 'female', weightKg: number, heightCm: number, age: number): number {
  if (sex === 'male') {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    return (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }
}

/**
 * Calculates Maintenance Calories based on Activity Multipliers
 */
export function calculateMaintenance(bmr: number, activityLevel: number): number {
  // Safe activity level limits, capping at 1.725 (no 1.9 extreme multiplier)
  const safeMultiplier = Math.min(activityLevel, 1.725);
  return Math.round(bmr * safeMultiplier);
}

/**
 * Calculates BMI
 */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightMeters = heightCm / 100;
  if (heightMeters <= 0) return 0;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-500' };
  if (bmi < 25.0) return { label: 'Normal weight', color: 'text-emerald-500' };
  if (bmi < 30.0) return { label: 'Overweight', color: 'text-amber-500' };
  return { label: 'Obese', color: 'text-rose-500' };
}

/**
 * Computes clinically safe Energy and Calorie Targets
 */
export function calculateCalorieTarget(profile: Omit<UserProfile, 'calculatedCalorieTarget'>): {
  bmr: number;
  maintenance: number;
  deficit: number;
  target: number;
  clinicalNote: string;
} {
  const bmr = calculateBMR(profile.sex, profile.weightKg, profile.heightCm, profile.age);
  const maintenance = calculateMaintenance(bmr, profile.activityLevel);

  let deficit = 0;
  let clinicalNote = "Maintenance calories calculated for structural balance.";

  if (profile.goal === 'weight_loss') {
    // Standard weight loss deficit is 500 kcal for 0.5 kg limit, up to 1000 kcal for 1 kg
    // Let's do a standard rate: say 500-750 kcal depending on their delta
    const weightDelta = profile.weightKg - profile.goalWeightKg;
    
    if (weightDelta > 0) {
      // Suggest deficit based on months timeline
      // Total fat loss equivalent: weightDelta * 7700 kcal
      // Target deficit = (weightDelta * 7700) / (profile.goalMonths * 30 days)
      const calculatedDeficitNeeded = (weightDelta * 7700) / (profile.goalMonths * 30);
      
      // Clinical safety boundary checks:
      // 1. Max 20% of maintenance
      const deficitLimit20Percent = maintenance * 0.20;
      // 2. Hard cap of 1,000 kcal deficit
      const hardCapDeficit = 1000;
      
      const safeMaxDeficit = Math.min(deficitLimit20Percent, hardCapDeficit);
      
      deficit = Math.min(Math.round(calculatedDeficitNeeded), safeMaxDeficit);
      
      if (calculatedDeficitNeeded > safeMaxDeficit) {
        clinicalNote = `Deficit constrained to ${Math.round(safeMaxDeficit)} kcal for metabolic safety (max 20% of maintenance or 1000 kcal cap). Your desired timeline is adjusted.`;
      } else {
        clinicalNote = `Deficit calculated safely at ${deficit} kcal/day to reach your goal over ${profile.goalMonths} months.`;
      }
    } else {
      deficit = 0;
      clinicalNote = "Goal weight is higher than or equal to current weight. Setting calories to maintenance.";
    }
  } else if (profile.goal === 'cholesterol') {
    // For cholesterol, a subtle safe deficit (e.g. 10%) can promote vascular recovery, paired with clean leafy foods
    deficit = Math.round(maintenance * 0.10);
    clinicalNote = "Premium clean cardiovascular plan: 10% structural deficit paired with antioxidant leafy fibers.";
  }

  let target = maintenance - deficit;

  // Absolute Floors check:
  // 1200 kcal for women, 1500 kcal for men
  const minFloor = profile.sex === 'female' ? 1200 : 1500;
  if (target < minFloor) {
    target = minFloor;
    deficit = maintenance - target;
    clinicalNote += ` Calorie Target raised to absolute medical floor of ${minFloor} kcal/day to protect physical organ operation.`;
  }

  return {
    bmr: Math.round(bmr),
    maintenance,
    deficit,
    target: Math.round(target),
    clinicalNote
  };
}

/**
 * Calculates a simulated weight projection array over the goal months
 */
export function generateWeightTrajectory(
  currentWeight: number,
  goalWeight: number,
  maintenance: number,
  targetCalories: number,
  months: number
): { week: number; dateStr: string; weight: number }[] {
  const trajectory: { week: number; dateStr: string; weight: number }[] = [];
  const weeks = months * 4;
  const dailyDeficit = maintenance - targetCalories;
  
  if (dailyDeficit <= 0) {
    // Maintenance or surplus line
    for (let w = 0; w <= weeks; w++) {
      const date = new Date();
      date.setDate(date.getDate() + (w * 7));
      trajectory.push({
        week: w,
        dateStr: date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
        weight: currentWeight
      });
    }
    return trajectory;
  }

  // Weight fat equivalent: 7700 kcal = 1 kg fat
  const weeklyLossKg = (dailyDeficit * 7) / 7700;

  let iteratingWeight = currentWeight;
  for (let w = 0; w <= weeks; w++) {
    const date = new Date();
    date.setDate(date.getDate() + (w * 7));
    
    trajectory.push({
      week: w,
      dateStr: date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }),
      weight: Number(Math.max(goalWeight, iteratingWeight).toFixed(1))
    });

    iteratingWeight -= weeklyLossKg;
  }

  return trajectory;
}

/**
 * Calculates a user's consistency streak for meeting calorie targets.
 * Hitting target is defined as being between 80% and 105% of the calculated budget.
 */
export function calculateStreak(
  logs: MealLogItem[],
  targetCalories: number
): {
  currentStreak: number;
  bestStreak: number;
  onTrackToday: boolean;
  statusToday: 'pending' | 'on_track' | 'over_budget';
  targetMetDates: string[];
} {
  // 1. Group logs by date
  const dailyTotals: Record<string, number> = {};
  logs.forEach(item => {
    const d = item.loggedAt; // "YYYY-MM-DD"
    dailyTotals[d] = (dailyTotals[d] || 0) + item.calories;
  });

  const isHit = (dateStr: string) => {
    const cals = dailyTotals[dateStr] || 0;
    return cals >= targetCalories * 0.8 && cals <= targetCalories * 1.05;
  };

  // Helper to generate YYYY-MM-DD for offset days in UTC
  const getOffsetDateStr = (offset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().split('T')[0];
  };

  const todayStr = getOffsetDateStr(0);

  // Determine status for "today"
  const todayCals = dailyTotals[todayStr] || 0;
  let statusToday: 'pending' | 'on_track' | 'over_budget' = 'pending';
  if (todayCals > targetCalories * 1.05) {
    statusToday = 'over_budget';
  } else if (todayCals >= targetCalories * 0.8) {
    statusToday = 'on_track';
  }

  // 2. Calculate Current Streak
  let currentStreak = 0;
  let dayOffset = 0;

  // If today is 'on_track', we start with today (offset 0) and go backward.
  // If today is 'pending' (intake is < 80% but <= 105% of target), we start with yesterday (offset 1) so the streak doesn't break prematurely.
  // If today is 'over_budget' (exceeds budget), streak is broken today.
  if (statusToday === 'on_track') {
    while (true) {
      const checkDate = getOffsetDateStr(dayOffset);
      if (isHit(checkDate)) {
        currentStreak++;
        dayOffset++;
      } else {
        break;
      }
    }
  } else if (statusToday === 'pending') {
    dayOffset = 1; // Count from yesterday backward
    while (true) {
      const checkDate = getOffsetDateStr(dayOffset);
      if (isHit(checkDate)) {
        currentStreak++;
        dayOffset++;
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  // 3. Calculate Best Streak (longest streak of consecutive matching day targets anywhere in logs)
  const allLoggedDates = Object.keys(dailyTotals).sort();
  let maxStreak = 0;
  let tempStreak = 0;
  let lastMetDate: Date | null = null;

  allLoggedDates.forEach(dateStr => {
    const cals = dailyTotals[dateStr];
    const met = cals >= targetCalories * 0.8 && cals <= targetCalories * 1.05;

    if (met) {
      if (lastMetDate === null) {
        tempStreak = 1;
      } else {
        const diffTime = new Date(dateStr).getTime() - lastMetDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      lastMetDate = new Date(dateStr);
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
      lastMetDate = null;
    }
  });

  const bestStreak = Math.max(maxStreak, currentStreak);

  // Collect all dates that met the target
  const targetMetDates = Object.keys(dailyTotals).filter(d => {
    const cals = dailyTotals[d];
    return cals >= targetCalories * 0.8 && cals <= targetCalories * 1.05;
  });

  return {
    currentStreak,
    bestStreak,
    onTrackToday: statusToday === 'on_track',
    statusToday,
    targetMetDates
  };
}

/**
 * Returns an achievement level milestone based on consecutive streak days.
 */
export function getStreakMilestone(currentStreak: number): { title: string; color: string; icon: string } {
  if (currentStreak === 0) {
    return { title: "Start Your Journey", color: "text-stone-400 bg-stone-50 border-stone-200", icon: "🌱" };
  }
  if (currentStreak < 3) {
    return { title: "Steady Beginner", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: "🔥" };
  }
  if (currentStreak < 7) {
    return { title: "Devoted Adherent", color: "text-blue-700 bg-blue-50 border-blue-200", icon: "💪" };
  }
  return { title: "Clinical Champion", color: "text-purple-700 bg-purple-50 border-purple-200", icon: "👑" };
}


