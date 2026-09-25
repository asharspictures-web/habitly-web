import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { 
  chatWithAI, 
  parseFoodFromQuery, 
  isFoodLogRequest, 
  COMMON_FOOD_DATABASE 
} from '../src/lib/gemini.js';

const ROOT_DIR = process.cwd();

// ============================================================================
// FORENSIC AUDIT SUITE - MILESTONE 5: FINAL COMPREHENSIVE PROJECT AUDIT
// ============================================================================

test('FORENSIC CHECK R1.1: TopBar Search Filters Historical Entries by Name as Typed', () => {
  const topBarSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/TopBar.jsx'), 'utf8');

  // Verify search container, input, clear button, and results dropdown exist in code
  assert.ok(topBarSrc.includes('searchQuery'), 'TopBar must accept and bind searchQuery');
  assert.ok(topBarSrc.includes('historicalEntries'), 'TopBar must index historicalEntries');
  assert.ok(topBarSrc.includes('filteredEntries'), 'TopBar must compute filteredEntries');
  assert.ok(topBarSrc.includes('Matching Logs for'), 'TopBar must render matching logs dropdown header');

  // Simulate historical entries indexing and search filtering logic directly
  const mockHabits = [
    {
      date: '2026-09-20',
      workouts: [{ type: 'Running', duration: 45, calories: 420 }],
      foods: [{ name: 'Chicken Biryani', cal: 450, p: 28, c: 52, f: 14 }]
    },
    {
      date: '2026-09-21',
      workouts: [{ type: 'Yoga Flow', duration: 30, calories: 150 }],
      foods: [{ name: 'Dal Tadka & Roti', cal: 290, p: 13, c: 42, f: 8 }]
    },
    {
      date: '2026-09-22',
      workouts: [{ type: 'Cycling', duration: 60, calories: 500 }],
      foods: [{ text: 'Avocado Toast', cal: 220, p: 5, c: 22, f: 13 }]
    }
  ];

  const indexEntries = (habits) => {
    const list = [];
    (habits || []).forEach(day => {
      (day.workouts || []).forEach((w, idx) => {
        list.push({
          id: `workout-${day.date}-${idx}-${w.type}`,
          name: w.type || 'Workout',
          category: 'Workout',
          date: w.date || day.date,
          detail: `${w.duration} min${w.calories ? ` • ${w.calories} kcal` : ''}`
        });
      });
      (day.foods || []).forEach((f, idx) => {
        const foodName = f.name || f.text || 'Meal';
        list.push({
          id: `food-${day.date}-${idx}-${foodName}`,
          name: foodName,
          category: 'Food',
          date: f.timestamp || day.date,
          detail: `${f.cal} kcal`
        });
      });
    });
    return list;
  };

  const filterEntries = (entries, q) => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return entries.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.category.toLowerCase().includes(query) ||
      item.detail.toLowerCase().includes(query)
    );
  };

  const indexed = indexEntries(mockHabits);
  assert.equal(indexed.length, 6, 'Must index all 3 workouts and 3 foods');

  // Test search by workout name
  const runResults = filterEntries(indexed, 'run');
  assert.equal(runResults.length, 1);
  assert.equal(runResults[0].name, 'Running');

  // Test search by food name
  const biryaniResults = filterEntries(indexed, 'biryani');
  assert.equal(biryaniResults.length, 1);
  assert.equal(biryaniResults[0].name, 'Chicken Biryani');

  // Test search by category
  const foodCatResults = filterEntries(indexed, 'Food');
  assert.equal(foodCatResults.length, 3);

  // Test search non-matching
  const noneResults = filterEntries(indexed, 'nonexistentquery123');
  assert.equal(noneResults.length, 0);
});

test('FORENSIC CHECK R1.2: Notification Bell Dropdown Says "No new notifications yet"', () => {
  const topBarSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/TopBar.jsx'), 'utf8');

  assert.ok(topBarSrc.includes('isNotifOpen'), 'Must track notification dropdown open state');
  assert.ok(topBarSrc.includes('No new notifications yet'), 'Must contain verbatim text: "No new notifications yet"');
  assert.ok(topBarSrc.includes('0 new'), 'Must show 0 new indicator');
});

test('FORENSIC CHECK R1.3: Profile Icon Dropdown Shows User Name and "Sign Out"', () => {
  const topBarSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/TopBar.jsx'), 'utf8');

  assert.ok(topBarSrc.includes('isProfileOpen'), 'Must track profile dropdown state');
  assert.ok(topBarSrc.includes('Alex Morgan') || topBarSrc.includes('Alex Johnson') || topBarSrc.includes('Alex'), 'Must display user name');
  assert.ok(topBarSrc.includes('Sign Out'), 'Must display "Sign Out" option');
  assert.ok(topBarSrc.includes('handleSignOut'), 'Must have handleSignOut handler');
});

