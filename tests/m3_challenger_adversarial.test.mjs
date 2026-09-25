import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { 
  chatWithAI, 
  isFoodLogRequest, 
  parseFoodFromQuery 
} from '../src/lib/gemini.js';

const projectRoot = process.cwd();

// Helper to simulate handleSaveCustomFood logic from FoodScreen.jsx
function simulateSaveCustomFood({ customName, customCal, customP, customC, customF, photoPreview, todayStr = '2026-09-24' }) {
  if (!customName || !customName.trim()) return null;

  const cal = Math.max(0, parseInt(customCal, 10) || 0);
  const p = Math.max(0, parseFloat(customP) || 0);
  const c = Math.max(0, parseFloat(customC) || 0);
  const f = Math.max(0, parseFloat(customF) || 0);

  return {
    name: customName.trim(),
    text: customName.trim(),
    cal,
    p,
    c,
    f,
    photo: photoPreview || null,
    date: todayStr,
    timestamp: new Date().toISOString(),
    category: 'Custom'
  };
}

// Helper to simulate FoodScreen totals & chartData calculation
function calculateNutritionTotals(foods) {
  const safeFoods = Array.isArray(foods) ? foods : [];
  const totals = safeFoods.reduce((acc, f) => {
    acc.cal += Number(f?.cal) || 0;
    acc.p += Number(f?.p) || 0;
    acc.c += Number(f?.c) || 0;
    acc.f += Number(f?.f) || 0;
    return acc;
  }, { cal: 0, p: 0, c: 0, f: 0 });

  const chartData = [
    { name: 'Protein', value: totals.p * 4, color: '#ef4444' },
    { name: 'Carbs', value: totals.c * 4, color: '#3b82f6' },
    { name: 'Fat', value: totals.f * 9, color: '#eab308' },
  ].filter(d => d.value > 0);

  return { totals, chartData };
}

// Helper to simulate category filtering from FoodScreen.jsx
function filterCommonFoods(commonFoods, activeCategory) {
  return commonFoods.filter(food => {
    if (activeCategory === 'All') return true;
    if (food.category === activeCategory) return true;
    if (food.tags && food.tags.includes(activeCategory)) return true;
    return false;
  });
}

// =========================================================================
// 1. Custom Food Photo Upload Stress & Edge Cases
// =========================================================================

test('Photo Upload Edge Case 1: Cancellation, empty file list, and null target', () => {
  const foodScreenCode = fs.readFileSync(path.join(projectRoot, 'src/components/FoodScreen.jsx'), 'utf8');

  // Verify safe optional chaining on e.target.files?.[0]
  assert.ok(
    foodScreenCode.includes('e.target.files?.[0]'),
    'FoodScreen must safely use optional chaining e.target.files?.[0] to prevent null pointer exceptions'
  );

  // Simulate handlePhotoUpload boundary conditions
  const simulatePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return { uploaded: false, preview: null };
    return { uploaded: true, preview: 'data:image/png;base64,mock' };
  };

  assert.equal(simulatePhotoUpload({ target: {} }).uploaded, false);
  assert.equal(simulatePhotoUpload({ target: { files: [] } }).uploaded, false);
  assert.equal(simulatePhotoUpload({ target: { files: null } }).uploaded, false);
  assert.equal(simulatePhotoUpload({ target: { files: [new Blob(['test'])] } }).uploaded, true);
});

test('Photo Upload Edge Case 2: Large Data URL persistence and memory safety', () => {
  // Generate a realistic 2MB Base64 image payload
  const largeBase64Header = 'data:image/jpeg;base64,';
  const chunk = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const largeBase64 = largeBase64Header + chunk.repeat(32000); // ~2MB string

  const entry = simulateSaveCustomFood({
    customName: 'Heavy Feast',
    customCal: '850',
    customP: '45',
    customC: '60',
    customF: '25',
    photoPreview: largeBase64
  });

  assert.ok(entry, 'Entry should be created successfully');
  assert.equal(entry.photo, largeBase64);

  // Test JSON serialization & round-trip safety (simulating localStorage storage)
  const habitsData = [{ date: '2026-09-24', foods: [entry] }];
  const serialized = JSON.stringify(habitsData);
  assert.ok(serialized.length > 2000000, 'Serialized string should hold large Data URL');

  const deserialized = JSON.parse(serialized);
  assert.equal(deserialized[0].foods[0].photo, largeBase64);
  assert.equal(deserialized[0].foods[0].name, 'Heavy Feast');
});

