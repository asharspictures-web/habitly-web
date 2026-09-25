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
// 1. Food Quick-Add Expansion Contract & Integrity Tests
// =========================================================================

test('Food Quick-Add: Source file contains 22+ diverse dishes with all required fields', () => {
  const foodScreenPath = path.join(projectRoot, 'src', 'components', 'FoodScreen.jsx');
  assert.ok(fs.existsSync(foodScreenPath), 'FoodScreen.jsx must exist');

  const content = fs.readFileSync(foodScreenPath, 'utf8');

  // Extract COMMON_FOODS array via regex
  const match = content.match(/const\s+COMMON_FOODS\s*=\s*(\[[\s\S]*?\]);/);
  assert.ok(match, 'COMMON_FOODS array must be defined in FoodScreen.jsx');

  // Parse items from COMMON_FOODS
  const items = [];
  const itemRegex = /{\s*name:\s*'([^']+)',\s*cal:\s*(\d+),\s*p:\s*(\d+(?:\.\d+)?),\s*c:\s*(\d+(?:\.\d+)?),\s*f:\s*(\d+(?:\.\d+)?),\s*category:\s*'([^']+)',\s*icon:\s*'([^']+)'/g;
  let m;
  while ((m = itemRegex.exec(match[1])) !== null) {
    items.push({
      name: m[1],
      cal: Number(m[2]),
      p: Number(m[3]),
      c: Number(m[4]),
      f: Number(m[5]),
      category: m[6],
      icon: m[7]
    });
  }

  assert.ok(items.length >= 22, `Expected at least 22 food items, found ${items.length}`);

  // Validate every item has positive calories and non-negative macros
  items.forEach(item => {
    assert.ok(item.name && item.name.length > 0, `Item must have a name: ${JSON.stringify(item)}`);
    assert.ok(item.cal > 0, `Item ${item.name} must have positive calories, got ${item.cal}`);
    assert.ok(item.p >= 0, `Item ${item.name} must have valid protein`);
    assert.ok(item.c >= 0, `Item ${item.name} must have valid carbs`);
    assert.ok(item.f >= 0, `Item ${item.name} must have valid fat`);
    assert.ok(item.category && item.category.length > 0, `Item ${item.name} must have a category`);
    assert.ok(item.icon && item.icon.length > 0, `Item ${item.name} must have an icon/thumbnail`);
  });

  // Verify mandatory Indian dishes
  const requiredIndian = [
    'Chicken Biryani',
    'Paneer Butter Masala',
    'Dal Makhani',
    'Masala Dosa',
    'Chole Bhature',
    'Idli Sambar',
    'Palak Paneer',
    'Roti with Ghee',
    'Tandoori Chicken',
    'Rajma Chawal'
  ];

  requiredIndian.forEach(req => {
    const found = items.some(i => i.name.toLowerCase().includes(req.toLowerCase()));
    assert.ok(found, `Mandatory Indian dish missing from FoodScreen: ${req}`);
  });

  // Verify mandatory International dishes
  const requiredInternational = [
    'Avocado Toast',
    'Grilled Salmon & Quinoa',
    'Chicken Caesar Salad',
    'Oatmeal with Berries',
    'Greek Yogurt Parfait',
    'Sushi Roll',
    'Pasta Primavera',
    'Protein Shake',
    'Apple & Peanut Butter'
  ];

  requiredInternational.forEach(req => {
    const found = items.some(i => i.name.toLowerCase().includes(req.toLowerCase()));
    assert.ok(found, `Mandatory International dish missing from FoodScreen: ${req}`);
  });

  // Verify COMMON_FOOD_DATABASE in gemini.js covers rich catalog
  assert.ok(COMMON_FOOD_DATABASE.length >= 22, `Expected COMMON_FOOD_DATABASE to have at least 22 entries, got ${COMMON_FOOD_DATABASE.length}`);
});

