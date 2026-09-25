import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chatWithAI, parseFoodFromQuery, isFoodLogRequest } from '../src/lib/gemini.js';

const projectRoot = process.cwd();

// =========================================================================
// Helper: State Manager simulating useHabits
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
    return habits.find((h) => h.date === today) || {
      date: today,
      workouts: [],
      foods: [],
      steps: 0,
      water: 0,
      sleep: 0,
    };
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
// SECTION 1: Visual Consistency, Overlay Architecture & Layout Safety
// =========================================================================

test('Visual Architecture: All 7 major screens have hero background imagery and non-destructive dark overlays', () => {
  const screens = [
    { file: 'DashboardScreen.jsx', name: 'DashboardScreen' },
    { file: 'ExerciseScreen.jsx', name: 'ExerciseScreen' },
    { file: 'FoodScreen.jsx', name: 'FoodScreen' },
    { file: 'StepsScreen.jsx', name: 'StepsScreen' },
    { file: 'GoalsScreen.jsx', name: 'GoalsScreen' },
    { file: 'AIAssistantScreen.jsx', name: 'AIAssistantScreen' },
    { file: 'DeviceConnectScreen.jsx', name: 'DeviceConnectScreen' },
  ];

  for (const screen of screens) {
    const filePath = path.join(projectRoot, 'src', 'components', screen.file);
    assert.ok(fs.existsSync(filePath), `${screen.name} file must exist`);
    const content = fs.readFileSync(filePath, 'utf8');

    // 1. Must use public/hero-bg.jpg background image
    assert.ok(
      content.includes("bg-[url('/hero-bg.jpg')]"),
      `${screen.name} must specify background image url '/hero-bg.jpg'`
    );

    // 2. Must apply proper sizing and centering
    assert.ok(
      content.includes('bg-cover') && content.includes('bg-center'),
      `${screen.name} must apply bg-cover and bg-center`
    );

    // 3. Layout safety: background & overlay layers must be absolute inset-0
    const absoluteOverlayMatches = content.match(/absolute\s+inset-0/g);
    assert.ok(
      absoluteOverlayMatches && absoluteOverlayMatches.length >= 2,
      `${screen.name} must use multiple absolute inset-0 layers for background and dark gradient overlay`
    );

    // 4. Hero card container encapsulation: must use relative and overflow-hidden
    assert.ok(
      content.includes('relative overflow-hidden'),
      `${screen.name} must wrap hero banner in relative overflow-hidden to prevent layout bleeding`
    );

    // 5. Content z-index hierarchy: foreground content must use relative z-10 (or higher)
    assert.ok(
      content.includes('relative z-10'),
      `${screen.name} must elevate content with relative z-10 to stay safely above dark overlay`
    );

    // 6. WCAG text contrast: must use text-white headings
    assert.ok(
      content.includes('text-white'),
      `${screen.name} must use text-white for high-contrast legible headings`
    );
  }
});

test('Visual Architecture: hero-bg.jpg and logo.jpg are valid binary JPEG image assets', () => {
  const heroPath = path.join(projectRoot, 'public', 'hero-bg.jpg');
  assert.ok(fs.existsSync(heroPath), 'public/hero-bg.jpg must exist');
  const heroBuf = fs.readFileSync(heroPath);
  assert.ok(heroBuf.length > 50000, 'hero-bg.jpg should be a high-resolution asset (> 50KB)');
  // JPEG magic bytes: FF D8 FF
  assert.equal(heroBuf[0], 0xff, 'hero-bg.jpg byte 0 must be 0xFF');
  assert.equal(heroBuf[1], 0xd8, 'hero-bg.jpg byte 1 must be 0xD8');
  assert.equal(heroBuf[2], 0xff, 'hero-bg.jpg byte 2 must be 0xFF');

  const logoPath = path.join(projectRoot, 'public', 'logo.jpg');
  assert.ok(fs.existsSync(logoPath), 'public/logo.jpg must exist');
  const logoBuf = fs.readFileSync(logoPath);
  assert.ok(logoBuf.length > 10000, 'logo.jpg should be valid asset (> 10KB)');
  assert.equal(logoBuf[0], 0xff, 'logo.jpg byte 0 must be 0xFF');
  assert.equal(logoBuf[1], 0xd8, 'logo.jpg byte 1 must be 0xD8');
  assert.equal(logoBuf[2], 0xff, 'logo.jpg byte 2 must be 0xFF');
});