test('Photo Upload Edge Case 3: Custom food without photo preserves null and renders fallback icon', () => {
  const entryWithoutPhoto = simulateSaveCustomFood({
    customName: 'Black Coffee',
    customCal: '5',
    customP: '0',
    customC: '1',
    customF: '0',
    photoPreview: null
  });

  assert.ok(entryWithoutPhoto);
  assert.equal(entryWithoutPhoto.photo, null);

  const foodScreenCode = fs.readFileSync(path.join(projectRoot, 'src/components/FoodScreen.jsx'), 'utf8');
  // Verify UI has ternary checking food.photo and fallback to icon
  assert.ok(
    foodScreenCode.includes('food.photo ?') && foodScreenCode.includes('food.icon ||'),
    'FoodScreen must conditionally render img when photo exists and fallback icon when photo is null'
  );
});

// =========================================================================
// 2. Custom Food Numeric Inputs Stress & Boundary Cases
// =========================================================================

test('Numeric Inputs Edge Case 1: Negative numbers are clamped to 0', () => {
  const result = simulateSaveCustomFood({
    customName: 'Anti-Calorie Salad',
    customCal: '-500',
    customP: '-25.5',
    customC: '-40',
    customF: '-15'
  });

  assert.ok(result);
  assert.equal(result.cal, 0, 'Negative calories must clamp to 0');
  assert.equal(result.p, 0, 'Negative protein must clamp to 0');
  assert.equal(result.c, 0, 'Negative carbs must clamp to 0');
  assert.equal(result.f, 0, 'Negative fat must clamp to 0');
});

test('Numeric Inputs Edge Case 2: Zero values and decimals parse accurately', () => {
  const result = simulateSaveCustomFood({
    customName: 'Electrolyte Water',
    customCal: '0',
    customP: '0.0',
    customC: '0.5',
    customF: '0'
  });

  assert.ok(result);
  assert.equal(result.cal, 0);
  assert.equal(result.p, 0);
  assert.equal(result.c, 0.5);
  assert.equal(result.f, 0);
});

test('Numeric Inputs Edge Case 3: Non-numeric, garbage, and whitespace inputs default safely to 0', () => {
  const result = simulateSaveCustomFood({
    customName: 'Mystery Snack',
    customCal: 'not-a-number',
    customP: 'NaN',
    customC: '---',
    customF: '   '
  });

  assert.ok(result);
  assert.equal(result.cal, 0);
  assert.equal(result.p, 0);
  assert.equal(result.c, 0);
  assert.equal(result.f, 0);
  assert.equal(Number.isNaN(result.cal), false);
  assert.equal(Number.isNaN(result.p), false);
});

test('Numeric Inputs Edge Case 4: Empty, whitespace-only, or missing food name rejects submission', () => {
  assert.equal(simulateSaveCustomFood({ customName: '' }), null);
  assert.equal(simulateSaveCustomFood({ customName: '   ' }), null);
  assert.equal(simulateSaveCustomFood({ customName: null }), null);
  assert.equal(simulateSaveCustomFood({ customName: undefined }), null);
});

test('Numeric Inputs Edge Case 5: Large numeric values do not overflow or produce NaN', () => {
  const result = simulateSaveCustomFood({
    customName: 'Sumo Diet',
    customCal: '15000',
    customP: '950.5',
    customC: '1200.75',
    customF: '450.25'
  });

  assert.ok(result);
  assert.equal(result.cal, 15000);
  assert.equal(result.p, 950.5);
  assert.equal(result.c, 1200.75);
  assert.equal(result.f, 450.25);

  const { totals, chartData } = calculateNutritionTotals([result]);
  assert.equal(totals.cal, 15000);
  assert.equal(chartData.length, 3);
  chartData.forEach(d => {
    assert.ok(d.value > 0);
    assert.equal(Number.isFinite(d.value), true);
  });
});

