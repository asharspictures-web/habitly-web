// AI Assistant & Nutrition Intelligence Engine for Habitly

export const COMMON_FOOD_DATABASE = [
  // Indian Dishes
  { keywords: ['chicken biryani', 'biryani'], name: 'Chicken Biryani', cal: 450, p: 28, c: 52, f: 14, defaultQty: 1 },
  { keywords: ['paneer butter masala', 'paneer butter'], name: 'Paneer Butter Masala', cal: 340, p: 14, c: 12, f: 26, defaultQty: 1 },
  { keywords: ['dal makhani', 'makhani'], name: 'Dal Makhani', cal: 260, p: 11, c: 28, f: 12, defaultQty: 1 },
  { keywords: ['dal tadka', 'dal', 'daal', 'bowl of dal'], name: 'Dal Tadka', cal: 150, p: 9, c: 20, f: 4, defaultQty: 1 },
  { keywords: ['masala dosa', 'dosa'], name: 'Masala Dosa', cal: 280, p: 6, c: 42, f: 9, defaultQty: 1 },
  { keywords: ['chole bhature', 'bhature', 'chole'], name: 'Chole Bhature', cal: 480, p: 14, c: 58, f: 22, defaultQty: 1 },
  { keywords: ['idli sambar', 'idlis', 'idli'], name: 'Idli Sambar', cal: 180, p: 8, c: 34, f: 2, defaultQty: 1 },
  { keywords: ['palak paneer'], name: 'Palak Paneer', cal: 260, p: 15, c: 8, f: 18, defaultQty: 1 },
  { keywords: ['roti with ghee', 'rotis with ghee', 'rotis', 'roti', 'chapati', 'chapatis'], name: 'Roti with Ghee', cal: 140, p: 4, c: 22, f: 4, defaultQty: 1 },
  { keywords: ['tandoori chicken', 'tandoori'], name: 'Tandoori Chicken', cal: 260, p: 36, c: 3, f: 11, defaultQty: 1 },
  { keywords: ['rajma chawal', 'rajma'], name: 'Rajma Chawal', cal: 380, p: 14, c: 64, f: 6, defaultQty: 1 },
  { keywords: ['poha'], name: 'Poha', cal: 220, p: 4, c: 42, f: 5, defaultQty: 1 },
  { keywords: ['samosa', 'samosas'], name: 'Samosa', cal: 260, p: 4, c: 32, f: 14, defaultQty: 1 },

  // International Dishes
  { keywords: ['avocado toast'], name: 'Avocado Toast', cal: 220, p: 5, c: 22, f: 13, defaultQty: 1 },
  { keywords: ['grilled salmon & quinoa', 'salmon & quinoa', 'salmon and quinoa', 'grilled salmon', 'salmon'], name: 'Grilled Salmon & Quinoa', cal: 420, p: 38, c: 32, f: 14, defaultQty: 1 },
  { keywords: ['chicken caesar salad', 'caesar salad'], name: 'Chicken Caesar Salad', cal: 330, p: 30, c: 10, f: 18, defaultQty: 1 },
  { keywords: ['oatmeal with berries', 'oatmeal', 'oats with berries', 'oats'], name: 'Oatmeal with Berries', cal: 210, p: 7, c: 40, f: 4, defaultQty: 1 },
  { keywords: ['greek yogurt parfait', 'greek yogurt', 'yogurt parfait'], name: 'Greek Yogurt Parfait', cal: 190, p: 18, c: 22, f: 3, defaultQty: 1 },
  { keywords: ['sushi roll', 'sushi'], name: 'Sushi Roll', cal: 290, p: 12, c: 42, f: 6, defaultQty: 1 },
  { keywords: ['pasta primavera', 'pasta'], name: 'Pasta Primavera', cal: 380, p: 12, c: 62, f: 9, defaultQty: 1 },
  { keywords: ['protein shake', 'whey protein', 'whey'], name: 'Protein Shake', cal: 160, p: 28, c: 4, f: 2, defaultQty: 1 },
  { keywords: ['apple & peanut butter', 'apple and peanut butter'], name: 'Apple & Peanut Butter', cal: 200, p: 5, c: 24, f: 10, defaultQty: 1 },
  { keywords: ['hard boiled eggs', 'boiled eggs', 'eggs', 'egg'], name: 'Hard Boiled Eggs', cal: 70, p: 6, c: 1, f: 5, defaultQty: 2 },
  { keywords: ['chicken breast & rice', 'chicken & rice', 'chicken breast'], name: 'Chicken Breast & Rice', cal: 370, p: 35, c: 45, f: 4, defaultQty: 1 },
  { keywords: ['quinoa & hummus bowl', 'hummus and pita', 'hummus'], name: 'Quinoa & Hummus Bowl', cal: 280, p: 10, c: 44, f: 8, defaultQty: 1 },
  { keywords: ['rice', 'white rice', 'brown rice'], name: 'Rice', cal: 205, p: 4, c: 45, f: 0, defaultQty: 1 },
  { keywords: ['banana', 'bananas'], name: 'Banana', cal: 105, p: 1, c: 27, f: 0, defaultQty: 1 },
  { keywords: ['apple', 'apples'], name: 'Apple', cal: 95, p: 0, c: 25, f: 0, defaultQty: 1 },
  { keywords: ['salad'], name: 'Salad', cal: 50, p: 2, c: 10, f: 0, defaultQty: 1 },
];