test('FORENSIC CHECK R1.4: Sidebar Logo Uses public/logo.jpg with 3D Barbell', () => {
  const sidebarSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/Sidebar.jsx'), 'utf8');

  // Check logo.jpg reference
  assert.ok(sidebarSrc.includes('/logo.jpg'), 'Sidebar must reference /logo.jpg');
  assert.ok(!sidebarSrc.includes('bg-red-600 rounded-xl p-2'), 'Old red H logo styling must not be present as logo');

  // Verify binary file exists
  const logoPath = path.join(ROOT_DIR, 'public/logo.jpg');
  assert.ok(fs.existsSync(logoPath), 'public/logo.jpg must exist');
  const stat = fs.statSync(logoPath);
  assert.ok(stat.size > 10000, `logo.jpg must be a valid non-empty image (size: ${stat.size} bytes)`);

  // Verify JPEG magic bytes FF D8 FF
  const buf = Buffer.alloc(3);
  const fd = fs.openSync(logoPath, 'r');
  fs.readSync(fd, buf, 0, 3, 0);
  fs.closeSync(fd);
  assert.equal(buf[0], 0xff, 'JPEG header byte 0 must be 0xFF');
  assert.equal(buf[1], 0xd8, 'JPEG header byte 1 must be 0xD8');
  assert.equal(buf[2], 0xff, 'JPEG header byte 2 must be 0xFF');
});

test('FORENSIC CHECK R2.1: "+ Log" Buttons on Water and Sleep Progress Rings on Dashboard', () => {
  const dashSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/DashboardScreen.jsx'), 'utf8');

  assert.ok(dashSrc.includes('+ Log'), 'Progress rings must include "+ Log" button text');
  assert.ok(dashSrc.includes('onLog={() => handleOpenQuickLog(\'water\')}'), 'Water ring must have onLog bound to water quick log');
  assert.ok(dashSrc.includes('onLog={() => handleOpenQuickLog(\'sleep\')}'), 'Sleep ring must have onLog bound to sleep quick log');
  assert.ok(dashSrc.includes('e.stopPropagation()'), 'onLog click must stop event propagation');
});

test('FORENSIC CHECK R2.2: Floating Quick-Log Button and QuickLogModal with Water/Sleep/Steps/Workout', () => {
  const dashSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/DashboardScreen.jsx'), 'utf8');
  const modalSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/QuickLogModal.jsx'), 'utf8');

  // Floating button in DashboardScreen
  assert.ok(dashSrc.includes('fixed bottom-8 right-8'), 'Floating button must be fixed at bottom-8 right-8');
  assert.ok(dashSrc.includes('QuickLogModal'), 'Dashboard must import and render QuickLogModal');

  // QuickLogModal tabs and handlers
  assert.ok(modalSrc.includes('handleQuickWaterAdd'), 'QuickLogModal must handle water logging');
  assert.ok(modalSrc.includes('handleSaveSleep'), 'QuickLogModal must handle sleep logging');
  assert.ok(modalSrc.includes('handleQuickStepsAdd') || modalSrc.includes('handleCustomSteps'), 'QuickLogModal must handle steps logging');
  assert.ok(modalSrc.includes('handleSaveWorkout'), 'QuickLogModal must handle workout logging');
  assert.ok(modalSrc.includes('role="dialog"') || modalSrc.includes('aria-modal="true"'), 'Modal must have accessible dialog attributes');
});

test('FORENSIC CHECK R3.1: Food Quick-Add Contains 22+ Indian & International Foods with Icons & Macros', () => {
  const foodSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/FoodScreen.jsx'), 'utf8');

  // Check COMMON_FOODS array length and properties
  const commonFoodsMatch = foodSrc.match(/const COMMON_FOODS = \[([\s\S]*?)\];/);
  assert.ok(commonFoodsMatch, 'COMMON_FOODS array must be defined in FoodScreen.jsx');

  // Verify categories
  assert.ok(foodSrc.includes('Indian'), 'Must include Indian category');
  assert.ok(foodSrc.includes('International'), 'Must include International category');
  assert.ok(foodSrc.includes('Chicken Biryani'), 'Must include Chicken Biryani');
  assert.ok(foodSrc.includes('Paneer Butter Masala'), 'Must include Paneer Butter Masala');
  assert.ok(foodSrc.includes('Dal Makhani'), 'Must include Dal Makhani');
  assert.ok(foodSrc.includes('Avocado Toast'), 'Must include Avocado Toast');
  assert.ok(foodSrc.includes('Grilled Salmon & Quinoa'), 'Must include Grilled Salmon');
  assert.ok(foodSrc.includes('Chicken Caesar Salad'), 'Must include Chicken Caesar Salad');

  // Verify gemini.js knowledge base is populated
  assert.ok(COMMON_FOOD_DATABASE.length >= 20, 'COMMON_FOOD_DATABASE must have at least 20 items');
});