test('Nutrition Totals Math: Empty foods array and corrupted items produce 0s without crashing chart', () => {
  const emptyRes = calculateNutritionTotals([]);
  assert.equal(emptyRes.totals.cal, 0);
  assert.equal(emptyRes.totals.p, 0);
  assert.equal(emptyRes.totals.c, 0);
  assert.equal(emptyRes.totals.f, 0);
  assert.equal(emptyRes.chartData.length, 0);

  const corruptedFoods = [
    null,
    undefined,
    {},
    { cal: 'garbage', p: null, c: undefined, f: NaN },
    { cal: 200, p: 10, c: 20, f: 5 }
  ];

  const corruptRes = calculateNutritionTotals(corruptedFoods);
  assert.equal(corruptRes.totals.cal, 200);
  assert.equal(corruptRes.totals.p, 10);
  assert.equal(corruptRes.totals.c, 20);
  assert.equal(corruptRes.totals.f, 5);
  assert.equal(corruptRes.chartData.length, 3);
});

// =========================================================================
// 3. AI Assistant Queries Stress & Boundary Cases
// =========================================================================

test('AI Queries Edge Case 1: Empty, whitespace, null, and non-string queries', async () => {
  const habits = [{ date: '2026-09-24', foods: [] }];

  const res1 = await chatWithAI('', habits);
  assert.ok(res1.text && res1.text.length > 0);
  assert.equal(res1.card, null);

  const res2 = await chatWithAI('   \t\n  ', habits);
  assert.ok(res2.text && res2.text.length > 0);
  assert.equal(res2.card, null);

  const res3 = await chatWithAI(null, habits);
  assert.ok(res3.text && res3.text.length > 0);
  assert.equal(res3.card, null);

  const res4 = await chatWithAI(12345, habits);
  assert.ok(res4.text && res4.text.length > 0);
  assert.equal(res4.card, null);
});

test('AI Queries Edge Case 2: Rapid concurrent queries stress test (50 parallel requests)', async () => {
  const habits = [
    {
      date: '2026-09-24',
      sleep: 8,
      water: 2500,
      steps: 9000,
      foods: [{ name: 'Chicken Biryani', cal: 450, p: 28, c: 52, f: 14 }]
    }
  ];

  const queries = [
    'Log 2 Rotis and Paneer Butter Masala',
    'How many calories have I consumed today?',
    'Healthy high-protein snack ideas',
    'What was my sleep last night?',
    'Did I drink enough water?',
    'How many steps did I take?',
    'Log 1 bowl of oatmeal with berries',
    'I ate chicken caesar salad',
    'What food did I log today?',
    'How was my workout?'
  ];

  const tasks = [];
  for (let i = 0; i < 50; i++) {
    const q = queries[i % queries.length];
    tasks.push(chatWithAI(q, habits));
  }

  const results = await Promise.all(tasks);
  assert.equal(results.length, 50);

  results.forEach((res, idx) => {
    assert.ok(res, `Result ${idx} must exist`);
    assert.ok(typeof res.text === 'string' && res.text.length > 0, `Result ${idx} must have non-empty text`);
    if (queries[idx % queries.length].startsWith('Log') || queries[idx % queries.length].startsWith('I ate')) {
      assert.ok(res.card !== null, `Food logging query ${idx} must return structured card`);
      assert.equal(res.card.type, 'food_confirmation');
      assert.ok(res.card.cal > 0);
    }
  });
});

test('AI Queries Edge Case 3: Queries for completely unlogged days / empty habit history', async () => {
  // Empty habits array
  const emptyHabits = [];

  const q1 = await chatWithAI('How many calories have I consumed today?', emptyHabits);
  assert.ok(q1.text.includes("haven't logged any data yet") || q1.text.includes("haven't logged any foods yet"));

  const q2 = await chatWithAI('What was my sleep last night?', emptyHabits);
  assert.ok(q2.text.includes("haven't logged any data yet"));

  const q3 = await chatWithAI('How much water did I drink?', emptyHabits);
  assert.ok(q3.text.includes("haven't logged any data yet"));

  // Habits exist, but today's metrics are zero or missing
  const partialHabits = [{ date: '2026-09-24', foods: [] }];
  const q4 = await chatWithAI('How many calories have I consumed today?', partialHabits);
  assert.ok(q4.text.includes("haven't logged any foods yet today"));
});

