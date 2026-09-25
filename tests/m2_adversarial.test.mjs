import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// =========================================================================
// 1. useHabits State Management Logic Verification
// =========================================================================

// Extracted pure simulation of the updateToday and hook handlers logic
function createHabitsStore(initialHabits = [], initialGoals = { water: 8, sleep: 8, steps: 10000, workout: 30 }) {
  let habits = [...initialHabits];
  let goals = { ...initialGoals };

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
    const existing = habits.find(h => h.date === today) || {
      date: today,
      workouts: [],
      foods: [],
      steps: 0,
      water: 0,
      sleep: 0
    };
    const updates = typeof updatesOrFn === 'function' ? updatesOrFn(existing) : updatesOrFn;

    let found = false;
    const newHabits = habits.map(h => {
      if (h.date === today) {
        found = true;
        return { ...h, ...updates };
      }
      return h;
    });

    if (!found) {
      newHabits.push({ ...existing, ...updates });
    }
    habits = newHabits;
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

  const updateSteps = (steps) => {
    updateToday({ steps: Math.max(0, Number(steps) || 0) });
  };

  const addWorkout = (workout) => {
    updateToday(current => ({
      workouts: [...(current.workouts || []), workout]
    }));
  };

  return {
    getHabits: () => habits,
    getGoals: () => goals,
    getTodayHabit,
    updateWater,
    addWater,
    updateSleep,
    updateSteps,
    addWorkout
  };
}

test('State: updateWater delta mode and clamping', () => {
  const store = createHabitsStore();
  assert.equal(store.getTodayHabit().water, 0);

  // Add 1 glass
  store.updateWater(1);
  assert.equal(store.getTodayHabit().water, 1);

  // Add 2 glasses
  store.updateWater(2);
  assert.equal(store.getTodayHabit().water, 3);

  // Negative delta
  store.updateWater(-1);
  assert.equal(store.getTodayHabit().water, 2);

  // Clamp below zero
  store.updateWater(-10);
  assert.equal(store.getTodayHabit().water, 0, 'Water should clamp at 0');
});

test('State: updateWater absolute mode', () => {
  const store = createHabitsStore();

  // Set absolute to 8
  store.updateWater(8, true);
  assert.equal(store.getTodayHabit().water, 8);

  // Set absolute to 4
  store.updateWater(4, true);
  assert.equal(store.getTodayHabit().water, 4);

  // Set absolute to negative clamps to 0
  store.updateWater(-3, true);
  assert.equal(store.getTodayHabit().water, 0);
});

test('State: addWater helper function', () => {
  const store = createHabitsStore();

  // Default is 1 glass
  store.addWater();
  assert.equal(store.getTodayHabit().water, 1);

  // Explicit glasses
  store.addWater(3);
  assert.equal(store.getTodayHabit().water, 4);

  store.addWater(2);
  assert.equal(store.getTodayHabit().water, 6);
});

test('State: updateSleep with decimal support and clamping', () => {
  const store = createHabitsStore();
  assert.equal(store.getTodayHabit().sleep, 0);

  // Decimal sleep e.g. 7.5 hrs
  store.updateSleep(7.5);
  assert.equal(store.getTodayHabit().sleep, 7.5);

  // Fractional sleep
  store.updateSleep(8.25);
  assert.equal(store.getTodayHabit().sleep, 8.25);

  // String numeric input
  store.updateSleep('6.5');
  assert.equal(store.getTodayHabit().sleep, 6.5);

  // Negative clamps to 0
  store.updateSleep(-4);
  assert.equal(store.getTodayHabit().sleep, 0);
});

test('State: updateSteps and addWorkout integration', () => {
  const store = createHabitsStore();

  store.updateSteps(5000);
  assert.equal(store.getTodayHabit().steps, 5000);

  store.updateSteps(12500);
  assert.equal(store.getTodayHabit().steps, 12500);

  store.addWorkout({ type: 'Running', duration: 45, calories: 350 });
  store.addWorkout({ type: 'Weights', duration: 30, calories: 200 });

  const today = store.getTodayHabit();
  assert.equal(today.workouts.length, 2);
  assert.equal(today.workouts[0].type, 'Running');
  assert.equal(today.workouts[0].duration, 45);
  assert.equal(today.workouts[1].type, 'Weights');
  assert.equal(today.workouts[1].duration, 30);
});


// =========================================================================
// 2. Source Code Contracts & File Verification
// =========================================================================

