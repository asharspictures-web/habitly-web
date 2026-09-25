# Milestone 3 Empirical Challenger Report

- **Author**: Challenger 1 (Empirical Challenger)
- **Role**: critic, specialist
- **Date**: 2026-09-24T21:12:00Z
- **Verdict**: **APPROVE**

---

## 1. Observation

### 1.1 Direct Inspection of Implementation Files
1. `src/components/FoodScreen.jsx`:
   - Lines 6–34: `COMMON_FOODS` defines 24 dishes (12 Indian, 12 International), each specifying `name`, `cal`, `p`, `c`, `f`, `category`, and `icon`.
   - Lines 36: `CATEGORIES = ['All', 'Indian', 'International', 'Healthy', 'Quick Snacks']`.
   - Lines 105–114: `handlePhotoUpload`:
     ```javascript
     const handlePhotoUpload = (e) => {
       const file = e.target.files?.[0];
       if (!file) return;

       const reader = new FileReader();
       reader.onloadend = () => {
         setPhotoPreview(reader.result);
       };
       reader.readAsDataURL(file);
     };
     ```
   - Lines 116–146: `handleSaveCustomFood` performs strict input sanitization:
     ```javascript
     const handleSaveCustomFood = (e) => {
       e.preventDefault();
       if (!customName.trim()) return;

       const cal = Math.max(0, parseInt(customCal, 10) || 0);
       const p = Math.max(0, parseFloat(customP) || 0);
       const c = Math.max(0, parseFloat(customC) || 0);
       const f = Math.max(0, parseFloat(customF) || 0);

       onSave({
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
       });
     ```
   - Lines 314–385: "Today's Logged Foods" list renders custom photo thumbnails when `food.photo` is non-null, and falls back cleanly to `food.icon || '🍽️'`.
   - Lines 445–627: "+ Add Custom Food" modal with `<input type="file" accept="image/*">`, change/remove buttons, instant Data URL preview, and input validation.

2. `src/components/AIAssistantScreen.jsx`:
   - Lines 33–36:
     ```javascript
     const handleSendMessage = async (textToSend) => {
       const text = (textToSend !== undefined ? textToSend : input).trim();
       if (!text || isThinking) return;
     ```
   - Lines 54–75: When `rawCard && rawCard.type === 'food_confirmation'`, card is flagged as `logged: true` and automatically invokes `onLogFood` to persist the food item in state.
   - Lines 205–251: Rich food confirmation card displays Food Name, Calories (`kcal`), macro badges (`Protein`, `Carbs`, `Fat`), and status indicator `✓ Logged to Food Diary` (with fallback `Confirm & Log` button).
   - Lines 280–304: Input form disables submission during `isThinking` or when `input.trim()` is empty.

3. `src/lib/gemini.js`:
   - Lines 3–36: `COMMON_FOOD_DATABASE` with 25+ food definitions and keyword synonyms.
   - Lines 60–105: `isFoodLogRequest` discriminates between questions (e.g., "How many calories have I consumed today?", "Healthy high-protein snack ideas") and logging requests (e.g., "Log 2 Rotis and Paneer Butter Masala", "I ate chicken biryani").
   - Lines 110–192: `parseFoodFromQuery` extracts quantities ("two", "1 bowl", numbers), aggregates multiple foods, and provides intelligent fallbacks for unrecognized dishes or explicit calories.
   - Lines 198–216: `createAIResponse` provides full backward compatibility, proxying native string methods (`includes`, `toLowerCase`, `slice`, `length`, `toString`).
   - Lines 274–288: Sums `latest.foods` calories and lists logged meals; correctly references `latest.foods` instead of obsolete `latest.meals`.

4. `src/App.jsx`:
   - Line 10: `import AIAssistantScreen from './components/AIAssistantScreen';`.
   - Line 39: `case 'ai': return <AIAssistantScreen habits={habits} onLogFood={addFood} />;`.
   - Line 33: `case 'food': return <FoodScreen habits={habits} onSave={addFood} />;`.

### 1.2 Empirical Tool Commands & Execution Results
1. **Linter Check** (`npm run lint`):
   ```
   > habitly-web@0.0.0 lint
   > oxlint

   Found 0 errors.
   Finished in 16ms on 26 files with 104 rules using 15 threads.
   ```

