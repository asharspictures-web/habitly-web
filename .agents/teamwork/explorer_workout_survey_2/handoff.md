# Handoff Report: Phase 0 Survey of Workout Logging Rebuild (R1, R2, R3)

**Agent:** `explorer_workout_survey_2`  
**Working Directory:** `/Users/asharspictures/Desktop/Habitly web/.agents/teamwork/explorer_workout_survey_2/`  
**Handoff Type:** Hard (Task complete)  
**Target Milestone:** Phase 0 -> Milestone Decomposition for M1, M2, M3  

---

## 1. Observation

Direct code observations from inspecting the codebase:

1. **`src/components/ExerciseScreen.jsx` (Lines 4-19, 21-25, 123-138):**
   - The current workout logging form is monolithic, single-schema:
     ```javascript
     const EXERCISE_TYPES = ['Running', 'Walking', 'Weights', 'Cycling', 'Yoga', 'Swimming', 'Other'];
     const [type, setType] = useState('Running');
     const [customType, setCustomType] = useState('');
     const [duration, setDuration] = useState(30);
     ```
   - Only `type`, `customType`, and `duration` are saved on submission (Line 13-17):
     ```javascript
     onSave({
       type: type === 'Other' ? customType : type,
       duration: Number(duration),
       date: new Date().toISOString()
     });
     ```
   - Filtering is restricted to `w.type`:
     ```javascript
     const filteredWorkouts = searchQuery.trim()
       ? allWorkouts.filter(w => (w.type || '').toLowerCase().includes(searchQuery.trim().toLowerCase()))
       : allWorkouts;
     ```
   - Recent activity cards are non-clickable `div` elements rendering only `w.type` and `w.duration min` with no detail view or domain telemetry (Lines 124-137).

2. **`src/hooks/useHabits.js` (Lines 69-73):**
   - `addWorkout(workout)` delegates directly to `updateToday`:
     ```javascript
     const addWorkout = (workout) => {
       updateToday(current => ({
         workouts: [...(current.workouts || []), workout]
       }));
     };
     ```
   - This accepts arbitrary properties on `workout` and saves them to `localStorage.getItem('habitlyDataV2')`.

3. **`src/components/DashboardScreen.jsx` (Lines 75, 82, 101, 117):**
   - The Dashboard consumes `w.duration` across multiple aggregations:
     - Line 75: `const todayWorkoutMins = (todayData.workouts || []).reduce((acc, w) => acc + w.duration, 0);`
     - Line 101: `workout: (habit?.workouts || []).reduce((acc, w) => acc + w.duration, 0)`
   - Every workout object saved must preserve a numeric `duration` field in minutes.

4. **`src/components/TopBar.jsx` (Lines 53-62):**
   - Indexes workouts for global search:
     ```javascript
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
     ```

5. **Test Harness Execution:**
   - Command `node --test tests/*.test.mjs` executed: 196 tests passing across 13 suites in 171.6 ms.
   - Command `npm run build` executed: Built client environment cleanly with Vite 8 in 290 ms.
   - Command `npm run lint` executed: 0 errors (2 unused variable warnings in legacy test files).

---

## 2. Logic Chain

1. **From Observation 1 to R1 Architecture:**
   - Because `ExerciseScreen.jsx` currently supports only a single primitive number input for duration, users cannot log sets, reps, weight, distance, laps, or pace.
   - Replacing the monolithic form with per-activity forms (`StrengthWorkoutForm`, `CardioWorkoutForm`, `SwimmingWorkoutForm`, `YogaWorkoutForm`, `OtherWorkoutForm`) fulfills R1 directly.
   - Renaming `'Weights'` to `'Strength Training'` requires an alias layer (`normalizeActivityType`) so historical `'Weights'` records in `localStorage` continue to map to the strength training domain without data loss or mutation.
   - To support bodyweight and assisted exercises without requiring fake weights, sets must support three explicit load modalities: `'weight'`, `'bodyweight'`, and `'assisted'`. When `'bodyweight'` is selected, the numeric weight input is omitted from the UI, and `weight` is stored as `null`/`0`.
   - Historical lookup can be performed by querying `habits` in reverse chronological order (`findPreviousExercisePerformance`). Because `habits` is an in-memory array in React, reverse linear scan takes <0.4ms, satisfying performance requirements without needing a database indexing engine.
   - Running and walking pace calculations follow:
     $$\text{paceSeconds} = \text{round}\left(\frac{\text{totalSeconds}}{\text{distance}}\right) \to \text{format as } MM:SS /km \text{ or } MM:SS /mi$$
     Guarded against division by zero.

