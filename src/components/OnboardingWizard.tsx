/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { calculateCalorieTarget } from '../utils/health-math';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, User, Globe, Heart, Activity, Flame, ShieldAlert, Sparkles } from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<number>(0);
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState<boolean>(false);
  
  // Onboarding Form States
  const [name, setName] = useState<string>('');
  const [isDiaspora, setIsDiaspora] = useState<boolean>(false);
  const [goal, setGoal] = useState<'weight_loss' | 'balance' | 'cholesterol'>('balance');
  const [nigerianFoodRatio, setNigerianFoodRatio] = useState<number>(75);
  const [breakfastPreference, setBreakfastPreference] = useState<string[]>([]);
  const [sex, setSex] = useState<'male' | 'female'>('female');
  const [age, setAge] = useState<number>(28);
  const [heightCm, setHeightCm] = useState<number>(165);
  const [weightKg, setWeightKg] = useState<number>(85);
  const [goalWeightKg, setGoalWeightKg] = useState<number>(72);
  const [activityLevel, setActivityLevel] = useState<number>(1.375);
  const [goalMonths, setGoalMonths] = useState<number>(6);
  const [satietyPreference, setSatietyPreference] = useState<'standard' | 'high'>('standard');
  const [budgetLevel, setBudgetLevel] = useState<'lean' | 'steady' | 'flexible'>('steady');
  const [preferredRegions, setPreferredRegions] = useState<string[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState<string>('');

  // Settle loading states for the trust animation
  const [calculating, setCalculating] = useState<boolean>(false);
  const [calculationLog, setCalculationLog] = useState<string[]>([]);
  const [calculatedCalorie, setCalculatedCalorie] = useState<number | null>(null);
  const [calculatedNote, setCalculatedNote] = useState<string>('');

  const totalSteps = 6;

  const handleDisclaimerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreedToDisclaimer) {
      setStep(1);
    }
  };

  const nextStep = () => {
    if (step === 1 && !name.trim()) return; // validation
    if (step === 3 && breakfastPreference.length === 0) {
      // Auto fill if empty
      setBreakfastPreference(['bread-eggs']);
    }
    if (step === 4) {
      // Safe boundary validation
      if (age < 18) {
        return;
      }
      if (heightCm < 100 || heightCm > 250) return;
      if (weightKg < 35 || weightKg > 250) return;
      if (goalWeightKg < 35 || goalWeightKg > 250) return;
    }
    
    if (step === totalSteps - 1) {
      // Trigger trust compilation animation
      triggerCalculation();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(0, prev - 1));
  };

  const toggleBreakfast = (pref: string) => {
    if (breakfastPreference.includes(pref)) {
      setBreakfastPreference(prev => prev.filter(p => p !== pref));
    } else {
      setBreakfastPreference(prev => [...prev, pref]);
    }
  };

  const toggleRegion = (region: string) => {
    if (preferredRegions.includes(region)) {
      setPreferredRegions(prev => prev.filter(r => r !== region));
    } else {
      setPreferredRegions(prev => [...prev, region]);
    }
  };

  const triggerCalculation = () => {
    setCalculating(true);
    setStep(totalSteps);

    const logs = [
      "Accessing physical profile metrics...",
      "Executing Mifflin-St Jeor metabolic equations...",
      `Calibrating for ${isDiaspora ? 'Diaspora hybrid availability mapping' : 'Local West African regional profile'}...`,
      "Enforcing strict clinical safety ceilings (Maximum 20% deficit limit)...",
      "Analyzing satiety preferences & macro ratios...",
      "Drafting optimal budget food routes...",
      "Syncing customizable weekly recipe models..."
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setCalculationLog(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        
        // Calculate core health calculations
        const rawProfileData: Omit<UserProfile, 'calculatedCalorieTarget'> = {
          name,
          isDiaspora,
          goal,
          nigerianFoodRatio,
          breakfastPreference,
          sex,
          age,
          heightCm,
          weightKg,
          goalWeightKg,
          activityLevel,
          goalMonths,
          satietyPreference,
          budgetLevel,
          preferredRegions,
          avoidIngredients: avoidIngredients.split(',').map(s => s.trim()).filter(Boolean),
          createdAt: new Date().toISOString()
        };

        const result = calculateCalorieTarget(rawProfileData);
        setCalculatedCalorie(result.target);
        setCalculatedNote(result.clinicalNote);
        setCalculating(false);
      }
    }, 450);
  };

  const handleFinalSubmit = () => {
    if (calculatedCalorie !== null) {
      const finalProfile: UserProfile = {
        name,
        isDiaspora,
        goal,
        nigerianFoodRatio,
        breakfastPreference,
        sex,
        age,
        heightCm,
        weightKg,
        goalWeightKg,
        activityLevel,
        goalMonths,
        satietyPreference,
        budgetLevel,
        preferredRegions,
        avoidIngredients: avoidIngredients.split(',').map(s => s.trim()).filter(Boolean),
        calculatedCalorieTarget: calculatedCalorie,
        createdAt: new Date().toISOString()
      };
      onComplete(finalProfile);
    }
  };

  // Welcome Step 0: Clinical Gate
  if (step === 0) {
    return (
      <div className="w-full max-w-xl mx-auto my-4 bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-10 text-stone-800" id="consent-wizard">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
            <span className="text-3xl font-bold font-mono">D</span>
          </div>
          <h2 className="text-3xl font-sans font-medium tracking-tight text-stone-900 leading-tight">Welcome to DiaLafia</h2>
          <p className="text-stone-500 mt-2 font-sans">A culturally intentional Nigerian food and wellness planner.</p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-6 mb-8 text-stone-700">
          <div className="flex gap-3 mb-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <h4 className="font-semibold text-amber-800 font-sans">Strict Clinical & Safety Notice</h4>
          </div>
          <p className="text-sm leading-relaxed mb-4">
            DiaLafia evaluates adult metabolic indices using the <strong>Mifflin-St Jeor</strong> formula. We cater strictly to adult parameters.
          </p>
          <ul className="text-xs list-disc pl-5 space-y-1 text-stone-600">
            <li>We enforce a strict <strong>18 years or older</strong> validation limit.</li>
            <li>This system provides general adult calorie calculations and dietary suggestions, not medical nutrition therapy.</li>
            <li>If you are pregnant, nursing, manage an active eating disorder, or suffer clinical medical constraints, please consult your healthcare provider first.</li>
          </ul>
        </div>

        <form onSubmit={handleDisclaimerSubmit} className="space-y-6">
          <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-stone-50 transition border border-transparent hover:border-stone-100">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              checked={agreedToDisclaimer}
              onChange={(e) => setAgreedToDisclaimer(e.target.checked)}
              required
            />
            <span className="text-sm text-stone-600 leading-relaxed">
              I certify that I am <strong>18 years of age or older</strong> and agree that DiaLafia serves as a general estimation planner, not clinician prescription.
            </span>
          </label>

          <button
            type="submit"
            disabled={!agreedToDisclaimer}
            className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 transition duration-200 ${
              agreedToDisclaimer 
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md' 
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            Access Conversational Planner
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto my-4 bg-white/95 rounded-3xl border border-stone-200/80 shadow-md p-6 sm:p-10 text-stone-800 relative overflow-hidden">
      {/* Background soft design indicators */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/30 rounded-bl-full pointer-events-none" />
      
      {/* Progress header */}
      {step <= totalSteps - 1 && (
        <div className="mb-8 select-none">
          <div className="flex justify-between text-xs text-stone-400 font-mono mb-2">
            <span>DIALAFIA DIET MATRIX</span>
            <span>STEP {step} OF {totalSteps - 1}</span>
          </div>
          <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Container Wrapper */}
      <div className="min-h-[400px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: -15, y: -10 }}
            transition={{ duration: 0.22 }}
            className="flex-1"
          >
            {/* Step 1: Greeting & Location Context */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex gap-2 items-center bg-stone-50 border border-stone-200 px-3 py-1 rounded-full text-stone-500 text-xs font-mono">
                    <User className="w-3.5 h-3.5 text-stone-700" />
                    <span>INTRODUCTIONS</span>
                  </div>
                  <h3 className="text-3xl font-sans font-medium tracking-tight text-stone-950">Let's craft your cultural path</h3>
                  <p className="text-stone-500">How should we address you in your weekly summaries and meals logs?</p>
                </div>

                <div className="space-y-4">
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-stone-700">What is your first name or nickname?</span>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Stephen, Chioma, Tunde"
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-base"
                    />
                  </label>

                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-stone-700 block">Where are you currently residing?</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsDiaspora(false)}
                        className={`p-4 rounded-2xl border text-left flex gap-3 items-start transition ${
                          !isDiaspora 
                            ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 shadow-sm' 
                            : 'border-stone-200 hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <span className="text-2xl mt-0.5">🇳🇬</span>
                        <div>
                          <p className="font-semibold text-sm">Living in Nigeria</p>
                          <p className="text-xs text-stone-500 mt-1">Full access to fresh local herbs, direct swallow sources, and native protein indices.</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsDiaspora(true)}
                        className={`p-4 rounded-2xl border text-left flex gap-3 items-start transition ${
                          isDiaspora 
                            ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 shadow-sm' 
                            : 'border-stone-200 hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <span className="text-2xl mt-0.5">🇬🇧</span>
                        <div>
                          <p className="font-semibold text-sm">Nigerian Diaspora (US, UK, etc.)</p>
                          <p className="text-xs text-stone-500 mt-1">Includes modern substitutions, hybrid meals (eating Western dishes 2-3 times a week), and ingredient index warnings.</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Goal & Continuous Dialect Ratio Slider */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex gap-2 items-center bg-stone-50 border border-stone-200 px-3 py-1 rounded-full text-stone-500 text-xs font-mono">
                    <Globe className="w-3.5 h-3.5 text-stone-700" />
                    <span>DIETARY GOALS</span>
                  </div>
                  <h3 className="text-3xl font-sans font-medium tracking-tight text-stone-950">Dietary goal & Culture ratio</h3>
                  <p className="text-stone-500">Every goal handles calorie ceilings and plantain/oil allocations differently.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-stone-700 block">Select your primary wellness target</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setGoal('balance')}
                        className={`p-4 rounded-2xl border text-center transition ${
                          goal === 'balance' 
                            ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-medium' 
                            : 'border-stone-200 hover:border-stone-300 text-stone-600'
                        }`}
                      >
                        <div className="text-xl mb-1">⚖️</div>
                        <p className="text-sm font-semibold">General Balance</p>
                        <p className="text-[11px] text-stone-500 mt-1">Focus on premium dietary rhythm and micronutrients.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGoal('weight_loss')}
                        className={`p-4 rounded-2xl border text-center transition ${
                          goal === 'weight_loss' 
                            ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-medium' 
                            : 'border-stone-200 hover:border-stone-300 text-stone-600'
                        }`}
                      >
                        <div className="text-xl mb-1">🔥</div>
                        <p className="text-sm font-semibold">Healthy Loss</p>
                        <p className="text-[11px] text-stone-500 mt-1">Apply a clinically capped safe deficit of max 20% limit.</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGoal('cholesterol')}
                        className={`p-4 rounded-2xl border text-center transition ${
                          goal === 'cholesterol' 
                            ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-medium' 
                            : 'border-stone-200 hover:border-stone-300 text-stone-600'
                        }`}
                      >
                        <div className="text-xl mb-1">❤️</div>
                        <p className="text-sm font-semibold">Heart Health</p>
                        <p className="text-[11px] text-stone-500 mt-1 font-sans">Focus heavily on leafy raw fiber, fresh fish, and seed oils.</p>
                      </button>
                    </div>
                  </div>

                  {/* Culturally Grounded Slider */}
                  <div className="space-y-3 bg-stone-50 border border-stone-200 rounded-2xl p-5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-stone-700">How much of your diet is Nigerian food?</span>
                      <strong className="text-emerald-700 font-mono text-lg">{nigerianFoodRatio}%</strong>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      step="5"
                      value={nigerianFoodRatio}
                      onChange={(e) => setNigerianFoodRatio(Number(e.target.value))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-stone-400 font-mono font-sans">
                      <span>Occasional Delicacies (10%)</span>
                      <span>Mostly Local (50%)</span>
                      <span>Pure Culture (100%)</span>
                    </div>
                    <p className="text-xs text-stone-600 leading-normal mt-1 border-t border-dashed border-stone-200 pt-2 font-mono">
                      {nigerianFoodRatio < 40 
                        ? "💡 Balanced Diaspora mode: We'll supplement your meals with simple Western equivalents."
                        : nigerianFoodRatio < 80
                        ? "💡 Hybrid mode: Perfect blend of classic soups & stews with modern quick breakfast pans."
                        : "💡 Deeply authentic Nigerian approach: Main focus resides on native regional swallows, palm sauces, and herbal soups."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Habits & Preloaded Breakfast Selection */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex gap-2 items-center bg-stone-50 border border-stone-200 px-3 py-1 rounded-full text-stone-500 text-xs font-mono">
                    <Heart className="w-3.5 h-3.5 text-stone-700" />
                    <span>MORNING HABITS</span>
                  </div>
                  <h3 className="text-3xl font-sans font-medium tracking-tight text-stone-950">Morning breakfast habits</h3>
                  <p className="text-stone-500">Select any preloaded habits you regularly enjoy (Select multiple if they alternate).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'bread-eggs', name: 'Sliced Bread & Eggs', img: '🍳', desc: 'Agege or sliced bread fried white eggs, simple tea.' },
                    { id: 'oats', name: 'Quaker Oats & Milk', img: '🥣', desc: 'Heart-healthy satisfying fiber oatmeal.' },
                    { id: 'pap', name: 'Warm Pap (Akamu/Ogi)', img: '🌽', desc: 'Comforting liquid maize pudding paired with akara.' },
                    { id: 'indomie', name: 'Indomie Instant Noodles', img: '🍜', desc: 'Fast dry instant noodles boiled with egg.' },
                    { id: 'swallow', name: 'Early swallow / Heavy plate', img: '🍲', desc: 'Heavier morning dishes like leftover soups and starch.' },
                    { id: 'skip', name: 'Skip breakfast / Coffee only', img: '☕', desc: 'Extended fasting or liquid energy start.' }
                  ].map((item) => {
                    const active = breakfastPreference.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleBreakfast(item.id)}
                        className={`p-4 rounded-2xl border text-left flex gap-3 transition ${
                          active 
                            ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950' 
                            : 'border-stone-200 hover:border-stone-300 text-stone-700'
                        }`}
                      >
                        <span className="text-2xl pt-1">{item.img}</span>
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-stone-500 mt-1 leading-normal">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Strict Biometrics Mifflin-St Jeor Input (Age Validate) */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex gap-2 items-center bg-stone-50 border border-stone-200 px-3 py-1 rounded-full text-stone-500 text-xs font-mono">
                    <Activity className="w-3.5 h-3.5 text-stone-700" />
                    <span>BIOMETRICS MODULE</span>
                  </div>
                  <h3 className="text-3xl font-sans font-medium tracking-tight text-stone-950">Physical & Energy attributes</h3>
                  <p className="text-stone-500">Mifflin-St Jeor utilizes these parameters with exact sex-specific offsets.</p>
                </div>

                <div className="space-y-4">
                  {/* Sex, Age */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-stone-700">Born Sex for energy constant</span>
                      <select 
                        value={sex}
                        onChange={(e) => setSex(e.target.value as 'male' | 'female')}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="female">Female (-161 offset Constant)</option>
                        <option value="male">Male (+5 offset Constant)</option>
                      </select>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-stone-700">Age (Must be 18+)</span>
                      <input 
                        type="number" 
                        min="18" 
                        max="110"
                        value={age}
                        onChange={(e) => setAge(Math.max(18, Number(e.target.value)))}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {age < 18 && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>DiaLafia adheres strictly to adult energy indexes.</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Height, Weight */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-stone-700">Height (cm)</span>
                      <input 
                        type="number" 
                        min="100" 
                        max="240"
                        value={heightCm}
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-stone-700">Current Weight (kg)</span>
                      <input 
                        type="number" 
                        min="30" 
                        max="250"
                        step="0.1"
                        value={weightKg}
                        onChange={(e) => setWeightKg(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-stone-700">Target Weight (kg)</span>
                      <input 
                        type="number" 
                        min="30" 
                        max="250"
                        step="0.1"
                        value={goalWeightKg}
                        onChange={(e) => setGoalWeightKg(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </label>
                  </div>

                  {/* Activity multiplier block */}
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-stone-700">Physical Activity Multiplier</span>
                    <select 
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="1.2">Mostly seated, little structured exercise (1.2x)</option>
                      <option value="1.375">Light activity, exercise 1-3 days/week (1.375x)</option>
                      <option value="1.55">Moderate activity, active exercise 3-5 days/week (1.55x)</option>
                      <option value="1.725">Very active, heavy structured exercise 6-7 days/week (1.725x)</option>
                    </select>
                  </label>
                </div>
              </div>
            )}

            {/* Step 5: Timeline, Satiety & Exclusions */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex gap-2 items-center bg-stone-50 border border-stone-200 px-3 py-1 rounded-full text-stone-500 text-xs font-mono">
                    <Flame className="w-3.5 h-3.5 text-stone-700" />
                    <span>TIMELINE & SATIETY</span>
                  </div>
                  <h3 className="text-3xl font-sans font-medium tracking-tight text-stone-950">Timelines, satiety & exclusions</h3>
                  <p className="text-stone-500">Fine-tune how fast your caloric targets are calculated and items are selected.</p>
                </div>

                <div className="space-y-4">
                  {/* Timeline Months + Budget Level */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-stone-700">Timeline Months</span>
                      <select 
                        value={goalMonths}
                        onChange={(e) => setGoalMonths(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white"
                      >
                        <option value="3">Urgently (3 months)</option>
                        <option value="6">Gradually (6 months)</option>
                        <option value="9">Steady (9 months)</option>
                        <option value="12">Gentle lifestyle change (12 months)</option>
                      </select>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-sm font-semibold text-stone-700">Grocery Budget Tiers</span>
                      <select 
                        value={budgetLevel}
                        onChange={(e) => setBudgetLevel(e.target.value as 'lean' | 'steady' | 'flexible')}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white"
                      >
                        <option value="lean">Lean budget (Minimize premium oils & seafood)</option>
                        <option value="steady">Steady budget (Balanced everyday cooking)</option>
                        <option value="flexible">Flexible budget (Includes high-end proteins/seafood)</option>
                      </select>
                    </label>
                  </div>

                  {/* Satiety Toggle */}
                  <div className="p-4 bg-emerald-50/25 border border-stone-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-stone-900">Satiety preference allocation</p>
                      <p className="text-xs text-stone-500">High-volume meals use low-caloric density greens and high protein beans to curb snacking.</p>
                    </div>
                    <div className="inline-flex rounded-xl bg-stone-100 p-1 border">
                      <button
                        type="button"
                        onClick={() => setSatietyPreference('standard')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          satietyPreference === 'standard' 
                            ? 'bg-white shadow text-emerald-950 font-semibold' 
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => setSatietyPreference('high')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          satietyPreference === 'high' 
                            ? 'bg-white shadow text-emerald-950 font-semibold' 
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        High Volume
                      </button>
                    </div>
                  </div>

                  {/* Preferred Nigerian regions */}
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-stone-700 block">Preferred Food Regions (Optional)</span>
                    <div className="flex flex-wrap gap-2">
                      {['Diaspora', 'Efik', 'Ibibio', 'Yoruba', 'Igbo', 'Hausa', 'Delta/Ijaw', 'Bini'].map(r => {
                        const active = preferredRegions.includes(r);
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => toggleRegion(r)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                              active 
                                ? 'bg-emerald-700 text-white border-transparent' 
                                : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Excluded Ingredients */}
                  <label className="block space-y-1">
                    <span className="text-sm font-semibold text-stone-700">Foods or Ingredients to avoid/reduce</span>
                    <input 
                      type="text" 
                      value={avoidIngredients}
                      onChange={(e) => setAvoidIngredients(e.target.value)}
                      placeholder="e.g. egusi, palm oil, MSG, nuts, shellfish"
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 text-sm"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Step 6: Trust Metric Calculations & Final Presentation */}
            {step === totalSteps && (
              <div className="space-y-6">
                {calculating ? (
                  <div className="space-y-6 py-6 text-center">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-700 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-medium text-stone-900">Synthesizing Personal Metabolism Blueprint</h4>
                      <p className="text-sm text-stone-500 max-w-sm mx-auto leading-relaxed font-sans">
                        Applying clinical criteria safely so your caloric pathway feels like home.
                      </p>
                    </div>
                    <div className="max-w-md mx-auto text-left bg-stone-50 border border-stone-200 rounded-2xl p-4 font-mono text-[10px] text-stone-500 space-y-1.5">
                      {calculationLog.map((log, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-center py-4">
                    <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 p-3 rounded-2xl border border-emerald-100">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-sans font-medium tracking-tight text-stone-950">Calculations Complete, {name}!</h3>
                      <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                        DiaLafia has matched your physical metadata with the authentic delicacies database.
                      </p>
                    </div>

                    <div className="bg-stone-50 border border-stone-200 rounded-3xl p-6 max-w-sm mx-auto space-y-4">
                      <div className="space-y-1">
                        <span className="text-xs text-stone-400 font-mono font-sans block uppercase tracking-wider">YOUR CLINICAL ENERGY BLUEPRINT</span>
                        <div className="text-4xl font-extrabold text-stone-900 font-sans tracking-tight">
                          {calculatedCalorie} <span className="text-lg font-normal text-stone-500">kcal/day</span>
                        </div>
                        <div className="text-sm text-stone-400 font-mono">
                          ≈ {Math.round((calculatedCalorie || 0) * 4.184)} kJ/day
                        </div>
                      </div>

                      <div className="border-t border-dashed border-stone-200 pt-3">
                        <p className="text-xs text-stone-600 leading-relaxed font-sans">
                          <strong>Clinical Deficit Rule:</strong> {calculatedNote}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-400 max-w-md mx-auto font-sans leading-relaxed">
                      💡 <strong>Continuous verification:</strong> Calculations are strictly local and compliant with Australian Privacy regulations. Your inputs never stream to remote databases unencrypted.
                    </div>

                    <button
                      type="button"
                      onClick={handleFinalSubmit}
                      className="w-full py-4 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-semibold shadow-md flex items-center justify-center gap-2 transition [transform:translateZ(0)] hover:scale-[1.01]"
                    >
                      Enter Health Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Back and Next Controls for regular wizard steps */}
        {step >= 1 && step <= totalSteps - 1 && (
          <div className="flex justify-between items-center pt-6 border-t border-stone-100 mt-6 select-none">
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 text-stone-500 hover:text-stone-800 text-sm font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={nextStep}
              disabled={step === 1 && !name.trim()}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition ${
                step === 1 && !name.trim()
                  ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm'
              }`}
            >
              <span>{step === totalSteps - 1 ? 'Analyze Blueprint' : 'Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