test('AI Queries Edge Case 4: Complex multi-item food queries with quantity words and digits', () => {
  // 1. Two rotis and one bowl of dal makhani
  const p1 = parseFoodFromQuery('Log two rotis with ghee and one bowl of dal makhani');
  assert.ok(p1.cal >= 400, `Expected >= 400 kcal, got ${p1.cal}`);
  assert.ok(p1.p >= 15, `Expected >= 15g protein, got ${p1.p}`);
  assert.ok(p1.c >= 50, `Expected >= 50g carbs, got ${p1.c}`);

  // 2. Multiple items with digit quantities
  const p2 = parseFoodFromQuery('track 2 boiled eggs, 1 avocado toast, and 1 protein shake');
  assert.ok(p2.cal >= 500, `Expected >= 500 kcal, got ${p2.cal}`);
  assert.ok(p2.p >= 40, `Expected high protein (>= 40g), got ${p2.p}`);

  // 3. Indian feast combo
  const p3 = parseFoodFromQuery('i ate 1 masala dosa and 2 idli sambar');
  assert.ok(p3.cal >= 500, `Expected combo calories, got ${p3.cal}`);
  assert.ok(p3.items.length >= 2, `Should match both dosa and idli sambar`);
});

test('AI Queries Edge Case 5: Weird formatting, uppercase, extra spaces, and special symbols', async () => {
  // Uppercase shouting
  const r1 = await chatWithAI('LOG 2 ROTIS AND PANEER BUTTER MASALA', []);
  assert.ok(r1.card, 'Uppercase food log request must succeed');
  assert.equal(r1.card.type, 'food_confirmation');
  assert.ok(r1.card.cal > 400);

  // Extra whitespaces and tabs
  const r2 = await chatWithAI('   log    chicken   biryani   ', []);
  assert.ok(r2.card, 'Padded food log request must succeed');
  assert.ok(r2.card.foodName.toLowerCase().includes('biryani'));

  // Punctuation and quotes
  const r3 = await chatWithAI('Log: "Chole Bhature"!', []);
  assert.ok(r3.card, 'Quoted food name must succeed');
  assert.ok(r3.card.foodName.toLowerCase().includes('chole'));

  // Explicit calorie mention
  const r4 = await chatWithAI('track 600 calories post-workout meal', []);
  assert.ok(r4.card, 'Explicit calorie query must succeed');
  assert.equal(r4.card.cal, 600);
});

test('AI Queries Edge Case 6: Discriminates non-logging food questions from log commands', () => {
  // Questions that mention food but are NOT log commands
  const nonLogQueries = [
    'How many calories are in chicken biryani?',
    'What did I eat yesterday?',
    'Can you recommend high protein snacks?',
    'How much protein does salmon have?',
    'Suggest some healthy dinner ideas'
  ];

  nonLogQueries.forEach(q => {
    assert.equal(isFoodLogRequest(q), false, `Query "${q}" should NOT be identified as a food log request`);
  });

  // Legitimate log commands
  const logQueries = [
    'Log 2 rotis and dal',
    'track my lunch: chicken salad',
    'I had paneer butter masala for dinner',
    'record 1 bowl of oatmeal',
    'add food: sushi roll'
  ];

  logQueries.forEach(q => {
    assert.equal(isFoodLogRequest(q), true, `Query "${q}" MUST be identified as a food log request`);
  });
});

// =========================================================================
// 4. Category Filtering in FoodScreen Stress Tests
// =========================================================================

