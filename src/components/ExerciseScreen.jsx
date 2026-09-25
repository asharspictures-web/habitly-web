// src/components/ExerciseScreen.jsx
import React, { useState, useEffect } from 'react';
import { Activity, Clock, Plus, Flame, Play, Pause, Check } from 'lucide-react';
import { validateWorkout, calculatePace, calculateCaloriesBurnt } from '../lib/workoutUtils.js';

// Common exercise suggestions for autocomplete
const EXERCISE_SUGGESTIONS = [
  'Bicep Curl',
  'Bench Press',
  'Tricep Pushdown',
  'Triceps Extension',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Pull Up',
  'Row',
  'Lateral Raise',
];

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
  const filteredSuggestions = EXERCISE_SUGGESTIONS.filter(s => s.toLowerCase().includes(exerciseName.toLowerCase()));
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
            <ul className="absolute bg-[#09090b] border border-[#27272a] mt-1 w-full rounded-md max-h-48 overflow-y-auto z-10">
              {filteredSuggestions.map((s, i) => (
                <li
                  key={i}
                  onMouseDown={() => { setExerciseName(s); setShowSuggestions(false); }}
                  className="p-2 cursor-pointer hover:bg-red-500/20 text-white"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
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

export default function ExerciseScreen({ habits, onSave, searchQuery = '' }) {
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
      alert('Please fix: ' + errors.join(', '));
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
      alert('No exercises added to this session. Please fill out the form or click "Add Exercise".');
      return;
    }

    // Optionally add a generic entry for the total session time
    const sessionWorkout = {
      activity: 'Other',
      notes: `Live Session Total Elapsed Time`,
      timeMinutes: Math.round(timerSec / 60),
      calories: 0 // calories are already accounted for in individual exercises
    };
    
    exercisesToSave.forEach(w => onSave(w));
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
      alert('Please fix: ' + errors.join(', '));
      return;
    }
    const withCalories = { ...currentWorkout, calories: calculateCaloriesBurnt(currentWorkout) };
    onSave(withCalories);
    setCurrentWorkout({ activity: selectedActivity });
    setFormResetKey(prev => prev + 1);
  };

  // Inject the date from the parent habit record so we can display it correctly
  const allWorkouts = habits.flatMap(h => (h.workouts || []).map(w => ({ ...w, date: h.date })));
  const filteredWorkouts = searchQuery.trim()
    ? allWorkouts.filter(w => (w.activity || '').toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : allWorkouts;
  const recentWorkouts = [...filteredWorkouts].reverse().slice(0, 5);

  const formatTimer = sec => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      {/* Mode selector */}
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setMode('static')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === 'static' ? 'bg-red-600 text-white' : 'bg-[#27272a] text-zinc-400 hover:text-white hover:bg-[#3f3f46]'}`}
        >
          Log Completed Workout
        </button>
        <button
          type="button"
          onClick={() => { setMode('live'); setTimerRunning(true); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${mode === 'live' ? 'bg-red-600 text-white' : 'bg-[#27272a] text-zinc-400 hover:text-white hover:bg-[#3f3f46]'}`}
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
              className="text-red-500 hover:text-red-300"
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
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl flex items-center justify-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Exercise</span>
            </button>
            <button
              type="button"
              onClick={handleFinishLive}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl flex items-center justify-center space-x-2"
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
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
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
          {recentWorkouts.length > 0 ? (
            recentWorkouts.map((w, i) => (
              <div key={i} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#27272a] flex items-center justify-center text-red-500">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {w.activity}{w.exerciseName ? ` - ${w.exerciseName}` : ''}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(w.date || new Date()).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-zinc-400">
                  {w.distanceKm && <span className="block">{w.distanceKm} km </span>}
                  {w.timeMinutes && <span className="block">{w.timeMinutes} min </span>}
                  {w.reps && (
                    <span className="block">
                      {w.reps} reps
                      {w.loadKg ? ` @ ${w.loadKg}kg` : ''}
                      {w.loadLb ? ` @ ${w.loadLb}lb` : ''}
                    </span>
                  )}
                  {w.calories && <span className="block text-red-400 font-medium">{w.calories} kcal</span>}
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
    </div>
  );
}
