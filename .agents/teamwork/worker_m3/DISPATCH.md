## 2026-09-24T20:51:00Z
You are Worker 3 implementing Milestone 3: Food Section & AI Assistant (Requirement R3).
Working directory: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/worker_m3/
Project workspace root: /Users/asharspictures/Desktop/Habitly web/
Original request file: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/ORIGINAL_REQUEST.md
Project specification: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/orchestrator/PROJECT.md
Explorer Survey 3 report: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/explorer_survey_3/survey_r3_r4.md

Read ORIGINAL_REQUEST.md, PROJECT.md, and survey_r3_r4.md before writing any code.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Write Ownership:
You own exclusively:
- src/components/FoodScreen.jsx
- src/components/AIAssistantScreen.jsx (create new component)
- src/lib/gemini.js
- src/App.jsx (uncomment AIAssistantScreen import and wire case 'ai' in renderScreen)

Requirements to Implement:
1. Food Quick-Add Expansion (`src/components/FoodScreen.jsx`):
   - Expand COMMON_FOODS to 22+ diverse Indian and international dishes.
   - Each food item must contain: name, calories (`cal`), protein (`p`), carbs (`c`), fat (`f`), category, and a thumbnail/icon (e.g. food emoji or icon).
   - Include Indian foods: e.g., Chicken Biryani, Paneer Butter Masala, Dal Makhani, Masala Dosa, Chole Bhature, Idli Sambar, Palak Paneer, Roti with Ghee, Tandoori Chicken, Rajma Chawal.
   - Include International foods: e.g., Avocado Toast, Grilled Salmon & Quinoa, Chicken Caesar Salad, Oatmeal with Berries, Greek Yogurt Parfait, Sushi Roll, Pasta Primavera, Protein Shake, Apple & Peanut Butter.
   - Add category filter tabs (All, Indian, International, Healthy, Quick Snacks) to browse easily.
   - Clean up unused imports (such as unused useEffect).
2. Custom Food with Photo File Upload (`src/components/FoodScreen.jsx`):
   - Add a "+ Add Custom Food" modal or section.
   - Form fields: Food Name, Calories, Protein (g), Carbs (g), Fat (g).
   - File input: `<input type="file" accept="image/*">` allowing users to upload a photo from local device storage.
   - Instant image preview using `FileReader.readAsDataURL`.
   - On save, invokes `onSave({ name, cal, p, c, f, photo: previewDataUrl, date: ... })`.
   - Render a "Today's Logged Foods" list/history on the Food page showing all foods logged today, displaying custom photo thumbnails for custom entries, calories, and macros.
3. Fix AI Assistant Page Error (`src/components/AIAssistantScreen.jsx` and `src/App.jsx`):
   - Create `src/components/AIAssistantScreen.jsx`.
   - In `src/App.jsx`: uncomment `import AIAssistantScreen from './components/AIAssistantScreen';` and add `case 'ai': return <AIAssistantScreen habits={habits} onLogFood={addFood} />;` in `renderScreen()`.
   - Implement interactive chat UI:
     - Welcoming message from Habitly AI.
     - Suggested prompt chips (e.g. "Log 2 Rotis and Paneer Butter Masala", "How many calories have I consumed today?", "Healthy high-protein snack ideas").
     - Responsive chat stream, auto-scroll, message bubbles for user and AI, input field with Send button and Enter key support.
     - Loads without any console errors and responds helpfully.
4. AI Food Logging Confirmation Card (`src/components/AIAssistantScreen.jsx` & `src/lib/gemini.js`):
   - When the user asks the AI to log food (e.g., typing "Log 1 bowl of oatmeal with berries" or clicking a suggested food log prompt):
   - The AI MUST NOT silently log food without visual feedback.
   - Display a rich Confirmation Card in the chat stream showing:
     - Food Name
     - Calories badge (e.g. "420 kcal")
     - Macro breakdown badges: Protein (P), Carbs (C), Fat (F)
     - Logged confirmation status (`✓ Logged to Food Diary`) or interactive `Confirm & Log` button that calls `onLogFood`.
   - Update `src/lib/gemini.js`:
     - Update `chatWithAI(question, habits)` to detect food logging requests, compute/estimate calories and macros (P/C/F), and return structured card payloads.
     - Fix line 44: use `latest.foods` from useHabits instead of obsolete `latest.meals`.

Verification requirements:
- Run `npm run lint` and ensure 0 errors.
- Run `npm run build` and ensure Vite build passes cleanly.
- Run automated test suites: `node --test tests/*.test.mjs`.
- Add test coverage for M3 requirements in `tests/m3_adversarial.test.mjs`.
- Deliver your completion handoff report to `/Users/asharspictures/Desktop/Habitly web/.agents/teamwork/worker_m3/handoff.md` with:
  - Observation (files created/modified, logic added)
  - Logic chain
  - Verification commands run and exact outputs
  - Verification checklist against R3 requirements.
When done, message parent with your summary.