2. **Production Build** (`npm run build`):
   ```
   > habitly-web@0.0.0 build
   > vite build

   vite v8.3.1 building client environment for production...
   transforming (2468) src/index.css✓ 2468 modules transformed.
   rendering chunks (1)...computing gzip size...
   dist/index.html                   0.46 kB │ gzip:   0.29 kB
   dist/assets/index-CVULqLHG.css   59.72 kB │ gzip:   9.91 kB
   dist/assets/index-Bm_upHBk.js   707.05 kB │ gzip: 202.72 kB
   ✓ built in 225ms
   ```

3. **Challenger Adversarial Test Suite** (`node --test tests/m3_challenger_adversarial.test.mjs`):
   ```
   ✔ Photo Upload Edge Case 1: Cancellation, empty file list, and null target (4.958ms)
   ✔ Photo Upload Edge Case 2: Large Data URL persistence and memory safety (8.213167ms)
   ✔ Photo Upload Edge Case 3: Custom food without photo preserves null and renders fallback icon (0.293167ms)
   ✔ Numeric Inputs Edge Case 1: Negative numbers are clamped to 0 (0.086458ms)
   ✔ Numeric Inputs Edge Case 2: Zero values and decimals parse accurately (0.078625ms)
   ✔ Numeric Inputs Edge Case 3: Non-numeric, garbage, and whitespace inputs default safely to 0 (0.062417ms)
   ✔ Numeric Inputs Edge Case 4: Empty, whitespace-only, or missing food name rejects submission (0.127333ms)
   ✔ Numeric Inputs Edge Case 5: Large numeric values do not overflow or produce NaN (0.199958ms)
   ✔ Nutrition Totals Math: Empty foods array and corrupted items produce 0s without crashing chart (0.130416ms)
   ✔ AI Queries Edge Case 1: Empty, whitespace, null, and non-string queries (23.639791ms)
   ✔ AI Queries Edge Case 2: Rapid concurrent queries stress test (50 parallel requests) (8.913916ms)
   ✔ AI Queries Edge Case 3: Queries for completely unlogged days / empty habit history (23.299875ms)
   ✔ AI Queries Edge Case 4: Complex multi-item food queries with quantity words and digits (1.963916ms)
   ✔ AI Queries Edge Case 5: Weird formatting, uppercase, extra spaces, and special symbols (24.195125ms)
   ✔ AI Queries Edge Case 6: Discriminates non-logging food questions from log commands (0.239084ms)
   ✔ Category Filtering Edge Case 1: All categories filter correctly and without overlap issues (0.6635ms)
   ✔ App Wiring: onLogFood passed to AIAssistantScreen matches onSave passed to FoodScreen (0.157334ms)
   ℹ tests 17
   ℹ pass 17
   ℹ fail 0
   ```

4. **Full Test Suite** (`node --test tests/*.test.mjs`):
   ```
   ℹ tests 98
   ℹ suites 0
   ℹ pass 98
   ℹ fail 0
   ℹ duration_ms 141.429125
   ```

---

## 2. Logic Chain

1. **Custom Food Photo Upload Verification**:
   - `FoodScreen.jsx` line 106 safely accesses `e.target.files?.[0]` with optional chaining and returns immediately when `!file`. Our empirical test `Photo Upload Edge Case 1` tested empty file lists, `target: {}`, and `files: null`, confirming that file picker cancellation never throws an unhandled exception.
   - When large photo payloads (tested up to 2MB Base64 Data URL) are provided, `simulateSaveCustomFood` and `JSON.stringify` round-trip tests confirm that the data structure is preserved and persists reliably in localStorage format without data corruption (`Photo Upload Edge Case 2`).
   - If no photo is selected, `photo` defaults to `null`, and the UI renders a placeholder icon (`food.icon || '🍽️'`), confirmed by `Photo Upload Edge Case 3`.

2. **Custom Food Numeric Inputs Verification**:
   - `FoodScreen.jsx` lines 120–123 utilize `Math.max(0, parseInt(customCal, 10) || 0)` and `Math.max(0, parseFloat(customX) || 0)`.
   - Adversarial inputs including negative numbers (`-500`), zeroes (`0`), decimals (`0.5`), garbage strings (`not-a-number`), and `NaN` were injected. In all cases, numbers clamped cleanly to non-negative values and never produced `NaN` or invalid states (`Numeric Inputs Edge Case 1, 2, 3`).
   - Empty or whitespace-only names abort submission without saving (`Numeric Inputs Edge Case 4`).
   - Extreme values (e.g. 15,000 kcal) compute finite values without overflowing the Recharts pie chart data (`Numeric Inputs Edge Case 5`).

