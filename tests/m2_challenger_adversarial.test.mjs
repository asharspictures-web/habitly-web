import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// =========================================================================
// 1. EXACT REPRODUCTION OF STATE LOGIC (from src/hooks/useHabits.js)
// =========================================================================

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

// =========================================================================
// 2. MODAL FORM VALIDATION SIMULATION (from src/components/QuickLogModal.jsx)
// =========================================================================

function simulateModal({
  todayData = { water: 0, sleep: 0, steps: 0 },
  store
}) {
  let activeTab = 'water';
  let feedback = null;
  let customWater = '';
  let sleepHours = todayData?.sleep ? String(todayData.sleep) : '7.5';
  let customSteps = '';

  const triggerFeedback = (message, type = 'success') => {
    feedback = { type, message };
  };

  const switchTab = (newTab) => {
    activeTab = newTab;
    feedback = null;
  };

  const handleQuickWaterAdd = (amount) => {
    store.addWater(amount);
    const currentWater = Number(store.getTodayHabit().water);
    triggerFeedback(`+${amount} glass${amount > 1 ? 'es' : ''} added! Total: ${currentWater} glasses.`);
  };

  const handleCustomWater = (valStr, isAbsolute = false) => {
    customWater = valStr;
    const val = Number(customWater);
    if (isNaN(val) || val <= 0) {
      triggerFeedback('Please enter a valid number of glasses (> 0).', 'error');
      return { ok: false, error: feedback.message };
    }
    if (isAbsolute) {
      store.updateWater(val, true);
      triggerFeedback(`Water intake set to ${val} glasses.`);
    } else {
      store.addWater(val);
      const currentWater = store.getTodayHabit().water;
      triggerFeedback(`Added ${val} glasses. Total: ${currentWater} glasses.`);
    }
    customWater = '';
    return { ok: true, message: feedback.message };
  };

  const handleSaveSleep = (hoursToSave) => {
    const hours = Number(hoursToSave ?? sleepHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      triggerFeedback('Please enter sleep hours between 0 and 24.', 'error');
      return { ok: false, error: feedback.message };
    }
    store.updateSleep(hours);
    triggerFeedback(`Sleep logged: ${hours} hours.`);
    return { ok: true, message: feedback.message };
  };

  const handleQuickStepsAdd = (amount) => {
    const currentSteps = Number(store.getTodayHabit().steps) || 0;
    const newTotal = currentSteps + amount;
    store.updateSteps(newTotal);
    triggerFeedback(`+${amount.toLocaleString()} steps added! Total: ${newTotal.toLocaleString()} steps.`);
  };

  const handleCustomSteps = (valStr, isAbsolute = false) => {
    customSteps = valStr;
    const val = Number(customSteps);
    if (isNaN(val) || val <= 0) {
      triggerFeedback('Please enter a valid step count (> 0).', 'error');
      return { ok: false, error: feedback.message };
    }
    if (isAbsolute) {
      store.updateSteps(val);
      triggerFeedback(`Steps set to ${val.toLocaleString()}.`);
    } else {
      const currentSteps = Number(store.getTodayHabit().steps) || 0;
      const newTotal = currentSteps + val;
      store.updateSteps(newTotal);
      triggerFeedback(`Added ${val.toLocaleString()} steps. Total: ${newTotal.toLocaleString()}.`);
    }
    customSteps = '';
    return { ok: true, message: feedback.message };
  };

  const handleSaveWorkout = ({ type, customType, durationStr, caloriesStr }) => {
    const duration = Number(durationStr);
    if (isNaN(duration) || duration <= 0) {
      triggerFeedback('Please enter a valid duration (> 0 minutes).', 'error');
      return { ok: false, error: feedback.message };
    }
    const finalType = type === 'Other' ? (customType?.trim() || 'Other Activity') : type;
    const calories = caloriesStr ? Number(caloriesStr) : undefined;

    store.addWorkout({
      type: finalType,
      duration,
      calories: calories && !isNaN(calories) ? calories : undefined,
      date: new Date().toISOString()
    });

    triggerFeedback(`Logged ${duration} min of ${finalType}!`);
    return { ok: true, message: feedback.message };
  };

  return {
    getActiveTab: () => activeTab,
    getFeedback: () => feedback,
    getCustomWater: () => customWater,
    getSleepHours: () => sleepHours,
    switchTab,
    handleQuickWaterAdd,
    handleCustomWater,
    handleSaveSleep,
    handleQuickStepsAdd,
    handleCustomSteps,
    handleSaveWorkout
  };
}