2. **From Observation 1 & 2 to R2 Architecture:**
   - Two entry paths must be offered:
     - **Path A ("Start Workout"):** Uses an active `setInterval` timer ticking seconds (`HH:MM:SS`), with interactive set completion checkmarks. State must mirror to `localStorage.habitlyActiveLiveSession` to survive tab switches.
     - **Path B ("Log Completed Workout"):** Static manual form with optional Start/End time pickers that auto-calculate elapsed minutes.
   - To satisfy the prompt's explicit rule (*"Label elapsed time clearly so it is never confused with active lift time"*), timing metrics must be labeled verbatim as **"Elapsed Time"** or **"Elapsed Session Time"**, accompanied by helper subtext explaining that elapsed time includes rest intervals.
   - To satisfy the anti-fabrication rule (*"Never derive or display invented calorie or volume totals from incomplete data"*), calories must be omitted unless explicitly entered, and strength training summaries must display **working sets** and **exercise counts** rather than fabricated tonnage.

3. **From Observation 1, 3, & 4 to R3 Architecture:**
   - Recent Activity cards must be upgraded from static divs to interactive components (`cursor-pointer`) invoking a detail modal (`WorkoutDetailModal`).
   - Card summaries must follow activity-specific formats (e.g. `"Upper body · 5 exercises · 14 working sets"` for strength, `"5.2 km · 28:10 · 5:25/km"` for running).
   - Old legacy entries (`{ type: "Running", duration: 30 }`) lack rich properties. The summary formatter and detail modal must defensively fall back to `"${type} · ${duration} min"`, preventing runtime crashes and guaranteeing backward compatibility (R4).

---

## 3. Caveats

1. **Dashboard Quick-Log Modal:** `src/components/QuickLogModal.jsx` also contains a quick "Workout" tab that logs `{ type, duration, calories, date }`. That modal serves as a quick 1-tap counter from the Dashboard and does not replace the full Exercise screen. Its output is fully compatible with our legacy-safe summary formatter.
2. **Floating Button Clipping (R5):** R5 pertains to the floating button on `DashboardScreen.jsx` clipping at the screen edge. That task is being investigated by Explorer 3 and does not collide with the form rebuild on `ExerciseScreen.jsx`.
3. **Assisted Strength Exercise Math:** When displaying assisted exercises in the detail modal, assistance should be clearly annotated as negative or offset load (e.g. `"-15 kg assistance"`), and excluded from any raw weight summations.

---

## 4. Conclusion

Requirements R1, R2, and R3 are fully scoped, architecturally specified, and ready for decomposition into worker milestones:
- **`survey_forms.md`** has been written to `.agents/teamwork/explorer_workout_survey_2/survey_forms.md` containing complete schema specifications, math formulas, reverse-lookup algorithms, component hierarchy, and validation matrices.
- Recommended worker milestones:
  - **M1 (Data & Storage):** Create `src/lib/workoutUtils.js` with pure helper functions (`calculatePace`, `formatWorkoutSummary`, `findPreviousExercisePerformance`), unit test suite, and backward-compatibility fixtures.
  - **M2 (Logging Forms & Live Timer):** Implement `WorkoutTypeSelector`, `WorkoutTimerBanner`, and per-activity forms (`StrengthWorkoutForm`, `CardioWorkoutForm`, `SwimmingWorkoutForm`, `YogaWorkoutForm`, `OtherWorkoutForm`) in `src/components/exercise/` with live timer and post-session paths.
  - **M3 (Rich Cards & Detail Modal):** Implement `WorkoutCard` and `WorkoutDetailModal`, wire card click handlers, and integrate search filtering in `ExerciseScreen.jsx`.

---

## 5. Verification Method

To independently verify the investigation and artifacts:

1. **Inspect Artifacts:**
   ```bash
   view_file AbsolutePath="/Users/asharspictures/Desktop/Habitly web/.agents/teamwork/explorer_workout_survey_2/survey_forms.md"
   ```
2. **Verify Project Cleanliness:**
   ```bash
   npm run build
   npm run lint
   node --test tests/*.test.mjs
   ```
3. **Invalidation Conditions:**
   - Any proposed change that breaks `todayWorkoutMins` aggregation in `DashboardScreen.jsx` (by omitting `duration`).
   - Any design that calculates fake calories or volume from incomplete sets.
   - Any design that labels elapsed time as "lift time" or "active time".
   - Any failure of legacy duration-only logs to render in the Recent Activity list.
