import React, { useState } from 'react';
import { Target, Lock, Calculator, Droplets, Moon, Footprints, Dumbbell, Scale, ChevronRight, Sparkles, Utensils } from 'lucide-react';
import { COMMON_FOODS } from '../lib/foodUtils';
import { EXERCISE_LIBRARY } from '../lib/workoutUtils';

export default function GoalsScreen({ goals, updateGoals, addFood, showAlert, showConfirm }) {
  const [localGoals, setLocalGoals] = useState(goals);
  
  // Calculators State
  const [bmrResult, setBmrResult] = useState(null);
  const [macroResult, setMacroResult] = useState(null);
  const [bfResult, setBfResult] = useState(null);

  // Premium Onboarding State
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const handleSaveGoals = (e) => {
    e.preventDefault();
    updateGoals(localGoals);
    // show success flash somehow
    const btn = document.getElementById('save-goals-btn');
    const originalText = btn.innerText;
    btn.innerText = 'Saved!';
    btn.classList.add('bg-emerald-500');
    setTimeout(() => {
      btn.innerText = originalText;
      btn.classList.remove('bg-emerald-500');
    }, 2000);
  };

  const handleBMR = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const w = Number(fd.get('weight'));
    const h = Number(fd.get('height'));
    const a = Number(fd.get('age'));
    const g = fd.get('gender');
    // Mifflin-St Jeor
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr = g === 'm' ? bmr + 5 : bmr - 161;
    setBmrResult(Math.round(bmr));
  };

  const handleMacros = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const goal = fd.get('goal');
    const cal = Number(fd.get('calories'));
    let p, c, f;
    if (goal === 'cut') { p = 0.4; c = 0.3; f = 0.3; }
    else if (goal === 'bulk') { p = 0.3; c = 0.5; f = 0.2; }
    else { p = 0.3; c = 0.4; f = 0.3; }
    
    setMacroResult({
      p: Math.round((cal * p) / 4),
      c: Math.round((cal * c) / 4),
      f: Math.round((cal * f) / 9)
    });
  };

  const handleBF = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const waist = Number(fd.get('waist'));
    const neck = Number(fd.get('neck'));
    const height = Number(fd.get('height'));
    // Very simplified navy method mock
    const bf = 86.010 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
    setBfResult(Math.max(5, Math.round(bf * 10) / 10)); // just a rough mock
  };

  const calculatePremiumPlan = () => {
    if (!goals.currentWeight || !goals.height || !goals.age) return null;
    
    // Mifflin-St Jeor BMR
    let bmr = 10 * goals.currentWeight + 6.25 * goals.height - 5 * goals.age;
    bmr += (goals.gender === 'male' ? 5 : -161);

    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725
    };
    const tdee = bmr * (activityMultipliers[goals.activityLevel] || 1.2);

    let targetCalories = tdee;
    let explanation = "This is your maintenance calories to keep your current weight.";
    
    if (goals.targetWeight < goals.currentWeight) {
      targetCalories = tdee - 500;
      explanation = "We've created a safe 500 calorie deficit to help you lose weight sustainably (~0.5kg/wk).";
    } else if (goals.targetWeight > goals.currentWeight) {
      targetCalories = tdee + 300;
      explanation = "We've added a 300 calorie surplus to fuel healthy muscle growth.";
    }

    targetCalories = Math.max(1200, Math.round(targetCalories)); // Safety floor
    
    // Macros (Protein: 2g/kg, Fat: 25%, Carbs: Remainder)
    const protein = Math.round(goals.currentWeight * 2);
    const fat = Math.round((targetCalories * 0.25) / 9);
    const carbs = Math.round((targetCalories - (protein * 4) - (fat * 9)) / 4);

    let suggestedFoods = COMMON_FOODS.slice(); // Copy
    if (goals.dietaryPreferences === 'vegetarian') {
      suggestedFoods = suggestedFoods.filter(f => !['Chicken', 'Salmon', 'Fish', 'Beef', 'Pork'].some(m => f.name.includes(m)));
    } else if (goals.dietaryPreferences === 'vegan') {
      suggestedFoods = suggestedFoods.filter(f => !['Chicken', 'Salmon', 'Fish', 'Beef', 'Pork', 'Paneer', 'Ghee', 'Cheese', 'Yogurt', 'Eggs'].some(m => f.name.includes(m)));
    } else if (goals.dietaryPreferences === 'allergies') {
      suggestedFoods = suggestedFoods.filter(f => !['Peanut', 'Nut'].some(m => f.name.includes(m)));
    }
    
    // Pick 3 random foods that vaguely fit the calorie goal (we just pick 3 for demo)
    suggestedFoods = suggestedFoods.sort(() => 0.5 - Math.random()).slice(0, 3);

    // Workout Suggestions
    let suggestedSteps = 5000;
    let allowedLevels = ['Beginner'];
    if (goals.activityLevel === 'lightly_active') { suggestedSteps = 7000; allowedLevels = ['Beginner', 'Intermediate']; }
    if (goals.activityLevel === 'moderately_active') { suggestedSteps = 10000; allowedLevels = ['Intermediate']; }
    if (goals.activityLevel === 'very_active') { suggestedSteps = 12000; allowedLevels = ['Intermediate', 'Advanced']; }

    let filteredEx = EXERCISE_LIBRARY.exercises.filter(ex => allowedLevels.includes(ex.level));
    const conditions = (goals.healthConditions || '').toLowerCase();
    if (goals.age >= 65 || conditions.includes('heart') || conditions.includes('cardiac') || conditions.includes('surgery')) {
      filteredEx = filteredEx.filter(ex => ex.tags.includes('Cardiac Safe') || ex.tags.includes('Seniors (65+)'));
    } else if (conditions.includes('knee') || conditions.includes('back') || conditions.includes('joint') || conditions.includes('injury')) {
      filteredEx = filteredEx.filter(ex => ex.tags.includes('Low Impact'));
    }

    if (filteredEx.length < 4) {
      filteredEx = EXERCISE_LIBRARY.exercises.filter(ex => ex.tags.includes('Low Impact'));
    }

    const suggestedWorkout = filteredEx.sort(() => 0.5 - Math.random()).slice(0, 4);

    return { calories: targetCalories, protein, fat, carbs, explanation, suggestedFoods, suggestedSteps, suggestedWorkout };
  };

  const premiumPlan = calculatePremiumPlan();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Hero Header with subtle fitness background imagery & dark overlay */}
      <div className="relative overflow-hidden rounded-3xl border border-[#27272a] shadow-xl p-6 md:p-8">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-25"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/85 to-[#09090b]/50"></div>
        <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay"></div>
        <div className="relative z-10 flex items-center">
          <Target className="text-red-500 mr-4 flex-shrink-0" size={36} />
          <div>
            <h2 className="text-3xl font-black text-white">Your Goals</h2>
            <p className="text-zinc-400 text-sm mt-1">Set your daily targets and use the calculators to guide your journey.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Daily Targets Editor */}
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-8 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mr-3">
              <Target size={18} className="text-red-500" />
            </span>
            Daily Targets
          </h3>
          
          <form onSubmit={handleSaveGoals} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-zinc-300">
                  <Droplets size={16} className="text-blue-500 mr-2" /> Water (glasses)
                </label>
                <input
                  type="number"
                  value={localGoals.water}
                  onChange={e => setLocalGoals({...localGoals, water: Number(e.target.value)})}
                  className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-zinc-300">
                  <Moon size={16} className="text-indigo-400 mr-2" /> Sleep (hours)
                </label>
                <input
                  type="number"
                  value={localGoals.sleep}
                  onChange={e => setLocalGoals({...localGoals, sleep: Number(e.target.value)})}
                  className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50"
                  min="1" step="0.5"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-zinc-300">
                  <Footprints size={16} className="text-emerald-500 mr-2" /> Steps
                </label>
                <input
                  type="number"
                  value={localGoals.steps}
                  onChange={e => setLocalGoals({...localGoals, steps: Number(e.target.value)})}
                  className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50"
                  min="1000" step="500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-zinc-300">
                  <Dumbbell size={16} className="text-orange-500 mr-2" /> Workout (mins)
                </label>
                <input
                  type="number"
                  value={localGoals.workout}
                  onChange={e => setLocalGoals({...localGoals, workout: Number(e.target.value)})}
                  className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50"
                  min="5" step="5"
                />
              </div>

            </div>

            <div 
              onClick={() => { setIsPremiumModalOpen(true); setWizardStep(1); }}
              className="bg-gradient-to-r from-red-900/40 to-red-600/10 border border-red-500/30 rounded-xl p-5 cursor-pointer hover:border-red-500/60 transition group flex items-center justify-between"
            >
              <div>
                <h4 className="text-white font-bold flex items-center">
                  <Sparkles size={16} className="text-red-400 mr-2" />
                  Personalized Weight Plan <span className="ml-2 text-[10px] uppercase font-black tracking-wider bg-red-600 text-white px-1.5 py-0.5 rounded">Premium</span>
                </h4>
                <p className="text-zinc-400 text-sm mt-1">Set your weight goal and generate a custom nutrition & workout plan.</p>
              </div>
              <ChevronRight className="text-zinc-500 group-hover:text-red-400 transition" />
            </div>

            <button 
              id="save-goals-btn"
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              Save Targets
            </button>
          </form>
        </div>

        {/* Calculators */}
        <div className="space-y-6">

          {premiumPlan && (
            <div className="bg-gradient-to-br from-[#18181b] to-[#27272a]/20 rounded-2xl border border-red-500/30 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-bl-xl z-10">Premium Plan</div>
              <h3 className="font-bold text-white mb-2 flex items-center">
                <Sparkles size={18} className="text-red-500 mr-2" /> Your Custom Nutrition Target
              </h3>
              
              <div className="mt-4 mb-6">
                <div className="flex items-end space-x-2">
                  <span className="text-5xl font-black text-white">{premiumPlan.calories}</span>
                  <span className="text-zinc-400 font-medium pb-1">kcal / day</span>
                </div>
                <p className="text-sm text-zinc-400 mt-2 bg-red-500/10 text-red-400 p-3 rounded-lg border border-red-500/20">{premiumPlan.explanation}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-center">
                  <p className="text-xs text-zinc-500 font-bold mb-1">PROTEIN</p>
                  <p className="text-lg font-black text-red-500">{premiumPlan.protein}g</p>
                </div>
                <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-center">
                  <p className="text-xs text-zinc-500 font-bold mb-1">CARBS</p>
                  <p className="text-lg font-black text-blue-500">{premiumPlan.carbs}g</p>
                </div>
                <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 text-center">
                  <p className="text-xs text-zinc-500 font-bold mb-1">FAT</p>
                  <p className="text-lg font-black text-yellow-500">{premiumPlan.fat}g</p>
                </div>
              </div>

              {premiumPlan.suggestedFoods && premiumPlan.suggestedFoods.length > 0 && (
                <div className="mt-6 border-t border-[#27272a] pt-6">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center">
                    <Utensils size={16} className="text-zinc-400 mr-2" /> Suggested Meals for You
                  </h4>
                  <div className="space-y-2">
                    {premiumPlan.suggestedFoods.map((food, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#09090b] border border-[#27272a] p-3 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{food.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-white">{food.name}</p>
                            <p className="text-xs text-zinc-500">{food.cal} kcal · {food.p}P / {food.c}C / {food.f}F</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            addFood({ ...food, timestamp: new Date().toISOString() });
                            showAlert(`Added ${food.name} to today's log!`);
                          }}
                          className="bg-[#27272a] hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          + Log
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {premiumPlan.suggestedWorkout && (
                <div className="mt-6 border-t border-[#27272a] pt-6">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center">
                    <Dumbbell size={16} className="text-zinc-400 mr-2" /> Suggested Workout & Activity
                  </h4>
                  <div className="bg-[#09090b] border border-[#27272a] p-4 rounded-xl mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">Daily Steps Goal</p>
                      <p className="text-xs text-zinc-500">Based on your activity level</p>
                    </div>
                    <div className="text-lg font-black text-emerald-500">
                      {premiumPlan.suggestedSteps.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-[#09090b] border border-[#27272a] p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-white">Safe Starter Routine</p>
                      <button 
                        onClick={() => {
                          updateGoals({ ...goals, activeRoutine: premiumPlan.suggestedWorkout });
                          showAlert('Routine exported! Go to the Exercise tab to start your workout.');
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Export to Exercise
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {premiumPlan.suggestedWorkout.map((ex, idx) => (
                        <li key={idx} className="text-sm text-zinc-400 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></span>
                          {ex.name}
                          {ex.tags.includes('Low Impact') && <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">Low Impact</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-[#27272a] text-[10px] text-zinc-600 leading-tight">
                Disclaimer: This personalized plan is general guidance generated by an algorithm and is not medical advice. Always consult with a healthcare professional before beginning any new diet or exercise program, especially if you have pre-existing health conditions.
              </div>
            </div>
          )}
          
          
          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center">
              <Calculator size={18} className="text-zinc-500 mr-2" /> BMR Calculator
            </h3>
            <form onSubmit={handleBMR} className="flex gap-2 mb-4 text-sm">
              <select name="gender" className="bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white">
                <option value="m">Male</option><option value="f">Female</option>
              </select>
              <input name="age" type="number" placeholder="Age" className="w-16 bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white" required />
              <input name="weight" type="number" placeholder="Wt (kg)" className="w-20 bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white" required />
              <input name="height" type="number" placeholder="Ht (cm)" className="w-20 bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white" required />
              <button type="submit" className="bg-[#27272a] hover:bg-[#3f3f46] px-3 rounded-lg text-white font-medium">→</button>
            </form>
            {bmrResult && <p className="text-emerald-500 font-bold bg-emerald-500/10 p-2 rounded-lg inline-block">BMR: {bmrResult} kcal/day</p>}
          </div>

          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center">
              <Calculator size={18} className="text-zinc-500 mr-2" /> Macro Needs
            </h3>
            <form onSubmit={handleMacros} className="flex gap-2 mb-4 text-sm">
              <input name="calories" type="number" placeholder="Target Calories" className="w-32 bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white" required />
              <select name="goal" className="bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white flex-1">
                <option value="maintain">Maintain</option><option value="cut">Cut</option><option value="bulk">Bulk</option>
              </select>
              <button type="submit" className="bg-[#27272a] hover:bg-[#3f3f46] px-3 rounded-lg text-white font-medium">→</button>
            </form>
            {macroResult && (
              <div className="flex gap-4 text-sm font-bold">
                <span className="text-red-500 bg-red-500/10 p-2 rounded-lg">{macroResult.p}g Protein</span>
                <span className="text-blue-500 bg-blue-500/10 p-2 rounded-lg">{macroResult.c}g Carbs</span>
                <span className="text-yellow-500 bg-yellow-500/10 p-2 rounded-lg">{macroResult.f}g Fat</span>
              </div>
            )}
          </div>

          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 shadow-xl">
            <h3 className="font-bold text-white mb-4 flex items-center">
              <Calculator size={18} className="text-zinc-500 mr-2" /> Body Fat Estimate (Navy)
            </h3>
            <form onSubmit={handleBF} className="flex gap-2 mb-4 text-sm">
              <input name="waist" type="number" placeholder="Waist (cm)" className="w-24 bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white" required />
              <input name="neck" type="number" placeholder="Neck (cm)" className="w-24 bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white" required />
              <input name="height" type="number" placeholder="Height (cm)" className="w-24 bg-[#09090b] border border-[#27272a] rounded-lg p-2 text-white" required />
              <button type="submit" className="bg-[#27272a] hover:bg-[#3f3f46] px-3 rounded-lg text-white font-medium">→</button>
            </form>
            {bfResult && <p className="text-emerald-500 font-bold bg-emerald-500/10 p-2 rounded-lg inline-block">Estimated BF: ~{bfResult}%</p>}
          </div>

        </div>
      </div>

      <div className="pt-8 flex items-center justify-center text-zinc-500 text-sm">
        <Lock size={14} className="mr-2" />
        <span>Your data stays private.</span>
      </div>

      {/* Premium Onboarding Modal */}
      {isPremiumModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setIsPremiumModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              ✕
            </button>
            <div className="flex items-center space-x-2 mb-6">
              <Sparkles className="text-red-500" size={24} />
              <h3 className="text-2xl font-black text-white">Personalized Plan</h3>
            </div>
            
            {wizardStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-zinc-400 mb-6">Let's start by setting a safe, achievable weight goal. We'll use this to build your custom nutrition and workout plan.</p>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Current Weight (kg)</label>
                  <input type="number" value={localGoals.currentWeight || ''} onChange={e => setLocalGoals({...localGoals, currentWeight: Number(e.target.value)})} className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Target Weight (kg)</label>
                  <input type="number" value={localGoals.targetWeight || ''} onChange={e => setLocalGoals({...localGoals, targetWeight: Number(e.target.value)})} className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50" />
                </div>
                
                <button type="button" onClick={() => setWizardStep(2)} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl mt-4 transition-colors">Next Step</button>
              </div>
            )}
            
            {wizardStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-zinc-400 mb-6">Tell us a bit about yourself to help tailor your calories.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Age</label>
                    <input type="number" value={localGoals.age || ''} onChange={e => setLocalGoals({...localGoals, age: Number(e.target.value)})} className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Height (cm)</label>
                    <input type="number" value={localGoals.height || ''} onChange={e => setLocalGoals({...localGoals, height: Number(e.target.value)})} className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Gender</label>
                  <select value={localGoals.gender || 'female'} onChange={e => setLocalGoals({...localGoals, gender: e.target.value})} className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 mt-4">
                  <button type="button" onClick={() => setWizardStep(1)} className="flex-1 bg-[#27272a] text-white font-bold py-3 rounded-xl transition-colors">Back</button>
                  <button type="button" onClick={() => setWizardStep(3)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors">Next Step</button>
                </div>
              </div>
            )}
            
            {wizardStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-zinc-400 mb-6">How active are you during a typical week?</p>
                
                <div className="space-y-2">
                  {[
                    { id: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise, desk job' },
                    { id: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                    { id: 'moderately_active', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                    { id: 'very_active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' }
                  ].map(opt => (
                    <div 
                      key={opt.id}
                      onClick={() => setLocalGoals({...localGoals, activityLevel: opt.id})}
                      className={`p-3 border rounded-xl cursor-pointer transition-colors ${localGoals.activityLevel === opt.id ? 'bg-red-500/10 border-red-500 text-white' : 'bg-[#09090b] border-[#27272a] text-zinc-400 hover:border-[#3f3f46]'}`}
                    >
                      <p className="font-bold">{opt.label}</p>
                      <p className="text-xs opacity-70">{opt.desc}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-3 mt-4">
                  <button type="button" onClick={() => setWizardStep(2)} className="flex-1 bg-[#27272a] text-white font-bold py-3 rounded-xl transition-colors">Back</button>
                  <button type="button" onClick={() => setWizardStep(4)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-colors">Next Step</button>
                </div>
              </div>
            )}
            
            {wizardStep === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-zinc-400 mb-6">Any final health or dietary preferences we should know about?</p>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Injuries or Health Conditions (Optional)</label>
                  <input type="text" placeholder="e.g. Bad knees, Cardiac Safe" value={localGoals.healthConditions || ''} onChange={e => setLocalGoals({...localGoals, healthConditions: e.target.value})} className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50" />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Dietary Preference</label>
                  <select value={localGoals.dietaryPreferences || 'none'} onChange={e => setLocalGoals({...localGoals, dietaryPreferences: e.target.value})} className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50">
                    <option value="none">None</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="allergies">Allergies (Nut, Dairy, etc.)</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 mt-4">
                  <button type="button" onClick={() => setWizardStep(3)} className="flex-1 bg-[#27272a] text-white font-bold py-3 rounded-xl transition-colors">Back</button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      handleSaveGoals(e);
                      setIsPremiumModalOpen(false);
                    }} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors"
                  >
                    Save & Generate Plan
                  </button>
                </div>
              </div>
            )}

            <p className="text-[10px] text-zinc-500 text-center mt-6 uppercase tracking-wider font-bold flex items-center justify-center">
              <Lock size={10} className="mr-1" /> Premium Feature Preview
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