// =========================================================================
// 3. PROGRESS RING CALCULATION (from src/components/DashboardScreen.jsx)
// =========================================================================

function calculateProgressRing(current, goal) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min((current / (goal || 1)) * 100, 100);
  const offset = circumference - (pct / 100) * circumference;
  const isComplete = pct >= 100;
  return { pct, offset, isComplete, circumference };
}

// =========================================================================
// TEST SUITE: ADVERSARIAL CHALLENGES
// =========================================================================

test('Challenger M2: Negative inputs are clamped or safely rejected', () => {
  const store = createHabitsStore();
  const modal = simulateModal({ store });

  // 1. Water negative inputs in modal
  const waterRes = modal.handleCustomWater('-5', false);
  assert.equal(waterRes.ok, false, 'Modal should reject negative custom water');
  assert.match(waterRes.error, /Please enter a valid number of glasses/);
  assert.equal(store.getTodayHabit().water, 0, 'Store water must remain 0');

  const waterAbsRes = modal.handleCustomWater('-10', true);
  assert.equal(waterAbsRes.ok, false, 'Modal should reject negative absolute water');
  assert.equal(store.getTodayHabit().water, 0);

  // 2. Direct store clamping on negative delta
  store.updateWater(5); // +5
  assert.equal(store.getTodayHabit().water, 5);
  store.updateWater(-2); // 5 - 2 = 3
  assert.equal(store.getTodayHabit().water, 3);
  store.updateWater(-20); // 3 - 20 = -17 -> clamped to 0
  assert.equal(store.getTodayHabit().water, 0, 'Store water must clamp at 0');

  // 3. Sleep negative inputs in modal
  const sleepRes = modal.handleSaveSleep('-2');
  assert.equal(sleepRes.ok, false, 'Modal should reject negative sleep hours');
  assert.match(sleepRes.error, /between 0 and 24/);
  assert.equal(store.getTodayHabit().sleep, 0);

  // 4. Direct store clamping on negative sleep
  store.updateSleep(-8);
  assert.equal(store.getTodayHabit().sleep, 0, 'Store sleep must clamp at 0');

  // 5. Steps negative inputs in modal
  const stepsRes = modal.handleCustomSteps('-500', false);
  assert.equal(stepsRes.ok, false, 'Modal should reject negative steps');
  assert.match(stepsRes.error, /valid step count/);
  assert.equal(store.getTodayHabit().steps, 0);

  // 6. Direct store clamping on negative steps
  store.updateSteps(-10000);
  assert.equal(store.getTodayHabit().steps, 0, 'Store steps must clamp at 0');

  // 7. Workout negative duration in modal
  const workoutRes = modal.handleSaveWorkout({
    type: 'Running',
    durationStr: '-30',
    caloriesStr: '200'
  });
  assert.equal(workoutRes.ok, false, 'Modal should reject negative workout duration');
  assert.match(workoutRes.error, /valid duration/);
  assert.equal(store.getTodayHabit().workouts.length, 0);
});

test('Challenger M2: Non-numeric and decimal inputs handling', () => {
  const store = createHabitsStore();
  const modal = simulateModal({ store });

  // 1. Non-numeric "abc" on Water
  const waterAbc = modal.handleCustomWater('abc', false);
  assert.equal(waterAbc.ok, false);
  assert.match(waterAbc.error, /Please enter a valid number of glasses/);

  // 2. Decimal Water input (e.g. 0.5 glasses, 2.5 glasses)
  const waterDec1 = modal.handleCustomWater('0.5', false);
  assert.equal(waterDec1.ok, true);
  assert.equal(store.getTodayHabit().water, 0.5);

  const waterDec2 = modal.handleCustomWater('2.5', false);
  assert.equal(waterDec2.ok, true);
  assert.equal(store.getTodayHabit().water, 3.0);

  // 3. Non-numeric "xyz" on Sleep
  const sleepAbc = modal.handleSaveSleep('xyz');
  assert.equal(sleepAbc.ok, false);
  assert.match(sleepAbc.error, /between 0 and 24/);

  // 4. Decimal Sleep input (e.g. 7.25 hours, 8.5 hours)
  const sleepDec = modal.handleSaveSleep('7.25');
  assert.equal(sleepDec.ok, true);
  assert.equal(store.getTodayHabit().sleep, 7.25);

  // 5. Non-numeric on Steps
  const stepsAbc = modal.handleCustomSteps('invalid', false);
  assert.equal(stepsAbc.ok, false);

  // 6. Non-numeric on Workout
  const workoutAbc = modal.handleSaveWorkout({
    type: 'Cycling',
    durationStr: 'NaN',
    caloriesStr: ''
  });
  assert.equal(workoutAbc.ok, false);

  // 7. Decimal workout duration (e.g. 45.5 mins)
  const workoutDec = modal.handleSaveWorkout({
    type: 'Cycling',
    durationStr: '45.5',
    caloriesStr: '300'
  });
  assert.equal(workoutDec.ok, true);
  assert.equal(store.getTodayHabit().workouts[0].duration, 45.5);
});

