import { useState, useEffect } from 'react';

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
};

export function useHabits() {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habitlyDataV2');
    return saved ? JSON.parse(saved) : [];
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('habitlyGoals');
    return saved ? JSON.parse(saved) : DEFAULT_GOALS;
  });

  useEffect(() => {
    localStorage.setItem('habitlyDataV2', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('habitlyGoals', JSON.stringify(goals));
  }, [goals]);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const getTodayHabit = () => {
    const today = getTodayDate();
    let entry = habits.find(h => h.date === today);
    if (!entry) {
      entry = { date: today, workouts: [], foods: [], steps: 0, water: 0, sleep: 0 };
    }
    return entry;
  };

  const updateToday = (updatesOrFn) => {
    const today = getTodayDate();
    setHabits(prevHabits => {
      let found = false;
      const existing = prevHabits.find(h => h.date === today) || {
        date: today,
        workouts: [],
        foods: [],
        steps: 0,
        water: 0,
        sleep: 0
      };
      const updates = typeof updatesOrFn === 'function' ? updatesOrFn(existing) : updatesOrFn;

      const newHabits = prevHabits.map(h => {
        if (h.date === today) {
          found = true;
          return { ...h, ...updates };
        }
        return h;
      });

      if (!found) {
        newHabits.push({ ...existing, ...updates });
      }
      return newHabits;
    });
  };

  const addWorkout = (workout) => {
    updateToday(current => ({
      workouts: [...(current.workouts || []), workout]
    }));
  };

  const addFood = (food) => {
    updateToday(current => ({
      foods: [...(current.foods || []), food]
    }));
  };

  const updateSteps = (steps) => {
    updateToday({ steps: Math.max(0, Number(steps) || 0) });
  };

  const updateWater = (amountOrDelta, isAbsolute = false) => {
    updateToday(current => {
      const currentWater = Number(current.water) || 0;
      const val = Number(amountOrDelta) || 0;
      const newWater = isAbsolute ? Math.max(0, val) : Math.max(0, currentWater + val);
      return { water: newWater };
    });
  };

  const addWater = (glasses = 1) => {
    updateWater(glasses, false);
  };

  const updateSleep = (hours) => {
    updateToday({ sleep: Math.max(0, Number(hours) || 0) });
  };

  const updateGoals = (newGoals) => {
    setGoals(prev => ({ ...prev, ...newGoals }));
  };

  // Keep old addEntry for backward compatibility
  const addEntry = (entry) => {
    const { workoutType, workoutDuration, sleep, water, steps, meals } = entry;
    updateToday({
      workouts: workoutDuration ? [{ type: workoutType, duration: workoutDuration, date: entry.date }] : [],
      sleep: Number(sleep) || 0,
      water: Number(water) || 0,
      steps: Number(steps) || 0,
      foods: meals ? [{ text: meals, cal: 0, p: 0, c: 0, f: 0 }] : []
    });
  };

  return {
    habits,
    goals,
    getTodayHabit,
    addWorkout,
    addFood,
    updateSteps,
    updateGoals,
    addEntry,
    updateWater,
    addWater,
    updateSleep
  };
}