test('Food Quick-Add: Category filter tabs present and clean unused imports', () => {
  const foodScreenPath = path.join(projectRoot, 'src', 'components', 'FoodScreen.jsx');
  const content = fs.readFileSync(foodScreenPath, 'utf8');

  // Verify category filter tabs: All, Indian, International, Healthy, Quick Snacks
  assert.ok(content.includes("'All'"), "Must have 'All' category");
  assert.ok(content.includes("'Indian'"), "Must have 'Indian' category");
  assert.ok(content.includes("'International'"), "Must have 'International' category");
  assert.ok(content.includes("'Healthy'"), "Must have 'Healthy' category");
  assert.ok(content.includes("'Quick Snacks'"), "Must have 'Quick Snacks' category");

  // Verify unused useEffect was cleaned up from imports
  assert.ok(!content.includes("import React, { useState, useEffect }"), "Unused useEffect must not be imported in FoodScreen.jsx");
});

// =========================================================================
// 2. Custom Food with Photo File Upload Tests
// =========================================================================

test('Custom Food: File upload, instant preview, and save handler contracts', () => {
  const foodScreenPath = path.join(projectRoot, 'src', 'components', 'FoodScreen.jsx');
  const content = fs.readFileSync(foodScreenPath, 'utf8');

  // Must have file input accepting images
  assert.ok(content.includes('type="file"'), 'Must contain file input');
  assert.ok(content.includes('accept="image/*"'), 'File input must accept image/*');

  // Must use FileReader.readAsDataURL for instant preview
  assert.ok(content.includes('new FileReader()'), 'Must instantiate FileReader');
  assert.ok(content.includes('readAsDataURL'), 'Must use readAsDataURL');
  assert.ok(content.includes('onloadend') || content.includes('onload'), 'Must handle FileReader onload');

  // Form fields for custom food
  assert.ok(content.includes('customName') || content.includes('name'), 'Must have food name field');
  assert.ok(content.includes('customCal') || content.includes('cal'), 'Must have calories field');
  assert.ok(content.includes('customP') || content.includes('p'), 'Must have protein field');
  assert.ok(content.includes('customC') || content.includes('c'), 'Must have carbs field');
  assert.ok(content.includes('customF') || content.includes('f'), 'Must have fat field');

  // onSave invocation with custom food object including photo
  assert.ok(content.includes('photo: photoPreview') || content.includes('photo: previewDataUrl') || content.includes('photo:'), 'onSave must receive photo preview data URL');

  // Must render Today\'s Logged Foods list
  assert.ok(content.includes("Today's Logged Foods"), "Must render 'Today\\'s Logged Foods' heading");
  assert.ok(content.includes('food.photo'), "Must support rendering custom food photo thumbnail");
});

// =========================================================================
// 3. AI Assistant Page Error Fix & App.jsx Routing Tests
// =========================================================================

