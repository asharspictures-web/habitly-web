import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// =========================================================================
// Pure Simulation of useHabits with localStorage & Functional State Updates
// =========================================================================

function createFullMockHabitsStore(initialHabits = null, initialGoals = null) {
  let localStorageMock = {};
  
  if (initialHabits !== null) {
    localStorageMock['habitlyDataV2'] = JSON.stringify(initialHabits);
  }
  if (initialGoals !== null) {
    localStorageMock['habitlyGoals'] = JSON.stringify(initialGoals);
  }

  const DEFAULT_GOALS = { water: 8, sleep: 8, steps: 10000, workout: 30 };

  // useState initializers
  let habits = localStorageMock['habitlyDataV2'] ? JSON.parse(localStorageMock['habitlyDataV2']) : [];
  let goals = localStorageMock['habitlyGoals'] ? JSON.parse(localStorageMock['habitlyGoals']) : DEFAULT_GOALS;

  // React-like setState dispatcher
  const setHabits = (updater) => {
    habits = typeof updater === 'function' ? updater(habits) : updater;
    localStorageMock['habitlyDataV2'] = JSON.stringify(habits);
  };

  const setGoals = (updater) => {
    goals = typeof updater === 'function' ? updater(goals) : updater;
    localStorageMock['habitlyGoals'] = JSON.stringify(goals);
  };

  const getTodayDate = () => '2026-09-24';

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

  return {
    getHabits: () => habits,
    getGoals: () => goals,
    getLocalStorage: () => localStorageMock,
    getTodayHabit,
    addWorkout,
    addFood,
    updateSteps,
    updateGoals,
    updateWater,
    addWater,
    updateSleep
  };
}

// =========================================================================
// Tests: Historical Data Protection & Isolation
// =========================================================================

test('Adversarial 1: Modifying today does NOT mutate or delete historical days', () => {
  const pastDay1 = { date: '2026-09-22', workouts: [{ type: 'Running', duration: 30 }], steps: 8000, water: 6, sleep: 7 };
  const pastDay2 = { date: '2026-09-23', workouts: [{ type: 'Yoga', duration: 45 }], steps: 11000, water: 8, sleep: 8.5 };

  const store = createFullMockHabitsStore([pastDay1, pastDay2]);
  
  // Add water to today
  store.updateWater(3);
  store.updateSleep(7.2);
  store.updateSteps(5400);
  store.addWorkout({ type: 'Weights', duration: 40 });

  const habits = store.getHabits();
  assert.equal(habits.length, 3, 'Should have exactly 3 days (2 past + 1 today)');

  // Verify historical days are intact and untouched
  const day1 = habits.find(h => h.date === '2026-09-22');
  assert.deepEqual(day1, pastDay1, 'Past day 1 must remain completely unchanged');

  const day2 = habits.find(h => h.date === '2026-09-23');
  assert.deepEqual(day2, pastDay2, 'Past day 2 must remain completely unchanged');

  // Verify today is created properly
  const today = habits.find(h => h.date === '2026-09-24');
  assert.equal(today.water, 3);
  assert.equal(today.sleep, 7.2);
  assert.equal(today.steps, 5400);
  assert.equal(today.workouts.length, 1);
  assert.equal(today.workouts[0].type, 'Weights');

  // Verify localStorage synchronization
  const stored = JSON.parse(store.getLocalStorage()['habitlyDataV2']);
  assert.equal(stored.length, 3);
  assert.equal(stored[2].water, 3);
});

// =========================================================================
// Tests: Rapid Concurrency & Stale Closure Stress Test
// =========================================================================

test('Adversarial 2: Rapid sequential water additions accumulate correctly without dropped updates', () => {
  const store = createFullMockHabitsStore();

  // Simulate 100 rapid clicks of "+1 glass"
  for (let i = 0; i < 100; i++) {
    store.addWater(1);
  }

  assert.equal(store.getTodayHabit().water, 100, '100 rapid additions must result in 100 glasses');

  // Mix of +2, +3, +4 glasses
  for (let i = 0; i < 10; i++) {
    store.addWater(2); // +20
    store.addWater(3); // +30
    store.addWater(4); // +40
  }
  assert.equal(store.getTodayHabit().water, 190, 'Mixed rapid additions must sum correctly');
});

// =========================================================================
// Tests: Malformed, Null, and Extreme Input Boundary Conditions
// =========================================================================