test('Contract: useHabits.js exports updateWater, addWater, and updateSleep', () => {
  const filePath = path.join(projectRoot, 'src', 'hooks', 'useHabits.js');
  assert.ok(fs.existsSync(filePath), 'useHabits.js must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(content.includes('updateWater'), 'Must define and export updateWater');
  assert.ok(content.includes('addWater'), 'Must define and export addWater');
  assert.ok(content.includes('updateSleep'), 'Must define and export updateSleep');

  // Verify function signatures
  assert.ok(content.includes('updateWater = (amountOrDelta, isAbsolute = false)'), 'updateWater must accept amountOrDelta and isAbsolute');
  assert.ok(content.includes('addWater = (glasses = 1)'), 'addWater helper must accept glasses');
  assert.ok(content.includes('updateSleep = (hours)'), 'updateSleep must accept hours');
});

test('Contract: App.jsx destructures handlers and passes them to DashboardScreen', () => {
  const filePath = path.join(projectRoot, 'src', 'App.jsx');
  assert.ok(fs.existsSync(filePath), 'App.jsx must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  // Destructuring
  assert.ok(content.includes('updateWater'), 'App.jsx must destructure updateWater');
  assert.ok(content.includes('addWater'), 'App.jsx must destructure addWater');
  assert.ok(content.includes('updateSleep'), 'App.jsx must destructure updateSleep');

  // Passing props down to DashboardScreen
  assert.ok(content.includes('updateWater={updateWater}'), 'App.jsx must pass updateWater to DashboardScreen');
  assert.ok(content.includes('addWater={addWater}'), 'App.jsx must pass addWater to DashboardScreen');
  assert.ok(content.includes('updateSleep={updateSleep}'), 'App.jsx must pass updateSleep to DashboardScreen');
  assert.ok(content.includes('updateSteps={updateSteps}'), 'App.jsx must pass updateSteps to DashboardScreen');
  assert.ok(content.includes('addWorkout={addWorkout}'), 'App.jsx must pass addWorkout to DashboardScreen');
});

test('Contract: DashboardScreen.jsx implements ProgressRing "+ Log" buttons', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DashboardScreen.jsx');
  assert.ok(fs.existsSync(filePath), 'DashboardScreen.jsx must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  // Must contain "+ Log" button
  assert.ok(content.includes('+ Log'), 'ProgressRing must render "+ Log" button');
  assert.ok(content.includes('aria-label={`+ Log ${label}`}'), 'ProgressRing button must include accessible label');

  // Water ring wiring
  assert.ok(content.includes('label="Water"'), 'Must have Water progress ring');
  assert.ok(content.includes("onLog={() => handleOpenQuickLog('water')}"), 'Water ring must open quick log with water tab');

  // Sleep ring wiring
  assert.ok(content.includes('label="Sleep"'), 'Must have Sleep progress ring');
  assert.ok(content.includes("onLog={() => handleOpenQuickLog('sleep')}"), 'Sleep ring must open quick log with sleep tab');

  // Styling accents
  assert.ok(content.includes('blue'), 'Water ring + Log must have blue theme accent');
  assert.ok(content.includes('indigo'), 'Sleep ring + Log must have indigo theme accent');
});

test('Contract: DashboardScreen.jsx implements Floating Quick-Log Button (FAB)', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DashboardScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // FAB button presence & positioning
  assert.ok(content.includes('fixed bottom-8 right-8 z-40'), 'FAB must be fixed bottom-8 right-8 z-40');
  assert.ok(content.includes('aria-label="Quick Log"'), 'FAB must have aria-label="Quick Log"');
  assert.ok(content.includes('title="Quick Log"'), 'FAB must have title="Quick Log"');

  // Glow and styling
  assert.ok(content.includes('rounded-full'), 'FAB must be circular rounded-full');
  assert.ok(content.includes('shadow-['), 'FAB must have accent glow shadow');

  // Opens QuickLogModal
  assert.ok(content.includes('QuickLogModal'), 'DashboardScreen must render QuickLogModal');
});

test('Contract: QuickLogModal.jsx existence, tabs, and dark theme modal', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'QuickLogModal.jsx');
  assert.ok(fs.existsSync(filePath), 'QuickLogModal.jsx must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  // Dark modal styling
  assert.ok(content.includes('fixed inset-0 bg-black/75 backdrop-blur-sm z-[60]'), 'Modal must have dark backdrop with z-[60]');
  assert.ok(content.includes('role="dialog"'), 'Modal must have dialog role');
  assert.ok(content.includes('aria-modal="true"'), 'Modal must have aria-modal attribute');

  // Dismissible mechanisms
  assert.ok(content.includes('Escape'), 'Modal must handle Escape key');
  assert.ok(content.includes('onClose'), 'Modal must trigger onClose');
  assert.ok(content.includes('Close modal'), 'Modal must have close button');

  // Dedicated tabs
  assert.ok(content.includes('Water') && content.includes("'water'"), 'Must support Water tab');
  assert.ok(content.includes('Sleep') && content.includes("'sleep'"), 'Must support Sleep tab');
  assert.ok(content.includes('Steps') && content.includes("'steps'"), 'Must support Steps tab');
  assert.ok(content.includes('Workout') && content.includes("'workout'"), 'Must support Workout tab');

  // Water features: quick buttons + custom
  assert.ok(content.includes('Quick Add Glasses'), 'Water tab must provide quick add');
  assert.ok(content.includes('Custom Amount'), 'Water tab must provide custom input');

  // Sleep features: hours selector + decimal support
  assert.ok(content.includes('Preset Hours'), 'Sleep tab must provide preset hours');
  assert.ok(content.includes('step="0.1"') || content.includes('step="0.5"'), 'Sleep tab must support decimal steps');

  // Steps features: quick add presets + custom
  assert.ok(content.includes('Quick Add Steps'), 'Steps tab must provide quick add');
  assert.ok(content.includes('Custom Steps'), 'Steps tab must provide custom steps');

  // Workout features: workout types, duration, calories
  assert.ok(content.includes('Workout Type'), 'Workout tab must have workout types');
  assert.ok(content.includes('Duration'), 'Workout tab must have duration');
  assert.ok(content.includes('Calories'), 'Workout tab must have calories');
});

test('Contract: Production build includes QuickLogModal and updated assets', () => {
  const distHtmlPath = path.join(projectRoot, 'dist', 'index.html');
  assert.ok(fs.existsSync(distHtmlPath), 'dist/index.html must exist');

  const assetsDir = path.join(projectRoot, 'dist', 'assets');
  const files = fs.readdirSync(assetsDir);
  const jsBundle = files.find(f => f.endsWith('.js'));
  assert.ok(jsBundle, 'JavaScript bundle must exist in dist/assets');

  const bundleContent = fs.readFileSync(path.join(assetsDir, jsBundle), 'utf8');
  assert.ok(bundleContent.includes('Quick Log'), 'Built bundle must contain Quick Log text');
  assert.ok(bundleContent.includes('+ Log'), 'Built bundle must contain + Log text');
});