3. **AI Assistant Queries Verification**:
   - Empty or whitespace prompts are blocked in `AIAssistantScreen.jsx` line 35 (`if (!text || isThinking) return;`), and `chatWithAI` provides a safe fallback when invoked with `""`, `null`, or non-string queries (`AI Queries Edge Case 1`).
   - Rapid concurrent load was stress-tested by executing 50 simultaneous parallel queries against `chatWithAI`. All 50 queries resolved successfully with correct card generation and no state collisions (`AI Queries Edge Case 2`).
   - Unlogged days and empty habit histories were tested (`AI Queries Edge Case 3`), confirming helpful status messages rather than errors.
   - Complex multi-item food queries (e.g., "Log two rotis with ghee and one bowl of dal makhani", "track 2 boiled eggs, 1 avocado toast, and 1 protein shake") correctly detect multiple items, multiply quantities, and sum macros accurately (`AI Queries Edge Case 4`).
   - Queries with uppercase text, excess whitespace, and punctuation parsed robustly (`AI Queries Edge Case 5`).
   - Informational questions (e.g., "How many calories are in chicken biryani?", "Suggest some healthy dinner ideas") were verified NOT to trigger accidental food logging cards (`AI Queries Edge Case 6`).

4. **Category Filtering in FoodScreen**:
   - Source code parsing and filtering checks confirmed that `COMMON_FOODS` contains 24 distinct items, with all 24 appearing under `'All'`.
   - Category tabs (`'Indian'`, `'International'`, `'Healthy'`, `'Quick Snacks'`) filter dishes according to their category or tags without cross-contamination.
   - Non-existent or empty categories degrade gracefully to empty arrays without crashing (`Category Filtering Edge Case 1`).

5. **App Wiring & Build Conformance**:
   - Both `FoodScreen` and `AIAssistantScreen` receive `addFood` from `useHabits`, persisting food items to the day's record using identical schemas (`{ name, text, cal, p, c, f, date, timestamp }`).
   - Production build compiles cleanly with Vite (`dist/` generated in 225ms) and oxlint reports 0 errors.

---

## 3. Caveats

- **Device Camera Hardware**: The photo upload feature utilizes standard HTML5 `<input type="file" accept="image/*">`, which uses the device's native file picker / camera interface; simulated File and Blob objects were verified in Node.js unit and integration tests.
- **Client-Side Storage**: Photos are stored as Base64 Data URLs directly within `localStorage`. While fine for the required demo integrity mode and typical image sizes (<2MB), high-resolution device photos (>10MB) could eventually exceed browser `localStorage` quotas (typically 5–10MB). In a production cloud setting, an external blob store (e.g., Firebase Storage / Cloud Storage) would be recommended.

---

## 4. Conclusion

Milestone 3 (Requirement R3) satisfies all boundary condition and edge case criteria with zero regressions:
- Quick-Add list is expanded to 24 diverse dishes (12 Indian, 12 International) with icons and category filtering tabs.
- Custom food modal supports device file upload, instant preview, change/remove, and strict numeric sanitization.
- AI Assistant page route is wired in `App.jsx`, responds to natural language and suggestions, and displays a rich confirmation card with macros when logging food.
- All 17 new adversarial stress tests and all 98 project tests pass cleanly.
- Build and lint checks pass without errors.

**Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce the empirical findings:

1. **Run Linter**:
   ```bash
   npm run lint
   ```
   *Expected*: Exits with code 0 (0 errors).

2. **Run Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: Vite builds `dist/` cleanly in <500ms.

3. **Run Challenger Adversarial Suite**:
   ```bash
   node --test tests/m3_challenger_adversarial.test.mjs
   ```
   *Expected*: All 17 boundary and edge case tests pass with 0 failures.

4. **Run Full Test Suite**:
   ```bash
   node --test tests/*.test.mjs
   ```
   *Expected*: All 98 tests pass with 0 failures.
