// src/components/ExerciseScreen.jsx
import React, { useState, useEffect } from 'react';
import { Activity, Clock, Plus, Flame, Play, Pause, Check } from 'lucide-react';
import { validateWorkout, calculatePace, calculateCaloriesBurnt, EXERCISE_LIBRARY } from '../lib/workoutUtils.js';

// Activity options – each will render a different set of fields.
const EXERCISE_TYPES = [
  'Strength Training',
  'Running',
  'Walking',
  'Cycling',
  'Swimming',
  'Yoga',
  'Other',
];

/**
 * Helper component that renders fields specific to the selected activity.
 * Returns a workout object matching the new schema.
 */
function ActivityForm({ activity, onChange, habits }) {
  const [exerciseName, setExerciseName] = useState(''); // for strength
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState('All');
  const [librarySearch, setLibrarySearch] = useState('');
  
  const suggestionList = EXERCISE_LIBRARY.exercises.map(e => e.name);
  const filteredSuggestions = suggestionList.filter(s => s.toLowerCase().includes(exerciseName.toLowerCase()));
  const [setType, setSetType] = useState('working'); // strength set type
  const [reps, setReps] = useState('');
  const [loadKg, setLoadKg] = useState('');
  const [loadLb, setLoadLb] = useState('');
  const [rpe, setRpe] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [timeMinutes, setTimeMinutes] = useState('');
  const [notes, setNotes] = useState('');

  const [previousStats, setPreviousStats] = useState(null);

  useEffect(() => {
    if (activity === 'Strength Training' && exerciseName.trim().length > 0) {
      const allWorkouts = (habits || []).flatMap(h => h.workouts || []);
      let found = null;
      for (let i = allWorkouts.length - 1; i >= 0; i--) {
        const w = allWorkouts[i];
        if (w.activity === 'Strength Training' && w.exerciseName && w.exerciseName.toLowerCase() === exerciseName.trim().toLowerCase()) {
          found = w;
          break;
        }
      }
      setPreviousStats(found);
    } else {
      setPreviousStats(null);
    }
  }, [activity, exerciseName, habits]);

  // Whenever a field changes, compose a partial workout object and notify parent.
  useEffect(() => {
    const base = { activity };
    let payload = { ...base };
    switch (activity) {
      case 'Strength Training':
        payload = {
          ...base,
          exerciseName: exerciseName.trim() || undefined,
          setType,
          reps: reps ? Number(reps) : undefined,
          loadKg: loadKg ? Number(loadKg) : undefined,
          loadLb: loadLb ? Number(loadLb) : undefined,
          rpe: rpe ? Number(rpe) : undefined,
          notes: notes.trim() || undefined,
        };
        break;
      case 'Running':
      case 'Walking':
      case 'Cycling':
      case 'Swimming':
        payload = {
          ...base,
          distanceKm: distanceKm ? Number(distanceKm) : undefined,
          timeMinutes: timeMinutes ? Number(timeMinutes) : undefined,
          notes: notes.trim() || undefined,
        };
        break;
      case 'Yoga':
        payload = {
          ...base,
          duration: timeMinutes ? Number(timeMinutes) : undefined,
          notes: notes.trim() || undefined,
        };
        break;
      case 'Other':
        payload = { ...base, notes: notes.trim() || undefined };
        break;
      default:
        break;
    }
    onChange(payload);
  }, [
    activity,
    exerciseName,
    setType,
    reps,
    loadKg,
    loadLb,
    rpe,
    distanceKm,
    timeMinutes,
    notes,
    onChange,
  ]);

  // Render fields per activity
  if (activity === 'Strength Training') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Exercise Name</label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={exerciseName}
                onChange={e => setExerciseName(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none focus:border-red-500/50"
                placeholder="e.g. Bench Press"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <ul className="absolute bg-[#09090b] border border-[#27272a] mt-1 w-full rounded-md max-h-48 overflow-y-auto z-10 shadow-xl">
                  {filteredSuggestions.map((s, i) => (
                    <li
                      key={i}
                      onMouseDown={() => { setExerciseName(s); setShowSuggestions(false); }}
                      className="p-2 cursor-pointer hover:bg-red-500/20 text-white transition-colors"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowLibrary(true)}
              className="bg-[#27272a] hover:bg-[#3f3f46] text-white font-medium px-4 py-2 rounded-xl transition cursor-pointer flex-shrink-0"
            >
              Library
            </button>
          </div>
          {previousStats && (
            <div className="mt-2 p-2.5 bg-[#18181b] border border-[#27272a] rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-300">
              <div className="flex items-center space-x-2">
                <Clock size={14} className="text-zinc-500" />
                <span className="text-zinc-400">Previous:</span>
                <span className="font-semibold text-white">
                  {previousStats.reps} reps
                  {previousStats.loadKg ? ` @ ${previousStats.loadKg}kg` : ''}
                  {previousStats.loadLb ? ` @ ${previousStats.loadLb}lb` : ''}
                </span>
              </div>
              <span className="text-zinc-500">{new Date(previousStats.date || previousStats.timestamp || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-4">
          <select
            value={setType}
            onChange={e => setSetType(e.target.value)}
            className="bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
          >
            <option value="working">Working Set</option>
            <option value="warm-up">Warm‑up Set</option>
          </select>
          <input
            type="number"
            min="1"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder="Reps"
            className="w-20 bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
          />
          <input
            type="number"
            min="0"
            placeholder="Kg"
            value={loadKg}
            onChange={e => setLoadKg(e.target.value)}
            className="w-20 bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
          />
          <input
            type="number"
            min="0"
            placeholder="Lb"
            value={loadLb}
            onChange={e => setLoadLb(e.target.value)}
            className="w-20 bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
          />
          <input
            type="number"
            min="1"
            max="10"
            placeholder="RPE"
            value={rpe}
            onChange={e => setRpe(e.target.value)}
            className="w-16 bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
            rows={2}
          />
        </div>

        {/* Library Modal */}
        {showLibrary && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-5 flex-shrink-0">
                <div>
                  <h3 className="text-xl font-black text-white">Exercise Library</h3>
                  <p className="text-xs text-zinc-400 mt-1">Select an exercise or filter by category</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLibrary(false)}
                  className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-[#27272a] transition cursor-pointer flex-shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="flex-shrink-0 space-y-4 mb-4">
                <input
                  type="text"
                  placeholder="Search library..."
                  value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
                  className="w-full bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none focus:border-red-500/50"
                />
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                  {EXERCISE_LIBRARY.categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setLibraryFilter(cat)}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        libraryFilter === cat ? 'bg-red-600 text-white' : 'bg-[#27272a] text-zinc-400 hover:text-white hover:bg-[#3f3f46]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {EXERCISE_LIBRARY.exercises
                  .filter(e => libraryFilter === 'All' || e.level === libraryFilter || e.tags.includes(libraryFilter))
                  .filter(e => e.name.toLowerCase().includes(librarySearch.toLowerCase()))
                  .map((e, idx) => (
                    <div 
                      key={idx}
                      onClick={() => { setExerciseName(e.name); setShowLibrary(false); }}
                      className="bg-[#09090b] border border-[#27272a] hover:border-red-500/50 rounded-xl p-3 flex justify-between items-center cursor-pointer group transition"
                    >
                      <div>
                        <p className="font-semibold text-white group-hover:text-red-400 transition-colors">{e.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            e.level === 'Beginner' ? 'text-green-500 bg-green-500/10' :
                            e.level === 'Intermediate' ? 'text-yellow-500 bg-yellow-500/10' :
                            'text-orange-500 bg-orange-500/10'
                          }`}>
                            {e.level}
                          </span>
                          {e.tags.map(t => (
                            <span key={t} className="text-[10px] uppercase font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Plus size={16} className="text-zinc-500 group-hover:text-red-500 transition-colors" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (['Running', 'Walking', 'Cycling', 'Swimming'].includes(activity)) {
    const pace = calculatePace(distanceKm, timeMinutes);
    return (
      <div className="space-y-4">
        <div className="flex space-x-4">
          <input
            type="number"
            min="0"
            placeholder="Distance (km)"
            value={distanceKm}
            onChange={e => setDistanceKm(e.target.value)}
            className="flex-1 bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
          />
          <input
            type="number"
            min="0"
            placeholder="Time (min)"
            value={timeMinutes}
            onChange={e => setTimeMinutes(e.target.value)}
            className="flex-1 bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
          />
        </div>
        {pace && (
          <p className="text-sm text-zinc-400">Pace: {pace}</p>
        )}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
            rows={2}
          />
        </div>
      </div>
    );
  }

  if (activity === 'Yoga') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Duration (min)</label>
          <input
            type="number"
            min="1"
            placeholder="Minutes"
            value={timeMinutes}
            onChange={e => setTimeMinutes(e.target.value)}
            className="w-full bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
            rows={2}
          />
        </div>
      </div>
    );
  }

  // "Other" – free‑form notes only
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Details</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
          rows={3}
          placeholder="Describe the activity..."
        />
      </div>
    </div>
  );
}

export default function ExerciseScreen({ habits, onSave, searchQuery = '', goals, updateGoals, showAlert, showConfirm }) {
  const [mode, setMode] = useState('static'); // 'static' | 'live'
  const [selectedActivity, setSelectedActivity] = useState('Strength Training');
  const [currentWorkout, setCurrentWorkout] = useState({ activity: selectedActivity });
  const [liveExercises, setLiveExercises] = useState([]);
  const [timerSec, setTimerSec] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

  // Timer effect for live mode
  useEffect(() => {
    let id;
    if (timerRunning) {
      id = setInterval(() => setTimerSec(prev => prev + 1), 1000);
    }
    return () => clearInterval(id);
  }, [timerRunning]);

  const handleAddLiveExercise = () => {
    const errors = validateWorkout(currentWorkout);
    if (errors.length) {
      showAlert('Please fix: ' + errors.join(', '));
      return;
    }
    const withCalories = { ...currentWorkout, calories: calculateCaloriesBurnt(currentWorkout) };
    setLiveExercises(prev => [...prev, withCalories]);
    setCurrentWorkout({ activity: selectedActivity });
    setFormResetKey(prev => prev + 1);
  };

  const handleFinishLive = () => {
    let exercisesToSave = [...liveExercises];
    
    // If the user filled out the form but forgot to click "Add Exercise", auto-add it if valid
    const errors = validateWorkout(currentWorkout);
    if (errors.length === 0) {
      const withCalories = { ...currentWorkout, calories: calculateCaloriesBurnt(currentWorkout) };
      exercisesToSave.push(withCalories);
    }

    if (exercisesToSave.length === 0) {
      showAlert('No exercises added to this session. Please fill out the form or click "Add Exercise".');
      return;
    }

    const sessionId = Date.now();

    // Optionally add a generic entry for the total session time
    const sessionWorkout = {
      sessionId,
      activity: 'Other',
      notes: `Live Session Total Elapsed Time`,
      timeMinutes: Math.round(timerSec / 60),
      calories: 0 // calories are already accounted for in individual exercises
    };
    
    exercisesToSave.forEach(w => onSave({ ...w, sessionId }));
    onSave(sessionWorkout); // Save the total elapsed time separately
    
    setLiveExercises([]);
    setTimerSec(0);
    setTimerRunning(false);
    setMode('static');
    setFormResetKey(prev => prev + 1);
  };

  const handleStaticSubmit = e => {
    e.preventDefault();
    const errors = validateWorkout(currentWorkout);
    if (errors.length) {
      showAlert('Please fix: ' + errors.join(', '));
      return;
    }
    const withCalories = { ...currentWorkout, calories: calculateCaloriesBurnt(currentWorkout), sessionId: Date.now() };
    onSave(withCalories);
    setCurrentWorkout({ activity: selectedActivity });
    setFormResetKey(prev => prev + 1);
  };

  // Active Routine Tracking
  const activeRoutine = goals?.activeRoutine || [];
  const [routineTimers, setRoutineTimers] = useState({});

  useEffect(() => {
    const id = setInterval(() => {
      setRoutineTimers(prev => {
        let changed = false;
        const next = { ...prev };
        for (const idx in next) {
          if (next[idx]?.running) {
            next[idx] = { ...next[idx], elapsed: Date.now() - next[idx].startTime };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleStartRoutine = (idx) => {
    setRoutineTimers(prev => ({
      ...prev,
      [idx]: { startTime: Date.now(), elapsed: 0, running: true, done: false }
    }));
  };

  const handleStopRoutine = (idx, ex) => {
    setRoutineTimers(prev => {
      const current = prev[idx];
      if (!current || !current.running) return prev;
      
      const elapsedMs = Date.now() - current.startTime;
      const hours = elapsedMs / (1000 * 60 * 60);
      const weightKg = goals?.currentWeight || 70;
      const met = ex.met || 4.0;
      const calories = Math.round(met * weightKg * hours);

      onSave({
        activity: 'Strength Training',
        exerciseName: ex.name,
        timeMinutes: Math.round(elapsedMs / 60000),
        calories,
        sessionId: Date.now()
      });

      return {
        ...prev,
        [idx]: { ...current, elapsed: elapsedMs, running: false, done: true }
      };
    });
  };

  const handleFinishRoutine = () => {
    const undoneCount = activeRoutine.length - activeRoutine.filter((_, idx) => routineTimers[idx]?.done).length;
    
    if (undoneCount > 0) {
      const phrases = [
        "So close, just a bit more!",
        "You've got this, finish strong!",
        "Almost there, keep pushing!",
        "Don't stop now, you're doing great!"
      ];
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      showConfirm(
        `You still have ${undoneCount} exercise${undoneCount > 1 ? 's' : ''} left. ${phrase}`,
        () => {
          updateGoals({ ...goals, activeRoutine: [] });
          setRoutineTimers({});
          showAlert("Routine finished and cleared!");
        },
        null,
        "Finish Anyway",
        "Continue Workout"
      );
    } else {
      updateGoals({ ...goals, activeRoutine: [] });
      setRoutineTimers({});
      showAlert("Awesome! You completed your entire routine!");
    }
  };

  // Group workouts into sessions
  const sessions = [];
  
  habits.forEach(h => {
    if (!h.workouts || h.workouts.length === 0) return;
    
    // Group this day's workouts
    const groups = {};
    h.workouts.forEach(w => {
      // Use sessionId if available, otherwise fallback to date + activity (for older logs)
      const key = w.sessionId ? w.sessionId : `${h.date}-${w.activity}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          date: h.date,
          // If the group contains multiple activities (e.g. live session), pick the first real one
          activity: w.activity !== 'Other' ? w.activity : 'Live Session',
          workouts: [],
          totalDistance: 0,
          totalTime: 0,
          totalReps: 0,
          totalSets: 0,
          totalCalories: 0,
        };
      }
      
      // Update activity name if we encounter a non-Other activity
      if (groups[key].activity === 'Live Session' && w.activity !== 'Other') {
        groups[key].activity = w.activity;
      }
      
      groups[key].workouts.push(w);
      if (w.distanceKm) groups[key].totalDistance += w.distanceKm;
      if (w.timeMinutes) groups[key].totalTime += w.timeMinutes;
      if (w.reps) {
        groups[key].totalReps += w.reps;
        if (w.activity === 'Strength Training') groups[key].totalSets += 1;
      }
      if (w.calories) groups[key].totalCalories += w.calories;
    });

    Object.values(groups).forEach(g => sessions.push(g));
  });

  // Sort sessions by date and ID (newest first)
  sessions.sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    // If same date and they have numeric sessionIds, sort by ID descending
    if (typeof b.id === 'number' && typeof a.id === 'number') return b.id - a.id;
    return 0;
  });

  const filteredSessions = searchQuery.trim()
    ? sessions.filter(s => s.activity.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : sessions;
  const recentSessions = filteredSessions.slice(0, 5);

  const [selectedSession, setSelectedSession] = useState(null);

  const formatTimer = sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#27272a] shadow-xl p-8">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/85 to-[#09090b]/50" />
        <div className="absolute inset-0 bg-red-600/10 mix-blend-overlay" />
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-2 flex items-center">
            <Flame className="text-red-500 mr-3" size={32} />
            Log Workout
          </h2>
          <p className="text-zinc-400 max-w-lg">
            Track your physical activity and keep the momentum going. Consistency is key.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      </div>

      {activeRoutine.length > 0 && (
        <div className="bg-[#18181b] rounded-2xl border border-red-500/30 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-bl-xl z-10">Active Routine</div>
          <h3 className="font-bold text-white mb-4">Your Custom Premium Routine</h3>
          <div className="space-y-3">
            {activeRoutine.map((ex, idx) => {
              const tr = routineTimers[idx] || {};
              const isRunning = tr.running;
              const isDone = tr.done;
              // Format ms to MM:SS
              const totalSecs = Math.floor((tr.elapsed || 0) / 1000);
              const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
              const s = (totalSecs % 60).toString().padStart(2, '0');
              const elapsedFmt = `${m}:${s}`;

              return (
                <div key={idx} className={`bg-[#09090b] border p-4 rounded-xl flex items-center justify-between ${isDone ? 'border-emerald-500/50 opacity-70' : isRunning ? 'border-red-500' : 'border-[#27272a]'}`}>
                  <div>
                    <h4 className={`font-bold ${isDone ? 'text-emerald-500' : 'text-white'}`}>{ex.name}</h4>
                    <p className="text-xs text-zinc-500 mb-1">
                      {isDone ? `Done (${elapsedFmt})` : isRunning ? `Running: ${elapsedFmt}` : 'Ready to start'}
                    </p>
                    <a href={`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(ex.name)}+exercise`} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 underline">
                      How to do this ↗
                    </a>
                  </div>
                  <div>
                    {isDone ? (
                      <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-full">
                        <Check size={20} />
                      </div>
                    ) : isRunning ? (
                      <button onClick={() => handleStopRoutine(idx, ex)} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full cursor-pointer shadow-lg animate-pulse">
                        <Pause size={20} />
                      </button>
                    ) : (
                      <button onClick={() => handleStartRoutine(idx)} className="bg-[#27272a] hover:bg-[#3f3f46] text-white p-2 rounded-full cursor-pointer">
                        <Play size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-red-500/20">
            <button
              onClick={() => {
                const name = document.getElementById('custom-ex-input')?.value;
                if (name && name.trim()) {
                  updateGoals({ ...goals, activeRoutine: [...activeRoutine, { name: name.trim(), met: 4.0, tags: [] }] });
                  document.getElementById('custom-ex-input').value = '';
                }
              }}
              className="w-full text-xs text-red-400 hover:text-red-300 font-bold mb-2 text-center block"
            >
              + Add Custom Exercise to Routine
            </button>
            <div className="flex space-x-2">
              <input id="custom-ex-input" type="text" placeholder="Custom exercise name..." className="flex-1 bg-[#09090b] border border-[#27272a] text-white text-xs p-2 rounded-lg focus:outline-none" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const name = e.target.value;
                  if (name.trim()) {
                    updateGoals({ ...goals, activeRoutine: [...activeRoutine, { name: name.trim(), met: 4.0, tags: [] }] });
                    e.target.value = '';
                  }
                }
              }} />
            </div>
            
            <button
              onClick={handleFinishRoutine}
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 cursor-pointer shadow-lg transition-colors"
            >
              <Check size={18} />
              <span>Finish Routine</span>
            </button>
          </div>
        </div>
      )}

      {/* Mode selector */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setMode('static')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${mode === 'static' ? 'bg-red-600 text-white' : 'bg-[#27272a] text-zinc-400 hover:text-white hover:bg-[#3f3f46]'}`}
        >
          Log Completed Workout
        </button>
        <button
          type="button"
          onClick={() => { setMode('live'); setTimerRunning(true); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${mode === 'live' ? 'bg-red-600 text-white' : 'bg-[#27272a] text-zinc-400 hover:text-white hover:bg-[#3f3f46]'}`}
        >
          Start Workout
        </button>
      </div>

      {/* Live mode UI */}
      {mode === 'live' && (
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 space-y-6">
          <div className="flex items-center justify-between text-red-400 font-mono">
            <span>Elapsed ⏱ {formatTimer(timerSec)}</span>
            <button
              type="button"
              onClick={() => setTimerRunning(r => !r)}
              className="text-red-500 hover:text-red-300 cursor-pointer"
            >
              {timerRunning ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Activity Type</label>
            <select
              value={selectedActivity}
              onChange={e => {
                setSelectedActivity(e.target.value);
                setCurrentWorkout({ activity: e.target.value });
              }}
              className="w-full bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
            >
              {EXERCISE_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <ActivityForm key={`live-${selectedActivity}-${formResetKey}`} activity={selectedActivity} onChange={setCurrentWorkout} habits={habits} />
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleAddLiveExercise}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Exercise</span>
            </button>
            <button
              type="button"
              onClick={handleFinishLive}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Check size={16} />
              <span>Finish Session</span>
            </button>
          </div>
          {liveExercises.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Queued Exercises ({liveExercises.length})</h4>
              <ul className="space-y-1 text-sm text-zinc-400">
                {liveExercises.map((w, i) => (
                  <li key={i}>• {w.activity}{w.exerciseName ? ` – ${w.exerciseName}` : ''}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Static entry UI */}
      {mode === 'static' && (
        <div className="bg-[#18181b] rounded-2xl border border-[#27272a] p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Activity Type</label>
            <select
              value={selectedActivity}
              onChange={e => {
                setSelectedActivity(e.target.value);
                setCurrentWorkout({ activity: e.target.value });
              }}
              className="w-full bg-[#09090b] border border-[#27272a] text-white p-2 rounded-xl focus:outline-none"
            >
              {EXERCISE_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <ActivityForm key={`static-${selectedActivity}-${formResetKey}`} activity={selectedActivity} onChange={setCurrentWorkout} habits={habits} />
          <button
            type="submit"
            onClick={handleStaticSubmit}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus size={20} />
            <span>Save Workout</span>
          </button>
        </div>
      )}

      {/* Recent List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          {searchQuery.trim() && (
            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">
              Filtering “{searchQuery}”
            </span>
          )}
        </div>
        <div className="space-y-3">
          {recentSessions.length > 0 ? (
            recentSessions.map((s, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedSession(s)}
                className="bg-[#18181b] border border-[#27272a] hover:border-red-500/50 rounded-xl p-4 flex items-center justify-between cursor-pointer transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#27272a] group-hover:bg-red-500/10 flex items-center justify-center text-red-500 transition">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {s.activity} Session
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(s.date || new Date()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-zinc-400">
                  {s.activity === 'Strength Training' ? (
                    <>
                      <span className="block">{s.workouts.filter(w => w.exerciseName).length} exercises</span>
                      <span className="block">{s.totalSets} sets</span>
                    </>
                  ) : (
                    <>
                      {s.totalDistance > 0 && <span className="block">{s.totalDistance.toFixed(2)} km</span>}
                      {s.totalTime > 0 && <span className="block">{s.totalTime} min</span>}
                    </>
                  )}
                  {s.totalCalories > 0 && <span className="block text-red-400 font-medium">{s.totalCalories} kcal</span>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-zinc-500 text-sm text-center py-8 bg-[#18181b] rounded-xl border border-[#27272a]">
              {searchQuery.trim() ? `No workouts matching "${searchQuery}".` : 'No recent workouts.'}
            </p>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-5 flex-shrink-0">
              <div>
                <h3 className="text-xl font-black text-white">{selectedSession.activity} Session</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {new Date(selectedSession.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-[#27272a] transition cursor-pointer flex-shrink-0"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {selectedSession.workouts.map((w, idx) => (
                <div key={idx} className="bg-[#09090b] border border-[#27272a] rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {w.activity === 'Other' && w.notes ? w.notes : (w.exerciseName || w.activity)}
                    </p>
                    {w.setType && w.activity === 'Strength Training' && (
                      <span className="text-[10px] uppercase font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">{w.setType}</span>
                    )}
                  </div>
                  <div className="text-right text-xs text-zinc-400 space-y-0.5">
                    {w.reps && <span className="block">{w.reps} reps {w.loadKg ? `@ ${w.loadKg}kg` : ''} {w.loadLb ? `@ ${w.loadLb}lb` : ''}</span>}
                    {w.distanceKm && <span className="block">{w.distanceKm} km</span>}
                    {w.timeMinutes && <span className="block">{w.timeMinutes} min</span>}
                    {w.calories > 0 && <span className="block text-red-400 font-medium">{w.calories} kcal</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#27272a] flex justify-between text-sm text-zinc-300 flex-shrink-0">
              <span className="font-semibold text-zinc-500 uppercase tracking-wider text-xs">Total Burn</span>
              <span className="font-black text-red-500">{selectedSession.totalCalories} kcal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