test('Challenger M2: Large and extreme values survive without crashing', () => {
  const store = createHabitsStore();
  const modal = simulateModal({ store });

  // 1. 50,000 steps
  const steps50k = modal.handleCustomSteps('50000', true);
  assert.equal(steps50k.ok, true);
  assert.equal(store.getTodayHabit().steps, 50000);

  // Progress ring for 50,000 steps (goal: 10,000)
  const ringSteps = calculateProgressRing(50000, 10000);
  assert.equal(ringSteps.pct, 100, 'Pct must be clamped at 100%');
  assert.equal(ringSteps.offset, 0, 'Offset must be 0 for complete ring');
  assert.equal(ringSteps.isComplete, true);

  // 2. 1,000 minutes workout
  const workout1000 = modal.handleSaveWorkout({
    type: 'Swimming',
    durationStr: '1000',
    caloriesStr: '5000'
  });
  assert.equal(workout1000.ok, true);
  assert.equal(store.getTodayHabit().workouts[0].duration, 1000);

  // Progress ring for 1,000 min workout (goal: 30)
  const ringWorkout = calculateProgressRing(1000, 30);
  assert.equal(ringWorkout.pct, 100);
  assert.equal(ringWorkout.isComplete, true);

  // 3. Sleep > 24 hours must be rejected by modal
  const sleep25 = modal.handleSaveSleep('25');
  assert.equal(sleep25.ok, false, 'Sleep > 24 must be rejected');
  assert.match(sleep25.error, /between 0 and 24/);

  const sleep100 = modal.handleSaveSleep('100');
  assert.equal(sleep100.ok, false);
});

test('Challenger M2: Modal tab switching preserves state and clears stale feedback', () => {
  const store = createHabitsStore();
  const modal = simulateModal({ store });

  assert.equal(modal.getActiveTab(), 'water');

  // Trigger error feedback in water tab
  modal.handleCustomWater('-1');
  assert.ok(modal.getFeedback() !== null, 'Feedback should exist after error');
  assert.equal(modal.getFeedback().type, 'error');

  // Switch to sleep tab
  modal.switchTab('sleep');
  assert.equal(modal.getActiveTab(), 'sleep');
  assert.equal(modal.getFeedback(), null, 'Switching tab must immediately clear stale feedback');

  // Switch to steps tab
  modal.switchTab('steps');
  assert.equal(modal.getActiveTab(), 'steps');

  // Switch to workout tab
  modal.switchTab('workout');
  assert.equal(modal.getActiveTab(), 'workout');

  // Switch back to water tab
  modal.switchTab('water');
  assert.equal(modal.getActiveTab(), 'water');
  assert.equal(modal.getFeedback(), null);
});

