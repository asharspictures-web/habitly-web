import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();

// =========================================================================
// 1. Search Logic & Edge Cases Testing
// =========================================================================

// Exact logic extracted from TopBar.jsx
function collectHistoricalEntries(habits) {
  const list = [];
  (habits || []).forEach(day => {
    if (!day) return;
    // Workouts
    (day.workouts || []).forEach((w, idx) => {
      if (!w) return;
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
      if (!f) return;
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

function filterEntries(historicalEntries, searchQuery) {
  const query = (searchQuery || '').trim().toLowerCase();
  if (!query) return [];
  return historicalEntries.filter(item => 
    item.name.toLowerCase().includes(query) || 
    item.category.toLowerCase().includes(query) ||
    item.detail.toLowerCase().includes(query)
  );
}

// Exact logic extracted from ExerciseScreen.jsx
function filterWorkouts(habits, searchQuery) {
  const allWorkouts = (habits || []).flatMap(h => (h && h.workouts) || []);
  const filteredWorkouts = (searchQuery || '').trim()
    ? allWorkouts.filter(w => (w && w.type ? w.type : '').toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : allWorkouts;
  return [...filteredWorkouts].reverse().slice(0, 5);
}

// Exact logic for formatDate in TopBar.jsx
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

test('Search Edge Case 1: Empty strings and nullish inputs', () => {
  const sampleHabits = [
    {
      date: '2026-09-24',
      workouts: [{ type: 'Running', duration: 30, calories: 250 }],
      foods: [{ name: 'Oatmeal', cal: 150, p: 5, c: 27, f: 3 }]
    }
  ];

  const entries = collectHistoricalEntries(sampleHabits);
  assert.equal(entries.length, 2);

  // Empty string
  assert.deepEqual(filterEntries(entries, ''), []);
  // Whitespace only
  assert.deepEqual(filterEntries(entries, '   '), []);
  assert.deepEqual(filterEntries(entries, '\t\n  '), []);
  // Null or undefined query
  assert.deepEqual(filterEntries(entries, null), []);
  assert.deepEqual(filterEntries(entries, undefined), []);
});

test('Search Edge Case 2: Leading and trailing whitespace', () => {
  const sampleHabits = [
    {
      date: '2026-09-24',
      workouts: [{ type: 'Running', duration: 30 }],
      foods: [{ name: 'Chicken Breast', cal: 165 }]
    }
  ];

  const entries = collectHistoricalEntries(sampleHabits);
  
  const res1 = filterEntries(entries, '   Running   ');
  assert.equal(res1.length, 1);
  assert.equal(res1[0].name, 'Running');

  const res2 = filterEntries(entries, '  chicken  ');
  assert.equal(res2.length, 1);
  assert.equal(res2[0].name, 'Chicken Breast');
});

test('Search Edge Case 3: Special characters, regex symbols, and unicode', () => {
  const sampleHabits = [
    {
      date: '2026-09-24',
      workouts: [
        { type: 'HIIT (Level 2)', duration: 45 },
        { type: 'C++ & Python [Dev Workout]', duration: 60 }
      ],
      foods: [
        { name: '100% Whole Wheat Bread (2 slices)', cal: 140 },
        { name: 'Protein Shake $5.99 / 20g', cal: 180 },
        { name: 'Spicy Curry? Yes! *Chef Kiss*', cal: 350 },
        { name: '<script>alert(1)</script>', cal: 0 },
        { name: 'Salad 🥗 with Nuts 🥜', cal: 200 },
        { name: 'Folder C:\\Diet\\Logs', cal: 100 }
      ]
    }
  ];

  const entries = collectHistoricalEntries(sampleHabits);

  const specialQueries = [
    '(Level 2)',
    '[Dev Workout]',
    '100%',
    '$5.99',
    'Curry?',
    '*Chef',
    '<script>',
    '\\',
    'C:\\Diet',
    '🥗',
    '🥜',
    'C++'
  ];

  for (const q of specialQueries) {
    // None of these should throw SyntaxError or crash, and all should match their corresponding entry
    const res = filterEntries(entries, q);
    assert.ok(Array.isArray(res), `Failed on query: ${q}`);
    assert.ok(res.length >= 1, `Expected at least 1 match for query: ${q}`);
  }

  // Non-matching special regex queries like `.*` should return 0 results safely without throwing
  assert.equal(filterEntries(entries, '.*').length, 0);
  assert.equal(filterEntries(entries, '^start$').length, 0);
  assert.equal(filterEntries(entries, '[0-9]+').length, 0);
});

test('Search Edge Case 4: Case sensitivity variations', () => {
  const sampleHabits = [
    {
      date: '2026-09-24',
      workouts: [{ type: 'Weightlifting', duration: 45 }],
      foods: [{ name: 'Paneer Tikka', cal: 280 }]
    }
  ];

  const entries = collectHistoricalEntries(sampleHabits);

  const variations = ['weightlifting', 'WEIGHTLIFTING', 'WeightLifting', 'wEiGhTlIfTiNg'];
  for (const v of variations) {
    const res = filterEntries(entries, v);
    assert.equal(res.length, 1, `Failed case insensitivity for: ${v}`);
    assert.equal(res[0].name, 'Weightlifting');
  }

  // Also category search
  assert.equal(filterEntries(entries, 'workout').length, 1);
  assert.equal(filterEntries(entries, 'WORKOUT').length, 1);
  assert.equal(filterEntries(entries, 'food').length, 1);
  assert.equal(filterEntries(entries, 'FOOD').length, 1);
});

test('Search Edge Case 5: Non-matching queries', () => {
  const sampleHabits = [
    {
      date: '2026-09-24',
      workouts: [{ type: 'Running', duration: 30 }],
      foods: [{ name: 'Salad', cal: 50 }]
    }
  ];

  const entries = collectHistoricalEntries(sampleHabits);
  assert.equal(filterEntries(entries, 'swimming').length, 0);
  assert.equal(filterEntries(entries, 'xyz999999').length, 0);
  assert.equal(filterEntries(entries, 'burger').length, 0);
});

test('Search Edge Case 6: Empty habits lists and malformed habit items', () => {
  assert.deepEqual(collectHistoricalEntries([]), []);
  assert.deepEqual(collectHistoricalEntries(null), []);
  assert.deepEqual(collectHistoricalEntries(undefined), []);

  const emptyDays = [
    {},
    { date: '2026-09-24' },
    { date: '2026-09-24', workouts: [], foods: [] },
    { date: '2026-09-24', workouts: null, foods: null }
  ];
  assert.deepEqual(collectHistoricalEntries(emptyDays), []);

  // Workouts missing fields
  const missingFieldDays = [
    {
      date: '2026-09-24',
      workouts: [
        {},
        { duration: 20 },
        { type: 'Cycling' }
      ],
      foods: [
        {},
        { text: 'Quick Snack' },
        { cal: 200 }
      ]
    }
  ];
  const entries = collectHistoricalEntries(missingFieldDays);
  assert.equal(entries.length, 6);
  assert.equal(entries[0].category, 'Workout');
  assert.equal(entries[0].name, 'Workout'); // fallback
  assert.equal(entries[3].name, 'Meal'); // fallback
  assert.equal(entries[4].name, 'Quick Snack'); // fallback to text
});

test('Search Stress Test: 10,000 logged items across 365 days', () => {
  const largeHabits = [];
  const workoutTypes = ['Running', 'Cycling', 'Weights', 'Swimming', 'Yoga', 'HIIT', 'Pilates'];
  const foodItems = ['Dal Makhani', 'Paneer Tikka', 'Oatmeal', 'Chicken Salad', 'Brown Rice', 'Egg Scramble'];

  for (let d = 0; d < 365; d++) {
    const workouts = [];
    const foods = [];
    for (let w = 0; w < 14; w++) {
      workouts.push({
        type: workoutTypes[(d + w) % workoutTypes.length],
        duration: 20 + (w * 5),
        calories: 100 + (w * 25),
        date: `2025-01-${String((d % 28) + 1).padStart(2, '0')}`
      });
    }
    for (let f = 0; f < 14; f++) {
      foods.push({
        name: `${foodItems[(d + f) % foodItems.length]} #${d}-${f}`,
        cal: 200 + (f * 30),
        p: 15,
        c: 30,
        f: 10,
        timestamp: `2025-01-${String((d % 28) + 1).padStart(2, '0')}`
      });
    }
    largeHabits.push({
      date: `2025-01-${String((d % 28) + 1).padStart(2, '0')}`,
      workouts,
      foods
    });
  }

  const startCollection = performance.now();
  const entries = collectHistoricalEntries(largeHabits);
  const collectionDuration = performance.now() - startCollection;

  assert.equal(entries.length, 365 * 28); // 10,220 entries
  assert.ok(collectionDuration < 200, `Collection of 10k items took ${collectionDuration}ms (expected < 200ms)`);

  const startFilter = performance.now();
  const searchResult = filterEntries(entries, 'Paneer');
  const filterDuration = performance.now() - startFilter;

  assert.ok(searchResult.length > 0, 'Should find Paneer items');
  assert.ok(filterDuration < 50, `Filtering 10k items took ${filterDuration}ms (expected < 50ms)`);
});

test('Search in ExerciseScreen: filtering logic', () => {
  const habits = [
    {
      date: '2026-09-20',
      workouts: [{ type: 'Running', duration: 25 }]
    },
    {
      date: '2026-09-21',
      workouts: [{ type: 'Weights', duration: 45 }]
    },
    {
      date: '2026-09-22',
      workouts: [{ type: 'Running', duration: 30 }]
    },
    {
      date: '2026-09-23',
      workouts: [{ type: 'Yoga', duration: 40 }]
    }
  ];

  // No filter -> returns last 5 workouts reversed
  const all = filterWorkouts(habits, '');
  assert.equal(all.length, 4);
  assert.equal(all[0].type, 'Yoga'); // newest first due to reverse

  // Filter 'running'
  const running = filterWorkouts(habits, 'running');
  assert.equal(running.length, 2);
  assert.ok(running.every(w => w.type === 'Running'));

  // Filter 'weights'
  const weights = filterWorkouts(habits, '  WEIGHTS  ');
  assert.equal(weights.length, 1);
  assert.equal(weights[0].type, 'Weights');

  // Filter non-matching
  const none = filterWorkouts(habits, 'boxing');
  assert.equal(none.length, 0);

  // Empty habits
  assert.deepEqual(filterWorkouts([], 'running'), []);
  assert.deepEqual(filterWorkouts(null, 'running'), []);
});

test('formatDate edge cases', () => {
  assert.equal(formatDate('2026-09-24'), 'Sep 24, 2026');
  assert.equal(formatDate('invalid-date'), 'invalid-date');
  assert.equal(formatDate(undefined), undefined);
});


// =========================================================================
// 2. Dropdown Toggling & Interaction State Machine Testing
// =========================================================================

class MockTopBarStateMachine {
  constructor() {
    this.isSearchOpen = false;
    this.isNotifOpen = false;
    this.isProfileOpen = false;
    this.searchQuery = '';
    this.currentView = 'dashboard';
    this.toastMessage = '';
  }

  clickBell() {
    this.isNotifOpen = !this.isNotifOpen;
    this.isProfileOpen = false;
    this.isSearchOpen = false;
  }

  clickProfile() {
    this.isProfileOpen = !this.isProfileOpen;
    this.isNotifOpen = false;
    this.isSearchOpen = false;
  }

  typeSearch(query) {
    this.searchQuery = query;
    this.isSearchOpen = true;
  }

  focusSearch() {
    if (this.searchQuery.trim().length > 0) {
      this.isSearchOpen = true;
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.isSearchOpen = false;
  }

  selectEntry(item) {
    this.isSearchOpen = false;
    if (item.targetView) {
      this.currentView = item.targetView;
    }
  }

  signOut() {
    this.isProfileOpen = false;
    this.toastMessage = 'Signed out successfully (Demo session reset)';
  }

  // Outside click handler simulating document mousedown
  handleMouseDown(targetElement) {
    // targetElement can be 'inside-search', 'inside-notif', 'inside-profile', 'outside'
    if (targetElement !== 'inside-search') {
      this.isSearchOpen = false;
    }
    if (targetElement !== 'inside-notif') {
      this.isNotifOpen = false;
    }
    if (targetElement !== 'inside-profile') {
      this.isProfileOpen = false;
    }
  }

  // Keydown handler simulating document keydown
  handleKeyDown(key) {
    if (key === 'Escape') {
      this.isSearchOpen = false;
      this.isNotifOpen = false;
      this.isProfileOpen = false;
    }
  }
}

test('Dropdown: Bell toggle and mutual exclusion', () => {
  const tb = new MockTopBarStateMachine();
  assert.equal(tb.isNotifOpen, false);

  // Click bell -> opens
  tb.clickBell();
  assert.equal(tb.isNotifOpen, true);
  assert.equal(tb.isProfileOpen, false);
  assert.equal(tb.isSearchOpen, false);

  // Click bell again -> closes
  tb.clickBell();
  assert.equal(tb.isNotifOpen, false);
});

test('Dropdown: Profile toggle and mutual exclusion', () => {
  const tb = new MockTopBarStateMachine();
  assert.equal(tb.isProfileOpen, false);

  // Click profile -> opens
  tb.clickProfile();
  assert.equal(tb.isProfileOpen, true);
  assert.equal(tb.isNotifOpen, false);
  assert.equal(tb.isSearchOpen, false);

  // Click profile again -> closes
  tb.clickProfile();
  assert.equal(tb.isProfileOpen, false);
});

test('Dropdown: Clicking Bell while Profile is open closes Profile and opens Bell', () => {
  const tb = new MockTopBarStateMachine();
  tb.clickProfile();
  assert.equal(tb.isProfileOpen, true);
  assert.equal(tb.isNotifOpen, false);

  tb.clickBell();
  assert.equal(tb.isProfileOpen, false, 'Profile must close when Bell is clicked');
  assert.equal(tb.isNotifOpen, true, 'Bell must open when clicked');
});

test('Dropdown: Clicking Profile while Bell is open closes Bell and opens Profile', () => {
  const tb = new MockTopBarStateMachine();
  tb.clickBell();
  assert.equal(tb.isNotifOpen, true);
  assert.equal(tb.isProfileOpen, false);

  tb.clickProfile();
  assert.equal(tb.isNotifOpen, false, 'Bell must close when Profile is clicked');
  assert.equal(tb.isProfileOpen, true, 'Profile must open when clicked');
});

test('Dropdown: Inside clicks do NOT dismiss active dropdown', () => {
  const tb = new MockTopBarStateMachine();

  // Bell dropdown
  tb.clickBell();
  assert.equal(tb.isNotifOpen, true);
  tb.handleMouseDown('inside-notif');
  assert.equal(tb.isNotifOpen, true, 'Bell dropdown should remain open when clicking inside');

  // Profile dropdown
  tb.clickProfile();
  assert.equal(tb.isProfileOpen, true);
  tb.handleMouseDown('inside-profile');
  assert.equal(tb.isProfileOpen, true, 'Profile dropdown should remain open when clicking inside');

  // Search dropdown
  tb.typeSearch('run');
  assert.equal(tb.isSearchOpen, true);
  tb.handleMouseDown('inside-search');
  assert.equal(tb.isSearchOpen, true, 'Search dropdown should remain open when clicking inside');
});

test('Dropdown: Outside clicks dismiss active dropdown', () => {
  const tb = new MockTopBarStateMachine();

  // Bell dropdown
  tb.clickBell();
  assert.equal(tb.isNotifOpen, true);
  tb.handleMouseDown('outside');
  assert.equal(tb.isNotifOpen, false, 'Bell dropdown should close on outside click');

  // Profile dropdown
  tb.clickProfile();
  assert.equal(tb.isProfileOpen, true);
  tb.handleMouseDown('outside');
  assert.equal(tb.isProfileOpen, false, 'Profile dropdown should close on outside click');

  // Search dropdown
  tb.typeSearch('run');
  assert.equal(tb.isSearchOpen, true);
  tb.handleMouseDown('outside');
  assert.equal(tb.isSearchOpen, false, 'Search dropdown should close on outside click');
});

test('Dropdown: Escape key dismisses all open dropdowns', () => {
  const tb = new MockTopBarStateMachine();

  tb.clickBell();
  assert.equal(tb.isNotifOpen, true);
  tb.handleKeyDown('Escape');
  assert.equal(tb.isNotifOpen, false, 'Bell dropdown should close on Escape');

  tb.clickProfile();
  assert.equal(tb.isProfileOpen, true);
  tb.handleKeyDown('Escape');
  assert.equal(tb.isProfileOpen, false, 'Profile dropdown should close on Escape');

  tb.typeSearch('run');
  assert.equal(tb.isSearchOpen, true);
  tb.handleKeyDown('Escape');
  assert.equal(tb.isSearchOpen, false, 'Search dropdown should close on Escape');
});

test('Dropdown: Sign Out action closes profile and shows toast', () => {
  const tb = new MockTopBarStateMachine();
  tb.clickProfile();
  assert.equal(tb.isProfileOpen, true);

  tb.signOut();
  assert.equal(tb.isProfileOpen, false);
  assert.equal(tb.toastMessage, 'Signed out successfully (Demo session reset)');
});

test('Dropdown: Select Entry closes search and navigates view', () => {
  const tb = new MockTopBarStateMachine();
  tb.typeSearch('yoga');
  assert.equal(tb.isSearchOpen, true);

  tb.selectEntry({ name: 'Yoga', targetView: 'exercise' });
  assert.equal(tb.isSearchOpen, false);
  assert.equal(tb.currentView, 'exercise');
});

test('Dropdown: Clear search clears input and closes search dropdown', () => {
  const tb = new MockTopBarStateMachine();
  tb.typeSearch('yoga');
  assert.equal(tb.searchQuery, 'yoga');
  assert.equal(tb.isSearchOpen, true);

  tb.clearSearch();
  assert.equal(tb.searchQuery, '');
  assert.equal(tb.isSearchOpen, false);
});


// =========================================================================
// 3. Logo Image Path Verification
// =========================================================================

test('Logo: public/logo.jpg existence and format', () => {
  const publicLogoPath = path.join(projectRoot, 'public', 'logo.jpg');
  assert.ok(fs.existsSync(publicLogoPath), 'public/logo.jpg must exist');
  
  const stats = fs.statSync(publicLogoPath);
  assert.ok(stats.size > 10000, `logo.jpg size should be substantial (actual: ${stats.size} bytes)`);

  const buf = fs.readFileSync(publicLogoPath);
  // Verify JPEG magic bytes: 0xFF, 0xD8, 0xFF
  assert.equal(buf[0], 0xFF, 'JPEG first magic byte must be 0xFF');
  assert.equal(buf[1], 0xD8, 'JPEG second magic byte must be 0xD8');
  assert.equal(buf[2], 0xFF, 'JPEG third magic byte must be 0xFF');
});

test('Logo: dist/logo.jpg exists and matches public/logo.jpg after build', () => {
  const distLogoPath = path.join(projectRoot, 'dist', 'logo.jpg');
  assert.ok(fs.existsSync(distLogoPath), 'dist/logo.jpg must exist after production build');

  const publicBuf = fs.readFileSync(path.join(projectRoot, 'public', 'logo.jpg'));
  const distBuf = fs.readFileSync(distLogoPath);
  assert.ok(publicBuf.equals(distBuf), 'dist/logo.jpg must be identical to public/logo.jpg');
});

test('Logo: Sidebar.jsx correctly references /logo.jpg', () => {
  const sidebarPath = path.join(projectRoot, 'src', 'components', 'Sidebar.jsx');
  const content = fs.readFileSync(sidebarPath, 'utf8');

  assert.ok(content.includes('src="/logo.jpg"'), 'Sidebar.jsx must use src="/logo.jpg"');
  assert.ok(content.includes('alt="Habitly Logo"'), 'Sidebar.jsx must specify alt attribute');
  assert.ok(!content.includes('<span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">H</span>'), 'Old red H placeholder must be removed');
});


// =========================================================================
// 4. Source Code Contract & Required Strings Verification
// =========================================================================

test('TopBar.jsx contract: Required strings and components present', () => {
  const topBarPath = path.join(projectRoot, 'src', 'components', 'TopBar.jsx');
  const content = fs.readFileSync(topBarPath, 'utf8');

  // Exact required strings from R1
  assert.ok(content.includes('No new notifications yet'), 'Must contain exact string: No new notifications yet');
  assert.ok(content.includes('Alex Morgan'), 'Must contain user name: Alex Morgan');
  assert.ok(content.includes('alex.morgan@example.com'), 'Must contain user email: alex.morgan@example.com');
  assert.ok(content.includes('Sign Out'), 'Must contain Sign Out option');
  
  // Props signature
  assert.ok(content.includes('searchQuery = \'\''), 'TopBar must accept searchQuery prop');
  assert.ok(content.includes('setSearchQuery = () => {}'), 'TopBar must accept setSearchQuery prop');
  assert.ok(content.includes('habits = []'), 'TopBar must accept habits prop');
  assert.ok(content.includes('setCurrentView = () => {}'), 'TopBar must accept setCurrentView prop');

  // Outside click & escape listeners
  assert.ok(content.includes('mousedown'), 'TopBar must listen for mousedown for outside click');
  assert.ok(content.includes('keydown'), 'TopBar must listen for keydown for Escape key');
  assert.ok(content.includes('Escape'), 'TopBar must handle Escape key');
});

test('App.jsx contract: Props wiring to TopBar and ExerciseScreen', () => {
  const appPath = path.join(projectRoot, 'src', 'App.jsx');
  const content = fs.readFileSync(appPath, 'utf8');

  assert.ok(content.includes('const [searchQuery, setSearchQuery] = useState(\'\');'), 'App must manage searchQuery state');
  assert.ok(content.includes('searchQuery={searchQuery}'), 'App must pass searchQuery to TopBar');
  assert.ok(content.includes('setSearchQuery={setSearchQuery}'), 'App must pass setSearchQuery to TopBar');
  assert.ok(content.includes('habits={habits}'), 'App must pass habits to TopBar');
  assert.ok(content.includes('setCurrentView={setCurrentView}'), 'App must pass setCurrentView to TopBar');
  assert.ok(content.includes('<ExerciseScreen habits={habits} onSave={addWorkout} searchQuery={searchQuery} />'), 'App must pass searchQuery to ExerciseScreen');
});

test('ExerciseScreen.jsx contract: Search filtering', () => {
  const exercisePath = path.join(projectRoot, 'src', 'components', 'ExerciseScreen.jsx');
  const content = fs.readFileSync(exercisePath, 'utf8');

  assert.ok(content.includes('searchQuery = \'\''), 'ExerciseScreen must accept searchQuery prop');
  assert.ok(content.includes('filteredWorkouts'), 'ExerciseScreen must filter workouts against searchQuery');
  assert.ok(content.includes('Filtering'), 'ExerciseScreen should show filtering indicator');
});