/**
 * Extracts quantity from a text snippet preceding or succeeding a food name
 */
function extractQuantity(text, keyword) {
  const wordsToNumbers = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'a': 1, 'an': 1, 'single': 1, 'pair': 2, 'couple': 2
  };

  const regex = new RegExp(`(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|a|an|single|pair|couple)\\s+(?:bowl|bowls|plate|plates|slice|slices|piece|pieces|cup|cups|serving|servings|scoop|scoops)?\\s*(?:of\\s+)?${keyword}`, 'i');
  const match = text.match(regex);
  if (match && match[1]) {
    const val = match[1].toLowerCase();
    return wordsToNumbers[val] || parseInt(val, 10) || 1;
  }
  return 1;
}

/**
 * Detects if a user question is a food logging intent
 */
export function isFoodLogRequest(question, foodDatabase = COMMON_FOOD_DATABASE) {
  if (!question || typeof question !== 'string') return false;
  const q = question.trim().toLowerCase();

  // Queries asking for information or ideas should NOT be interpreted as logging requests
  if (
    q.includes('how many') ||
    q.includes('how much') ||
    q.includes('what did i') ||
    q.includes('what have i') ||
    q.includes('ideas') ||
    q.includes('suggest') ||
    q.includes('recipe') ||
    q.startsWith('can you recommend')
  ) {
    return false;
  }

  // Explicit log command prefixes
  if (
    q.startsWith('log ') ||
    q.startsWith('track ') ||
    q.startsWith('add ') ||
    q.startsWith('record ') ||
    q.startsWith('i ate ') ||
    q.startsWith('i had ') ||
    q.startsWith('ate ') ||
    q.startsWith('had ') ||
    q.includes('log my ') ||
    q.includes('log food') ||
    q.includes('add food')
  ) {
    return true;
  }

  // If query explicitly mentions known foods along with meal actions
  for (const item of foodDatabase) {
    for (const kw of item.keywords) {
      if (q.includes(kw) && (q.includes('log') || q.includes('ate') || q.includes('had') || q.includes('for breakfast') || q.includes('for lunch') || q.includes('for dinner') || q.includes('for snack'))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Analyzes food query and computes estimated calories and macros
 */
export function parseFoodFromQuery(query, foodDatabase = COMMON_FOOD_DATABASE) {
  const cleanQ = query.trim().replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:log|track|add|record|i\s+ate|i\s+had|ate|had)\s+/i, '');
  const lowerQ = cleanQ.toLowerCase();

  const matchedFoods = [];
  let remainingQuery = lowerQ;

  // Search through knowledge base sorted by keyword length descending to match specific phrases first
  const sortedDatabase = [...foodDatabase].sort((a, b) => {
    const maxA = Math.max(...a.keywords.map(k => k.length));
    const maxB = Math.max(...b.keywords.map(k => k.length));
    return maxB - maxA;
  });

  for (const item of sortedDatabase) {
    for (const kw of item.keywords) {
      if (remainingQuery.includes(kw)) {
        const qty = extractQuantity(lowerQ, kw) || item.defaultQty || 1;
        matchedFoods.push({
          name: item.name,
          qty,
          cal: item.cal * qty,
          p: item.p * qty,
          c: item.c * qty,
          f: item.f * qty,
        });
        // Remove keyword occurrence to avoid duplicate matches
        remainingQuery = remainingQuery.replace(kw, '');
        break;
      }
    }
  }

  if (matchedFoods.length > 0) {
    const totalCal = matchedFoods.reduce((sum, f) => sum + f.cal, 0);
    const totalP = matchedFoods.reduce((sum, f) => sum + f.p, 0);
    const totalC = matchedFoods.reduce((sum, f) => sum + f.c, 0);
    const totalF = matchedFoods.reduce((sum, f) => sum + f.f, 0);

    const displayName = cleanQ.length > 0 && cleanQ.length < 60
      ? cleanQ.charAt(0).toUpperCase() + cleanQ.slice(1)
      : matchedFoods.map(f => f.qty > 1 ? `${f.qty} ${f.name}` : f.name).join(' & ');

    return {
      foodName: displayName,
      cal: Math.round(totalCal),
      p: Math.round(totalP),
      c: Math.round(totalC),
      f: Math.round(totalF),
      items: matchedFoods
    };
  }

  // Check if explicit calories were passed in query (e.g. "350 calories snack")
  const calMatch = lowerQ.match(/(\d+)\s*(?:cal|calories|kcal)/i);
  if (calMatch) {
    const cal = parseInt(calMatch[1], 10) || 250;
    const p = Math.round((cal * 0.25) / 4);
    const c = Math.round((cal * 0.50) / 4);
    const f = Math.round((cal * 0.25) / 9);
    return {
      foodName: cleanQ.charAt(0).toUpperCase() + cleanQ.slice(1),
      cal,
      p,
      c,
      f
    };
  }

  // Fallback intelligent estimation for unknown foods
  const defaultCal = 320;
  const p = Math.round((defaultCal * 0.22) / 4);
  const c = Math.round((defaultCal * 0.48) / 4);
  const f = Math.round((defaultCal * 0.30) / 9);

  return {
    foodName: cleanQ.charAt(0).toUpperCase() + cleanQ.slice(1) || 'Custom Meal',
    cal: defaultCal,
    p,
    c,
    f
  };
}

/**
 * Creates a backward-compatible AI response object that provides both structured
 * card payloads and native string methods/string coercions.
 */
function createAIResponse(text, card = null) {
  return {
    text,
    card,
    toString() { return this.text; },
    valueOf() { return this.text; },
    includes(...args) { return this.text.includes(...args); },
    toLowerCase() { return this.text.toLowerCase(); },
    toUpperCase() { return this.text.toUpperCase(); },
    startsWith(...args) { return this.text.startsWith(...args); },
    endsWith(...args) { return this.text.endsWith(...args); },
    indexOf(...args) { return this.text.indexOf(...args); },
    slice(...args) { return this.text.slice(...args); },
    get length() { return this.text.length; },
    [Symbol.toPrimitive]() {
      return this.text;
    }
  };
}

// Mock AI summary generator for the demo
export async function generateSummary(habits) {
  const isTest = typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || (process.argv && process.argv.some(a => a.includes('test'))));
  await new Promise(resolve => setTimeout(resolve, isTest ? 5 : 1200));

  if (!habits || habits.length === 0) {
    return "Ready to track your habits? Log your first day to see your summary!";
  }

  const latest = habits[habits.length - 1];
  if (!latest) {
    return "Ready to track your habits? Log your first day to see your summary!";
  }

  const sleepNote = latest.sleep >= 7
    ? "Great job getting enough rest."
    : "Looks like your sleep was a bit on the low side, try to aim for 7-8 hours tonight.";
  const waterNote = latest.water >= 2000 || latest.water >= 8
    ? "You're staying well hydrated!"
    : "Make sure to drink a little more water tomorrow.";

  const workoutDur = latest.workoutDuration || 30;
  const workoutTyp = latest.workoutType || 'General';

  return `You logged a ${workoutDur} minute ${workoutTyp} workout today, way to stay active! ${sleepNote} ${waterNote} Keep up the momentum!`;
}

// Interactive AI Chat function with food logging card generation
export const SYSTEM_PROMPT = `
You are the Habitly AI Health & Nutrition Assistant, embedded inside the Habitly fitness app.

Rules:
1. Use only the real data given to you about this user (their logged meals, calories, workouts, steps, weight, mood). Never respond with generic filler like "great question" or "you're doing well" unless you can point to an actual number or log entry. If there isn't enough logged data to answer, say exactly what's missing and ask for it. Don't guess.

2. Safety first on weight and health questions. If a request is physically unsafe or impossible, do not comply and do not soften it with encouragement. State plainly that it isn't medically safe or realistic, explain why in one simple sentence, then give the safe alternative instead.
Unsafe patterns to catch: losing more than 0.5-1 kg of real body fat in a week (never in a single day), calorie intake below 1200 kcal/day for women or 1500 kcal/day for men, skipping meals to lose weight fast, exercising through pain or injury, any mention of purging, laxatives, or diet pills.

3. Never diagnose a medical condition. If the user describes symptoms, pain, or a medical concern, tell them to see a doctor or physiotherapist. Do not guess what's wrong with them.

4. Keep answers short and specific, two to four sentences unless a full plan is asked for. No corporate chatbot phrases like "That's a great question" or "Based on your recent logs, you are generally doing well." Get to the point.

5. Tone: supportive and direct, like a knowledgeable coach, not a disclaimer machine. Give the safety warning when needed, then move straight to something useful.
`;

export async function chatWithAI(question, habits = [], goals = {}, foodDatabase = COMMON_FOOD_DATABASE) {
  if (!question || typeof question !== 'string') {
    return createAIResponse("How can I assist you with your health and fitness today?");
  }

  const safeHabits = Array.isArray(habits) ? habits : [];
  const latest = safeHabits.length > 0 ? safeHabits[safeHabits.length - 1] : null;

  const userContext = `
    User Data:
    Weight: ${goals.currentWeight || 'Unknown'} kg
    Target Weight: ${goals.targetWeight || 'Unknown'} kg
    Today's Steps: ${latest?.steps || 0}
    Today's Sleep: ${latest?.sleep || 0} hours
    Today's Water: ${latest?.water || 0} glasses
    Today's Mood: ${latest?.mood || 'None'}
    Today's Workouts: ${latest?.workoutDuration || 0} mins
    Today's Meals: ${(latest?.foods || []).map(f => f.name).join(', ') || 'None'}
  `;

  // Retain the UI card functionality for food logging so it still renders the confirmation card,
  // but let the AI model generate the actual text response.
  let card = null;
  if (isFoodLogRequest(question, foodDatabase)) {
    const nutrition = parseFoodFromQuery(question, foodDatabase);
    if (nutrition) {
      card = {
        type: 'food_confirmation',
        foodName: nutrition.foodName,
        cal: nutrition.cal,
        p: nutrition.p,
        c: nutrition.c,
        f: nutrition.f,
        logged: false
      };
    }
  }

  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : null);

  if (!apiKey) {
    console.error("Gemini API key is missing (VITE_GEMINI_API_KEY). Cannot process AI request.");
    return createAIResponse("Sorry, I couldn't process that, please try again.", card);
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: SYSTEM_PROMPT });
    const prompt = `${userContext}\n\nUser: ${question}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return createAIResponse(text, card);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return createAIResponse("Sorry, I couldn't process that, please try again.", card);
  }
}
