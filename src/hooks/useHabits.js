import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const DEFAULT_GOALS = {
  water: 8, // glasses
  sleep: 8, // hours
  steps: 10000,
  workout: 30, // minutes
  currentWeight: 75, // kg
  targetWeight: 70, // kg
  age: 30,
  height: 170, // cm
  gender: 'female',
  activityLevel: 'sedentary',
  healthConditions: '',
  dietaryPreferences: 'none',
  wakeTime: '07:00',
  sleepTime: '23:00',
  activeRoutine: [],
};

const HISTORY_DAYS = 90;

const numOrNull = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const getTodayDate = () => new Date().toISOString().split('T')[0];
const toDateStr = (iso) => new Date(iso).toISOString().split('T')[0];

// ---- goals <-> row mapping -------------------------------------------------

function goalsRowToObj(row) {
  if (!row) return DEFAULT_GOALS;
  return {
    water: row.water_glasses ?? DEFAULT_GOALS.water,
    sleep: row.sleep_hours ?? DEFAULT_GOALS.sleep,
    steps: row.steps ?? DEFAULT_GOALS.steps,
    workout: row.workout_minutes ?? DEFAULT_GOALS.workout,
    currentWeight: row.current_weight_kg ?? undefined,
    targetWeight: row.target_weight_kg ?? undefined,
    age: row.age ?? undefined,
    height: row.height_cm ?? undefined,
    gender: row.gender ?? undefined,
    activityLevel: row.activity_level ?? undefined,
    healthConditions: row.health_conditions ?? '',
    dietaryPreferences: row.dietary_preferences ?? 'none',
    wakeTime: row.wake_time ? String(row.wake_time).slice(0, 5) : '07:00',
    sleepTime: row.sleep_time ? String(row.sleep_time).slice(0, 5) : '23:00',
    activeRoutine: row.active_routine || [],
  };
}

function goalsObjToRow(userId, goals) {
  return {
    user_id: userId,
    water_glasses: numOrNull(goals.water) ?? 8,
    sleep_hours: numOrNull(goals.sleep) ?? 8,
    steps: numOrNull(goals.steps) ?? 10000,
    workout_minutes: numOrNull(goals.workout) ?? 30,
    current_weight_kg: numOrNull(goals.currentWeight),
    target_weight_kg: numOrNull(goals.targetWeight),
    age: numOrNull(goals.age),
    height_cm: numOrNull(goals.height),
    gender: goals.gender || null,
    activity_level: goals.activityLevel || null,
    health_conditions: goals.healthConditions || null,
    dietary_preferences: goals.dietaryPreferences || null,
    wake_time: goals.wakeTime || null,
    sleep_time: goals.sleepTime || null,
    active_routine: goals.activeRoutine || [],
    updated_at: new Date().toISOString(),
  };
}

// ---- workout <-> row mapping ----------------------------------------------
// `details` always holds the FULL original workout object, so whichever field
// name a given caller used (e.g. Yoga's `duration` vs cardio's `timeMinutes`
// vs legacy QuickLogModal's `duration`+`type`) survives the round trip
// untouched. duration_minutes/distance_km/calories/exercise_name/session_id
// are normalized copies for DB-side querying only.

function workoutObjToInsert(userId, workout) {
  const activity = workout.activity || workout.type || 'Other';
  return {
    user_id: userId,
    activity,
    exercise_name: workout.exerciseName || null,
    session_id: workout.sessionId != null ? Number(workout.sessionId) : null,
    duration_minutes: numOrNull(workout.duration ?? workout.timeMinutes),
    distance_km: numOrNull(workout.distanceKm),
    calories: numOrNull(workout.calories),
    details: { ...workout },
  };
}

function workoutRowToObj(row) {
  const details = row.details || {};
  return {
    ...details,
    id: row.id,
    activity: row.activity,
    exerciseName: row.exercise_name ?? details.exerciseName,
    sessionId: row.session_id ?? details.sessionId,
    calories: row.calories ?? details.calories,
    distanceKm: row.distance_km ?? details.distanceKm,
    date: row.logged_at,
    timestamp: row.logged_at,
  };
}

// ---- food <-> row mapping ---------------------------------------------------

