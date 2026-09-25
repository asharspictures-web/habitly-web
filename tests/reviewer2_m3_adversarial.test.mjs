import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  chatWithAI, 
  generateSummary, 
  isFoodLogRequest, 
  parseFoodFromQuery, 
  COMMON_FOOD_DATABASE 
} from '../src/lib/gemini.js';

// =========================================================================
// Reviewer 2 Adversarial Stress Suite for Milestone 3 (R3)
// =========================================================================

test('R2-M3 Adversarial: Extreme and boundary quantities in food parsing', () => {
  // Single number word
  const r1 = parseFoodFromQuery('five rotis');
  assert.equal(r1.items[0].qty, 5);
  assert.equal(r1.cal, 140 * 5);

  // Large numeric digit
  const r2 = parseFoodFromQuery('100 hard boiled eggs');
  assert.equal(r2.items[0].qty, 100);
  assert.equal(r2.cal, 70 * 100);
  assert.equal(r2.p, 6 * 100);

  // Default quantity when none specified
  const r3 = parseFoodFromQuery('chicken biryani');
  assert.equal(r3.cal, 450);
  assert.equal(r3.p, 28);
  assert.equal(r3.c, 52);
  assert.equal(r3.f, 14);
});

test('R2-M3 Adversarial: Adversarial & malicious inputs into food parser', () => {
  // XSS script injection
  const xss = "<script>alert('xss')</script>";
  const rXss = parseFoodFromQuery(xss);
  assert.ok(rXss.cal > 0, "Should safely produce nutritional fallback without throwing");
  assert.ok(typeof rXss.foodName === 'string');

  // SQL Injection syntax
  const sqli = "SELECT * FROM foods WHERE 1=1; DROP TABLE habits;--";
  const rSql = parseFoodFromQuery(sqli);
  assert.ok(rSql.cal > 0);

  // Special characters and symbols
  const weird = "!@#$%^&*()_+~`|}{[]:;?><,./";
  const rWeird = parseFoodFromQuery(weird);
  assert.ok(rWeird.cal > 0);

  // Empty string and pure whitespace
  const rEmpty = parseFoodFromQuery("   ");
  assert.equal(rEmpty.foodName, 'Custom Meal');
  assert.ok(rEmpty.cal > 0);

  // Massive string (10,000 chars)
  const huge = "healthy salad ".repeat(700);
  const rHuge = parseFoodFromQuery(huge);
  assert.ok(rHuge.cal > 0);
});

test('R2-M3 Adversarial: Food questions vs. Log requests precision', () => {
  // Questions that contain food names should NOT be treated as log requests
  assert.equal(isFoodLogRequest("Is chicken biryani healthy for weight loss?"), false);
  assert.equal(isFoodLogRequest("How many calories are in paneer butter masala?"), false);
  assert.equal(isFoodLogRequest("Suggest a high protein dinner with chicken"), false);
  assert.equal(isFoodLogRequest("Can you recommend an oatmeal recipe?"), false);
  assert.equal(isFoodLogRequest("What did I eat yesterday?"), false);
  assert.equal(isFoodLogRequest("How much food did I consume?"), false);

  // Explicit log commands MUST be treated as log requests
  assert.equal(isFoodLogRequest("Log 2 rotis and dal"), true);
  assert.equal(isFoodLogRequest("log my breakfast: oatmeal with berries"), true);
  assert.equal(isFoodLogRequest("I ate 2 eggs and toast"), true);
  assert.equal(isFoodLogRequest("i had pasta primavera for dinner"), true);
  assert.equal(isFoodLogRequest("track avocado toast"), true);
  assert.equal(isFoodLogRequest("record chicken breast & rice"), true);
});

test('R2-M3 Adversarial: createAIResponse backwards compatibility and serialization', async () => {
  const habits = [
    {
      date: '2026-09-24',
      foods: [{ name: 'Chicken Biryani', cal: 450, p: 28, c: 52, f: 14 }]
    }
  ];

  const logRes = await chatWithAI("Log Chicken Biryani", habits);
  
  // 1. Structured card existence
  assert.ok(logRes.card, "Card object should exist");
  assert.equal(logRes.card.type, 'food_confirmation');
  assert.equal(logRes.card.foodName, 'Chicken Biryani');
  assert.equal(logRes.card.cal, 450);

  // 2. String conversion methods
  assert.ok(String(logRes).includes('nutrition log'));
  assert.ok(`${logRes}`.includes('nutrition log'));
  assert.ok(logRes.toLowerCase().includes('chicken biryani'));
  assert.ok(logRes.toUpperCase().includes('CHICKEN'));
  assert.ok(logRes.includes('Chicken Biryani'));
  assert.ok(logRes.length > 0);

  // 3. JSON serialization
  const jsonStr = JSON.stringify(logRes);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.card.foodName, 'Chicken Biryani');
  assert.equal(parsed.card.cal, 450);
  assert.ok(parsed.text.length > 0);
});

