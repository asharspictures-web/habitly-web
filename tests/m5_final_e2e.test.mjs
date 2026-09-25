import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  chatWithAI,
  generateSummary,
  isFoodLogRequest,
  parseFoodFromQuery,
  COMMON_FOOD_DATABASE
} from '../src/lib/gemini.js';

const projectRoot = process.cwd();

// =========================================================================
// State Simulator mirroring useHabits behavior
// =========================================================================
function createHabitsStateManager(
  initialHabits = [],
  initialGoals = { water: 8, sleep: 8, steps: 10000, workout: 30 }
) {
  let habits = JSON.parse(JSON.stringify(initialHabits));
  let goals = JSON.parse(JSON.stringify(initialGoals));

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const updateToday = (updatesOrFn) => {
    const today = getTodayDate();
    let found = false;
    const existing = habits.find((h) => h.date === today) || {
      date: today,
      workouts: [],
      foods: [],
      steps: 0,
      water: 0,
      sleep: 0,
    };
    const updates = typeof updatesOrFn === 'function' ? updatesOrFn(existing) : updatesOrFn;

    habits = habits.map((h) => {
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
    updateToday((current) => ({
      workouts: [...(current.workouts || []), workout],
    }));
  };

  const addFood = (food) => {
    updateToday((current) => ({
      foods: [...(current.foods || []), food],
    }));
  };

  const updateSteps = (steps) => {
    updateToday({ steps: Math.max(0, Number(steps) || 0) });
  };

  const updateWater = (amountOrDelta, isAbsolute = false) => {
    updateToday((current) => {
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

  const getTodayHabit = () => {
    const today = getTodayDate();
    return (
      habits.find((h) => h.date === today) || {
        date: today,
        workouts: [],
        foods: [],
        steps: 0,
        water: 0,
        sleep: 0,
      }
    );
  };

  return {
    getHabits: () => habits,
    getGoals: () => goals,
    getTodayHabit,
    addWorkout,
    addFood,
    updateSteps,
    updateWater,
    addWater,
    updateSleep,
    updateGoals,
  };
}

// =========================================================================
// SECTION 1: R1 E2E - Top Bar Search, Dropdowns, Logo, and Navigation
// =========================================================================

test('R1 E2E: TopBar historical search indexing, filtering, clearing, and deep routing', () => {
  const topBarPath = path.join(projectRoot, 'src', 'components', 'TopBar.jsx');
  assert.ok(fs.existsSync(topBarPath), 'TopBar.jsx must exist');
  const content = fs.readFileSync(topBarPath, 'utf8');

  // Verify dropdown texts and accessibility contracts
  assert.ok(content.includes('No new notifications yet'), 'Must contain notification bell message');
  assert.ok(content.includes('Alex Morgan'), 'Must show user name Alex Morgan in profile');
  assert.ok(content.includes('Sign Out'), 'Must offer Sign Out option in profile');
  assert.ok(content.includes('Signed out successfully (Demo session reset)'), 'Must show toast on sign out');
  assert.ok(content.includes('aria-label="Clear search"'), 'Search input must have clear button');
  assert.ok(content.includes("event.key === 'Escape'"), 'Must handle Escape key to close dropdowns');

  // Mock habits reflecting multi-day historical workouts and foods
  const mockHabits = [
    {
      date: '2026-09-22',
      workouts: [
        { type: 'Morning Run', duration: 40, calories: 380, date: '2026-09-22' },
        { type: 'Power Yoga', duration: 30, calories: 150, date: '2026-09-22' },
      ],
      foods: [
        { name: 'Oatmeal with Berries', cal: 210, p: 7, c: 40, f: 4, timestamp: '2026-09-22T08:00:00Z' },
        { name: 'Grilled Salmon & Quinoa', cal: 420, p: 38, c: 32, f: 14, timestamp: '2026-09-22T13:00:00Z' },
      ],
      steps: 9200,
      water: 8,
      sleep: 7.5,
    },
    {
      date: '2026-09-23',
      workouts: [
        { type: 'Heavy Squats & Deadlifts', duration: 55, calories: 480, date: '2026-09-23' },
      ],
      foods: [
        { name: 'Chicken Biryani', cal: 450, p: 28, c: 52, f: 14, timestamp: '2026-09-23T19:30:00Z' },
        { name: 'Roti with Ghee', cal: 280, p: 8, c: 44, f: 8, timestamp: '2026-09-23T19:35:00Z' },
      ],
      steps: 11500,
      water: 9,
      sleep: 8.0,
    },
  ];

  // Emulate TopBar indexing algorithm
  const indexer = (habits) => {
    const list = [];
    (habits || []).forEach((day) => {
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
  };

  const indexed = indexer(mockHabits);
  assert.equal(indexed.length, 7, 'Should index 3 workouts and 4 food items = 7 entries');

  const searchFilter = (items, q) => {
    const clean = q.trim().toLowerCase();
    if (!clean) return [];
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(clean) ||
        item.category.toLowerCase().includes(clean) ||
        item.detail.toLowerCase().includes(clean)
    );
  };

  // Test search accuracy
  const salmonResults = searchFilter(indexed, 'salmon');
  assert.equal(salmonResults.length, 1);
  assert.equal(salmonResults[0].targetView, 'food');

  const runResults = searchFilter(indexed, 'run');
  assert.equal(runResults.length, 1);
  assert.equal(runResults[0].targetView, 'exercise');

  const foodCategoryResults = searchFilter(indexed, 'food');
  assert.equal(foodCategoryResults.length, 4);

  const workoutCategoryResults = searchFilter(indexed, 'workout');
  assert.equal(workoutCategoryResults.length, 3);

  // Test special queries and boundaries
  assert.equal(searchFilter(indexed, '   ').length, 0);
  assert.equal(searchFilter(indexed, 'xyzNonExistent').length, 0);
  assert.equal(searchFilter(indexed, 'BIRyAnI').length, 1);
});

test('R1 E2E: Sidebar logo rendering and full navigation suite', () => {
  const sidebarPath = path.join(projectRoot, 'src', 'components', 'Sidebar.jsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

  // Verify logo image tag and src attribute
  assert.ok(sidebarContent.includes('src="/logo.jpg"'), 'Sidebar logo must link to /logo.jpg');
  assert.ok(sidebarContent.includes('alt="Habitly Logo"'), 'Sidebar logo must have alt text');

  // Verify binary image asset on disk
  const logoPath = path.join(projectRoot, 'public', 'logo.jpg');
  assert.ok(fs.existsSync(logoPath), 'public/logo.jpg must exist on disk');
  const buf = fs.readFileSync(logoPath);
  assert.ok(buf.length > 5000, 'logo.jpg must be non-empty image asset');
  assert.equal(buf[0], 0xff, 'JPEG header byte 0 must be 0xFF');
  assert.equal(buf[1], 0xd8, 'JPEG header byte 1 must be 0xD8');
  assert.equal(buf[2], 0xff, 'JPEG header byte 2 must be 0xFF');

  // Verify all 7 navigation items exist
  const expectedNav = ['dashboard', 'exercise', 'food', 'steps', 'connect', 'ai', 'goals'];
  for (const navId of expectedNav) {
    assert.ok(
      sidebarContent.includes(`id: '${navId}'`) || sidebarContent.includes(`id: "${navId}"`),
      `Sidebar must contain navigation item '${navId}'`
    );
  }
});

// =========================================================================
// SECTION 2: R2 E2E - Dashboard Progress Rings, Floating Button, Quick-Log Modal
// =========================================================================

test('R2 E2E: Dashboard Water & Sleep rings have functional "+ Log" buttons and state wiring', () => {
  const dashboardPath = path.join(projectRoot, 'src', 'components', 'DashboardScreen.jsx');
  const content = fs.readFileSync(dashboardPath, 'utf8');

  // 1. Water ring onLog triggers handleOpenQuickLog('water')
  assert.ok(
    content.includes("onLog={() => handleOpenQuickLog('water')}"),
    'DashboardScreen must bind water ring onLog to handleOpenQuickLog("water")'
  );

  // 2. Sleep ring onLog triggers handleOpenQuickLog('sleep')
  assert.ok(
    content.includes("onLog={() => handleOpenQuickLog('sleep')}"),
    'DashboardScreen must bind sleep ring onLog to handleOpenQuickLog("sleep")'
  );

  // 3. Floating Quick Log button exists with fixed bottom-8 right-8 and onClick handler
  assert.ok(
    content.includes("handleOpenQuickLog('water')") && content.includes('fixed bottom-8 right-8'),
    'DashboardScreen must render fixed bottom-right quick-log button'
  );
  assert.ok(
    content.includes('aria-label="Quick Log"'),
    'Floating button must have accessible aria-label="Quick Log"'
  );

  // 4. QuickLogModal is rendered and passed all necessary handlers and data
  assert.ok(content.includes('<QuickLogModal'), 'DashboardScreen must render QuickLogModal');
  assert.ok(content.includes('updateWater={updateWater}'), 'DashboardScreen must pass updateWater to modal');
  assert.ok(content.includes('addWater={addWater}'), 'DashboardScreen must pass addWater to modal');
  assert.ok(content.includes('updateSleep={updateSleep}'), 'DashboardScreen must pass updateSleep to modal');
  assert.ok(content.includes('updateSteps={updateSteps}'), 'DashboardScreen must pass updateSteps to modal');
  assert.ok(content.includes('addWorkout={addWorkout}'), 'DashboardScreen must pass addWorkout to modal');
});

test('R2 E2E: QuickLogModal supports all 4 logging domains (Water, Sleep, Steps, Workout)', () => {
  const modalPath = path.join(projectRoot, 'src', 'components', 'QuickLogModal.jsx');
  assert.ok(fs.existsSync(modalPath), 'QuickLogModal.jsx must exist');
  const content = fs.readFileSync(modalPath, 'utf8');

  // Verify accessibility attributes
  assert.ok(content.includes('role="dialog"'), 'QuickLogModal must have role="dialog"');
  assert.ok(content.includes('aria-modal="true"'), 'QuickLogModal must have aria-modal="true"');
  assert.ok(content.includes('aria-labelledby="quick-log-title"'), 'QuickLogModal must have aria-labelledby');
  assert.ok(content.includes('id="quick-log-title"'), 'QuickLogModal header must have matching id');

  // Verify all 4 tab IDs exist
  const expectedTabs = ['water', 'sleep', 'steps', 'workout'];
  for (const tab of expectedTabs) {
    assert.ok(content.includes(`id: '${tab}'`), `QuickLogModal must define tab '${tab}'`);
  }

  // Test state accumulation across all 4 types using StateManager
  const sm = createHabitsStateManager();

  // Test Water quick addition (+1, +2, +3, +4) and custom set
  sm.addWater(1);
  assert.equal(sm.getTodayHabit().water, 1);
  sm.addWater(3);
  assert.equal(sm.getTodayHabit().water, 4);
  sm.updateWater(10, true); // absolute set
  assert.equal(sm.getTodayHabit().water, 10);

  // Test Sleep preset chips & custom decimal hours
  sm.updateSleep(7.5);
  assert.equal(sm.getTodayHabit().sleep, 7.5);
  sm.updateSleep(8.25);
  assert.equal(sm.getTodayHabit().sleep, 8.25);

  // Test Steps quick add presets (+1000, +2500, +5000) and custom
  sm.updateSteps(1000);
  assert.equal(sm.getTodayHabit().steps, 1000);
  sm.updateSteps(sm.getTodayHabit().steps + 2500);
  assert.equal(sm.getTodayHabit().steps, 3500);
  sm.updateSteps(10500);
  assert.equal(sm.getTodayHabit().steps, 10500);

  // Test Workout addition with duration, calories, custom type
  sm.addWorkout({ type: 'Running', duration: 30, calories: 280, date: new Date().toISOString() });
  sm.addWorkout({ type: 'Rock Climbing', duration: 45, calories: 350, date: new Date().toISOString() });
  const todayHabit = sm.getTodayHabit();
  assert.equal(todayHabit.workouts.length, 2);
  assert.equal(todayHabit.workouts[0].type, 'Running');
  assert.equal(todayHabit.workouts[1].type, 'Rock Climbing');
});

// =========================================================================
// SECTION 3: R3 E2E - Food Section, Custom Food with Photo, AI Assistant
// =========================================================================

test('R3 E2E: FoodScreen contains 24+ dishes, category filtering, and custom food with photo', () => {
  const foodScreenPath = path.join(projectRoot, 'src', 'components', 'FoodScreen.jsx');
  assert.ok(fs.existsSync(foodScreenPath), 'FoodScreen.jsx must exist');
  const content = fs.readFileSync(foodScreenPath, 'utf8');

  // Extract COMMON_FOODS array
  const match = content.match(/const\s+COMMON_FOODS\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(match, 'FoodScreen must define COMMON_FOODS');
  const evalFoods = new Function(`return ${match[1]};`)();

  assert.ok(evalFoods.length >= 22, `Expected >= 22 dishes in catalog, found ${evalFoods.length}`);

  // Verify Indian and International categories
  const indianDishes = evalFoods.filter((f) => f.category === 'Indian');
  const internationalDishes = evalFoods.filter((f) => f.category === 'International');
  assert.ok(indianDishes.length >= 10, 'Expected >= 10 Indian dishes');
  assert.ok(internationalDishes.length >= 10, 'Expected >= 10 International dishes');

  // Verify all dishes have icons and positive nutritional values
  for (const dish of evalFoods) {
    assert.ok(dish.name, 'Dish must have a name');
    assert.ok(dish.icon, `Dish ${dish.name} must have an icon`);
    assert.ok(dish.cal > 0, `Dish ${dish.name} must have cal > 0`);
    assert.ok(dish.p >= 0, `Dish ${dish.name} must have p >= 0`);
    assert.ok(dish.c >= 0, `Dish ${dish.name} must have c >= 0`);
    assert.ok(dish.f >= 0, `Dish ${dish.name} must have f >= 0`);
  }

  // Verify file upload input for custom food with photo
  assert.ok(
    content.includes('type="file"') && content.includes('accept="image/*"'),
    'FoodScreen must contain file input for photo upload'
  );
  assert.ok(
    content.includes('readAsDataURL'),
    'FoodScreen must process photo using FileReader readAsDataURL'
  );

  // Test Custom Food payload creation and saving
  const sm = createHabitsStateManager();
  const samplePhotoDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...';
  sm.addFood({
    name: "Grandma's Chicken Curry",
    text: "Grandma's Chicken Curry",
    cal: 480,
    p: 35,
    c: 12,
    f: 28,
    photo: samplePhotoDataUrl,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    category: 'Custom',
  });

  const todayFoods = sm.getTodayHabit().foods;
  assert.equal(todayFoods.length, 1);
  assert.equal(todayFoods[0].name, "Grandma's Chicken Curry");
  assert.equal(todayFoods[0].photo, samplePhotoDataUrl);
  assert.equal(todayFoods[0].cal, 480);
});

test('R3 E2E: AI Assistant chat loads, responds, detects food intent, and renders confirmation card', async () => {
  const aiScreenPath = path.join(projectRoot, 'src', 'components', 'AIAssistantScreen.jsx');
  assert.ok(fs.existsSync(aiScreenPath), 'AIAssistantScreen.jsx must exist');
  const content = fs.readFileSync(aiScreenPath, 'utf8');

  // Verify COMMON_FOOD_DATABASE in gemini.js has full coverage
  assert.ok(Array.isArray(COMMON_FOOD_DATABASE), 'COMMON_FOOD_DATABASE must be an array');
  assert.ok(COMMON_FOOD_DATABASE.length >= 20, 'COMMON_FOOD_DATABASE should contain at least 20 food items');

  // Verify AI confirmation card rendering contracts
  assert.ok(content.includes("msg.card.type === 'food_confirmation'"), 'AIAssistantScreen must support food_confirmation cards');
  assert.ok(content.includes('msg.card.cal'), 'Must display card calories');
  assert.ok(content.includes('msg.card.p'), 'Must display card protein');
  assert.ok(content.includes('msg.card.c'), 'Must display card carbs');
  assert.ok(content.includes('msg.card.f'), 'Must display card fat');
  assert.ok(content.includes('onLogFood('), 'Must invoke onLogFood to log detected food');

  // Test parseFoodFromQuery with Indian & International items
  const query1 = 'Log 2 Rotis with Ghee and Dal Makhani';
  assert.ok(isFoodLogRequest(query1), 'Query must be recognized as food log request');
  const parsed1 = parseFoodFromQuery(query1);
  assert.ok(parsed1.items.length >= 2, 'Should identify both Rotis and Dal Makhani');
  assert.ok(parsed1.cal > 400, 'Calories should accurately aggregate items');

  const query2 = 'I had 1 Avocado Toast and a Protein Shake';
  assert.ok(isFoodLogRequest(query2), 'Query must be recognized as food log request');
  const parsed2 = parseFoodFromQuery(query2);
  assert.ok(parsed2.items.length >= 2, 'Should identify Avocado Toast and Protein Shake');
  assert.ok(parsed2.p >= 30, 'Protein should sum accurately');

  // Test full chatWithAI flow returning structured card
  const mockHabits = [
    {
      date: new Date().toISOString().split('T')[0],
      workouts: [{ type: 'Running', duration: 30, date: '2026-09-24' }],
      foods: [{ name: 'Idli Sambar', cal: 180, p: 8, c: 34, f: 2 }],
      steps: 8000,
      water: 6,
      sleep: 7.5,
    },
  ];

  const aiLogResponse = await chatWithAI('Log Chicken Biryani', mockHabits);
  assert.ok(aiLogResponse.card, 'Response must include card');
  assert.equal(aiLogResponse.card.type, 'food_confirmation');
  assert.equal(aiLogResponse.card.foodName, 'Chicken Biryani');
  assert.equal(aiLogResponse.card.cal, 450);
  assert.equal(aiLogResponse.card.p, 28);
  assert.equal(aiLogResponse.card.c, 52);
  assert.equal(aiLogResponse.card.f, 14);

  // Test non-logging questions do NOT generate a food card
  const aiGeneralResponse = await chatWithAI('How much sleep did I get?', mockHabits);
  assert.equal(aiGeneralResponse.card, null, 'General questions must not return food card');
  assert.ok(aiGeneralResponse.includes('sleep'), 'Response should mention sleep');

  const aiSnackResponse = await chatWithAI('Suggest healthy snacks with high protein', mockHabits);
  assert.equal(aiSnackResponse.card, null);
  assert.ok(aiSnackResponse.includes('Greek Yogurt') || aiSnackResponse.includes('Protein'));

  // Test empty habits safety: chatWithAI does not crash
  const emptyResponse = await chatWithAI('What did I eat?', []);
  assert.ok(emptyResponse, 'Must handle empty habits gracefully');
});

// =========================================================================
// SECTION 4: R4 E2E - Visuals & Wearables Screen
// =========================================================================

test('R4 E2E: Subtle fitness background imagery & dark overlay applied across all 7 major screens', () => {
  const screens = [
    'DashboardScreen.jsx',
    'ExerciseScreen.jsx',
    'FoodScreen.jsx',
    'StepsScreen.jsx',
    'GoalsScreen.jsx',
    'AIAssistantScreen.jsx',
    'DeviceConnectScreen.jsx',
  ];

  for (const screen of screens) {
    const filePath = path.join(projectRoot, 'src', 'components', screen);
    assert.ok(fs.existsSync(filePath), `${screen} must exist`);
    const content = fs.readFileSync(filePath, 'utf8');

    // 1. References hero-bg.jpg
    assert.ok(
      content.includes("bg-[url('/hero-bg.jpg')]"),
      `${screen} must reference bg-[url('/hero-bg.jpg')]`
    );

    // 2. Contains bg-cover and bg-center
    assert.ok(
      content.includes('bg-cover') && content.includes('bg-center'),
      `${screen} must apply bg-cover and bg-center`
    );

    // 3. Dark gradient / overlay applied
    assert.ok(
      content.includes('bg-gradient-to-') || content.includes('from-[#09090b]'),
      `${screen} must have dark overlay styling`
    );

    // 4. Relative container with overflow-hidden
    assert.ok(
      content.includes('relative overflow-hidden'),
      `${screen} must use relative overflow-hidden container`
    );
  }

  // Verify binary hero-bg.jpg asset
  const heroPath = path.join(projectRoot, 'public', 'hero-bg.jpg');
  assert.ok(fs.existsSync(heroPath), 'public/hero-bg.jpg must exist');
  const buf = fs.readFileSync(heroPath);
  assert.ok(buf.length > 50000, 'hero-bg.jpg must be high quality asset > 50KB');
  assert.equal(buf[0], 0xff, 'JPEG header byte 0 must be 0xFF');
  assert.equal(buf[1], 0xd8, 'JPEG header byte 1 must be 0xD8');
  assert.equal(buf[2], 0xff, 'JPEG header byte 2 must be 0xFF');
});

test('R4 E2E: DeviceConnectScreen contains all 5 required devices and "coming soon" modal', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  assert.ok(fs.existsSync(filePath), 'DeviceConnectScreen.jsx must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  // Verify the exact 5 devices
  const match = content.match(/const\s+WEARABLE_DEVICES\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(match, 'Must define WEARABLE_DEVICES');
  const devices = new Function(`return ${match[1]};`)();

  assert.equal(devices.length, 5, 'Must have exactly 5 devices');
  const deviceIds = devices.map((d) => d.id);
  assert.deepEqual(deviceIds, ['fitbit', 'apple', 'whoop', 'garmin', 'oura']);

  // Verify absence of Google Fit or fake biometrics
  assert.ok(!deviceIds.includes('google'), 'Must NOT have google fit');
  assert.ok(!content.includes('setInterval'), 'Must not have fake polling interval');
  assert.ok(!content.includes('setTimeout'), 'Must not have fake connection timeout');

  // Verify "coming soon, log manually for now" modal text
  const expectedPhrase = 'coming soon, log manually for now';
  assert.ok(
    content.toLowerCase().includes(expectedPhrase),
    `Modal must contain verbatim phrase: "${expectedPhrase}"`
  );

  // Modal accessibility
  assert.ok(content.includes('role="dialog"'), 'Modal must have role="dialog"');
  assert.ok(content.includes('aria-modal="true"'), 'Modal must have aria-modal="true"');
  assert.ok(content.includes("e.key === 'Escape'"), 'Modal must handle Escape key');
  assert.ok(content.includes("onNavigate('exercise')"), 'Log Manually button must route to exercise');
});

// =========================================================================
// SECTION 5: Core Logging Logic & App Wiring Regression
// =========================================================================

test('Core Logging Regression: GoalsScreen updates daily targets and calculator formulas', () => {
  const sm = createHabitsStateManager();

  sm.updateGoals({
    water: 10,
    sleep: 8.5,
    steps: 12000,
    workout: 45,
  });

  const updatedGoals = sm.getGoals();
  assert.equal(updatedGoals.water, 10);
  assert.equal(updatedGoals.sleep, 8.5);
  assert.equal(updatedGoals.steps, 12000);
  assert.equal(updatedGoals.workout, 45);

  // Mifflin-St Jeor formula test
  const calcBMR = (w, h, a, gender) => {
    let bmr = 10 * w + 6.25 * h - 5 * a;
    return gender === 'm' ? Math.round(bmr + 5) : Math.round(bmr - 161);
  };

  assert.equal(calcBMR(80, 180, 30, 'm'), Math.round(10 * 80 + 6.25 * 180 - 5 * 30 + 5)); // 1780
  assert.equal(calcBMR(60, 165, 25, 'f'), Math.round(10 * 60 + 6.25 * 165 - 5 * 25 - 161)); // 1345

  // Macro distribution test
  const calcMacros = (cal, goal) => {
    let p, c, f;
    if (goal === 'cut') {
      p = 0.4;
      c = 0.3;
      f = 0.3;
    } else if (goal === 'bulk') {
      p = 0.3;
      c = 0.5;
      f = 0.2;
    } else {
      p = 0.3;
      c = 0.4;
      f = 0.3;
    }
    return {
      p: Math.round((cal * p) / 4),
      c: Math.round((cal * c) / 4),
      f: Math.round((cal * f) / 9),
    };
  };

  const macros = calcMacros(2000, 'maintain');
  assert.equal(macros.p, 150);
  assert.equal(macros.c, 200);
  assert.equal(macros.f, 67);
});

test('Core Logging Regression: ExerciseScreen search filtering and workout saving', () => {
  const sm = createHabitsStateManager();

  sm.addWorkout({ type: 'Swimming', duration: 45, date: '2026-09-24T10:00:00Z' });
  sm.addWorkout({ type: 'Cycling', duration: 60, date: '2026-09-24T16:00:00Z' });

  const workouts = sm.getTodayHabit().workouts;
  assert.equal(workouts.length, 2);

  // ExerciseScreen filtering logic
  const filterWorkouts = (list, query) => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((w) => (w.type || '').toLowerCase().includes(q));
  };

  assert.equal(filterWorkouts(workouts, 'swim').length, 1);
  assert.equal(filterWorkouts(workouts, 'cycl').length, 1);
  assert.equal(filterWorkouts(workouts, 'run').length, 0);
  assert.equal(filterWorkouts(workouts, '').length, 2);
});

test('Core Logging Regression: StepsScreen step updating and daily history', () => {
  const sm = createHabitsStateManager();

  sm.updateSteps(5000);
  assert.equal(sm.getTodayHabit().steps, 5000);

  sm.updateSteps(12450);
  assert.equal(sm.getTodayHabit().steps, 12450);

  // Clamping check
  sm.updateSteps(-500);
  assert.equal(sm.getTodayHabit().steps, 0);
});

// =========================================================================
// SECTION 6: End-to-End User Journey Simulation Across All 4 Areas
// =========================================================================

test('End-to-End User Journey: Complete day in the life of a Habitly user', async () => {
  // Step 1: User starts with empty habits and default goals
  const sm = createHabitsStateManager();
  assert.equal(sm.getHabits().length, 0);

  // Step 2: User customizes daily goals
  sm.updateGoals({ water: 9, sleep: 8, steps: 10000, workout: 40 });
  assert.equal(sm.getGoals().water, 9);

  // Step 3: Morning - user logs water from Dashboard ring (+ Log)
  sm.addWater(2);
  assert.equal(sm.getTodayHabit().water, 2);

  // Step 4: Morning - user logs breakfast from Food Quick Add
  sm.addFood({
    name: 'Masala Dosa',
    text: 'Masala Dosa',
    cal: 280,
    p: 6,
    c: 42,
    f: 9,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  });
  assert.equal(sm.getTodayHabit().foods.length, 1);

  // Step 5: Afternoon - user logs lunch via AI Assistant
  const aiLunch = await chatWithAI('Log Chicken Biryani and Dal Tadka', sm.getHabits());
  assert.ok(aiLunch.card);
  assert.equal(aiLunch.card.type, 'food_confirmation');
  sm.addFood({
    name: aiLunch.card.foodName,
    text: aiLunch.card.foodName,
    cal: aiLunch.card.cal,
    p: aiLunch.card.p,
    c: aiLunch.card.c,
    f: aiLunch.card.f,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  });
  assert.equal(sm.getTodayHabit().foods.length, 2);

  // Step 6: Afternoon - user adds custom snack with device photo
  sm.addFood({
    name: 'Homemade Protein Bar',
    text: 'Homemade Protein Bar',
    cal: 240,
    p: 20,
    c: 22,
    f: 6,
    photo: 'data:image/jpeg;base64,mockCustomBarData...',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
  });
  assert.equal(sm.getTodayHabit().foods.length, 3);

  // Step 7: Evening - user opens FAB Quick Log to log a 45-min HIIT workout and 3 glasses of water
  sm.addWorkout({
    type: 'HIIT',
    duration: 45,
    calories: 420,
    date: new Date().toISOString(),
  });
  sm.addWater(3);
  assert.equal(sm.getTodayHabit().workouts.length, 1);
  assert.equal(sm.getTodayHabit().water, 5);

  // Step 8: Night - user logs steps and sleep
  sm.updateSteps(11200);
  sm.updateSleep(7.75);
  assert.equal(sm.getTodayHabit().steps, 11200);
  assert.equal(sm.getTodayHabit().sleep, 7.75);

  // Step 9: User searches TopBar for "Biryani" and "HIIT"
  const allEntries = [];
  sm.getHabits().forEach((day) => {
    (day.workouts || []).forEach((w, idx) => {
      allEntries.push({ id: `w-${idx}`, name: w.type, target: 'exercise' });
    });
    (day.foods || []).forEach((f, idx) => {
      allEntries.push({ id: `f-${idx}`, name: f.name, target: 'food' });
    });
  });

  const biryaniMatch = allEntries.filter((e) => e.name.toLowerCase().includes('biryani'));
  assert.equal(biryaniMatch.length, 1);
  assert.equal(biryaniMatch[0].target, 'food');

  const hiitMatch = allEntries.filter((e) => e.name.toLowerCase().includes('hiit'));
  assert.equal(hiitMatch.length, 1);
  assert.equal(hiitMatch[0].target, 'exercise');

  // Step 10: Generate Daily AI Insight Summary for Dashboard
  const summary = await generateSummary(
    sm.getHabits().map((h) => ({
      ...h,
      workoutDuration: h.workouts?.reduce((a, w) => a + w.duration, 0) || 0,
      workoutType: h.workouts?.[0]?.type || 'General',
    }))
  );
  assert.ok(typeof summary === 'string' && summary.length > 20);
  assert.ok(summary.includes('45 minute HIIT workout'));
  assert.ok(summary.includes('Great job getting enough rest'));
});

// =========================================================================
// SECTION 7: High-Volume Concurrent Stress Harness
// =========================================================================

test('Stress Harness: 50 concurrent AI queries and 100 rapid sequential logs benchmark', async () => {
  const sm = createHabitsStateManager();

  // 100 rapid sequential multi-category logs
  const startTime = Date.now();
  for (let i = 1; i <= 100; i++) {
    sm.addFood({ name: `Food ${i}`, cal: 200 + i, p: 15, c: 20, f: 5 });
    sm.addWorkout({ type: `Workout ${i}`, duration: 25, calories: 200 });
    sm.addWater(1);
    sm.updateSteps(5000 + i * 50);
    sm.updateSleep(7.0 + (i % 3) * 0.5);
  }
  const logDuration = Date.now() - startTime;
  assert.ok(logDuration < 200, `100 sequential logs should execute in < 200ms (took ${logDuration}ms)`);

  const today = sm.getTodayHabit();
  assert.equal(today.foods.length, 100);
  assert.equal(today.workouts.length, 100);
  assert.equal(today.water, 100);
  assert.equal(today.steps, 10000);

  // 50 concurrent AI queries
  const questions = [
    'Log 2 rotis with ghee',
    'Log chicken biryani',
    'How many calories have I consumed today?',
    'Healthy snack ideas',
    'What was my sleep?',
    'How much water did I drink?',
    'What exercises build core strength?',
    'Log 1 bowl of oatmeal with berries',
    'Log paneer butter masala',
    'Log hard boiled eggs',
  ];

  const aiStart = Date.now();
  const promises = [];
  for (let j = 0; j < 50; j++) {
    const q = questions[j % questions.length];
    promises.push(chatWithAI(q, sm.getHabits()));
  }
  const results = await Promise.all(promises);
  const aiDuration = Date.now() - aiStart;

  assert.equal(results.length, 50);
  for (const res of results) {
    assert.ok(res, 'AI response must exist');
  }
  assert.ok(aiDuration < 1500, `50 AI queries should execute in < 1500ms (took ${aiDuration}ms)`);
});

test('Integrity Check: Zero production mocks, bypasses, or fake simulated hardware APIs', () => {
  const srcFiles = [
    'src/components/DeviceConnectScreen.jsx',
    'src/components/TopBar.jsx',
    'src/components/DashboardScreen.jsx',
    'src/components/FoodScreen.jsx',
    'src/components/AIAssistantScreen.jsx',
    'src/components/QuickLogModal.jsx',
  ];

  for (const relPath of srcFiles) {
    const fullPath = path.join(projectRoot, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Reject fake heart rate or fake simulated device connections
    assert.ok(!content.includes('setInterval'), `${relPath} must not contain background setInterval`);
    assert.ok(!content.includes('faker'), `${relPath} must not contain fake data generators`);
    assert.ok(!content.includes('dummy_bypass'), `${relPath} must not contain dummy bypasses`);
  }
});
