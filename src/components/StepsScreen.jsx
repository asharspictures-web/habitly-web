import React, { useState } from 'react';
import { Footprints, Save, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function StepsScreen({ habits, onSave }) {
  const [steps, setSteps] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const todayData = habits.find(h => h.date === new Date().toISOString().split('T')[0]);
  const todaySteps = todayData?.steps || 0;

  const handleQuickStepsAdd = (amount) => {
    onSave(todaySteps + amount);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!steps) return;
    onSave(Number(steps));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    setSteps('');
  };

  // Generate last 7 days chart data
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const habit = habits.find(h => h.date === dateStr);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      steps: habit?.steps || 0
    };
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Hero Header with subtle fitness background imagery & dark overlay */}
      <div className="relative overflow-hidden rounded-3xl border border-[#27272a] shadow-xl p-8 flex items-center justify-between">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-25"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/85 to-[#09090b]/50"></div>
        <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-2 flex items-center">
            <Footprints className="text-red-500 mr-3" size={32} />
            Today's Steps
          </h2>
          <p className="text-zinc-400">Keep moving to reach your daily goal of 10,000 steps.</p>
        </div>
        <div className="relative z-10 text-right">
          <span className="text-5xl font-black text-white">{todaySteps.toLocaleString()}</span>
          <span className="block text-zinc-500 text-sm mt-1">/ 10,000</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1">
          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6">
            <h3 className="text-lg font-bold text-white mb-4">Log Steps</h3>
            
            {/* Quick Add Presets */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Quick Add</label>
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2500, 5000].map((stepCount) => (
                  <button
                    key={stepCount}
                    type="button"
                    onClick={() => handleQuickStepsAdd(stepCount)}
                    className="py-2.5 px-3 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+{stepCount.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="number"
                value={steps}
                onChange={e => setSteps(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-[#09090b] border border-[#27272a] text-white p-4 rounded-xl focus:outline-none focus:border-red-500/50 text-2xl font-bold text-center"
                min="0"
                required
              />
              <button 
                type="submit"
                className={`w-full font-bold py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center space-x-2 ${
                  showSuccess 
                    ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                }`}
              >
                {showSuccess ? (
                  <span>Saved!</span>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Update Steps</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 h-80">
            <h3 className="text-lg font-bold text-white mb-6">Last 7 Days</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" stroke="#52525b" tick={{fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#27272a'}}
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                />
                <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.steps >= 10000 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
