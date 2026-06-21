/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserProfile, MealLogItem } from '../types';
import { generateWeightTrajectory, calculateBMI, getBMICategory } from '../utils/health-math';
import { AreaChart, TrendingDown, Target, Info, Award } from 'lucide-react';

interface ProgressChartsProps {
  profile: UserProfile;
  logs: MealLogItem[];
}

export default function ProgressCharts({ profile, logs }: ProgressChartsProps) {
  const bmi = calculateBMI(profile.weightKg, profile.heightCm);
  const bmiCategory = getBMICategory(bmi);

  // Generates weight pathway coordinate weights
  const weightTrend = generateWeightTrajectory(
    profile.weightKg,
    profile.goalWeightKg,
    // safe estimate maintenance
    Math.round(profile.calculatedCalorieTarget * 1.2),
    profile.calculatedCalorieTarget,
    profile.goalMonths
  );

  // Compute region distribution
  const regionCounts: Record<string, number> = {};
  logs.forEach(item => {
    // Check key in initial database to find region
    // Simplistic count
    const dishRegion = item.dishName.includes('Afang') || item.dishName.includes('Ekpang') ? 'Efik/Ibibio' :
                       item.dishName.includes('Amala') || item.dishName.includes('Ayamase') || item.dishName.includes('Ofada') ? 'Yoruba' :
                       item.dishName.includes('Oha') || item.dishName.includes('Nsala') ? 'Igbo' :
                       item.dishName.includes('Suya') || item.dishName.includes('Masa') || item.dishName.includes('Fura') || item.dishName.includes('Dan Wake') ? 'Hausa' :
                       item.dishName.includes('Banga') ? 'Delta/Ijaw' :
                       item.dishName.includes('Black') ? 'Bini' : 'National';
    regionCounts[dishRegion] = (regionCounts[dishRegion] || 0) + 1;
  });

  const totalLogs = logs.length || 1;
  const regionBreakdown = Object.entries(regionCounts).map(([region, count]) => ({
    region,
    pct: Math.round((count / totalLogs) * 100),
    count
  })).sort((a, b) => b.pct - a.pct);

  // SVG dimensions for weight pathway rendering
  const svgWidth = 500;
  const svgHeight = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };

  const xMax = svgWidth - padding.left - padding.right;
  const yMax = svgHeight - padding.top - padding.bottom;

  // Find min and max weight in trend coordinates
  const weights = weightTrend.map(d => d.weight);
  const maxW = Math.max(...weights) + 2;
  const minW = Math.min(...weights) - 2;

  // Map coordinate weights to coordinates in pixel space
  const points = weightTrend.map((d, index) => {
    const x = padding.left + (index / (weightTrend.length - 1)) * xMax;
    const y = padding.top + yMax - ((d.weight - minW) / (maxW - minW)) * yMax;
    return { x, y, label: d.dateStr, weight: d.weight };
  });

  const polylinePath = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. BMI status and energy cards */}
      <div className="space-y-4">
        {/* Physical Layout */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex gap-2.5 items-center">
            <span className="text-xl">🩺</span>
            <h4 className="text-sm font-semibold text-stone-900 font-sans">Physical BMI Layout</h4>
          </div>

          <div className="p-4 bg-stone-50 rounded-2xl flex justify-between items-center">
            <div>
              <span className="text-stone-400 block text-[10px] font-mono">CALCULATED BODY MASS INDEX (BMI)</span>
              <strong className="text-2xl font-extrabold text-stone-900 font-sans">{bmi}</strong>
            </div>
            <div className="text-right">
              <span className="text-stone-400 block text-[10px] font-mono">STATUS LENS</span>
              <span className={`text-sm font-bold font-sans ${bmiCategory.color}`}>{bmiCategory.label}</span>
            </div>
          </div>

          <div className="text-[11px] text-stone-500 leading-normal bg-stone-50 p-3 rounded-xl border border-stone-150 flex gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              BMI handles general proportions only. It does not index muscle volume or bone thickness offsets. Use as a clinical reference.
            </span>
          </div>
        </div>

        {/* Nutritional goals progress */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex gap-2.5 items-center">
            <span className="text-xl">🏆</span>
            <h4 className="text-sm font-semibold text-stone-900 font-sans">Cultural Milestones</h4>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-600 font-medium font-sans">Nigerian nutrition density</span>
              <strong className="text-emerald-700">{profile.nigerianFoodRatio}% target matching</strong>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${profile.nigerianFoodRatio}%` }} />
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-600 font-medium font-sans">Fiber catalog variety status</span>
              <strong className="text-emerald-700">Satisfactory</strong>
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: '80%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Estimated Weight Pathway SVG Coordinate Curve */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-6 lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center border-b border-dashed border-stone-100 pb-3">
          <div className="flex gap-2.5 items-center">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center">
              <AreaChart className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900 font-sans leading-tight">Illustrative Weight Pathway Curve</h4>
              <p className="text-[10px] text-stone-400 mt-0.5">Physical trend modeled over {profile.goalMonths} desired months.</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Target: {profile.goalWeightKg} kg</span>
          </span>
        </div>

        {/* The SVG weight line */}
        <div className="relative">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto bg-stone-50/50 rounded-2xl border" style={{ minHeight: '180px' }}>
            {/* Grid horizontal markers */}
            {Array.from({ length: 4 }).map((_, idx) => {
              const y = padding.top + (yMax * idx) / 3;
              const val = Math.round(maxW - ((maxW - minW) * idx) / 3);
              return (
                <g key={idx}>
                  <line x1={padding.left} y1={y} x2={svgWidth - padding.right} y2={y} stroke="#e5e5e0" strokeDasharray="3 3" />
                  <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#888880" fontFamily="monospace">
                    {val}kg
                  </text>
                </g>
              );
            })}

            {/* Pathway dashed stroke line */}
            <polyline
              fill="none"
              stroke="#047857"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              points={polylinePath}
            />

            {/* Coordinate circles */}
            {points.map((p, idx) => {
              // Only render dots for first, middle and last week to prevent visual cluster clutter
              if (idx === 0 || idx === points.length - 1 || idx === Math.round(points.length / 2)) {
                return (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="4" fill="#047857" />
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0f172a" fontFamily="sans-serif">
                      {p.weight}kg
                    </text>
                    <text x={p.x} y={svgHeight - padding.bottom + 14} textAnchor="middle" fontSize="9" fill="#888880" fontFamily="monospace">
                      {p.label}
                    </text>
                  </g>
                );
              }
              return null;
            })}
          </svg>

          <p className="text-[10px] text-stone-500 leading-normal border-t border-dashed border-stone-200 mt-2 pt-2 text-center font-mono font-sans">
            ⚠️ <strong>Dashed illustrative line:</strong> This pathway serves as a planning index estimate. True human metabolic pathways change depending on cortisol levels, sleep, and physical conditions.
          </p>
        </div>

        {/* Cuisine Spread Breakdown */}
        <div className="border-t border-dashed border-stone-100 pt-4 space-y-3">
          <span className="text-xs font-semibold text-stone-500 font-sans block uppercase tracking-wider">HERITAGE CUISINE REGION MAP (Logged Dishes)</span>
          
          {logs.length === 0 ? (
            <p className="text-xs text-stone-400 italic">No region metrics logged yet. Record some dishes to view distribution.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              {regionBreakdown.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-stone-700 font-sans truncate">{item.region}</span>
                    <strong className="text-emerald-700 font-mono">{item.pct}%</strong>
                  </div>
                  <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-700 rounded-full" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="text-[9px] text-stone-400 font-mono leading-none">{item.count} meals recorded</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