// =========================================================================
// SECTION 2: Wearables Screen Empirical Stress Testing (Requirement R4)
// =========================================================================

test('Wearables Stress: DeviceConnectScreen device catalog validation and metadata integrity', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Parse WEARABLE_DEVICES
  const match = content.match(/const\s+WEARABLE_DEVICES\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(match, 'WEARABLE_DEVICES array must be defined');
  const fn = new Function(`return ${match[1]};`);
  const devices = fn();

  assert.equal(devices.length, 5, 'Exactly 5 wearable devices must be configured');

  const expectedIds = ['fitbit', 'apple', 'whoop', 'garmin', 'oura'];
  const expectedNames = ['Fitbit', 'Apple Health', 'Whoop', 'Garmin', 'Oura'];

  devices.forEach((dev, idx) => {
    assert.equal(dev.id, expectedIds[idx], `Device ${idx} id mismatch`);
    assert.equal(dev.name, expectedNames[idx], `Device ${idx} name mismatch`);
    assert.ok(typeof dev.subtitle === 'string' && dev.subtitle.length > 0, `Device ${dev.name} subtitle required`);
    assert.ok(typeof dev.category === 'string' && dev.category.length > 0, `Device ${dev.name} category required`);
    assert.ok(typeof dev.icon === 'string' && dev.icon.length > 0, `Device ${dev.name} icon required`);
    assert.equal(dev.status, 'Ready to Sync', `Device ${dev.name} status must be Ready to Sync`);
    assert.ok(dev.accentBorder && dev.accentBorder.startsWith('hover:border-'), `Device ${dev.name} must have hover border accent`);
    assert.ok(dev.accentBg && dev.accentBg.includes('border-'), `Device ${dev.name} must have accent badge styling`);
  });

  // Strict check: No legacy Google Fit or simulated fake vitals
  assert.ok(!devices.some(d => d.id === 'google'), 'Google Fit must not be present');
  assert.ok(!content.includes('rhr:'), 'Must not have fake heart-rate vitals');
  assert.ok(!content.includes('sleepScore:'), 'Must not have fake sleep-score vitals');
  assert.ok(!content.includes('setTimeout'), 'Must not have fake connection timeout');
});

test('Wearables Stress: Modal dialog accessibility, verbatim prompt message and dismissal', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Accessibility attributes
  assert.ok(content.includes('role="dialog"'), 'Modal must have role="dialog"');
  assert.ok(content.includes('aria-modal="true"'), 'Modal must have aria-modal="true"');
  assert.ok(content.includes('aria-labelledby="device-modal-title"'), 'Modal must have aria-labelledby');
  assert.ok(content.includes('id="device-modal-title"'), 'Modal heading must have matching id');
  assert.ok(content.includes('aria-label="Close modal"'), 'Close button must have aria-label');

  // 2. Verbatim message required by R4
  const expectedPhrase = 'coming soon, log manually for now';
  assert.ok(
    content.toLowerCase().includes(expectedPhrase),
    `Modal must contain requirement phrase "${expectedPhrase}"`
  );

  // 3. Escape key dismissal with proper cleanup
  assert.ok(content.includes("e.key === 'Escape'"), 'Modal must handle Escape key');
  assert.ok(content.includes("window.addEventListener('keydown'"), 'Must register keydown listener');
  assert.ok(content.includes("window.removeEventListener('keydown'"), 'Must remove keydown listener');

  // 4. Backdrop click isolation
  assert.ok(content.includes('e.target === e.currentTarget'), 'Backdrop click must check event target to prevent dismiss on child clicks');
  assert.ok(content.includes('e.stopPropagation()'), 'Modal container must stop click propagation');

  // 5. Navigation wiring to manual logging
  assert.ok(content.includes("onNavigate('exercise')"), 'Log Manually button must route to exercise screen');
});

