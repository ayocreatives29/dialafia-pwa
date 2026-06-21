/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, DayPlan, Dish } from '../types';
import { INITIAL_DISH_DATABASE } from '../data/food-data';
import { CalendarRange, Sparkles, ShoppingBag, CheckSquare, Plus } from 'lucide-react';

interface WeeklyPlannerProps {
  profile: UserProfile;
}

export default function WeeklyPlanner({ profile }: WeeklyPlannerProps) {
  const [weeklyPlan, setWeeklyPlan] = useState<DayPlan[] | null>(null);
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [completedItems, setCompletedItems] = useState<string[]>([]);

  // Auto-generate plan on load if it doesn't exist
  useEffect(() => {
    generateDynamicPlanner();
  }, [profile]);

  const generateDynamicPlanner = () => {
    // 1. Filter dishes based on profile exclusions
    const validDishes = INITIAL_DISH_DATABASE.filter(dish => {
      const containsAvoid = profile.avoidIngredients.some(avoid => {
        const keyword = avoid.toLowerCase();
        return (
          dish.name.toLowerCase().includes(keyword) ||
          dish.localNames.some(l => l.toLowerCase().includes(keyword)) ||
          dish.description.toLowerCase().includes(keyword)
        );
      });
      return !containsAvoid;
    });

    const candidateBreakfasts = validDishes.filter(d => d.mealTypes.includes('breakfast'));
    const candidateMainDishes = validDishes.filter(d => d.mealTypes.includes('lunch') || d.mealTypes.includes('dinner'));
    const candidateSnacks = validDishes.filter(d => d.mealTypes.includes('snack') || d.mealTypes.includes('drink'));

    // fallback in case filters empty everything
    const breakfasts = candidateBreakfasts.length > 0 ? candidateBreakfasts : INITIAL_DISH_DATABASE.filter(d => d.mealTypes.includes('breakfast'));
    const mains = candidateMainDishes.length > 0 ? candidateMainDishes : INITIAL_DISH_DATABASE.filter(d => d.mealTypes.includes('lunch'));
    const snacks = candidateSnacks.length > 0 ? candidateSnacks : INITIAL_DISH_DATABASE.filter(d => d.mealTypes.includes('snack'));

    // 2. Select meals for 7 days
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const generatedPlan: DayPlan[] = [];
    const shoppingIngredientsSet = new Set<string>();

    days.forEach((day, index) => {
      // Deterministic selection based on day index + profile constraints (budget, goal, satiety)
      
      // Choose breakfast:
      let poolB = breakfasts;
      if (profile.budgetLevel === 'lean') {
        const cheapB = breakfasts.filter(d => d.isBudgetFriendly);
        if (cheapB.length > 0) poolB = cheapB;
      }
      const bDish = poolB[(index + (profile.isDiaspora ? 1 : 0)) % poolB.length];

      // Choose lunch:
      let poolL = mains;
      if (profile.goal === 'cholesterol') {
        const leafyL = mains.filter(d => d.isLeafyVegHeavy);
        if (leafyL.length > 0) poolL = leafyL;
      } else if (profile.satietyPreference === 'high') {
        const highS = mains.filter(d => d.satietyIndex === 'high');
        if (highS.length > 0) poolL = highS;
      }
      const lDish = poolL[(index + 2) % poolL.length];

      // Choose dinner:
      let poolD = mains;
      if (profile.goal === 'weight_loss') {
        // lean towards lower caloric density dinners
        const lowerCal = mains.filter(d => d.calories < 650);
        if (lowerCal.length > 0) poolD = lowerCal;
      }
      const dDish = poolD[(index + 4) % poolD.length];

      // Choose snack:
      let poolS = snacks;
      if (profile.goal === 'cholesterol') {
        const cleanS = snacks.filter(d => d.name.toLowerCase().includes('zobo') || d.isLeafyVegHeavy);
        if (cleanS.length > 0) poolS = cleanS;
      }
      const sDish = poolS[(index + 1) % poolS.length];

      generatedPlan.push({
        dayName: day,
        breakfast: bDish.name,
        lunch: lDish.name,
        dinner: dDish.name,
        snack: sDish.name,
        targetCalories: bDish.calories + lDish.calories + dDish.calories + sDish.calories
      });

      // Map dishes to standard ingredient profiles
      [bDish, lDish, dDish, sDish].forEach(dish => {
        // extract ingredient hints based on description
        if (dish.name.includes('Bread')) {
          shoppingIngredientsSet.add('Presliced white or wheat bread');
          shoppingIngredientsSet.add('Fresh farm eggs');
        }
        if (dish.name.includes('Indomie')) {
          shoppingIngredientsSet.add('Indomie Instant Noodles (Multi-pack)');
          shoppingIngredientsSet.add('Flaked dry pepper & spring onions');
        }
        if (dish.name.includes('Pap')) {
          shoppingIngredientsSet.add('Corn starch pap pulp (Akamu)');
          shoppingIngredientsSet.add('Evaporated Peak/Three Crowns Milk');
        }
        if (dish.name.includes('Quaker')) {
          shoppingIngredientsSet.add('Quaker quick grain oats');
        }
        if (dish.name.includes('Afang')) {
          shoppingIngredientsSet.add('Shredded dry Afang leaves');
          shoppingIngredientsSet.add('Fresh waterleaves');
          shoppingIngredientsSet.add('Red palm oil & Crayfish');
        }
        if (dish.name.includes('Oha')) {
          shoppingIngredientsSet.add('Fresh Oha leaves');
          shoppingIngredientsSet.add('Cocoyam tube powder (Thickener)');
        }
        if (dish.name.includes('Suya')) {
          shoppingIngredientsSet.add('Lean steak beef (for kebab striping)');
          shoppingIngredientsSet.add('Suya dry Yaji spice (kuli basis)');
        }
        if (dish.name.includes('Masa')) {
          shoppingIngredientsSet.add('Tuwo white rice flour');
          shoppingIngredientsSet.add('Yeast & Honey syrup');
        }
        if (dish.name.includes('Ewedu')) {
          shoppingIngredientsSet.add('Fresh Jute leaves (Ewedu)');
          shoppingIngredientsSet.add('Amala yam flour (Elubo)');
          shoppingIngredientsSet.add('Brown beans (Gbegiri broth)');
        }
        if (dish.name.includes('Jollof')) {
          shoppingIngredientsSet.add('Parboiled long-grain rice');
          shoppingIngredientsSet.add('Tatashe & fresh Red pepper');
          shoppingIngredientsSet.add('Chicken drumsticks');
        }
        if (dish.name.includes('Beans')) {
          shoppingIngredientsSet.add('Oloyin honey brown beans');
          shoppingIngredientsSet.add('Ripe sweet plantain fingers (Dodo)');
        }
        if (dish.name.includes('Zobo')) {
          shoppingIngredientsSet.add('Dried Roselle hibiscus petals (Zobo)');
          shoppingIngredientsSet.add('Fresh ginger root');
        }
      });
    });

    setWeeklyPlan(generatedPlan);
    setShoppingList(Array.from(shoppingIngredientsSet));
    setCompletedItems([]);
  };

  const toggleShoppingItem = (item: string) => {
    setCompletedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const budgetEmojiMap = {
    lean: '💰 Economy (Maximum Local Beans & Oats)',
    steady: '🍽️ Standard (Balanced Native & Contemporary)',
    flexible: '🦐 Premium (Seafood, Fresh Fish, Organic Suya)'
  };

  return (
    <div className="space-y-6">
      {/* Planner Toolbar Header */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <strong className="text-stone-900 text-base font-sans">Active Dialect Planner Tiers</strong>
          </div>
          <p id="plan-summary" className="text-xs text-stone-500 font-sans leading-normal">
            Currently displaying 7-day schedule formulated for <strong>{profile.name}</strong> • Budget leans <strong>{budgetEmojiMap[profile.budgetLevel]}</strong>.
          </p>
        </div>

        <button
          onClick={generateDynamicPlanner}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition self-stretch md:self-auto justify-center cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Regenerate Custom Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Planned Days Columns */}
        <div className="lg:col-span-2 space-y-4">
          {weeklyPlan?.map((plan, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl border border-stone-200/95 p-4 sm:p-5 hover:shadow-sm transition"
            >
              <div className="flex justify-between items-center border-b border-dashed border-stone-100 pb-2.5 mb-3">
                <span className="text-sm font-semibold text-emerald-950 font-display">{plan.dayName}</span>
                <div className="text-right text-[10px] font-mono text-stone-400">
                  <span className="bg-stone-50 border px-2 py-0.5 rounded leading-none">{plan.targetCalories} kcal</span>
                </div>
              </div>

              {/* Meals Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-stone-50 rounded-xl">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-rose-500 font-semibold">Breakfast</div>
                  <div className="font-semibold text-stone-800 mt-1 leading-snug">{plan.breakfast}</div>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-amber-600 font-semibold">Lunch</div>
                  <div className="font-semibold text-stone-800 mt-1 leading-snug">{plan.lunch}</div>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-600 font-semibold">Dinner</div>
                  <div className="font-semibold text-stone-800 mt-1 leading-snug">{plan.dinner}</div>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-purple-600 font-semibold">Snack / Sip</div>
                  <div className="font-semibold text-stone-800 mt-1 leading-snug">{plan.snack}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Shopping list list */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-6 space-y-4 h-fit">
          <div className="flex gap-2.5 items-center border-b border-stone-100 pb-3">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900 font-sans leading-tight">Dynamic Shopping Checklist</h4>
              <p className="text-[10px] text-stone-400 mt-0.5">Ingredients needed for this planned week.</p>
            </div>
          </div>

          <div className="space-y-2">
            {shoppingList.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 italic">Shopping list empty. Generate a plan first.</p>
            ) : (
              shoppingList.map((item, idx) => {
                const complete = completedItems.includes(item);
                return (
                  <label 
                    key={idx}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                      complete 
                        ? 'bg-stone-50/50 border-stone-200 text-stone-400 line-through' 
                        : 'bg-white border-stone-150 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={complete}
                      onChange={() => toggleShoppingItem(item)}
                      className="mt-0.5 w-4 h-4 accent-emerald-700 cursor-pointer"
                    />
                    <span className="text-[11px] leading-snug font-sans font-medium">{item}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
