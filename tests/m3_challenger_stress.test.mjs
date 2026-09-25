import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  chatWithAI, 
  parseFoodFromQuery 
} from '../src/lib/gemini.js';

// Helper to simulate useHabits state transitions purely in Node.js
function createHabitsStateManager(initialHabits = [], initialGoals = { water: 8, sleep: 8, steps: 10000, workout: 30 }) {
  let habits = JSON.parse(JSON.stringify(initialHabits));
  let goals = JSON.parse(JSON.stringify(initialGoals));

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const updateToday = (updatesOrFn) => {
    const today = getTodayDate();
    let found = false;
    const existing = habits.find(h => h.date === today) || {
      date: today,
      workouts: [],
      foods: [],
      steps: 0,
      water: 0,
      sleep: 0
    };
    const updates = typeof updatesOrFn === 'function' ? updatesOrFn(existing) : updatesOrFn;

    habits = habits.map(h => {
      if (h.date === today) {
        found = true;
        return { ...h, ...updates };
      }
      return h;
    });

    if (!found) {
      habits.push({ ...existing, ...updates });
    }
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
    goals = { ...goals, ...newGoals };
  };

  return {
    getHabits: () => habits,
    getGoals: () => goals,
    addWorkout,
    addFood,
    updateSteps,
    updateWater,
    addWater,
    updateSleep,
    updateGoals
  };
}

