/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dish } from '../types';
import { INITIAL_DISH_DATABASE } from '../data/food-data';
import { Search, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface TextAssistProps {
  onLogMeal: (dish: Dish, multiplier: number) => void;
}

export default function TextAssist({ onLogMeal }: TextAssistProps) {
  const [description, setDescription] = useState<string>('');
  const [leaningRegion, setLeaningRegion] = useState<string>('all');
  const [matches, setMatches] = useState<Dish[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1);

  const handleSmartSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setMatches([]);
      setSearched(false);
      return;
    }

    const queries = description.toLowerCase().split(/[\s,]+/);
    
    // Perform simple score based search against database
    const scoredDishes = INITIAL_DISH_DATABASE.map(dish => {
      let score = 0;
      
      // Match against region
      if (leaningRegion !== 'all' && dish.region.toLowerCase() === leaningRegion.toLowerCase()) {
        score += 2;
      }

      // Check queries terms against name, localNames, description
      queries.forEach(term => {
        if (!term || term.length < 2) return;
        
        if (dish.name.toLowerCase().includes(term)) score += 5;
        if (dish.description.toLowerCase().includes(term)) score += 3;
        
        dish.localNames.forEach(localName => {
          if (localName.toLowerCase().includes(term)) score += 6;
        });

        // specific ingredients trigger match overrides
        if (term === 'swallow' && (dish.name.includes('Swallow') || dish.name.includes('Swallow') || dish.description.toLowerCase().includes('eba') || dish.description.toLowerCase().includes('starch') || dish.description.toLowerCase().includes('garri') || dish.description.toLowerCase().includes('amala') || dish.description.toLowerCase().includes('pounded yam'))) {
          score += 4;
        }

        if (term === 'soup' && dish.name.toLowerCase().includes('soup')) {
          score += 3;
        }

        if (term === 'vegetable' || term === 'leaf' || term === 'leafy' || term === 'greens') {
          if (dish.isLeafyVegHeavy) score += 4;
        }

        if ((term === 'egg' || term === 'eggs') && (dish.allergens.includes('eggs') || dish.name.toLowerCase().includes('egg'))) {
          score += 4;
        }
      });

      return { dish, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

    setMatches(scoredDishes.map(item => item.dish).slice(0, 4));
    setSearched(true);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-6 space-y-4">
      <div className="flex gap-2.5 items-start">
        <div className="p-2 h-10 w-10 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-emerald-700" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-stone-900 font-sans leading-tight">Meal description assist</h4>
          <p className="text-xs text-stone-500 mt-1">
            Describe your plate or ingredients to find authentic matches instantly.
          </p>
        </div>
      </div>

      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-[11px] text-stone-600 leading-relaxed flex gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>Photo Assist Notice:</strong> DiaLafia matches descriptions using advanced text mining. Real camera-based computer vision is slated for Sprint 4.
        </div>
      </div>

      <form onSubmit={handleSmartSearch} className="space-y-3.5">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-stone-700">What is on your plate?</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. fried eggs with soft bread, or afang soup accompanied by smooth eba swallow"
            className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-800 bg-stone-50/50"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-stone-700">Leaning Region</span>
            <select
              value={leaningRegion}
              onChange={(e) => setLeaningRegion(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-300 bg-white"
            >
              <option value="all">Any Region</option>
              <option value="efik">Efik cooking</option>
              <option value="ibibio">Ibibio cooking</option>
              <option value="yoruba">Yoruba cooking</option>
              <option value="igbo">Igbo cooking</option>
              <option value="hausa">Hausa cooking</option>
              <option value="delta/ijaw">Delta/Ijaw cooking</option>
              <option value="bini">Bini cooking</option>
              <option value="national">National favorites</option>
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-stone-700">Multiplier Servings</span>
            <select
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="w-full text-xs px-2.5 py-2 rounded-xl border border-stone-300 bg-white"
            >
              <option value="0.5">Half portion (0.5x)</option>
              <option value="1">Standard home plate (1x)</option>
              <option value="1.5">Large portion (1.5x)</option>
              <option value="2">Double portion (2x)</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Search className="w-4 h-4" />
          Find Likely Matches
        </button>
      </form>

      {/* Match Results */}
      {searched && (
        <div className="space-y-2.5 border-t border-dashed border-stone-200 pt-3.5">
          <span className="text-xs font-semibold text-stone-500 font-sans block uppercase tracing-tight">LATEST SUGGESTED DELICACIES</span>
          
          {matches.length === 0 ? (
            <p className="text-xs text-stone-400 py-2 italic">No matches found. Try describing with words like &quot;suya&quot;, &quot;afang&quot;, &quot;swallow&quot;, or &quot;eggs&quot;.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {matches.map(dish => (
                <div 
                  key={dish.id} 
                  className="flex justify-between items-center bg-stone-50 border border-stone-200 p-2.5 rounded-xl hover:border-emerald-500 transition group"
                >
                  <div className="flex gap-2 items-center">
                    <span className="text-xl">{dish.imageUrl}</span>
                    <div>
                      <h5 className="text-xs font-semibold text-stone-800 group-hover:text-emerald-900 transition">{dish.name}</h5>
                      <p className="text-[10px] text-stone-400 mt-0.5">{dish.region} • {Math.round(dish.calories * multiplier)} kcal ({Math.round(dish.calories * multiplier * 4.184)} kJ)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogMeal(dish, multiplier);
                      setDescription('');
                      setSearched(false);
                    }}
                    className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition"
                    title="Log meal"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