function foodObjToInsert(userId, food) {
  return {
    user_id: userId,
    name: food.name || food.text || 'Meal',
    cal: numOrNull(food.cal) ?? 0,
    p: numOrNull(food.p) ?? 0,
    c: numOrNull(food.c) ?? 0,
    f: numOrNull(food.f) ?? 0,
    quantity: numOrNull(food.quantity) ?? 1,
    photo_url: food.photo_url || null,
    category: food.category || null,
  };
}

function foodRowToObj(row) {
  return {
    id: row.id,
    name: row.name,
    text: row.name,
    cal: row.cal,
    p: row.p,
    c: row.c,
    f: row.f,
    quantity: row.quantity,
    photo: null, // resolved async from photo_url via a signed URL (see resolvePhotoUrls)
    photo_url: row.photo_url,
    category: row.category,
    date: row.logged_at,
    timestamp: row.logged_at,
  };
}

async function resolvePhotoUrls(rows, setHabits) {
  const withPhotos = (rows || []).filter((r) => r.photo_url);
  if (withPhotos.length === 0) return;

  const resolved = await Promise.all(
    withPhotos.map(async (r) => {
      const { data, error } = await supabase.storage.from('food-photos').createSignedUrl(r.photo_url, 3600);
      if (error) {
        console.error('Failed to sign photo URL', error);
        return null;
      }
      return { id: r.id, url: data?.signedUrl };
    })
  );

  const byId = new Map(resolved.filter(Boolean).map((r) => [r.id, r.url]));
  if (byId.size === 0) return;

  setHabits((prev) =>
    prev.map((day) => ({
      ...day,
      foods: day.foods.map((f) => (byId.has(f.id) ? { ...f, photo: byId.get(f.id) } : f)),
    }))
  );
}