test('AI Assistant: AIAssistantScreen exists and is wired in App.jsx routing', () => {
  const aiScreenPath = path.join(projectRoot, 'src', 'components', 'AIAssistantScreen.jsx');
  assert.ok(fs.existsSync(aiScreenPath), 'src/components/AIAssistantScreen.jsx must exist');

  const appPath = path.join(projectRoot, 'src', 'App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  // Verify import is uncommented
  assert.ok(
    appContent.includes("import AIAssistantScreen from './components/AIAssistantScreen';"),
    "App.jsx must import AIAssistantScreen"
  );
  assert.ok(
    !appContent.includes("// import AIAssistantScreen"),
    "App.jsx must NOT have AIAssistantScreen commented out"
  );

  // Verify case 'ai' in renderScreen switch
  assert.ok(appContent.includes("case 'ai':"), "App.jsx renderScreen must handle case 'ai'");
  assert.ok(
    appContent.includes("<AIAssistantScreen habits={habits} onLogFood={addFood} />"),
    "App.jsx case 'ai' must render AIAssistantScreen with habits and onLogFood={addFood}"
  );
});

test('AI Assistant: Interactive chat UI, welcome message, and suggested chips', () => {
  const aiScreenPath = path.join(projectRoot, 'src', 'components', 'AIAssistantScreen.jsx');
  const content = fs.readFileSync(aiScreenPath, 'utf8');

  // Welcoming message
  assert.ok(content.includes("Habitly AI Health & Nutrition Assistant"), "Must have welcoming assistant message");

  // Suggested prompt chips
  assert.ok(content.includes("Log 2 Rotis and Paneer Butter Masala"), "Must include suggested food logging prompt chip");
  assert.ok(content.includes("How many calories have I consumed today?"), "Must include calorie query prompt chip");
  assert.ok(content.includes("Healthy high-protein snack ideas"), "Must include healthy snack prompt chip");

  // Chat stream and input field
  assert.ok(content.includes('scrollIntoView'), "Must support auto-scroll on new messages");
  assert.ok(content.includes('onKeyDown') || content.includes('handleKeyDown'), "Must support Enter key sending");
  assert.ok(content.includes('handleSendMessage') || content.includes('handleSend'), "Must have send message handler");
});

// =========================================================================
// 4. AI Food Logging Confirmation Card & gemini.js Tests
// =========================================================================

test('AI Food Confirmation Card: AIAssistantScreen renders rich confirmation badge', () => {
  const aiScreenPath = path.join(projectRoot, 'src', 'components', 'AIAssistantScreen.jsx');
  const content = fs.readFileSync(aiScreenPath, 'utf8');

  // Verification of card elements in UI
  assert.ok(content.includes('food_confirmation'), "Must handle card type 'food_confirmation'");
  assert.ok(content.includes('card.foodName'), "Must render food name in confirmation card");
  assert.ok(content.includes('card.cal'), "Must render calories badge in confirmation card");
  assert.ok(content.includes('card.p'), "Must render protein in confirmation card");
  assert.ok(content.includes('card.c'), "Must render carbs in confirmation card");
  assert.ok(content.includes('card.f'), "Must render fat in confirmation card");

  // Verification of logged status or confirm button
  assert.ok(
    content.includes("Logged to Food Diary") || content.includes("Confirm & Log"),
    "Must display 'Logged to Food Diary' status or interactive 'Confirm & Log' button"
  );
});

test('gemini.js: chatWithAI detects food log requests and returns structured card', async () => {
  // Mock habits
  const mockHabits = [
    {
      date: '2026-09-24',
      sleep: 8,
      water: 2500,
      steps: 8500,
      foods: [{ name: 'Oatmeal', cal: 200, p: 6, c: 38, f: 3 }],
      workoutDuration: 45,
      workoutType: 'Running'
    }
  ];

  // Test 1: Explicit log request for Indian foods
  const res1 = await chatWithAI("Log 2 Rotis and Paneer Butter Masala", mockHabits);
  assert.ok(res1.card, "Result must contain card object");
  assert.equal(res1.card.type, 'food_confirmation');
  assert.ok(res1.card.cal > 400, `Calories should be realistic for 2 rotis + paneer butter, got ${res1.card.cal}`);
  assert.ok(res1.card.p >= 15, `Protein should be substantial, got ${res1.card.p}`);
  assert.ok(res1.card.c >= 30, `Carbs should be accounted for, got ${res1.card.c}`);
  assert.ok(res1.card.f >= 20, `Fat should be accounted for, got ${res1.card.f}`);

  // Test 2: International food log request
  const res2 = await chatWithAI("Log 1 bowl of oatmeal with berries", mockHabits);
  assert.ok(res2.card, "Result must contain card object for oatmeal with berries");
  assert.equal(res2.card.type, 'food_confirmation');
  assert.ok(res2.card.foodName.toLowerCase().includes('oatmeal'));
  assert.ok(res2.card.cal >= 150 && res2.card.cal <= 300, `Oatmeal calories expected ~210, got ${res2.card.cal}`);

  // Test 3: 'I ate' phrasing
  const res3 = await chatWithAI("I ate chicken biryani", mockHabits);
  assert.ok(res3.card, "'I ate chicken biryani' should trigger food confirmation card");
  assert.equal(res3.card.type, 'food_confirmation');
  assert.ok(res3.card.foodName.toLowerCase().includes('biryani'));
  assert.ok(res3.card.cal >= 400);

  // Test 4: Custom / unknown food with calorie specification
  const res4 = await chatWithAI("Log 350 calories snack", mockHabits);
  assert.ok(res4.card, "Explicit calorie snack should produce confirmation card");
  assert.equal(res4.card.cal, 350);
  assert.ok(res4.card.p > 0);
  assert.ok(res4.card.c > 0);
  assert.ok(res4.card.f > 0);
});

test('gemini.js: Non-logging queries do NOT return food logging cards', async () => {
  const mockHabits = [
    {
      date: '2026-09-24',
      sleep: 7.5,
      water: 2200,
      steps: 10200,
      foods: [
        { name: 'Avocado Toast', cal: 220, p: 5, c: 22, f: 13 },
        { name: 'Protein Shake', cal: 160, p: 28, c: 4, f: 2 }
      ],
      workoutDuration: 40,
      workoutType: 'Strength'
    }
  ];

  // Query 1: Calorie question
  const calRes = await chatWithAI("How many calories have I consumed today?", mockHabits);
  assert.equal(calRes.card, null, "Calorie inquiry should not generate a logging card");
  assert.ok(calRes.text.includes("380 kcal"), `Should calculate sum of today's calories (220 + 160 = 380), text was: ${calRes.text}`);

  // Query 2: Healthy snack ideas
  const snackRes = await chatWithAI("Healthy high-protein snack ideas", mockHabits);
  assert.equal(snackRes.card, null, "Snack suggestions inquiry should not generate a logging card");
  assert.ok(snackRes.text.includes("Protein") || snackRes.text.includes("protein"), "Should return high protein ideas");

  // Query 3: Sleep question
  const sleepRes = await chatWithAI("How was my sleep?", mockHabits);
  assert.equal(sleepRes.card, null);
  assert.ok(sleepRes.text.includes("7.5") || sleepRes.text.includes("sleep"));

  // Query 4: Water question
  const waterRes = await chatWithAI("Did I drink enough water?", mockHabits);
  assert.equal(waterRes.card, null);
  assert.ok(waterRes.text.includes("water") || waterRes.text.includes("hydrated"));
});

test('gemini.js Line 44 Fix: uses latest.foods instead of obsolete latest.meals', async () => {
  const geminiPath = path.join(projectRoot, 'src', 'lib', 'gemini.js');
  const geminiCode = fs.readFileSync(geminiPath, 'utf8');

  // Verify line 44 fix: obsolete latest.meals is NOT referenced
  assert.ok(!geminiCode.includes('latest.meals'), "gemini.js must not reference obsolete latest.meals");
  assert.ok(geminiCode.includes('latest.foods'), "gemini.js must reference modern latest.foods");

  // Verify behavior when foods are logged
  const habitsWithFoods = [
    {
      date: '2026-09-24',
      foods: [
        { name: 'Chole Bhature', cal: 480, p: 14, c: 58, f: 22 },
        { name: 'Masala Dosa', cal: 280, p: 6, c: 42, f: 9 }
      ]
    }
  ];

  const mealRes = await chatWithAI("What food did I eat recently?", habitsWithFoods);
  assert.ok(mealRes.text.includes("Chole Bhature") && mealRes.text.includes("Masala Dosa"), "Should list logged foods");

  // Verify behavior when no foods are logged
  const habitsWithoutFoods = [{ date: '2026-09-24', foods: [] }];
  const emptyRes = await chatWithAI("What food did I eat?", habitsWithoutFoods);
  assert.ok(emptyRes.text.includes("haven't logged recent meals") || emptyRes.text.includes("No foods logged"), "Should handle empty foods gracefully");
});

// =========================================================================
// 5. Adversarial & Edge Case Tests
// =========================================================================

test('Adversarial: Empty, null, or undefined habits do not crash chatWithAI or generateSummary', async () => {
  // Undefined habits
  const r1 = await chatWithAI("Log Chicken Biryani", undefined);
  assert.ok(r1.card, "Should still successfully parse food with undefined habits");

  const r2 = await chatWithAI("How is my sleep?", undefined);
  assert.ok(r2.text.length > 0, "Should return response with undefined habits");

  // Null habits
  const r3 = await chatWithAI("Log 2 eggs", null);
  assert.ok(r3.card, "Should parse food with null habits");

  // Empty string or null question
  const r4 = await chatWithAI("", []);
  assert.ok(r4.text.length > 0, "Should handle empty question safely");

  const r5 = await chatWithAI(null, []);
  assert.ok(r5.text.length > 0, "Should handle null question safely");

  // generateSummary safety
  const s1 = await generateSummary(null);
  assert.ok(typeof s1 === 'string' && s1.length > 0);

  const s2 = await generateSummary([]);
  assert.ok(typeof s2 === 'string' && s2.length > 0);
});

test('Adversarial: Food parsing handles complex multi-item queries and quantities', () => {
  // Multi-item with number words
  const p1 = parseFoodFromQuery("two rotis and one bowl of dal tadka");
  assert.ok(p1.cal > 300, `Calories should reflect two rotis + dal, got ${p1.cal}`);
  assert.ok(p1.p >= 15);

  // Multi-item with digit numbers
  const p2 = parseFoodFromQuery("2 boiled eggs and 1 avocado toast");
  assert.ok(p2.cal >= 300, `Calories should reflect 2 eggs + avocado toast, got ${p2.cal}`);
  assert.ok(p2.p >= 15);

  // Unrecognized dish fallback
  const p3 = parseFoodFromQuery("homemade vegetable curry");
  assert.ok(p3.cal > 0);
  assert.ok(p3.p > 0);
  assert.ok(p3.c > 0);
  assert.ok(p3.f > 0);
});

test('Adversarial: isFoodLogRequest discriminates accurately between questions and log commands', () => {
  assert.equal(isFoodLogRequest("Log 2 Rotis and Paneer Butter Masala"), true);
  assert.equal(isFoodLogRequest("log 1 bowl of oatmeal with berries"), true);
  assert.equal(isFoodLogRequest("I ate chicken biryani for lunch"), true);
  assert.equal(isFoodLogRequest("track a protein shake"), true);
  assert.equal(isFoodLogRequest("add food: pasta"), true);

  assert.equal(isFoodLogRequest("How many calories have I consumed today?"), false);
  assert.equal(isFoodLogRequest("Healthy high-protein snack ideas"), false);
  assert.equal(isFoodLogRequest("What did I eat yesterday?"), false);
  assert.equal(isFoodLogRequest("How much food did I log?"), false);
  assert.equal(isFoodLogRequest("Can you recommend healthy dinners?"), false);
});

test('Integrity: Source files do not contain hardcoded test strings or dummy bypasses', () => {
  const filesToCheck = [
    'src/components/FoodScreen.jsx',
    'src/components/AIAssistantScreen.jsx',
    'src/lib/gemini.js',
    'src/App.jsx'
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(projectRoot, relPath);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Forbidden patterns that signify cheating
    assert.ok(!content.includes('__MOCK_TEST_BYPASS__'), `Cheat string found in ${relPath}`);
    assert.ok(!content.includes('__AUDITOR_PASSTHROUGH__'), `Cheat string found in ${relPath}`);
    assert.ok(!content.includes('/* test-only-bypass */'), `Cheat string found in ${relPath}`);
  }
});