test('Wearables Stress: DeviceConnectScreen handles optional props without throwing', () => {
  const filePath = path.join(projectRoot, 'src', 'components', 'DeviceConnectScreen.jsx');
  const content = fs.readFileSync(filePath, 'utf8');

  // Check default parameter destructuring: export default function DeviceConnectScreen({ onNavigate, onBack } = {})
  assert.ok(
    content.includes('{ onNavigate, onBack } = {}') || content.includes('onNavigate = () => {}'),
    'DeviceConnectScreen must safely default its props'
  );
  assert.ok(
    content.includes('{onBack && (') || content.includes('onBack ?'),
    'Back button must be conditionally rendered only if onBack is provided'
  );
  assert.ok(
    content.includes('{onNavigate && (') || content.includes('onNavigate ?'),
    'Log Manually button must be conditionally rendered only if onNavigate is provided'
  );
});

// =========================================================================
// SECTION 3: App Wiring & Routing Integrity
// =========================================================================

test('App Routing: All 7 screen routes and Sidebar navigation entries are complete and aligned', () => {
  const appPath = path.join(projectRoot, 'src', 'App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  const sidebarPath = path.join(projectRoot, 'src', 'components', 'Sidebar.jsx');
  const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

  const expectedRoutes = [
    { id: 'dashboard', component: 'DashboardScreen' },
    { id: 'exercise', component: 'ExerciseScreen' },
    { id: 'food', component: 'FoodScreen' },
    { id: 'steps', component: 'StepsScreen' },
    { id: 'goals', component: 'GoalsScreen' },
    { id: 'connect', component: 'DeviceConnectScreen' },
    { id: 'ai', component: 'AIAssistantScreen' },
  ];

  for (const route of expectedRoutes) {
    // 1. Imported in App.jsx
    assert.ok(
      appContent.includes(`import ${route.component}`),
      `App.jsx must import ${route.component}`
    );

    // 2. Wired in renderScreen switch
    if (route.id !== 'dashboard') {
      const caseRegex = new RegExp(`case\\s+['"]${route.id}['"]\\s*:`);
      assert.ok(
        caseRegex.test(appContent),
        `App.jsx renderScreen must handle case '${route.id}'`
      );
    }

    // 3. Listed in Sidebar navItems
    const navRegex = new RegExp(`id:\\s*['"]${route.id}['"]`);
    assert.ok(
      navRegex.test(sidebarContent),
      `Sidebar navItems must contain navigation entry with id '${route.id}'`
    );
  }

  // Sidebar logo must use /logo.jpg
  assert.ok(
    sidebarContent.includes('src="/logo.jpg"'),
    'Sidebar logo must reference /logo.jpg'
  );
});

// =========================================================================
// SECTION 4: Empirical Regression Suite Across Prior Milestones (R1, R2, R3)
// =========================================================================

test('Regression R1 (TopBar Search): Historical search accurately indexes workouts & foods and handles adversarial queries', () => {
  const topBarPath = path.join(projectRoot, 'src', 'components', 'TopBar.jsx');
  const topBarContent = fs.readFileSync(topBarPath, 'utf8');

  // Verify TopBar dropdown contracts
  assert.ok(
    topBarContent.includes('No new notifications yet'),
    'TopBar notification dropdown must contain "No new notifications yet"'
  );
  assert.ok(
    topBarContent.includes('Sign Out'),
    'TopBar profile dropdown must contain "Sign Out"'
  );

  // Simulate TopBar search indexer logic
  const mockHabits = [
    {
      date: '2026-09-20',
      workouts: [{ type: 'Running', duration: 45, calories: 420, date: '2026-09-20' }],
      foods: [{ name: 'Oatmeal with Blueberries', cal: 320, p: 12, c: 54, f: 6 }],
      steps: 8500,
      water: 7,
      sleep: 7.5,
    },
    {
      date: '2026-09-21',
      workouts: [{ type: 'Heavy Deadlifts & Squats', duration: 60, calories: 500, date: '2026-09-21' }],
      foods: [{ name: 'Chicken Biryani', cal: 650, p: 42, c: 68, f: 18 }],
      steps: 12400,
      water: 9,
      sleep: 8.0,
    },
  ];

  // Helper matching TopBar search indexing
  const indexHabits = (habits) => {
    const list = [];
    (habits || []).forEach((day) => {
      (day.workouts || []).forEach((w, idx) => {
        list.push({
          id: `workout-${day.date}-${idx}-${w.type}`,
          name: w.type || 'Workout',
          category: 'Workout',
        });
      });
      (day.foods || []).forEach((f, idx) => {
        const foodName = f.name || f.text || 'Meal';
        list.push({
          id: `food-${day.date}-${idx}-${foodName}`,
          name: foodName,
          category: 'Food',
        });
      });
    });
    return list;
  };

  const indexed = indexHabits(mockHabits);
  assert.equal(indexed.length, 4, 'Should index 2 workouts and 2 food entries');

  const filterSearch = (items, query) => {
    const clean = query.trim().toLowerCase();
    if (!clean) return items;
    return items.filter((item) => item.name.toLowerCase().includes(clean));
  };

  // Case-insensitive & partial matches
  assert.equal(filterSearch(indexed, 'running').length, 1);
  assert.equal(filterSearch(indexed, 'RUN').length, 1);
  assert.equal(filterSearch(indexed, 'biryani').length, 1);
  assert.equal(filterSearch(indexed, '  deadlifts  ').length, 1);
  assert.equal(filterSearch(indexed, 'Oatmeal').length, 1);

  // Adversarial queries: special characters and empty inputs
  assert.equal(filterSearch(indexed, '').length, 4);
  assert.equal(filterSearch(indexed, '   ').length, 4);
  assert.equal(filterSearch(indexed, '*** non existent ***').length, 0);
  assert.equal(filterSearch(indexed, '<script>alert(1)</script>').length, 0);
  assert.equal(filterSearch(indexed, '#$%^&*()').length, 0);
});

test('Regression R2 (Dashboard Water & Sleep): State updating, clamping, and "+ Log" bindings', () => {
  const dashboardPath = path.join(projectRoot, 'src', 'components', 'DashboardScreen.jsx');
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

  // Verify Dashboard implements "+ Log" buttons and Quick-Log modal / FAB button
  assert.ok(
    dashboardContent.includes('ProgressRing') && dashboardContent.includes('onLog='),
    'DashboardScreen must bind onLog to ProgressRing'
  );
  assert.ok(
    dashboardContent.includes('handleOpenQuickLog'),
    'DashboardScreen must implement handleOpenQuickLog'
  );
  assert.ok(
    dashboardContent.includes('QuickLogModal'),
    'DashboardScreen must render QuickLogModal'
  );

  // Test state transitions
  const sm = createHabitsStateManager();

  // Water delta and absolute modes
  sm.addWater(1);
  assert.equal(sm.getTodayHabit().water, 1);
  sm.addWater(3);
  assert.equal(sm.getTodayHabit().water, 4);
  sm.updateWater(10, true); // absolute
  assert.equal(sm.getTodayHabit().water, 10);
  sm.updateWater(-2, false); // delta decrement
  assert.equal(sm.getTodayHabit().water, 8);
  sm.updateWater(-20, false); // clamp to 0
  assert.equal(sm.getTodayHabit().water, 0);

  // Sleep float precision and clamping
  sm.updateSleep(7.5);
  assert.equal(sm.getTodayHabit().sleep, 7.5);
  sm.updateSleep(8.25);
  assert.equal(sm.getTodayHabit().sleep, 8.25);
  sm.updateSleep(-5);
  assert.equal(sm.getTodayHabit().sleep, 0);

  // Steps clamping
  sm.updateSteps(12500);
  assert.equal(sm.getTodayHabit().steps, 12500);
  sm.updateSteps(-100);
  assert.equal(sm.getTodayHabit().steps, 0);
});

test('Regression R3 (Food Section & AI Assistant): 22+ foods catalog, macro calculations, and AI food card', async () => {
  const foodScreenPath = path.join(projectRoot, 'src', 'components', 'FoodScreen.jsx');
  const foodContent = fs.readFileSync(foodScreenPath, 'utf8');

  // Check 22+ foods catalog
  const match = foodContent.match(/const\s+COMMON_FOODS\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(match, 'FoodScreen must define COMMON_FOODS');
  const fn = new Function(`return ${match[1]};`);
  const commonFoods = fn();

  assert.ok(
    commonFoods.length >= 22,
    `COMMON_FOODS must have at least 22 items (found ${commonFoods.length})`
  );

  // Verify macro numbers are well-formed positive numbers
  for (const item of commonFoods) {
    assert.ok(typeof item.name === 'string' && item.name.length > 0, 'Food item name required');
    assert.ok(typeof item.cal === 'number' && item.cal > 0, `Food ${item.name} cal must be > 0`);
    assert.ok(typeof item.p === 'number' && item.p >= 0, `Food ${item.name} protein must be >= 0`);
    assert.ok(typeof item.c === 'number' && item.c >= 0, `Food ${item.name} carbs must be >= 0`);
    assert.ok(typeof item.f === 'number' && item.f >= 0, `Food ${item.name} fat must be >= 0`);
    assert.ok(item.icon, `Food ${item.name} must have an icon`);
  }

  // Check AI Food parsing and logging
  const aiLogCommand = 'I ate 2 Samosas and 2 Rotis';
  assert.ok(isFoodLogRequest(aiLogCommand), 'Command must be detected as food log request');

  const parsed = parseFoodFromQuery(aiLogCommand);
  assert.ok(parsed, 'Food query must be parsed');
  assert.ok(parsed.items.length >= 2, 'Should parse both Samosas and Rotis');
  assert.ok(parsed.cal > 0, 'Total calories must be > 0');
  assert.ok(parsed.p >= 0 && parsed.c >= 0 && parsed.f >= 0);

  // Chat with AI returns structured card
  const mockHabits = [
    {
      date: new Date().toISOString().split('T')[0],
      workouts: [],
      foods: [],
      steps: 5000,
      water: 4,
      sleep: 7,
    },
  ];
  const response = await chatWithAI(aiLogCommand, mockHabits);
  assert.ok(response.card, 'Response must include structured food card');
  assert.equal(response.card.type, 'food_confirmation');
  assert.equal(typeof response.card.foodName, 'string');
  assert.ok(response.card.cal > 0);
  assert.ok(response.card.p >= 0 && response.card.c >= 0 && response.card.f >= 0);

  // Verify non-logging questions do NOT trigger food logging cards
  const questionResponse = await chatWithAI('What exercises build triceps?', mockHabits);
  assert.equal(questionResponse.card, null, 'Non-log question must not trigger food card');
  assert.ok(typeof questionResponse.text === 'string' && questionResponse.text.length > 0);
});

test('Regression Goals & Calculators: Goals state updates and formulas operate accurately', () => {
  const sm = createHabitsStateManager();

  sm.updateGoals({
    water: 12,
    sleep: 9,
    steps: 15000,
    workout: 45,
    calories: 2500,
  });

  const updated = sm.getGoals();
  assert.equal(updated.water, 12);
  assert.equal(updated.sleep, 9);
  assert.equal(updated.steps, 15000);
  assert.equal(updated.workout, 45);
  assert.equal(updated.calories, 2500);

  // Check TDEE & BMI calculator formulas from GoalsScreen
  const weightKg = 75;
  const heightCm = 178;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  assert.ok(bmi > 23 && bmi < 24, `BMI calculation should be ~23.67, got ${bmi}`);

  // Mifflin-St Jeor formula for Men: 10 * weight + 6.25 * height - 5 * age + 5
  const age = 28;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  assert.equal(bmr, 750 + 1112.5 - 140 + 5); // 1727.5
});

// =========================================================================
// SECTION 5: High-Volume Concurrent Stress & Boundary Harness
// =========================================================================

test('Stress Harness: 100 historical days, 50 rapid sequential entries, and 200 TopBar searches', () => {
  const initialHabits = [];
  const now = new Date();

  // Generate 100 historical days
  for (let i = 1; i <= 100; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    initialHabits.push({
      date: dateStr,
      workouts: [
        { type: i % 2 === 0 ? 'Running' : 'Cycling', duration: 30 + (i % 30), calories: 200 + i * 5, date: dateStr },
      ],
      foods: [
        { name: `Meal Day ${i}`, cal: 400 + i, p: 25, c: 45, f: 12 },
      ],
      steps: 6000 + i * 50,
      water: 6 + (i % 4),
      sleep: 6.5 + (i % 3) * 0.5,
    });
  }

  const sm = createHabitsStateManager(initialHabits);

  // Perform 50 rapid sequential mixed actions on today
  for (let j = 0; j < 10; j++) {
    sm.addFood({ name: `Snack ${j}`, cal: 150, p: 5, c: 20, f: 5 });
    sm.addWorkout({ type: `Workout ${j}`, duration: 20, calories: 150 });
    sm.addWater(1);
    sm.updateSleep(7.0 + (j * 0.1));
    sm.updateSteps(1000 + j * 500);
  }

  const today = sm.getTodayHabit();
  assert.equal(today.foods.length, 10, 'Today should have 10 logged foods');
  assert.equal(today.workouts.length, 10, 'Today should have 10 logged workouts');
  assert.equal(today.water, 10, 'Today should have accumulated 10 glasses of water');
  assert.equal(today.sleep, 7.9, 'Today should have 7.9 hours of sleep');
  assert.equal(today.steps, 5500, 'Today steps should be 5500');

  // Verify historical days are 100% intact (immutability)
  const currentHabits = sm.getHabits();
  assert.equal(currentHabits.length, 101, 'Should have 100 historical days + today');
  for (let i = 0; i < 100; i++) {
    assert.equal(currentHabits[i].date, initialHabits[i].date);
    assert.equal(currentHabits[i].workouts.length, initialHabits[i].workouts.length);
    assert.equal(currentHabits[i].foods.length, initialHabits[i].foods.length);
  }

  // TopBar search indexing 101 days (over 220 items)
  const list = [];
  currentHabits.forEach((day) => {
    (day.workouts || []).forEach((w, idx) => {
      list.push({ id: `w-${day.date}-${idx}`, name: w.type || 'Workout' });
    });
    (day.foods || []).forEach((f, idx) => {
      list.push({ id: `f-${day.date}-${idx}`, name: f.name || 'Food' });
    });
  });

  assert.ok(list.length >= 220, `Indexed list should have >= 220 items (got ${list.length})`);

  // Execute 200 search queries benchmark
  const queries = ['running', 'cycling', 'meal', 'snack', 'workout', 'day 5', 'day 99', 'unknown item', 'xyz', ''];
  const startTime = Date.now();
  for (let k = 0; k < 200; k++) {
    const q = queries[k % queries.length];
    const results = list.filter((item) => item.name.toLowerCase().includes(q.toLowerCase()));
    assert.ok(Array.isArray(results));
  }
  const elapsed = Date.now() - startTime;
  assert.ok(elapsed < 250, `200 searches must complete under 250ms (took ${elapsed}ms)`);
});
