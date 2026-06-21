/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, MealLogItem, Dish } from './types';
import OnboardingWizard from './components/OnboardingWizard';
import FoodLibrary from './components/FoodLibrary';
import MealLogger from './components/MealLogger';
import TextAssist from './components/TextAssist';
import WeeklyPlanner from './components/WeeklyPlanner';
import ProgressCharts from './components/ProgressCharts';
import PWAStatus from './components/PWAStatus';
import { INITIAL_DISH_DATABASE } from './data/food-data';
import { calculateStreak, getStreakMilestone } from './utils/health-math';
import { 
  BarChart3, 
  BookOpen, 
  CalendarRange, 
  Flame, 
  Heart, 
  LayoutDashboard, 
  RotateCcw, 
  Activity,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  Award
} from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mealLogs, setMealLogs] = useState<MealLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'planner' | 'progress'>('dashboard');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Unified persistent loaders
  useEffect(() => {
    const savedProfile = localStorage.getItem('dialafia_profile_v1');
    const savedLogs = localStorage.getItem('dialafia_meal_logs_v1');
    
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed loading saved profile", e);
      }
    }
    if (savedLogs) {
      try {
        setMealLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Failed loading saved meal logs", e);
      }
    }
  }, []);

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('dialafia_profile_v1', JSON.stringify(newProfile));
    setActiveTab('dashboard');
  };

  const handleResetProfile = () => {
    setProfile(null);
    setMealLogs([]);
    localStorage.removeItem('dialafia_profile_v1');
    localStorage.removeItem('dialafia_meal_logs_v1');
    setShowResetConfirm(false);
  };

  const handleAddMealLog = (dish: Dish, multiplier: number) => {
    const targetDate = new Date().toISOString().split('T')[0];
    
    const newLogItem: MealLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dishId: dish.id,
      dishName: dish.name,
      calories: Math.round(dish.calories * multiplier),
      macros: {
        proteinG: Math.round(dish.macros.proteinG * multiplier),
        carbsG: Math.round(dish.macros.carbsG * multiplier),
        fatG: Math.round(dish.macros.fatG * multiplier),
        fiberG: Math.round(dish.macros.fiberG * multiplier),
      },
      portionMultiplier: multiplier,
      loggedAt: targetDate,
      mealType: dish.mealTypes[0] || 'lunch'
    };

    const updatedLogs = [newLogItem, ...mealLogs];
    setMealLogs(updatedLogs);
    localStorage.setItem('dialafia_meal_logs_v1', JSON.stringify(updatedLogs));
  };

  const handleDirectAddLog = (
    dishId: string, 
    multiplier: number, 
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink', 
    dateStr: string
  ) => {
    // Find the dish in catalog
    const dish = INITIAL_DISH_DATABASE.find((d: Dish) => d.id === dishId);
    if (!dish) return;

    const newLogItem: MealLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dishId: dish.id,
      dishName: dish.name,
      calories: Math.round(dish.calories * multiplier),
      macros: {
        proteinG: Math.round(dish.macros.proteinG * multiplier),
        carbsG: Math.round(dish.macros.carbsG * multiplier),
        fatG: Math.round(dish.macros.fatG * multiplier),
        fiberG: Math.round(dish.macros.fiberG * multiplier),
      },
      portionMultiplier: multiplier,
      loggedAt: dateStr,
      mealType: mealType
    };

    const updatedLogs = [newLogItem, ...mealLogs];
    setMealLogs(updatedLogs);
    localStorage.setItem('dialafia_meal_logs_v1', JSON.stringify(updatedLogs));
  };

  const handleRemoveMealLog = (id: string) => {
    const updated = mealLogs.filter(f => f.id !== id);
    setMealLogs(updated);
    localStorage.setItem('dialafia_meal_logs_v1', JSON.stringify(updated));
  };

  // Compute daily totals for current day
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayLogs = mealLogs.filter(item => item.loggedAt === todayDateStr);
  
  const todayCalories = todayLogs.reduce((acc, item) => acc + item.calories, 0);
  const todayKj = Math.round(todayCalories * 4.184);
  const todayProtein = todayLogs.reduce((acc, item) => acc + item.macros.proteinG, 0);

  // If user is not onboarded, show the conversational wizard
  if (!profile) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col justify-center py-10 px-4 font-sans antialiased text-stone-800 bg-[#FAF9F5]">
        <PWAStatus />
        <header className="text-center mb-6">
          <div className="brand-lockup flex items-center justify-center gap-2">
            <span className="text-3xl font-extrabold font-display text-emerald-900 tracking-tight">DiaLafia</span>
          </div>
          <p className="text-xs font-mono font-medium text-stone-400 mt-1 uppercase tracking-widest">Culture • Balance • Accuracy</p>
        </header>

        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  // Config target variables
  const calorieTarget = profile.calculatedCalorieTarget;
  const targetKj = Math.round(calorieTarget * 4.184);
  const percentUsed = calorieTarget > 0 ? Math.min(100, Math.round((todayCalories / calorieTarget) * 100)) : 0;
  const remainingCals = Math.max(0, calorieTarget - todayCalories);

  // Consistency Streak tracking
  const streakInfo = calculateStreak(mealLogs, calorieTarget);
  const milestone = getStreakMilestone(streakInfo.currentStreak);

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-stone-800 font-sans antialiased flex flex-col pb-24 lg:pb-6">
      <PWAStatus />
      
      {/* 1. Brand Shell Header */}
      <header className="bg-stone-900 text-stone-100 py-5 px-4 sm:px-8 shadow-md relative overflow-hidden">
        {/* Soft native background illustration mask */}
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-800/10 rounded-l-full pointer-events-none blur-3xl" />

        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold font-display text-emerald-400 tracking-tight select-none">DiaLafia</span>
              <span className="bg-emerald-950 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-800 uppercase tracking-widest font-mono">MVP</span>
            </div>
            <p className="text-xs text-stone-400 font-sans leading-none">
              Welcome back, <strong>{profile.name}</strong> • {profile.isDiaspora ? '🌍 Diaspora Hub' : '🇳🇬 Local Hub'}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-600 select-none cursor-pointer shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Register New User</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main content router */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Tab content renderer */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Quick Metrics Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Daily Energy intake */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-stone-400 block text-[10px] font-mono font-medium uppercase tracking-wider">DAILY CALORIE BUDGET</span>
                  <div className="text-3xl font-extrabold text-stone-900 font-sans">
                    {todayCalories} <span className="text-sm font-normal text-stone-400">/ {calorieTarget} kcal</span>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    ≈ {todayKj} / {targetKj} kJ
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${percentUsed > 100 ? 'bg-rose-500' : 'bg-emerald-700'}`}
                      style={{ width: `${percentUsed}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-medium text-stone-400 font-sans">
                    <span>{percentUsed}% Used</span>
                    <span>{remainingCals} kcal remaining</span>
                  </div>
                </div>
              </div>

              {/* Satiety preference, target goal indices */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-stone-400 block text-[10px] font-mono font-medium uppercase tracking-wider">ACTIVE GOAL STRATEGY</span>
                  <div className="text-xl font-bold text-stone-800 font-sans mt-1 capitalize leading-snug">
                    {profile.goal === 'weight_loss' ? '🎯 Weight Loss' : profile.goal === 'cholesterol' ? '❤️ Cardio Support' : '⚖️ Health Balance'}
                  </div>
                  <p className="text-[11px] text-stone-500 font-sans mt-1 leading-normal">
                    Deficit check: <strong>Max 20% limit</strong> applied for medical safety automatically.
                  </p>
                </div>

                {/* mini milestone status link */}
                <div className="border-t border-dashed border-stone-100 pt-3 flex justify-between items-center text-xs">
                  <span className="text-stone-400 font-medium">Satiety filter:</span>
                  <strong className="text-emerald-800 uppercase font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    {profile.satietyPreference === 'high' ? 'High Volume' : 'Standard'}
                  </strong>
                </div>
              </div>

              {/* Consistency Streak Badge */}
              <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 flex flex-col justify-between relative overflow-hidden">
                {streakInfo.currentStreak > 0 && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full pointer-events-none blur-xl animate-pulse" />
                )}
                <div className="space-y-1 z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 block text-[10px] font-mono font-medium uppercase tracking-wider">CONSISTENCY STREAK</span>
                    {streakInfo.currentStreak > 0 ? (
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-stone-900 font-sans">
                      {streakInfo.currentStreak}
                    </span>
                    <span className="text-xs font-semibold text-stone-500 font-sans">
                      {streakInfo.currentStreak === 1 ? 'day' : 'days'}
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-xl border ${milestone.color}`}>
                      <span>{milestone.icon}</span>
                      <span>{milestone.title}</span>
                    </span>
                  </div>
                </div>

                <div className="border-t border-dashed border-stone-100 pt-3 flex flex-col gap-1.5 mt-3 text-xs z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 font-semibold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-stone-400" /> Best Record:
                    </span>
                    <strong className="text-stone-800 font-sans">
                      {streakInfo.bestStreak} {streakInfo.bestStreak === 1 ? 'day' : 'days'}
                    </strong>
                  </div>
                  
                  {/* Miniature explanation on target met status */}
                  <div className="text-[9px] text-stone-400 leading-none mt-0.5">
                    Success zone: 80% to 105% of budget.
                  </div>
                </div>
              </div>

              {/* Meals logged status summary */}
              <div className="bg-[#052E16] text-stone-100 rounded-3xl p-5 flex flex-col justify-between">
                <div className="space-y-1">
                  <span className="text-emerald-400 block text-[10px] font-mono font-medium uppercase tracking-wider">PLATE TRACKING RUNNING TOTAL</span>
                  <div className="text-3xl font-extrabold font-sans">
                    {todayLogs.length} <span className="text-sm font-normal text-emerald-300">dishes</span>
                  </div>
                  <p className="text-[11px] text-emerald-100/85 mt-2 font-sans select-none leading-relaxed font-sans">
                    {todayCalories === 0 
                      ? 'No dishes tracked today. Describe your breakfast, lunch or snack above!'
                      : todayCalories > calorieTarget 
                      ? '💡 Over energy target segment. We suggest pairing dinner with a light zobo drink or skipped snacks.'
                      : '💡 Clean energy metrics tracker. Carry on with your home plate logging!'}
                  </p>
                </div>
              </div>
            </div>

            {/* Core Logger and Matchers Segment */}
            <div className="space-y-6">
              
              {/* Description match assist and running logging totals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Visual assistant match form */}
                <div className="md:col-span-1">
                  <TextAssist onLogMeal={handleAddMealLog} />
                </div>
                
                {/* Unified manual log & history list */}
                <div className="md:col-span-2">
                  <MealLogger 
                    logs={mealLogs} 
                    onAddLog={handleDirectAddLog} 
                    onRemoveLog={handleRemoveMealLog} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <FoodLibrary onLogMeal={handleAddMealLog} />
        )}

        {activeTab === 'planner' && (
          <WeeklyPlanner profile={profile} />
        )}

        {activeTab === 'progress' && (
          <ProgressCharts profile={profile} logs={mealLogs} />
        )}

      </main>

      {/* 3. High contrast responsive bottom-navigation drawer */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 py-3 px-4 shadow-xl z-50 select-none">
        <div className="max-w-md mx-auto flex justify-around items-center">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'dashboard' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-semibold font-sans">Eats Log</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'library' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-semibold font-sans">Delicacies</span>
          </button>

          <button
            onClick={() => setActiveTab('planner')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'planner' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <CalendarRange className="w-5 h-5" />
            <span className="text-[10px] font-semibold font-sans">Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`flex flex-col items-center gap-1 transition ${
              activeTab === 'progress' ? 'text-emerald-700' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-semibold font-sans">Progress</span>
          </button>

        </div>
      </nav>

      {/* Elegant State-based Custom Registration/Reset Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-md w-full p-6 sm:p-8 text-stone-800 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto text-xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-stone-900 font-sans tracking-tight">Register as a New User?</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-sans">
                This action will wipe your current DiaLafia profile and logged meal history permanently from this device so you can start clean registration steps.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-semibold text-sm transition"
              >
                Keep Current Profile
              </button>
              <button
                onClick={handleResetProfile}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm transition shadow-sm"
              >
                Yes, Register New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