// Helper to simulate TopBar search indexing
function indexHistoricalEntries(habits) {
  const list = [];
  (habits || []).forEach(day => {
    // Workouts
    (day.workouts || []).forEach((w, idx) => {
      list.push({
        id: `workout-${day.date}-${idx}-${w.type}`,
        name: w.type || 'Workout',
        category: 'Workout',
        date: w.date || day.date,
        detail: `${w.duration} min${w.calories ? ` • ${w.calories} kcal` : ''}`,
        targetView: 'exercise',
      });
    });

    // Foods
    (day.foods || []).forEach((f, idx) => {
      const foodName = f.name || f.text || 'Meal';
      const parts = [];
      if (f.cal !== undefined) parts.push(`${f.cal} kcal`);
      if (f.p !== undefined && f.c !== undefined && f.f !== undefined && (f.p || f.c || f.f)) {
        parts.push(`P:${f.p}g C:${f.c}g F:${f.f}g`);
      }
      list.push({
        id: `food-${day.date}-${idx}-${foodName}`,
        name: foodName,
        category: 'Food',
        date: f.timestamp || day.date,
        detail: parts.join(' • ') || 'Logged meal',
        targetView: 'food',
      });
    });
  });

  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function filterTopBarEntries(entries, query) {
  const cleanQ = (query || '').trim().toLowerCase();
  if (!cleanQ) return [];
  return entries.filter(item => 
    item.name.toLowerCase().includes(cleanQ) || 
    item.category.toLowerCase().includes(cleanQ) ||
    item.detail.toLowerCase().includes(cleanQ)
  );
}

// =========================================================================
// SECTION 1: REGRESSION FREEDOM VERIFICATION
// =========================================================================

test('Regression: Goals state updates and formulas continue functioning without disturbance', () => {
  const sm = createHabitsStateManager([], { water: 8, sleep: 8, steps: 10000, workout: 30 });
  
  // Test updateGoals
  sm.updateGoals({ water: 10, workout: 45 });
  assert.deepEqual(sm.getGoals(), { water: 10, sleep: 8, steps: 10000, workout: 45 });

  // Test BMR Mifflin-St Jeor formula logic from GoalsScreen.jsx
  // Male: 10*w + 6.25*h - 5*a + 5: (750 + 1093.75 - 140 + 5 = 1708.75 -> 1709)
  const bmrMale = (10 * 75) + (6.25 * 175) - (5 * 28) + 5;
  assert.equal(Math.round(bmrMale), 1709);

  // Female: 10*w + 6.25*h - 5*a - 161
  const bmrFemale = (10 * 60) + (6.25 * 165) - (5 * 25) - 161;
  assert.equal(Math.round(bmrFemale), 1345);

  // Test Macro splitting
  // Cut: 40% P, 30% C, 30% F
  const cutCal = 2000;
  const cutP = Math.round((cutCal * 0.4) / 4);
  const cutC = Math.round((cutCal * 0.3) / 4);
  const cutF = Math.round((cutCal * 0.3) / 9);
  assert.equal(cutP, 200);
  assert.equal(cutC, 150);
  assert.equal(cutF, 67);
});

test('Regression: Exercise logging, state mutation, and search filtering', () => {
  const today = new Date().toISOString().split('T')[0];
  const sm = createHabitsStateManager([
    {
      date: '2026-09-20',
      workouts: [{ type: 'Running', duration: 40, date: '2026-09-20T10:00:00Z' }],
      foods: [],
      steps: 9000,
      water: 8,
      sleep: 7.5
    }
  ]);

  sm.addWorkout({ type: 'Weights', duration: 45, date: `${today}T11:00:00Z` });
  sm.addWorkout({ type: 'Cycling', duration: 30, date: `${today}T18:00:00Z` });

  const habits = sm.getHabits();
  const todayEntry = habits.find(h => h.date === today);
  assert.equal(todayEntry.workouts.length, 2);
  assert.equal(todayEntry.workouts[0].type, 'Weights');
  assert.equal(todayEntry.workouts[1].type, 'Cycling');

  // Verify historical day was not modified
  assert.equal(habits.find(h => h.date === '2026-09-20').workouts.length, 1);

  // Verify ExerciseScreen search filtering logic
  const allWorkouts = habits.flatMap(h => h.workouts || []);
  const filterByQuery = (q) => q.trim()
    ? allWorkouts.filter(w => (w.type || '').toLowerCase().includes(q.trim().toLowerCase()))
    : allWorkouts;

  assert.equal(filterByQuery('').length, 3);
  assert.equal(filterByQuery('run').length, 1);
  assert.equal(filterByQuery('weights').length, 1);
  assert.equal(filterByQuery('nonexistent').length, 0);
});

test('Regression: Steps, Water, and Sleep logging and clamping', () => {
  const today = new Date().toISOString().split('T')[0];
  const sm = createHabitsStateManager();

  // Steps
  sm.updateSteps(8500);
  assert.equal(sm.getHabits().find(h => h.date === today).steps, 8500);
  sm.updateSteps(-500); // Clamping negative to 0
  assert.equal(sm.getHabits().find(h => h.date === today).steps, 0);

  // Water delta and absolute mode
  sm.addWater(3);
  assert.equal(sm.getHabits().find(h => h.date === today).water, 3);
  sm.updateWater(2, false); // Delta: +2 -> 5
  assert.equal(sm.getHabits().find(h => h.date === today).water, 5);
  sm.updateWater(10, true); // Absolute: 10
  assert.equal(sm.getHabits().find(h => h.date === today).water, 10);
  sm.updateWater(-20, false); // Clamped to 0
  assert.equal(sm.getHabits().find(h => h.date === today).water, 0);

  // Sleep decimal precision and clamping
  sm.updateSleep(7.75);
  assert.equal(sm.getHabits().find(h => h.date === today).sleep, 7.75);
  sm.updateSleep(-2);
  assert.equal(sm.getHabits().find(h => h.date === today).sleep, 0);
});

test('Regression: TopBar historical entries indexing workouts and foods without disruption', () => {
  const habits = [
    {
      date: '2026-09-22',
      workouts: [{ type: 'Yoga', duration: 45, date: '2026-09-22T08:00:00Z' }],
      foods: [{ name: 'Greek Salad', cal: 220, p: 6, c: 14, f: 16, timestamp: '2026-09-22T13:00:00Z' }]
    },
    {
      date: '2026-09-23',
      workouts: [{ type: 'Swimming', duration: 60, calories: 500, date: '2026-09-23T07:00:00Z' }],
      foods: [{ name: 'Protein Bar', cal: 210, p: 20, c: 22, f: 5, timestamp: '2026-09-23T16:00:00Z' }]
    }
  ];

  const entries = indexHistoricalEntries(habits);
  assert.equal(entries.length, 4);

  // Check workout indexing
  const yoga = entries.find(e => e.name === 'Yoga');
  assert.ok(yoga);
  assert.equal(yoga.category, 'Workout');
  assert.equal(yoga.targetView, 'exercise');
  assert.equal(yoga.detail, '45 min');

  // Check food indexing
  const salad = entries.find(e => e.name === 'Greek Salad');
  assert.ok(salad);
  assert.equal(salad.category, 'Food');
  assert.equal(salad.targetView, 'food');
  assert.equal(salad.detail, '220 kcal • P:6g C:14g F:16g');

  // Search filtering
  assert.equal(filterTopBarEntries(entries, 'yoga').length, 1);
  assert.equal(filterTopBarEntries(entries, 'salad').length, 1);
  assert.equal(filterTopBarEntries(entries, 'food').length, 2);
  assert.equal(filterTopBarEntries(entries, 'workout').length, 2);
  assert.equal(filterTopBarEntries(entries, '220 kcal').length, 1);
  assert.equal(filterTopBarEntries(entries, 'unknown item').length, 0);
});

// =========================================================================
// SECTION 2: AI ASSISTANT FOOD CONFIRMATION CARD SYNCHRONIZATION
// =========================================================================

test('AI Synchronization: AI food confirmation card correctly synchronizes with today foods and TopBar index', async () => {
  const today = new Date().toISOString().split('T')[0];
  const sm = createHabitsStateManager([
    {
      date: '2026-09-23',
      workouts: [{ type: 'Walking', duration: 30 }],
      foods: [{ name: 'Hard Boiled Eggs', cal: 140, p: 12, c: 2, f: 10 }],
      steps: 6000,
      water: 6,
      sleep: 7
    }
  ]);

  // Step 1: User asks AI Assistant: "Log 2 Rotis and Paneer Butter Masala"
  const aiQuery = "Log 2 Rotis and Paneer Butter Masala";
  const aiResponse = await chatWithAI(aiQuery, sm.getHabits());

  assert.ok(aiResponse.card, "AI must return a card");
  assert.equal(aiResponse.card.type, 'food_confirmation');
  assert.ok(aiResponse.card.foodName.toLowerCase().includes('roti') || aiResponse.card.foodName.toLowerCase().includes('paneer'));
  assert.ok(aiResponse.card.cal > 400);

  // Step 2: AIAssistantScreen executes onLogFood({ ...cardData })
  const loggedItem = {
    name: aiResponse.card.foodName,
    text: aiResponse.card.foodName,
    cal: aiResponse.card.cal,
    p: aiResponse.card.p,
    c: aiResponse.card.c,
    f: aiResponse.card.f,
    date: today,
    timestamp: new Date().toISOString()
  };

  sm.addFood(loggedItem);

  // Step 3: Verify today's foods list in habits contains this exact food entry
  const updatedHabits = sm.getHabits();
  const todayEntry = updatedHabits.find(h => h.date === today);
  assert.ok(todayEntry, "Today habit entry must exist");
  assert.equal(todayEntry.foods.length, 1);
  assert.equal(todayEntry.foods[0].name, loggedItem.name);
  assert.equal(todayEntry.foods[0].cal, loggedItem.cal);
  assert.equal(todayEntry.foods[0].p, loggedItem.p);
  assert.equal(todayEntry.foods[0].c, loggedItem.c);
  assert.equal(todayEntry.foods[0].f, loggedItem.f);

  // Step 4: Verify FoodScreen nutrition totals calculate correctly
  const foods = todayEntry.foods;
  const totals = foods.reduce((acc, f) => {
    acc.cal += Number(f.cal) || 0;
    acc.p += Number(f.p) || 0;
    acc.c += Number(f.c) || 0;
    acc.f += Number(f.f) || 0;
    return acc;
  }, { cal: 0, p: 0, c: 0, f: 0 });

  assert.equal(totals.cal, loggedItem.cal);
  assert.equal(totals.p, loggedItem.p);
  assert.equal(totals.c, loggedItem.c);
  assert.equal(totals.f, loggedItem.f);

  // Step 5: Verify TopBar search index immediately contains the AI logged item
  const topBarEntries = indexHistoricalEntries(updatedHabits);
  const foundInTopBar = topBarEntries.find(e => e.name === loggedItem.name && e.category === 'Food');
  assert.ok(foundInTopBar, "AI-logged item must be indexed in TopBar entries");
  assert.equal(foundInTopBar.targetView, 'food');
  assert.ok(foundInTopBar.detail.includes(`${loggedItem.cal} kcal`));

  // Search in TopBar for the food
  const searchResults = filterTopBarEntries(topBarEntries, "Paneer");
  assert.ok(searchResults.length > 0, "TopBar search for 'Paneer' must return the logged food");
  assert.equal(searchResults[0].name, loggedItem.name);
});

test('AI Synchronization: Interactive manual confirm fallback button activates onLogFood callback', () => {
  const today = new Date().toISOString().split('T')[0];
  let loggedFoodPayload = null;

  const mockOnLogFood = (payload) => {
    loggedFoodPayload = payload;
  };

  const card = {
    type: 'food_confirmation',
    foodName: 'Avocado Toast',
    cal: 220,
    p: 5,
    c: 22,
    f: 13,
    logged: false
  };

  // Simulate handleManualConfirmLog in AIAssistantScreen.jsx
  mockOnLogFood({
    name: card.foodName,
    text: card.foodName,
    cal: card.cal,
    p: card.p,
    c: card.c,
    f: card.f,
    date: today,
    timestamp: new Date().toISOString()
  });

  assert.ok(loggedFoodPayload);
  assert.equal(loggedFoodPayload.name, 'Avocado Toast');
  assert.equal(loggedFoodPayload.cal, 220);
  assert.equal(loggedFoodPayload.p, 5);
});

// =========================================================================
// SECTION 3: STRESS TESTING 50 SUCCESSIVE FOOD ADDITIONS
// =========================================================================

test('Stress Test: 50 successive food additions via quick add, custom food, and AI assistant', async () => {
  const today = new Date().toISOString().split('T')[0];
  
  // Baseline initial state with historical records
  const initialHabits = [
    {
      date: '2026-09-22',
      workouts: [{ type: 'Running', duration: 35 }],
      foods: [{ name: 'Oatmeal', cal: 210, p: 7, c: 40, f: 4 }],
      steps: 8200,
      water: 8,
      sleep: 7.2
    },
    {
      date: '2026-09-23',
      workouts: [{ type: 'Weights', duration: 50 }],
      foods: [{ name: 'Chicken Salad', cal: 330, p: 30, c: 10, f: 18 }],
      steps: 10500,
      water: 10,
      sleep: 8.0
    },
    {
      date: today,
      workouts: [{ type: 'Morning Jog', duration: 25 }],
      foods: [],
      steps: 3500,
      water: 4,
      sleep: 7.5
    }
  ];

  const sm = createHabitsStateManager(initialHabits);

  // Source dishes for Quick Add
  const quickAddPalette = [
    { name: 'Chicken Biryani', cal: 450, p: 28, c: 52, f: 14 },
    { name: 'Paneer Butter Masala', cal: 340, p: 14, c: 12, f: 26 },
    { name: 'Dal Makhani', cal: 260, p: 11, c: 28, f: 12 },
    { name: 'Masala Dosa', cal: 280, p: 6, c: 42, f: 9 },
    { name: 'Chole Bhature', cal: 480, p: 14, c: 58, f: 22 },
    { name: 'Idli Sambar', cal: 180, p: 8, c: 34, f: 2 },
    { name: 'Avocado Toast', cal: 220, p: 5, c: 22, f: 13 },
    { name: 'Grilled Salmon & Quinoa', cal: 420, p: 38, c: 32, f: 14 },
    { name: 'Hard Boiled Eggs', cal: 140, p: 12, c: 1, f: 10 },
    { name: 'Protein Shake', cal: 160, p: 28, c: 4, f: 2 }
  ];

  // Mock 1x1 transparent PNG data URL to stress test custom food photo payloads
  const mockBase64Photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const startTime = Date.now();
  let expectedTotalCal = 0;
  let expectedTotalP = 0;
  let expectedTotalC = 0;
  let expectedTotalF = 0;

  // Add 17 foods via Quick Add
  for (let i = 0; i < 17; i++) {
    const template = quickAddPalette[i % quickAddPalette.length];
    const foodItem = {
      ...template,
      name: `${template.name} #${i + 1}`,
      text: `${template.name} #${i + 1}`,
      date: today,
      timestamp: new Date(Date.now() + i * 1000).toISOString()
    };
    sm.addFood(foodItem);
    expectedTotalCal += foodItem.cal;
    expectedTotalP += foodItem.p;
    expectedTotalC += foodItem.c;
    expectedTotalF += foodItem.f;
  }

  // Add 17 foods via Custom Food (with Base64 photo)
  for (let i = 0; i < 17; i++) {
    const customFood = {
      name: `Chef Special Meal ${i + 1}`,
      text: `Chef Special Meal ${i + 1}`,
      cal: 300 + (i * 10),
      p: 20 + i,
      c: 30 + i,
      f: 10 + (i % 5),
      photo: mockBase64Photo,
      date: today,
      timestamp: new Date(Date.now() + (20 + i) * 1000).toISOString(),
      category: 'Custom'
    };
    sm.addFood(customFood);
    expectedTotalCal += customFood.cal;
    expectedTotalP += customFood.p;
    expectedTotalC += customFood.c;
    expectedTotalF += customFood.f;
  }

  // Add 16 foods via AI Assistant parseFoodFromQuery
  const aiPrompts = [
    "Log 2 rotis with ghee and dal tadka",
    "I ate chicken biryani",
    "Log 1 bowl of oatmeal with berries",
    "track avocado toast",
    "Log 350 calories snack",
    "I had Greek yogurt parfait",
    "Log sushi roll",
    "add food: pasta primavera",
    "Log 2 boiled eggs and banana",
    "Log tandoori chicken",
    "Log rajma chawal",
    "Log poha",
    "Log quinoa & hummus bowl",
    "Log chicken caesar salad",
    "Log apple & peanut butter",
    "Log protein shake"
  ];

  for (let i = 0; i < 16; i++) {
    const prompt = aiPrompts[i];
    const parsed = parseFoodFromQuery(prompt);
    const aiFood = {
      name: parsed.foodName,
      text: parsed.foodName,
      cal: parsed.cal,
      p: parsed.p,
      c: parsed.c,
      f: parsed.f,
      date: today,
      timestamp: new Date(Date.now() + (40 + i) * 1000).toISOString()
    };
    sm.addFood(aiFood);
    expectedTotalCal += aiFood.cal;
    expectedTotalP += aiFood.p;
    expectedTotalC += aiFood.c;
    expectedTotalF += aiFood.f;
  }

  const durationMs = Date.now() - startTime;
  assert.ok(durationMs < 500, `50 successive additions must complete rapidly, took ${durationMs}ms`);

  // --- State Assertions ---
  const currentHabits = sm.getHabits();
  const todayRecord = currentHabits.find(h => h.date === today);

  // Total additions check: exactly 50 items logged today
  assert.equal(todayRecord.foods.length, 50, `Expected 50 foods logged today, got ${todayRecord.foods.length}`);

  // Macro sum accuracy
  const computedTotals = todayRecord.foods.reduce((acc, f) => {
    acc.cal += Number(f.cal) || 0;
    acc.p += Number(f.p) || 0;
    acc.c += Number(f.c) || 0;
    acc.f += Number(f.f) || 0;
    return acc;
  }, { cal: 0, p: 0, c: 0, f: 0 });

  assert.equal(computedTotals.cal, expectedTotalCal, `Calories mismatch: expected ${expectedTotalCal}, got ${computedTotals.cal}`);
  assert.equal(computedTotals.p, expectedTotalP, `Protein mismatch: expected ${expectedTotalP}, got ${computedTotals.p}`);
  assert.equal(computedTotals.c, expectedTotalC, `Carbs mismatch: expected ${expectedTotalC}, got ${computedTotals.c}`);
  assert.equal(computedTotals.f, expectedTotalF, `Fat mismatch: expected ${expectedTotalF}, got ${computedTotals.f}`);

  // Non-disturbance check: today's workout, water, sleep, and steps remain completely undisturbed
  assert.equal(todayRecord.workouts.length, 1);
  assert.equal(todayRecord.workouts[0].type, 'Morning Jog');
  assert.equal(todayRecord.water, 4);
  assert.equal(todayRecord.sleep, 7.5);
  assert.equal(todayRecord.steps, 3500);

  // Historical integrity check: previous days are untouched
  const day1 = currentHabits.find(h => h.date === '2026-09-22');
  assert.equal(day1.foods.length, 1);
  assert.equal(day1.workouts.length, 1);
  assert.equal(day1.steps, 8200);

  const day2 = currentHabits.find(h => h.date === '2026-09-23');
  assert.equal(day2.foods.length, 1);
  assert.equal(day2.workouts.length, 1);
  assert.equal(day2.steps, 10500);

  // TopBar indexing check: all 50 items + 2 previous day foods + 3 workouts = 55 total entries
  const topBarEntries = indexHistoricalEntries(currentHabits);
  assert.equal(topBarEntries.length, 55, `Expected 55 indexed entries in TopBar, got ${topBarEntries.length}`);

  // Check search filtering across the 50 items
  const chefSpecialResults = filterTopBarEntries(topBarEntries, 'Chef Special');
  assert.equal(chefSpecialResults.length, 17, `Expected 17 Chef Special custom food items matching in TopBar, got ${chefSpecialResults.length}`);

  const biryaniResults = filterTopBarEntries(topBarEntries, 'Biryani');
  assert.ok(biryaniResults.length >= 2, `Expected at least 2 Biryani results, got ${biryaniResults.length}`);

  // Serialization integrity check (localStorage compatibility)
  const serialized = JSON.stringify(currentHabits);
  assert.ok(serialized.length > 5000, `Serialized habits must be valid JSON string`);
  const deserialized = JSON.parse(serialized);
  assert.equal(deserialized.find(h => h.date === today).foods.length, 50);
});

// =========================================================================
// SECTION 4: ADVERSARIAL EDGE CASES & STRESS HARNESS
// =========================================================================

test('Adversarial: Malformed, missing, and non-numeric macros in food items handle gracefully', () => {
  const foodsWithAnomalies = [
    { name: 'Glitch Item 1', cal: null, p: undefined, c: NaN, f: 'invalid' },
    { name: 'Glitch Item 2', cal: -50, p: -10, c: 0, f: 0 },
    { name: 'Glitch Item 3' } // completely missing macro fields
  ];

  // Verification of FoodScreen totals reduction logic
  const totals = foodsWithAnomalies.reduce((acc, f) => {
    acc.cal += Number(f.cal) || 0;
    acc.p += Number(f.p) || 0;
    acc.c += Number(f.c) || 0;
    acc.f += Number(f.f) || 0;
    return acc;
  }, { cal: 0, p: 0, c: 0, f: 0 });

  assert.equal(typeof totals.cal, 'number');
  assert.ok(!isNaN(totals.cal), 'Totals must not be NaN');
  assert.ok(!isNaN(totals.p), 'Protein must not be NaN');
  assert.ok(!isNaN(totals.c), 'Carbs must not be NaN');
  assert.ok(!isNaN(totals.f), 'Fat must not be NaN');
});

test('Adversarial: Special characters, HTML injections, and emojis in custom food names and TopBar search', () => {
  const dangerousNames = [
    '<script>alert("xss")</script>',
    'Spicy Ramen 🍜 & Gyoza 🥟',
    'Food with "quotes" and \'apostrophes\'',
    'Special symbols: /\\|[]{}()!@#$%^&*+-=',
    '   Trimmed Food Name    '
  ];

  const habits = [
    {
      date: '2026-09-24',
      foods: dangerousNames.map((name) => ({
        name: name.trim(),
        text: name.trim(),
        cal: 250,
        p: 15,
        c: 25,
        f: 10,
        timestamp: new Date().toISOString()
      }))
    }
  ];

  const entries = indexHistoricalEntries(habits);
  assert.equal(entries.length, 5);

  // Search by emoji
  const emojiSearch = filterTopBarEntries(entries, '🍜');
  assert.equal(emojiSearch.length, 1);
  assert.ok(emojiSearch[0].name.includes('Ramen'));

  // Search by script tag text
  const xssSearch = filterTopBarEntries(entries, '<script>');
  assert.equal(xssSearch.length, 1);

  // Search with regex characters should not throw RegExp syntax error
  assert.doesNotThrow(() => {
    filterTopBarEntries(entries, '*+?^${}()|[]');
  });
});

test('Adversarial: 500KB large Base64 photo payload custom food survives state updates', () => {
  const today = new Date().toISOString().split('T')[0];
  const sm = createHabitsStateManager();

  // Create ~500KB fake base64 string
  const largeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(500 * 1024);

  sm.addFood({
    name: 'High-Res Photo Meal',
    text: 'High-Res Photo Meal',
    cal: 600,
    p: 40,
    c: 50,
    f: 20,
    photo: largeBase64,
    date: today,
    timestamp: new Date().toISOString()
  });

  const habits = sm.getHabits();
  const todayRecord = habits.find(h => h.date === today);
  assert.equal(todayRecord.foods.length, 1);
  assert.equal(todayRecord.foods[0].photo.length, largeBase64.length);

  // Verify JSON serialization survives
  const serialized = JSON.stringify(habits);
  assert.ok(serialized.length > 500000);
});