test('Adversarial 3: updateWater handles NaN, null, undefined, objects, negative numbers', () => {
  const store = createFullMockHabitsStore();

  // Initial is 0
  assert.equal(store.getTodayHabit().water, 0);

  // Non-numeric strings
  store.updateWater('invalid-text');
  assert.equal(store.getTodayHabit().water, 0, 'NaN delta should result in 0 change');

  // Null & undefined
  store.updateWater(null);
  assert.equal(store.getTodayHabit().water, 0);
  store.updateWater(undefined);
  assert.equal(store.getTodayHabit().water, 0);

  // Object / array input
  store.updateWater({});
  assert.equal(store.getTodayHabit().water, 0);

  // Negative delta clamping at 0
  store.updateWater(-50);
  assert.equal(store.getTodayHabit().water, 0, 'Water cannot go below 0');

  // Valid addition
  store.updateWater(10);
  assert.equal(store.getTodayHabit().water, 10);

  // Subtracting less than total
  store.updateWater(-4);
  assert.equal(store.getTodayHabit().water, 6);

  // Subtracting more than total clamps at 0
  store.updateWater(-20);
  assert.equal(store.getTodayHabit().water, 0);

  // Decimal water e.g. 0.5 glasses
  store.updateWater(0.5);
  assert.equal(store.getTodayHabit().water, 0.5);
  store.updateWater(1.5);
  assert.equal(store.getTodayHabit().water, 2.0);

  // Absolute mode with negative value clamps at 0
  store.updateWater(-8, true);
  assert.equal(store.getTodayHabit().water, 0);

  // Absolute mode with huge value
  store.updateWater(999999, true);
  assert.equal(store.getTodayHabit().water, 999999);
});

test('Adversarial 4: updateSleep handles decimal precision, zero, negative, and invalid values', () => {
  const store = createFullMockHabitsStore();

  // Decimal sleep values
  store.updateSleep(6.75);
  assert.equal(store.getTodayHabit().sleep, 6.75);

  store.updateSleep('7.8');
  assert.equal(store.getTodayHabit().sleep, 7.8);

  // Zero hours (e.g. all-nighter)
  store.updateSleep(0);
  assert.equal(store.getTodayHabit().sleep, 0);

  // Negative hours clamps to 0
  store.updateSleep(-8);
  assert.equal(store.getTodayHabit().sleep, 0);

  // Invalid string
  store.updateSleep('not_a_number');
  assert.equal(store.getTodayHabit().sleep, 0);
});

test('Adversarial 5: Multiple workouts aggregation and missing fields', () => {
  const store = createFullMockHabitsStore();

  store.addWorkout({ type: 'HIIT', duration: 25 });
  store.addWorkout({ type: 'Swimming', duration: 35, calories: 300 });
  store.addWorkout({ type: 'Other', duration: 15, name: 'Rock Climbing' });

  const today = store.getTodayHabit();
  assert.equal(today.workouts.length, 3);

  // Verify workout minutes sum calculation like DashboardScreen line 75
  const totalMins = today.workouts.reduce((acc, w) => acc + (w.duration || 0), 0);
  assert.equal(totalMins, 75);
});

// =========================================================================
// Tests: Codebase Integrity Violations Audit
// =========================================================================

test('Integrity: Source files do not contain hardcoded mock bypasses or cheats', () => {
  const filesToCheck = [
    'src/hooks/useHabits.js',
    'src/components/DashboardScreen.jsx',
    'src/components/QuickLogModal.jsx',
    'src/App.jsx'
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(projectRoot, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Check for obvious cheat tokens or test bypasses
    assert.ok(!content.includes('__MOCK_PASS__'), `${relPath} contains __MOCK_PASS__`);
    assert.ok(!content.includes('process.env.NODE_ENV === "test" && return true'), `${relPath} contains test short-circuit`);
    assert.ok(!content.includes('// dummy implementation'), `${relPath} contains dummy comment`);
    assert.ok(!content.includes('// fake logic'), `${relPath} contains fake logic comment`);
    assert.ok(!content.includes('return 42; // cheat'), `${relPath} contains cheat token`);
  }
});

// =========================================================================
// Tests: UI & Contract Invariants
// =========================================================================

test('Contract: DashboardScreen ProgressRing onLog stops propagation', () => {
  const dsPath = path.join(projectRoot, 'src', 'components', 'DashboardScreen.jsx');
  const content = fs.readFileSync(dsPath, 'utf8');

  // Check stopPropagation on onLog button
  assert.ok(content.includes('e.stopPropagation()'), 'DashboardScreen ProgressRing button must stop propagation');
});

test('Contract: QuickLogModal has accessible dialog attributes and escape handling', () => {
  const qmPath = path.join(projectRoot, 'src', 'components', 'QuickLogModal.jsx');
  const content = fs.readFileSync(qmPath, 'utf8');

  assert.ok(content.includes('role="dialog"'), 'QuickLogModal must have role="dialog"');
  assert.ok(content.includes('aria-modal="true"'), 'QuickLogModal must have aria-modal="true"');
  assert.ok(content.includes('aria-labelledby="quick-log-title"'), 'QuickLogModal must have aria-labelledby');
  assert.ok(content.includes('e.key === \'Escape\''), 'QuickLogModal must handle Escape key');
  assert.ok(content.includes('removeEventListener'), 'QuickLogModal must clean up keydown listener');
});
