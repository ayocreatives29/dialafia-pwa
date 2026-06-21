/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Dish } from '../types';
import { INITIAL_DISH_DATABASE } from '../data/food-data';
import { Search, Filter, Plus, BookOpen, AlertCircle, Heart } from 'lucide-react';

interface FoodLibraryProps {
  onLogMeal: (dish: Dish, multiplier: number) => void;
}

export default function FoodLibrary({ onLogMeal }: FoodLibraryProps) {
  const [search, setSearch] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [wellnessLens, setWellnessLens] = useState<string>('all');
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});

  const regions = ['All', 'Diaspora', 'Efik', 'Ibibio', 'Yoruba', 'Igbo', 'Hausa', 'Delta/Ijaw', 'Bini', 'National'];

  const filteredDishes = useMemo(() => {
    return INITIAL_DISH_DATABASE.filter(dish => {
      // 1. Search Query
      const matchesSearch = 
        dish.name.toLowerCase().includes(search.toLowerCase()) ||
        dish.localNames.some(lName => lName.toLowerCase().includes(search.toLowerCase())) ||
        dish.description.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Region Filter
      if (selectedRegion !== 'All' && dish.region.toLowerCase() !== selectedRegion.toLowerCase()) {
        return false;
      }

      // 3. Wellness Lens Filter
      if (wellnessLens === 'leafy' && !dish.isLeafyVegHeavy) return false;
      if (wellnessLens === 'protein' && dish.macros.proteinG < 14) return false;
      if (wellnessLens === 'comfort' && dish.satietyIndex !== 'high') return false;
      if (wellnessLens === 'budget' && !dish.isBudgetFriendly) return false;
      if (wellnessLens === 'snack' && !dish.mealTypes.includes('snack')) return false;

      return true;
    });
  }, [search, selectedRegion, wellnessLens]);

  const handleMultiplierChange = (dishId: string, value: number) => {
    setMultipliers(prev => ({ ...prev, [dishId]: value }));
  };

  return (
    <div className="space-y-6">
      {/* library-controls */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 space-y-4">
        {/* Search header with bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search afang, suya, kokoro, agege, eba swallow, plantain chips..."
              className="w-full text-sm pl-11 pr-4 py-3 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50/20"
            />
          </div>

          <div>
            <select
              value={wellnessLens}
              onChange={(e) => setWellnessLens(e.target.value)}
              className="w-full text-sm px-3.5 py-3 rounded-2xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">👁️ All Wellness Lenses</option>
              <option value="leafy">🥬 Leafy & Greens-heavy</option>
              <option value="protein">🥩 Protein Forward (14g+)</option>
              <option value="comfort">🍲 Comfort High Satiety</option>
              <option value="budget">💰 Budget Friendly Options</option>
              <option value="snack">🍿 Snacks & Quick Bites</option>
            </select>
          </div>
        </div>

        {/* Region Chip Line */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-500 font-sans block uppercase tracking-wider">FILTER REGIONAL HERITAGE</label>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {regions.map(region => (
              <button
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer select-none ${
                  selectedRegion === region 
                    ? 'bg-emerald-800 text-white' 
                    : 'bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-800'
                }`}
              >
                {region === 'All' ? '🌍 All Regions' : region}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Database Grid */}
      <div id="library-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDishes.length === 0 ? (
          <div className="col-span-full py-16 bg-white/70 rounded-3xl border border-stone-200 text-center text-stone-500 font-sans p-6 space-y-2">
            <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
            <h4 className="font-semibold text-stone-800">No regional dishes found</h4>
            <p className="text-xs max-w-xs mx-auto">Try resetting your search parameter or looking at a different regional filter chip above.</p>
          </div>
        ) : (
          filteredDishes.map(dish => {
            const mult = multipliers[dish.id] || 1;
            return (
              <div 
                key={dish.id} 
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:border-emerald-600/50 hover:shadow-md transition duration-200 group relative"
              >
                {/* Premium Aspect-Ratio Food Cover Photo */}
                {dish.photoUrl && (
                  <div className="h-44 w-full overflow-hidden relative bg-stone-100">
                    <img 
                      src={dish.photoUrl} 
                      alt={dish.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    {/* Visual Accent Tags overlays */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {dish.isLeafyVegHeavy && (
                        <div className="bg-emerald-800/95 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                          <Heart className="w-2.5 h-2.5 fill-current" />
                          <span>Leafy Fibers</span>
                        </div>
                      )}
                      {dish.isBudgetFriendly && (
                        <div className="bg-stone-900/85 backdrop-blur-md text-white text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          💰 Budget Friendly
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border border-white/10 uppercase font-mono tracking-wider">
                      {dish.region}
                    </div>
                  </div>
                )}
                
                <div className="p-5 flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 shrink-0 text-2xl flex items-center justify-center select-none group-hover:scale-110 transition duration-300">
                    {dish.imageUrl}
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="text-sm font-semibold text-stone-900 truncate leading-tight group-hover:text-emerald-800 transition">{dish.name}</h4>
                    </div>
                    {dish.localNames.length > 0 && (
                      <p className="text-[11px] text-stone-400 font-medium italic truncate">Aliased: {dish.localNames.join(', ')}</p>
                    )}
                    <p className="text-xs text-stone-500 leading-normal line-clamp-2">{dish.description}</p>
                    
                    {/* Portion + Calorics Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-dashed border-stone-100 text-[11px] font-mono">
                      <div>
                        <span className="text-stone-400 block text-[9px]">CALORIES</span>
                        <strong className="text-stone-800">{Math.round(dish.calories * mult)} kcal</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px]">ENERGY</span>
                        <strong className="text-stone-500">{Math.round(dish.calories * mult * 4.184)} kJ</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px]">PROTEIN</span>
                        <strong className="text-stone-700">{Math.round(dish.macros.proteinG * mult)}g</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px]">CARBS / FAT</span>
                        <span className="text-stone-500 text-[10px]">{Math.round(dish.macros.carbsG * mult)}g / {Math.round(dish.macros.fatG * mult)}g</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom logger action block */}
                <div className="bg-stone-50/50 border-t border-stone-200/65 px-4 py-3 flex justify-between items-center gap-4 text-xs font-sans">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-stone-400 shrink-0 text-[11px]">Portion:</span>
                    <select
                      value={mult}
                      onChange={(e) => handleMultiplierChange(dish.id, Number(e.target.value))}
                      className="text-xs bg-white border border-stone-300 rounded-md px-1.5 py-0.5"
                    >
                      <option value="0.5">0.5 portion (Half scoop)</option>
                      <option value="1">1.0 portion (Standard cup)</option>
                      <option value="1.5">1.5 portion (Large plate)</option>
                      <option value="2">2.0 portion (Double serve)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => onLogMeal(dish, mult)}
                    className="flex items-center justify-center gap-1 py-1.5 px-3 bg-emerald-100 hover:bg-emerald-700 hover:text-white text-emerald-800 font-semibold rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Plate</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
