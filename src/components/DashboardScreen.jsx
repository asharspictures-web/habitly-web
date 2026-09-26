import React, { useEffect, useState } from 'react';
import { generateSummary } from '../lib/gemini';
import { LineChart, Line, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Plus } from 'lucide-react';
import QuickLogModal from './QuickLogModal';

const MoodCard = ({ current, onLog }) => {
  const getEmoji = (score) => {
    switch (score) {
      case 1: return '😫';
      case 2: return '🙁';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '🤩';
      default: return '😶';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-lg relative group transition-all duration-200 hover:border-zinc-700">
      <div className="relative w-24 h-24 mb-2 flex items-center justify-center bg-[#09090b] rounded-full border-4 border-[#27272a] transition-all">
        <span className="text-4xl filter drop-shadow-md">{getEmoji(current)}</span>
      </div>
      <span className="text-sm font-semibold text-zinc-300">Mood</span>
      <span className="text-xs text-zinc-500">{current ? 'Logged' : 'No Data'}</span>
      {onLog && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLog();
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full transition-all border opacity-0 group-hover:opacity-100 bg-yellow-500/10 hover:bg-yellow-600 text-yellow-400 hover:text-white border-yellow-500/30 hover:border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]`}
          title="Quick Log Mood"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
};

// Reusable Circular Progress Ring
const ProgressRing = ({ label, current, goal, unit, defaultColor, onLog, logColorClass }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min((current / (goal || 1)) * 100, 100);
  const offset = circumference - (pct / 100) * circumference;
  const isComplete = pct >= 100;
  
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-lg relative group transition-all duration-200 hover:border-zinc-700">
      <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-[#27272a]" />
          <circle 
            cx="48" cy="48" r={radius} 
            stroke="currentColor" strokeWidth="6" fill="transparent" 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${isComplete ? 'text-emerald-500 animate-pulse' : defaultColor}`} 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold ${isComplete ? 'text-emerald-500' : 'text-white'}`}>{current}</span>
        </div>
      </div>
      <span className="text-sm font-semibold text-zinc-300">{label}</span>
      <span className="text-xs text-zinc-500">Goal: {goal} {unit}</span>
      {onLog && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLog();
          }}
          aria-label={`+ Log ${label}`}
          className={`mt-2.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1 cursor-pointer border ${
            logColorClass || 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/20'
          }`}
        >
          <Plus size={12} className="stroke-[2.5]" aria-hidden="true" />
          <span>+ Log</span>
        </button>
      )}
    </div>
  );
};

export default function DashboardScreen({ 
  habits = [], 
  goals = {},
  updateWater,
  addWater,
  updateSleep,
  updateSteps,
  addWorkout,
  updateMood
}) {
  const [summary, setSummary] = useState("Analyzing your day...");
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [quickLogTab, setQuickLogTab] = useState('water');

  const handleOpenQuickLog = (tab = 'water') => {
    setQuickLogTab(tab);
    setIsQuickLogOpen(true);
  };
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayData = habits.find(h => h.date === todayStr) || { workouts: [], steps: 0, water: 0, sleep: 0 };
  const todayWorkoutMins = (todayData.workouts || []).reduce((acc, w) => acc + w.duration, 0);

  useEffect(() => {
    async function fetchSummary() {
      // adapt summary generation to use our new schema properly
      const adapted = habits.map(h => ({
        ...h,
        workoutDuration: h.workouts?.reduce((a,w)=>a+w.duration,0) || 0,
        workoutType: h.workouts?.[0]?.type || 'Activity'
      }));
      const text = await generateSummary(adapted);
      setSummary(text);
    }
    fetchSummary();
  }, [habits]);

  // Chart Data Preparation (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const habit = habits.find(h => h.date === dateStr);
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      sleep: habit?.sleep || 0,
      water: habit?.water || 0,
      workout: (habit?.workouts || []).reduce((acc, w) => acc + w.duration, 0)
    };
  });

  // Mock Calendar Heatmap Data (last 28 days)
  const heatmapData = Array.from({ length: 28 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    const dateStr = d.toISOString().split('T')[0];
    const h = habits.find(hab => hab.date === dateStr);
    
    let score = 0;
    if (h) {
      if (h.water >= goals.water) score++;
      if (h.sleep >= goals.sleep) score++;
      if (h.steps >= goals.steps) score++;
      const wMins = (h.workouts || []).reduce((a, w) => a + w.duration, 0);
      if (wMins >= goals.workout) score++;
    }
    return { date: dateStr, score };
  });

  const getHeatmapColor = (score) => {
    if (score === 4) return 'bg-red-500';
    if (score === 3) return 'bg-red-600/80';
    if (score === 2) return 'bg-red-700/60';
    if (score === 1) return 'bg-red-800/40';
    return 'bg-[#27272a]';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Hero AI Summary */}
      <div className="relative overflow-hidden rounded-3xl border border-[#27272a] shadow-2xl group min-h-[200px] flex flex-col justify-end p-8">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-red-600/20 mix-blend-multiply"></div>
        
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-sm font-bold text-red-500 tracking-wider uppercase mb-2">Daily AI Insight</h2>
          <p className="text-2xl md:text-3xl font-black text-white leading-tight">
            {summary}
          </p>
        </div>
      </div>

      {/* Progress Rings */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <ProgressRing 
          label="Water" 
          current={todayData.water} 
          goal={goals.water} 
          unit="gl" 
          defaultColor="text-blue-500" 
          onLog={() => handleOpenQuickLog('water')}
          logColorClass="bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-500/30 hover:border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
        />
        <ProgressRing 
          label="Sleep" 
          current={todayData.sleep} 
          goal={goals.sleep} 
          unit="hrs" 
          defaultColor="text-indigo-400" 
          onLog={() => handleOpenQuickLog('sleep')}
          logColorClass="bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border-indigo-500/30 hover:border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
        />
        <ProgressRing label="Steps" current={todayData.steps} goal={goals.steps} unit="" defaultColor="text-orange-400" />
        <ProgressRing label="Activity" current={todayWorkoutMins} goal={goals.workout} unit="min" defaultColor="text-red-500" />
        <MoodCard current={todayData.mood} onLog={() => handleOpenQuickLog('mood')} />
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-semibold">Sleep Avg</p>
            <p className="text-2xl font-black text-white mt-1">6.8h</p>
          </div>
          <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg text-sm font-bold">
            <TrendingUp size={16} className="mr-1" /> 12%
          </div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-semibold">Steps Avg</p>
            <p className="text-2xl font-black text-white mt-1">8,420</p>
          </div>
          <div className="flex items-center text-red-500 bg-red-500/10 px-2 py-1 rounded-lg text-sm font-bold">
            <TrendingDown size={16} className="mr-1" /> 5%
          </div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-semibold">Activity Avg</p>
            <p className="text-2xl font-black text-white mt-1">42m</p>
          </div>
          <div className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg text-sm font-bold">
            <TrendingUp size={16} className="mr-1" /> 18%
          </div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-semibold">Cal Burnt Today</p>
            <p className="text-2xl font-black text-red-400 mt-1">{ (todayData.workouts || []).reduce((acc, w) => acc + (w.calories || 0), 0) } <span className="text-sm font-medium text-zinc-500">kcal</span></p>
          </div>
        </div>
        <div className="bg-[#18181b] border border-[#27272a] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm font-semibold">Weight Goal</p>
            <p className="text-2xl font-black text-white mt-1">{goals.currentWeight || '--'} <span className="text-sm font-medium text-zinc-500">kg</span></p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-zinc-400 font-medium">Target: {goals.targetWeight || '--'}</span>
            {goals.currentWeight && goals.targetWeight && (
              <span className="text-xs font-bold mt-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                {Math.abs(goals.currentWeight - goals.targetWeight).toFixed(1)} kg to go
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recharts Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 h-80">
          <h3 className="text-lg font-bold text-white mb-6">Sleep Trends</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={chartData}>
              <XAxis dataKey="day" stroke="#52525b" tick={{fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="sleep" stroke="#ef4444" strokeWidth={4} dot={{r: 4, fill: '#18181b', strokeWidth: 2}} activeDot={{r: 6}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 h-80">
          <h3 className="text-lg font-bold text-white mb-6">Hydration & Activity</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={chartData}>
              <XAxis dataKey="day" stroke="#52525b" tick={{fill: '#a1a1aa'}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }} cursor={{fill: '#27272a'}} />
              <Bar dataKey="water" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="workout" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Consistency Heatmap</h3>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {heatmapData.map((d, i) => (
            <div key={i} className="group relative">
              <div className={`w-10 h-10 rounded-lg ${getHeatmapColor(d.score)} transition-colors`}></div>
              {/* Simple tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#09090b] border border-[#27272a] text-xs text-white px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                {d.date}: {d.score}/4 goals
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Heatmap Legend */}
      <div className="flex items-center space-x-3 mt-2 text-sm text-zinc-400">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#27272a] rounded mr-1" title="0 / 4 goals"></div>
          <span>0</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-800/40 rounded mr-1" title="1 / 4 goals"></div>
          <span>1</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-700/60 rounded mr-1" title="2 / 4 goals"></div>
          <span>2</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-600/80 rounded mr-1" title="3 / 4 goals"></div>
          <span>3</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-1" title="4 / 4 goals"></div>
          <span>4</span>
        </div>
        <span className="ml-2">Higher score = more daily goals met</span>
      </div>
      {/* Floating Quick Log Button */}
      <button
        type="button"
        onClick={() => handleOpenQuickLog('water')}
        aria-label="Quick Log"
        title="Quick Log"
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:shadow-[0_0_35px_rgba(239,68,68,0.8)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#09090b]"
      >
        <Plus size={28} className="stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
      </button>

      {/* Quick Log Modal */}
      <QuickLogModal
        key={`${isQuickLogOpen}-${quickLogTab}`}
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        initialTab={quickLogTab}
        todayData={todayData}
        goals={goals}
        updateWater={updateWater}
        addWater={addWater}
        updateSleep={updateSleep}
        updateSteps={updateSteps}
        addWorkout={addWorkout}
        updateMood={updateMood}
      />

    </div>
  );
}
