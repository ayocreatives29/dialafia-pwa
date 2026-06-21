/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dish, MealLogItem } from '../types';
import { INITIAL_DISH_DATABASE } from '../data/food-data';
import { Plus, Trash2, Calendar, ClipboardList, Clock } from 'lucide-react';

interface MealLoggerProps {
  logs: MealLogItem[];
  onAddLog: (dishId: string, multiplier: number, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink', dateStr: string) => void;
  onRemoveLog: (id: string) => void;
}

export default function MealLogger({ logs, onAddLog, onRemoveLog }: MealLoggerProps) {
  const [selectedDishId, setSelectedDishId] = useState<string>(INITIAL_DISH_DATABASE[0]?.id || '');
  const [multiplier, setMultiplier] = useState<number>(1);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink'>('lunch');
  const [dateStr, setDateStr] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDishId) return;
    onAddLog(selectedDishId, multiplier, mealType, dateStr);
  };

  // Group logs by date
  const sortedLogs = [...logs].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Quick Manual Logger Form */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-6 space-y-4 h-fit">
        <div className="flex gap-2.5 items-center">
          <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-emerald-700" />
          </div>
          <h4 className="text-base font-semibold text-stone-900 font-sans leading-tight">Add a local meal</h4>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-stone-700">Choose Dish from catalog</span>
            <select
              value={selectedDishId}
              onChange={(e) => setSelectedDishId(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 bg-white"
            >
              {INITIAL_DISH_DATABASE.map(dish => (
                <option key={dish.id} value={dish.id}>
                  {dish.imageUrl} {dish.name} ({dish.region} • {dish.calories} kcal)
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-stone-700">Portion multiplier</span>
              <select
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 bg-white"
              >
                <option value="0.5">0.5 (Sample serving)</option>
                <option value="1">1.0 (Standard home serve)</option>
                <option value="1.5">1.5 (A bit heavy serve)</option>
                <option value="2">2.0 (Heavy swallow portion)</option>
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-stone-700">Meal Session</span>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-stone-300 bg-white"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="drink">Local Drink</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-stone-700">Logged Date</span>
            <div className="relative">
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 text-stone-800"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Meal to Day Log</span>
          </button>
        </form>
      </div>

      {/* 2. Log History Card Column */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-6 lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b border-dashed border-stone-100 pb-3">
          <div className="flex gap-2.5 items-center">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-700" />
            </div>
            <h4 className="text-base font-semibold text-stone-900 font-sans leading-tight">Meal History Log</h4>
          </div>
          <span className="text-[10px] font-mono text-stone-400 bg-stone-50 border px-2 py-1 rounded inline-block">TOTAL ENTRIES: {logs.length}</span>
        </div>

        {sortedLogs.length === 0 ? (
          <div className="py-16 text-center text-stone-400 italic text-sm space-y-2">
            <p>No meals logged in this session yet.</p>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">Click any delicacy card in the library or use Description Assist above to record your nutrition!</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {sortedLogs.map(item => {
              const formattedDate = new Date(item.loggedAt).toLocaleDateString('en-NG', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              return (
                <div 
                  key={item.id}
                  className="flex justify-between items-center p-3.5 bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-xl transition"
                >
                  <div className="flex gap-3 items-center min-w-0">
                    <span className="text-xs font-mono font-bold bg-amber-100 border border-amber-200 text-amber-900 px-2 py-1 rounded uppercase shrink-0">
                      {item.mealType}
                    </span>
                    <div className="min-w-0">
                      <h5 className="text-xs font-semibold text-stone-800 truncate leading-tight">{item.dishName}</h5>
                      <p className="text-[10px] text-stone-400 mt-1">{formattedDate} • Portion: <strong>{item.portionMultiplier}x</strong></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 shrink-0">
                    <div className="text-right font-mono text-xs">
                      <strong className="text-stone-800 block">{item.calories} kcal</strong>
                      <span className="text-[10px] text-stone-400">{Math.round(item.calories * 4.184)} kJ</span>
                    </div>

                    <button
                      onClick={() => onRemoveLog(item.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete log item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