test('R2-M3 Adversarial: State accumulation and macro arithmetic integrity', () => {
  // Simulate useHabits food accumulation
  let todayHabit = {
    date: '2026-09-24',
    workouts: [],
    foods: [],
    steps: 0,
    water: 0,
    sleep: 0
  };

  const addFood = (food) => {
    todayHabit = {
      ...todayHabit,
      foods: [...todayHabit.foods, food]
    };
  };

  // Add Item 1: Preset Indian Quick Add
  addFood({
    name: 'Paneer Butter Masala',
    text: 'Paneer Butter Masala',
    cal: 340,
    p: 14,
    c: 12,
    f: 26,
    category: 'Indian',
    icon: '🧀',
    date: '2026-09-24',
    timestamp: '2026-09-24T12:00:00Z'
  });

  // Add Item 2: Custom Food with Photo
  const dummyPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  addFood({
    name: 'Home Protein Bowl',
    text: 'Home Protein Bowl',
    cal: '380', // String input test
    p: '35',    // String input test
    c: 40,
    f: 8,
    photo: dummyPhoto,
    category: 'Custom',
    date: '2026-09-24',
    timestamp: '2026-09-24T15:00:00Z'
  });

  // Add Item 3: AI Logged Food
  addFood({
    name: '2 Rotis with Ghee',
    text: '2 Rotis with Ghee',
    cal: 280,
    p: 8,
    c: 44,
    f: 8,
    date: '2026-09-24',
    timestamp: '2026-09-24T19:00:00Z'
  });

  assert.equal(todayHabit.foods.length, 3);

  // Compute totals as FoodScreen does
  const totals = todayHabit.foods.reduce((acc, f) => {
    acc.cal += Number(f.cal) || 0;
    acc.p += Number(f.p) || 0;
    acc.c += Number(f.c) || 0;
    acc.f += Number(f.f) || 0;
    return acc;
  }, { cal: 0, p: 0, c: 0, f: 0 });

  // 340 + 380 + 280 = 1000 kcal
  assert.equal(totals.cal, 1000, `Calories total should be exactly 1000, got ${totals.cal}`);
  // 14 + 35 + 8 = 57 g protein
  assert.equal(totals.p, 57, `Protein total should be 57, got ${totals.p}`);
  // 12 + 40 + 44 = 96 g carbs
  assert.equal(totals.c, 96, `Carbs total should be 96, got ${totals.c}`);
  // 26 + 8 + 8 = 42 g fat
  assert.equal(totals.f, 42, `Fat total should be 42, got ${totals.f}`);

  // Validate JSON serialization with photo data URL
  const serialized = JSON.stringify([todayHabit]);
  assert.ok(serialized.includes(dummyPhoto), 'Base64 photo must be preserved in serialized habits');
  const restored = JSON.parse(serialized);
  assert.equal(restored[0].foods[1].photo, dummyPhoto);
});

test('R2-M3 Adversarial: chatWithAI calorie summation across multiple logged foods', async () => {
  const habits = [
    {
      date: '2026-09-24',
      foods: [
        { name: 'Avocado Toast', cal: 220, p: 5, c: 22, f: 13 },
        { name: 'Protein Shake', cal: 160, p: 28, c: 4, f: 2 },
        { name: 'Chicken Biryani', cal: 450, p: 28, c: 52, f: 14 }
      ]
    }
  ];

  // 220 + 160 + 450 = 830 kcal
  const res = await chatWithAI("How many calories have I consumed today?", habits);
  assert.equal(res.card, null);
  assert.ok(res.text.includes("830 kcal"), `Response should include 830 kcal, got: ${res.text}`);
  assert.ok(res.text.includes("3 meal(s)"));
});