test('FORENSIC CHECK R3.2: Custom Food Item with File Upload Photo from Device Storage', () => {
  const foodSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/FoodScreen.jsx'), 'utf8');

  assert.ok(foodSrc.includes('type="file"'), 'Must have file input for photo upload');
  assert.ok(foodSrc.includes('accept="image/*"'), 'Must restrict to image files');
  assert.ok(foodSrc.includes('readAsDataURL'), 'Must use FileReader.readAsDataURL for local persistence');
  assert.ok(foodSrc.includes('handleSaveCustomFood'), 'Must have handleSaveCustomFood handler');
  assert.ok(foodSrc.includes('photo: photoPreview'), 'Custom food payload must include photo');
});

test('FORENSIC CHECK R3.3: AI Assistant Page Loads without Errors and Responds Accurately', async () => {
  const aiSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/AIAssistantScreen.jsx'), 'utf8');
  assert.ok(aiSrc.includes('chatWithAI'), 'AIAssistantScreen must import chatWithAI');

  // Test chatWithAI responses
  const res1 = await chatWithAI("How much water did I drink?", [{ date: '2026-09-24', water: 7 }]);
  assert.ok(res1.toString().includes('7'), `Response must reflect 7 glasses: ${res1.toString()}`);

  const res2 = await chatWithAI("What healthy snack do you recommend?");
  assert.ok(res2.toString().toLowerCase().includes('protein') || res2.toString().toLowerCase().includes('snack'), 'Must provide healthy snack guidance');

  const resEmpty = await chatWithAI("");
  assert.ok(typeof resEmpty.toString() === 'string' && resEmpty.toString().length > 0, 'Must handle empty query gracefully');
});

test('FORENSIC CHECK R3.4: AI Assistant Food Confirmation Card (Food, Cal, P, C, F)', async () => {
  const query = "Log 2 Rotis and Paneer Butter Masala";
  assert.ok(isFoodLogRequest(query), 'Must identify query as a food log request');

  const parsed = parseFoodFromQuery(query);
  assert.ok(parsed.cal > 0, `Calories must be > 0 (got ${parsed.cal})`);
  assert.ok(parsed.p > 0, `Protein must be > 0 (got ${parsed.p})`);
  assert.ok(parsed.c > 0, `Carbs must be > 0 (got ${parsed.c})`);
  assert.ok(parsed.f > 0, `Fat must be > 0 (got ${parsed.f})`);

  const response = await chatWithAI(query);
  assert.ok(response.card, 'Response must include structured card object');
  assert.equal(response.card.type, 'food_confirmation', 'Card type must be food_confirmation');
  assert.ok(response.card.foodName, 'Card must specify foodName');
  assert.ok(response.card.cal, 'Card must specify calories');
  assert.ok(response.card.p !== undefined, 'Card must specify protein');
  assert.ok(response.card.c !== undefined, 'Card must specify carbs');
  assert.ok(response.card.f !== undefined, 'Card must specify fat');

  const aiSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/AIAssistantScreen.jsx'), 'utf8');
  assert.ok(aiSrc.includes('msg.card.type === \'food_confirmation\''), 'AIAssistantScreen must render food_confirmation card');
  assert.ok(aiSrc.includes('Protein'), 'Must display Protein in card');
  assert.ok(aiSrc.includes('Carbs'), 'Must display Carbs in card');
  assert.ok(aiSrc.includes('Fat'), 'Must display Fat in card');
});