test('Challenger M2: Modal triggers from Water "+ Log" vs Sleep "+ Log" vs FAB button', () => {
  const dashboardContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'DashboardScreen.jsx'), 'utf8');

  // Verify Water ring triggers quick log with 'water' tab
  const waterMatch = dashboardContent.includes("onLog={() => handleOpenQuickLog('water')}");
  assert.ok(waterMatch, 'Water ring must call handleOpenQuickLog("water")');

  // Verify Sleep ring triggers quick log with 'sleep' tab
  const sleepMatch = dashboardContent.includes("onLog={() => handleOpenQuickLog('sleep')}");
  assert.ok(sleepMatch, 'Sleep ring must call handleOpenQuickLog("sleep")');

  // Verify FAB button triggers quick log with 'water' tab
  const fabMatch = dashboardContent.includes("onClick={() => handleOpenQuickLog('water')}");
  assert.ok(fabMatch, 'FAB button must call handleOpenQuickLog("water")');

  // Verify QuickLogModal key is updated with tab and open state to prevent stale state remount issues
  assert.ok(dashboardContent.includes('key={`${isQuickLogOpen}-${quickLogTab}`}'), 'Modal must have dynamic composite key');
});

test('Challenger M2: Modal dismissal mechanisms (Escape, Backdrop click, and X close button)', () => {
  const modalContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'QuickLogModal.jsx'), 'utf8');

  // 1. Escape key listener
  assert.ok(modalContent.includes("if (e.key === 'Escape')"), 'Escape key listener must be present');
  assert.ok(modalContent.includes("window.addEventListener('keydown', handleKeyDown)"), 'Must attach keydown listener');
  assert.ok(modalContent.includes("window.removeEventListener('keydown', handleKeyDown)"), 'Must cleanup keydown listener');

  // 2. Backdrop click
  assert.ok(modalContent.includes("if (e.target === e.currentTarget) onClose();"), 'Backdrop click must check target === currentTarget');
  assert.ok(modalContent.includes("onClick={(e) => e.stopPropagation()}"), 'Modal card must stop propagation to prevent accidental close');

  // 3. X Close Button
  assert.ok(modalContent.includes('aria-label="Close modal"'), 'Must have accessible close button');
  assert.ok(modalContent.includes('onClick={onClose}'), 'Close button must call onClose');

  // 4. Done Button
  assert.ok(modalContent.includes('Done'), 'Done button present in footer');
});

test('Challenger M2: Rapid sequential updates prevent race conditions and preserve data integrity', () => {
  const store = createHabitsStore();
  const modal = simulateModal({ store });

  // Simulate user rapidly clicking quick add buttons in water
  modal.handleQuickWaterAdd(1);
  modal.handleQuickWaterAdd(2);
  modal.handleQuickWaterAdd(3);
  modal.handleQuickWaterAdd(4);

  assert.equal(store.getTodayHabit().water, 10, 'Rapid water additions must accumulate to 10');

  // Simulate user rapidly adding steps
  modal.handleQuickStepsAdd(1000);
  modal.handleQuickStepsAdd(2500);
  modal.handleQuickStepsAdd(5000);

  assert.equal(store.getTodayHabit().steps, 8500, 'Rapid step additions must accumulate to 8500');

  // Simulate adding multiple workouts
  modal.handleSaveWorkout({ type: 'Weights', durationStr: '45', caloriesStr: '250' });
  modal.handleSaveWorkout({ type: 'Running', durationStr: '30', caloriesStr: '300' });
  modal.handleSaveWorkout({ type: 'Yoga', durationStr: '20', caloriesStr: '80' });

  const today = store.getTodayHabit();
  assert.equal(today.workouts.length, 3);
  const totalMins = today.workouts.reduce((acc, w) => acc + w.duration, 0);
  assert.equal(totalMins, 95);
});

test('Challenger M2: ProgressRing math edge cases (0 goal, 0 current, fractional values)', () => {
  // 1. Goal is 0 or undefined -> avoid division by zero
  const ringZeroGoal = calculateProgressRing(5, 0);
  assert.ok(!isNaN(ringZeroGoal.pct), 'Pct must not be NaN when goal is 0');
  assert.ok(isFinite(ringZeroGoal.pct), 'Pct must be finite when goal is 0');

  // 2. Current is 0
  const ringZeroCurrent = calculateProgressRing(0, 8);
  assert.equal(ringZeroCurrent.pct, 0);
  assert.equal(ringZeroCurrent.isComplete, false);
  assert.equal(ringZeroCurrent.offset, ringZeroCurrent.circumference);

  // 3. Fractional current (e.g. 7.5 hrs sleep out of 8)
  const ringFractional = calculateProgressRing(7.5, 8);
  assert.equal(ringFractional.pct, (7.5 / 8) * 100);
  assert.equal(ringFractional.isComplete, false);
});