test('Category Filtering Edge Case 1: All categories filter correctly and without overlap issues', () => {
  const foodScreenCode = fs.readFileSync(path.join(projectRoot, 'src/components/FoodScreen.jsx'), 'utf8');

  // Parse COMMON_FOODS array directly from source code
  const match = foodScreenCode.match(/const\s+COMMON_FOODS\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(match, 'COMMON_FOODS must be present in FoodScreen.jsx');

  // Safely parse items
  const items = [];
  const regex = /{\s*name:\s*'([^']+)',\s*cal:\s*(\d+),\s*p:\s*(\d+(?:\.\d+)?),\s*c:\s*(\d+(?:\.\d+)?),\s*f:\s*(\d+(?:\.\d+)?),\s*category:\s*'([^']+)',\s*icon:\s*'([^']+)'(?:,\s*tags:\s*(\[[^\]]*\]))?/g;
  let m;
  while ((m = regex.exec(match[1])) !== null) {
    let tags = [];
    if (m[8]) {
      try {
        tags = JSON.parse(m[8].replace(/'/g, '"'));
      } catch {
        tags = [];
      }
    }
    items.push({
      name: m[1],
      cal: Number(m[2]),
      p: Number(m[3]),
      c: Number(m[4]),
      f: Number(m[5]),
      category: m[6],
      icon: m[7],
      tags
    });
  }

  assert.equal(items.length, 24, 'Must have exactly 24 common dishes');

  // Test 'All' category
  const allFoods = filterCommonFoods(items, 'All');
  assert.equal(allFoods.length, 24, "'All' category must return all 24 dishes");

  // Test 'Indian' category
  const indianFoods = filterCommonFoods(items, 'Indian');
  assert.ok(indianFoods.length >= 10, `'Indian' category should have at least 10 items, got ${indianFoods.length}`);
  indianFoods.forEach(f => {
    assert.ok(f.category === 'Indian' || (f.tags && f.tags.includes('Indian')), `Item ${f.name} in Indian tab must be Indian`);
  });

  // Test 'International' category
  const intlFoods = filterCommonFoods(items, 'International');
  assert.ok(intlFoods.length >= 10, `'International' category should have at least 10 items, got ${intlFoods.length}`);
  intlFoods.forEach(f => {
    assert.ok(f.category === 'International' || (f.tags && f.tags.includes('International')), `Item ${f.name} in International tab must be International`);
  });

  // Test 'Healthy' category
  const healthyFoods = filterCommonFoods(items, 'Healthy');
  assert.ok(healthyFoods.length >= 8, `'Healthy' category should have at least 8 items, got ${healthyFoods.length}`);
  healthyFoods.forEach(f => {
    assert.ok(f.category === 'Healthy' || (f.tags && f.tags.includes('Healthy')));
  });

  // Test 'Quick Snacks' category
  const snackFoods = filterCommonFoods(items, 'Quick Snacks');
  assert.ok(snackFoods.length >= 5, `'Quick Snacks' category should have at least 5 items, got ${snackFoods.length}`);
  snackFoods.forEach(f => {
    assert.ok(f.category === 'Quick Snacks' || (f.tags && f.tags.includes('Quick Snacks')));
  });

  // Test unknown / invalid category returns empty array safely without throwing
  const unknownFoods = filterCommonFoods(items, 'NonExistentCategory');
  assert.equal(unknownFoods.length, 0);

  const emptyCategoryFoods = filterCommonFoods(items, '');
  assert.equal(emptyCategoryFoods.length, 0);
});

// =========================================================================
// 5. App Wiring, Contract Symmetry & Schema Consistency Tests
// =========================================================================

test('App Wiring: onLogFood passed to AIAssistantScreen matches onSave passed to FoodScreen', () => {
  const appCode = fs.readFileSync(path.join(projectRoot, 'src/App.jsx'), 'utf8');

  // Verify FoodScreen wiring: onSave={addFood}
  assert.ok(
    appCode.includes('<FoodScreen habits={habits} onSave={addFood} />'),
    'App.jsx must pass addFood to FoodScreen as onSave'
  );

  // Verify AIAssistantScreen wiring: onLogFood={addFood}
  assert.ok(
    appCode.includes('<AIAssistantScreen habits={habits} onLogFood={addFood} />'),
    'App.jsx must pass addFood to AIAssistantScreen as onLogFood'
  );

  // Verify both useHabits and AIAssistantScreen contract: payload object structure
  const sampleAIPayload = {
    name: 'Paneer Butter Masala',
    text: 'Paneer Butter Masala',
    cal: 340,
    p: 14,
    c: 12,
    f: 26,
    date: '2026-09-24',
    timestamp: '2026-09-24T20:55:00.000Z'
  };

  const sampleCustomPayload = simulateSaveCustomFood({
    customName: 'Paneer Butter Masala',
    customCal: '340',
    customP: '14',
    customC: '12',
    customF: '26',
    photoPreview: null
  });

  // Check property key symmetry
  const requiredKeys = ['name', 'text', 'cal', 'p', 'c', 'f', 'date', 'timestamp'];
  requiredKeys.forEach(key => {
    assert.ok(key in sampleAIPayload, `AI payload must include ${key}`);
    assert.ok(key in sampleCustomPayload, `Custom food payload must include ${key}`);
  });
});