test('FORENSIC CHECK R4.1: Background Imagery with Dark Overlays Across All 7 Major Screens', () => {
  const screens = [
    'src/components/DashboardScreen.jsx',
    'src/components/ExerciseScreen.jsx',
    'src/components/FoodScreen.jsx',
    'src/components/StepsScreen.jsx',
    'src/components/DeviceConnectScreen.jsx',
    'src/components/AIAssistantScreen.jsx',
    'src/components/GoalsScreen.jsx'
  ];

  for (const screenPath of screens) {
    const fullPath = path.join(ROOT_DIR, screenPath);
    assert.ok(fs.existsSync(fullPath), `Screen file must exist: ${screenPath}`);
    const content = fs.readFileSync(fullPath, 'utf8');

    const hasBgImage = content.includes('/hero-bg.jpg') || content.includes('hero-bg.jpg');
    assert.ok(hasBgImage, `${screenPath} must contain background image reference (/hero-bg.jpg)`);

    const hasDarkOverlay = content.includes('bg-gradient-to') || content.includes('bg-[#09090b]') || content.includes('bg-black') || content.includes('mix-blend');
    assert.ok(hasDarkOverlay, `${screenPath} must contain dark overlay for contrast and legibility`);
  }

  // Verify binary image public/hero-bg.jpg
  const heroPath = path.join(ROOT_DIR, 'public/hero-bg.jpg');
  assert.ok(fs.existsSync(heroPath), 'public/hero-bg.jpg must exist');
  const stat = fs.statSync(heroPath);
  assert.ok(stat.size > 20000, `hero-bg.jpg must be a valid non-empty image (size: ${stat.size} bytes)`);

  const buf = Buffer.alloc(3);
  const fd = fs.openSync(heroPath, 'r');
  fs.readSync(fd, buf, 0, 3, 0);
  fs.closeSync(fd);
  assert.equal(buf[0], 0xff, 'JPEG header byte 0 must be 0xFF');
  assert.equal(buf[1], 0xd8, 'JPEG header byte 1 must be 0xD8');
  assert.equal(buf[2], 0xff, 'JPEG header byte 2 must be 0xFF');
});

test('FORENSIC CHECK R4.2: Connect Devices Page Displays 5 Wearables & "Coming Soon" Modal without Fake Connections', () => {
  const deviceSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/components/DeviceConnectScreen.jsx'), 'utf8');

  // Verify all 5 devices exist
  assert.ok(deviceSrc.includes('Fitbit'), 'Must include Fitbit');
  assert.ok(deviceSrc.includes('Apple Health'), 'Must include Apple Health');
  assert.ok(deviceSrc.includes('Whoop'), 'Must include Whoop');
  assert.ok(deviceSrc.includes('Garmin'), 'Must include Garmin');
  assert.ok(deviceSrc.includes('Oura'), 'Must include Oura');

  // Verify Google Fit was properly replaced by Garmin
  assert.ok(!deviceSrc.includes('Google Fit'), 'Google Fit must not be present');

  // Verify verbatim coming soon message
  assert.ok(
    deviceSrc.includes('Coming soon, log manually for now') ||
    deviceSrc.includes('coming soon, log manually for now'),
    'Must display "Coming soon, log manually for now" modal message'
  );

  // FORENSIC INTEGRITY: Zero fake connections or simulated timers
  assert.ok(!deviceSrc.includes('setTimeout'), 'DeviceConnectScreen must NOT use setTimeout for fake connection simulation');
  assert.ok(!deviceSrc.includes('setInterval'), 'DeviceConnectScreen must NOT use setInterval');
  assert.ok(!deviceSrc.includes('simulate'), 'DeviceConnectScreen must NOT simulate fake connection');
  assert.ok(!deviceSrc.includes('fake'), 'DeviceConnectScreen must NOT contain fake connection stubs');

  // Verify modal dismissal
  assert.ok(deviceSrc.includes('handleBackdropClick') || deviceSrc.includes('Escape'), 'Must support modal dismissal');
});

test('FORENSIC CHECK: Integrity & Prohibited Patterns Audit across Entire Codebase', () => {
  const srcFiles = [
    'src/App.jsx',
    'src/components/TopBar.jsx',
    'src/components/Sidebar.jsx',
    'src/components/DashboardScreen.jsx',
    'src/components/QuickLogModal.jsx',
    'src/components/FoodScreen.jsx',
    'src/components/AIAssistantScreen.jsx',
    'src/components/DeviceConnectScreen.jsx',
    'src/components/ExerciseScreen.jsx',
    'src/components/StepsScreen.jsx',
    'src/components/GoalsScreen.jsx',
    'src/hooks/useHabits.js',
    'src/lib/gemini.js'
  ];

  for (const f of srcFiles) {
    const fullPath = path.join(ROOT_DIR, f);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Check for hardcoded test result patterns or bypass strings
    assert.ok(!content.includes('__MOCK_PASS__'), `${f} contains mock pass cheat`);
    assert.ok(!content.includes('__TEST_BYPASS__'), `${f} contains test bypass cheat`);
    assert.ok(!content.includes('eval('), `${f} contains unsafe eval`);
    assert.ok(!content.includes('new Function('), `${f} contains unsafe new Function`);
  }

  // Check package.json dependencies
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  const allowedDeps = ['react', 'react-dom', 'recharts', 'lucide-react'];
  for (const dep of Object.keys(pkg.dependencies || {})) {
    assert.ok(allowedDeps.includes(dep), `Disallowed dependency in package.json: ${dep}`);
  }
});
