import React, { useState, useEffect } from 'react';
import { X, Droplet, Moon, Footprints, Dumbbell, Plus, Check, AlertCircle, Smile } from 'lucide-react';

const WORKOUT_TYPES = ['Running', 'Walking', 'Weights', 'Cycling', 'Yoga', 'Swimming', 'HIIT', 'Other'];

export default function QuickLogModal({
  isOpen,
  onClose,
  initialTab = 'water',
  todayData = {},
  goals = {},
  updateWater,
  addWater,
  updateSleep,
  updateSteps,
  addWorkout,
  updateMood
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Water Form State
  const [customWater, setCustomWater] = useState('');

  // Sleep Form State
  const [sleepHours, setSleepHours] = useState(() => (todayData?.sleep ? String(todayData.sleep) : '7.5'));

  // Steps Form State
  const [customSteps, setCustomSteps] = useState('');

  // Workout Form State
  const [workoutType, setWorkoutType] = useState('Running');
  const [customWorkoutType, setCustomWorkoutType] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('30');
  const [workoutCalories, setWorkoutCalories] = useState('');

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentWater = Number(todayData?.water) || 0;
  const currentSleep = Number(todayData?.sleep) || 0;
  const currentSteps = Number(todayData?.steps) || 0;

  const triggerFeedback = (message, type = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Water Handlers
  const handleQuickWaterAdd = (amount) => {
    if (addWater) {
      addWater(amount);
    } else if (updateWater) {
      updateWater(amount, false);
    }
    triggerFeedback(`+${amount} glass${amount > 1 ? 'es' : ''} added! Total: ${currentWater + amount} glasses.`);
  };

  const handleCustomWater = (isAbsolute = false) => {
    const val = Number(customWater);
    if (isNaN(val) || val <= 0) {
      triggerFeedback('Please enter a valid number of glasses (> 0).', 'error');
      return;
    }
    if (isAbsolute) {
      updateWater?.(val, true);
      triggerFeedback(`Water intake set to ${val} glasses.`);
    } else {
      if (addWater) {
        addWater(val);
      } else {
        updateWater?.(val, false);
      }
      triggerFeedback(`Added ${val} glasses. Total: ${currentWater + val} glasses.`);
    }
    setCustomWater('');
  };

  // Sleep Handlers
  const handleSaveSleep = (hoursToSave) => {
    const hours = Number(hoursToSave ?? sleepHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      triggerFeedback('Please enter sleep hours between 0 and 24.', 'error');
      return;
    }
    updateSleep?.(hours);
    triggerFeedback(`Sleep logged: ${hours} hours.`);
  };

  // Steps Handlers
  const handleQuickStepsAdd = (amount) => {
    const newTotal = currentSteps + amount;
    updateSteps?.(newTotal);
    triggerFeedback(`+${amount.toLocaleString()} steps added! Total: ${newTotal.toLocaleString()} steps.`);
  };

  const handleCustomSteps = (isAbsolute = false) => {
    const val = Number(customSteps);
    if (isNaN(val) || val <= 0) {
      triggerFeedback('Please enter a valid step count (> 0).', 'error');
      return;
    }
    if (isAbsolute) {
      updateSteps?.(val);
      triggerFeedback(`Steps set to ${val.toLocaleString()}.`);
    } else {
      const newTotal = currentSteps + val;
      updateSteps?.(newTotal);
      triggerFeedback(`Added ${val.toLocaleString()} steps. Total: ${newTotal.toLocaleString()}.`);
    }
    setCustomSteps('');
  };

  // Workout Handlers
  const handleSaveWorkout = (e) => {
    e.preventDefault();
    const duration = Number(workoutDuration);
    if (isNaN(duration) || duration <= 0) {
      triggerFeedback('Please enter a valid duration (> 0 minutes).', 'error');
      return;
    }
    const finalType = workoutType === 'Other' ? (customWorkoutType.trim() || 'Other Activity') : workoutType;
    const calories = workoutCalories ? Number(workoutCalories) : undefined;

    addWorkout?.({
      type: finalType,
      duration,
      calories: calories && !isNaN(calories) ? calories : undefined,
      date: new Date().toISOString()
    });

    triggerFeedback(`Logged ${duration} min of ${finalType}!`);
    setWorkoutDuration('30');
    setWorkoutCalories('');
    setCustomWorkoutType('');
  };

  const tabs = [
    { id: 'water', label: 'Water', icon: Droplet, activeClass: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
    { id: 'sleep', label: 'Sleep', icon: Moon, activeClass: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
    { id: 'steps', label: 'Steps', icon: Footprints, activeClass: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
    { id: 'workout', label: 'Workout', icon: Dumbbell, activeClass: 'text-red-400 bg-red-500/15 border-red-500/30' },
    { id: 'mood', label: 'Mood', icon: Smile, activeClass: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' }
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-log-title"
    >
      <div 
        className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-7 shadow-2xl max-w-lg w-full relative space-y-6 text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
            <h2 id="quick-log-title" className="text-xl font-black text-white tracking-wide">
              Quick Log
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-[#27272a] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-5 gap-2 bg-[#09090b] p-1.5 rounded-2xl border border-[#27272a]">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id);
                  setFeedback(null);
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
                  isActive ? t.activeClass : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900'
                }`}
              >
                <Icon size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`flex items-center gap-2 p-3 rounded-xl text-sm font-semibold border animate-in fade-in slide-in-from-top-2 duration-200 ${
              feedback.type === 'error'
                ? 'bg-red-500/15 border-red-500/30 text-red-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {feedback.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* TAB 1: WATER */}
        {activeTab === 'water' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Status Card */}
            <div className="bg-[#09090b] border border-blue-500/20 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Today's Intake</p>
                <p className="text-2xl font-black text-blue-400 mt-0.5">
                  {currentWater} <span className="text-sm font-normal text-zinc-500">/ {goals?.water || 8} glasses</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Droplet size={24} />
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Quick Add Glasses</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((gl) => (
                  <button
                    key={gl}
                    type="button"
                    onClick={() => handleQuickWaterAdd(gl)}
                    className="py-2.5 px-3 bg-blue-500/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-500 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>{gl} {gl === 1 ? 'glass' : 'glasses'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Water Input */}
            <div className="pt-2 border-t border-[#27272a] space-y-2">
              <label className="block text-xs font-semibold text-zinc-400">Custom Amount (Glasses)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={customWater}
                  onChange={(e) => setCustomWater(e.target.value)}
                  placeholder="e.g. 5"
                  className="flex-1 bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleCustomWater(false)}
                  disabled={!customWater}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCustomWater(true)}
                  disabled={!customWater}
                  className="px-3.5 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Set Total
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SLEEP */}
        {activeTab === 'sleep' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Status Card */}
            <div className="bg-[#09090b] border border-indigo-500/20 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Today's Sleep</p>
                <p className="text-2xl font-black text-indigo-400 mt-0.5">
                  {currentSleep} <span className="text-sm font-normal text-zinc-500">/ {goals?.sleep || 8} hrs</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Moon size={24} />
              </div>
            </div>

            {/* Quick Hours Preset Chips */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Preset Hours</label>
              <div className="flex flex-wrap gap-2">
                {['6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => {
                      setSleepHours(hrs);
                      handleSaveSleep(hrs);
                    }}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border ${
                      sleepHours === hrs
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border-indigo-500/20 hover:border-indigo-500'
                    }`}
                  >
                    {hrs} hrs
                  </button>
                ))}
              </div>
            </div>

            {/* Decimal Hours Input */}
            <div className="pt-2 border-t border-[#27272a] space-y-2">
              <label className="block text-xs font-semibold text-zinc-400">Sleep Duration (Hours with decimal e.g. 7.5)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.1"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="flex-1 bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleSaveSleep()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Save Sleep</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STEPS */}
        {activeTab === 'steps' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Status Card */}
            <div className="bg-[#09090b] border border-orange-500/20 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Today's Steps</p>
                <p className="text-2xl font-black text-orange-400 mt-0.5">
                  {currentSteps.toLocaleString()} <span className="text-sm font-normal text-zinc-500">/ {(goals?.steps || 10000).toLocaleString()}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Footprints size={24} />
              </div>
            </div>

            {/* Quick Add Presets */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Quick Add Steps</label>
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2500, 5000].map((stepCount) => (
                  <button
                    key={stepCount}
                    type="button"
                    onClick={() => handleQuickStepsAdd(stepCount)}
                    className="py-2.5 px-3 bg-orange-500/10 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/20 hover:border-orange-500 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>+{stepCount.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Steps Input */}
            <div className="pt-2 border-t border-[#27272a] space-y-2">
              <label className="block text-xs font-semibold text-zinc-400">Custom Steps</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={customSteps}
                  onChange={(e) => setCustomSteps(e.target.value)}
                  placeholder="e.g. 3500"
                  className="flex-1 bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => handleCustomSteps(false)}
                  disabled={!customSteps}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCustomSteps(true)}
                  disabled={!customSteps}
                  className="px-3.5 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Set Total
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WORKOUT */}
        {activeTab === 'workout' && (
          <form onSubmit={handleSaveWorkout} className="space-y-4 animate-in fade-in duration-200">
            {/* Workout Type Chips & Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-400">Workout Type</label>
                <select
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  className="bg-[#09090b] border border-[#27272a] text-zinc-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-red-500"
                >
                  {WORKOUT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {WORKOUT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setWorkoutType(t)}
                    className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      workoutType === t
                        ? 'bg-red-600 text-white border-red-500'
                        : 'bg-[#09090b] text-zinc-400 border-[#27272a] hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {workoutType === 'Other' && (
                <input
                  type="text"
                  value={customWorkoutType}
                  onChange={(e) => setCustomWorkoutType(e.target.value)}
                  placeholder="Specify activity name..."
                  className="mt-2 w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500"
                />
              )}
            </div>

            {/* Duration Presets & Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-400">Duration (Minutes)</label>
                <div className="flex gap-1">
                  {['15', '30', '45', '60'].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setWorkoutDuration(mins)}
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer border ${
                        workoutDuration === mins
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-[#09090b] text-zinc-400 border-[#27272a] hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                max="600"
                value={workoutDuration}
                onChange={(e) => setWorkoutDuration(e.target.value)}
                placeholder="Duration in minutes..."
                required
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Calories (optional) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Calories Burned (kcal, optional)</label>
              <input
                type="number"
                min="0"
                value={workoutCalories}
                onChange={(e) => setWorkoutCalories(e.target.value)}
                placeholder="e.g. 250"
                className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            {/* Submit Workout Button */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              <span>Log Workout</span>
            </button>
          </form>
        )}

        {/* TAB 5: MOOD */}
        {activeTab === 'mood' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-white tracking-tight">How are you feeling today?</p>
              <p className="text-xs text-zinc-400">Track your daily mood to see how it correlates with your habits.</p>
            </div>
            <div className="flex justify-between items-center bg-[#09090b] border border-[#27272a] rounded-2xl p-4">
              {[
                { s: 1, e: '😫', label: 'Very Low' },
                { s: 2, e: '🙁', label: 'Low' },
                { s: 3, e: '😐', label: 'Neutral' },
                { s: 4, e: '🙂', label: 'Good' },
                { s: 5, e: '🤩', label: 'Great' }
              ].map(mood => (
                <button
                  key={mood.s}
                  type="button"
                  onClick={() => {
                    if (updateMood) {
                      updateMood(mood.s);
                      triggerFeedback('success', `Mood logged: ${mood.label} ${mood.e}`);
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-[#27272a] transition-colors cursor-pointer group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform">{mood.e}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2 border-t border-[#27272a] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">Press Esc or click outside to close</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#27272a] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
