import React, { useState } from 'react';
import { Target, Lock, Calculator, Droplets, Moon, Footprints, Dumbbell, Scale } from 'lucide-react';

export default function GoalsScreen({ goals, updateGoals }) {
  const [localGoals, setLocalGoals] = useState(goals);
  
  // Calculators State
  const [bmrResult, setBmrResult] = useState(null);
  const [macroResult, setMacroResult] = useState(null);
  const [bfResult, setBfResult] = useState(null);

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

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-zinc-300">
                  <Scale size={16} className="text-zinc-400 mr-2" /> Current Weight (kg)
                </label>
                <input
                  type="number"
                  value={localGoals.currentWeight || ''}
                  onChange={e => setLocalGoals({...localGoals, currentWeight: Number(e.target.value)})}
                  className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50"
                  min="20" step="0.1"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-zinc-300">
                  <Target size={16} className="text-red-500 mr-2" /> Target Weight (kg)
                </label>
                <input
                  type="number"
                  value={localGoals.targetWeight || ''}
                  onChange={e => setLocalGoals({...localGoals, targetWeight: Number(e.target.value)})}
                  className="w-full bg-[#09090b] border border-[#27272a] text-white p-3 rounded-xl focus:outline-none focus:border-red-500/50"
                  min="20" step="0.1"
                />
              </div>

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

    </div>
  );
}