export function useHabits(userId) {
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setGoals(DEFAULT_GOALS);
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const sinceIso = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const sinceDate = sinceIso.split('T')[0];

    const [goalsRes, metricsRes, workoutsRes, foodsRes, waterRes] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('daily_metrics').select('*').eq('user_id', userId).gte('log_date', sinceDate),
      supabase.from('workouts').select('*').eq('user_id', userId).gte('logged_at', sinceIso).order('logged_at', { ascending: true }),
      supabase.from('food_logs').select('*').eq('user_id', userId).gte('logged_at', sinceIso).order('logged_at', { ascending: true }),
      supabase.from('water_logs').select('*').eq('user_id', userId).gte('logged_at', sinceIso),
    ]);

    if (goalsRes.error) console.error('Failed to load goals', goalsRes.error);
    if (metricsRes.error) console.error('Failed to load daily_metrics', metricsRes.error);
    if (workoutsRes.error) console.error('Failed to load workouts', workoutsRes.error);
    if (foodsRes.error) console.error('Failed to load food_logs', foodsRes.error);
    if (waterRes.error) console.error('Failed to load water_logs', waterRes.error);

    setGoals(goalsRes.data ? goalsRowToObj(goalsRes.data) : DEFAULT_GOALS);

    const byDate = {};
    const ensure = (date) => byDate[date] || (byDate[date] = { date, workouts: [], foods: [], steps: 0, water: 0, sleep: 0, mood: null });

    (metricsRes.data || []).forEach((r) => {
      const d = ensure(r.log_date);
      d.steps = r.steps;
      d.sleep = r.sleep_hours;
      d.mood = r.mood_score;
    });

    const waterByDate = {};
    (waterRes.data || []).forEach((r) => {
      const dateStr = toDateStr(r.logged_at);
      waterByDate[dateStr] = (waterByDate[dateStr] || 0) + (Number(r.glasses) || 0);
    });
    Object.entries(waterByDate).forEach(([dateStr, sum]) => {
      ensure(dateStr).water = Math.max(0, sum);
    });

    (workoutsRes.data || []).forEach((r) => {
      ensure(toDateStr(r.logged_at)).workouts.push(workoutRowToObj(r));
    });

    (foodsRes.data || []).forEach((r) => {
      ensure(toDateStr(r.logged_at)).foods.push(foodRowToObj(r));
    });

    setHabits(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
    setLoading(false);

    resolvePhotoUrls(foodsRes.data, setHabits);
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const getTodayHabit = useCallback(() => {
    const today = getTodayDate();
    return habits.find((h) => h.date === today) || { date: today, workouts: [], foods: [], steps: 0, water: 0, sleep: 0 };
  }, [habits]);

  const patchToday = useCallback((patchFn) => {
    const today = getTodayDate();
    setHabits((prev) => {
      const exists = prev.some((h) => h.date === today);
      if (!exists) {
        const fresh = { date: today, workouts: [], foods: [], steps: 0, water: 0, sleep: 0 };
        return [...prev, patchFn(fresh)];
      }
      return prev.map((h) => (h.date === today ? patchFn(h) : h));
    });
  }, []);

  const addWorkout = useCallback(
    (workout) => {
      if (!userId) return;
      const insertRow = workoutObjToInsert(userId, workout);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const nowIso = new Date().toISOString();
      const optimistic = { ...workout, id: tempId, activity: insertRow.activity, date: nowIso, timestamp: nowIso };

      patchToday((day) => ({ ...day, workouts: [...day.workouts, optimistic] }));

      supabase
        .from('workouts')
        .insert(insertRow)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('addWorkout failed', error);
            return;
          }
          const real = workoutRowToObj(data);
          setHabits((prev) =>
            prev.map((day) => ({
              ...day,
              workouts: day.workouts.map((w) => (w.id === tempId ? real : w)),
            }))
          );
        });
    },
    [userId, patchToday]
  );

  const addFood = useCallback(
    (food) => {
      if (!userId) return;
      const insertRow = foodObjToInsert(userId, food);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const nowIso = new Date().toISOString();
      const optimistic = { ...food, id: tempId, date: nowIso, timestamp: food.timestamp || nowIso };

      patchToday((day) => ({ ...day, foods: [...day.foods, optimistic] }));

      supabase
        .from('food_logs')
        .insert(insertRow)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('addFood failed', error);
            return;
          }
          const real = foodRowToObj(data);
          // keep any locally-previewed base64 photo until the signed URL resolves
          if (!real.photo && food.photo) real.photo = food.photo;
          setHabits((prev) =>
            prev.map((day) => ({
              ...day,
              foods: day.foods.map((f) => (f.id === tempId ? real : f)),
            }))
          );
        });
    },
    [userId, patchToday]
  );

  const removeFood = useCallback(
    (identifier) => {
      if (!userId) return;
      let targetId = null;
      setHabits((prev) =>
        prev.map((day) => {
          const match = day.foods.find((f) => f.id === identifier || f.timestamp === identifier);
          if (match) targetId = match.id;
          return { ...day, foods: day.foods.filter((f) => !(f.id === identifier || f.timestamp === identifier)) };
        })
      );
      if (targetId && !String(targetId).startsWith('temp-')) {
        supabase
          .from('food_logs')
          .delete()
          .eq('id', targetId)
          .then(({ error }) => {
            if (error) console.error('removeFood failed', error);
          });
      }
    },
    [userId]
  );

  const updateSteps = useCallback(
    (steps) => {
      if (!userId) return;
      const val = Math.max(0, Number(steps) || 0);
      const today = getTodayDate();
      patchToday((day) => ({ ...day, steps: val }));
      supabase
        .from('daily_metrics')
        .upsert({ user_id: userId, log_date: today, steps: val }, { onConflict: 'user_id,log_date' })
        .then(({ error }) => {
          if (error) console.error('updateSteps failed', error);
        });
    },
    [userId, patchToday]
  );

  const updateSleep = useCallback(
    (hours) => {
      if (!userId) return;
      const val = Math.max(0, Number(hours) || 0);
      const today = getTodayDate();
      patchToday((day) => ({ ...day, sleep: val }));
      supabase
        .from('daily_metrics')
        .upsert({ user_id: userId, log_date: today, sleep_hours: val }, { onConflict: 'user_id,log_date' })
        .then(({ error }) => {
          if (error) console.error('updateSleep failed', error);
        });
    },
    [userId, patchToday]
  );

  const updateMood = useCallback(
    (score) => {
      if (!userId) return;
      const val = Math.max(1, Math.min(5, Number(score) || 0));
      if (val < 1 || val > 5) return;
      const today = getTodayDate();
      patchToday((day) => ({ ...day, mood: val }));
      supabase
        .from('daily_metrics')
        .upsert({ user_id: userId, log_date: today, mood_score: val }, { onConflict: 'user_id,log_date' })
        .then(({ error }) => {
          if (error) console.error('updateMood failed', error);
        });
    },
    [userId, patchToday]
  );

  const updateWater = useCallback(
    (amountOrDelta, isAbsolute = false) => {
      if (!userId) return;
      const currentWater = Number(getTodayHabit().water) || 0;
      const val = Number(amountOrDelta) || 0;

      if (isAbsolute) {
        const target = Math.max(0, val);
        const delta = target - currentWater;
        patchToday((day) => ({ ...day, water: target }));
        if (delta !== 0) {
          supabase
            .from('water_logs')
            .insert({ user_id: userId, glasses: delta, logged_at: new Date().toISOString() })
            .then(({ error }) => {
              if (error) console.error('updateWater failed', error);
            });
        }
      } else {
        const newWater = Math.max(0, currentWater + val);
        patchToday((day) => ({ ...day, water: newWater }));
        supabase
          .from('water_logs')
          .insert({ user_id: userId, glasses: val, logged_at: new Date().toISOString() })
          .then(({ error }) => {
            if (error) console.error('updateWater failed', error);
          });
      }
    },
    [userId, patchToday, getTodayHabit]
  );

  const addWater = useCallback(
    (glasses = 1) => {
      updateWater(glasses, false);
    },
    [updateWater]
  );

  const updateGoals = useCallback(
    (newGoals) => {
      if (!userId) return;
      setGoals((prev) => {
        const merged = { ...prev, ...newGoals };
        const row = goalsObjToRow(userId, merged);
        supabase
          .from('goals')
          .upsert(row, { onConflict: 'user_id' })
          .then(({ error }) => {
            if (error) console.error('updateGoals failed', error);
          });
        return merged;
      });
    },
    [userId]
  );

  // Kept for API compatibility; not called anywhere in the current UI.
  const fetchPeriodLogs = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('period_logs')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    if (error) {
      console.error('fetchPeriodLogs failed', error);
      return [];
    }
    return data || [];
  }, [userId]);

  const addPeriodLog = useCallback(async (startDate, endDate) => {
    if (!userId) return { error: 'Not logged in' };
    const { data, error } = await supabase
      .from('period_logs')
      .insert({
        user_id: userId,
        start_date: startDate,
        end_date: endDate || null
      });
    if (error) console.error('addPeriodLog failed', error);
    return { data, error };
  }, [userId]);

  const deletePeriodLog = useCallback(async (id) => {
    if (!userId) return { error: 'Not logged in' };
    const { data, error } = await supabase
      .from('period_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) console.error('deletePeriodLog failed', error);
    return { data, error };
  }, [userId]);

  const getNextPredictedDate = useCallback((logs) => {
    if (!logs || logs.length < 2) return null;
    
    // Sort descending by start_date to be safe
    const sorted = [...logs].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    
    // Use up to the last 6 logs to find averages
    const recentLogs = sorted.slice(0, 6);
    if (recentLogs.length < 2) return null;

    let totalDays = 0;
    let gaps = 0;
    
    for (let i = 0; i < recentLogs.length - 1; i++) {
      const current = new Date(recentLogs[i].start_date);
      const prev = new Date(recentLogs[i+1].start_date);
      const diffTime = Math.abs(current - prev);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalDays += diffDays;
      gaps++;
    }
    
    const avgCycle = totalDays / gaps;
    
    const lastDate = new Date(sorted[0].start_date);
    const nextDate = new Date(lastDate.getTime() + (avgCycle * 24 * 60 * 60 * 1000));
    return nextDate.toISOString().split('T')[0];
  }, []);

  const addEntry = useCallback(
    (entry) => {
      const { workoutType, workoutDuration, sleep, water, steps, meals } = entry;
      if (workoutDuration) addWorkout({ type: workoutType, duration: workoutDuration, date: entry.date });
      if (sleep !== undefined) updateSleep(Number(sleep) || 0);
      if (water !== undefined) updateWater(Number(water) || 0, true);
      if (steps !== undefined) updateSteps(Number(steps) || 0);
      if (meals) addFood({ text: meals, cal: 0, p: 0, c: 0, f: 0 });
    },
    [addWorkout, updateSleep, updateWater, updateSteps, addFood]
  );

  return {
    habits,
    goals,
    loading,
    getTodayHabit,
    addWorkout,
    addFood,
    removeFood,
    updateSteps,
    updateGoals,
    addEntry,
    updateWater,
    addWater,
    updateSleep,
    updateMood,

    fetchPeriodLogs,
    addPeriodLog,
    deletePeriodLog,
    getNextPredictedDate,
  };
}
