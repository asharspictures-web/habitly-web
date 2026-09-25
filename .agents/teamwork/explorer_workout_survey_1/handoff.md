# Handoff Report: Phase 0 Survey (Workout Logging & Backward Compatibility)

**Agent**: explorer_workout_survey_1  
**Working Directory**: `/Users/asharspictures/Desktop/Habitly web/.agents/teamwork/explorer_workout_survey_1/`  
**Date**: 2026-09-24T22:35:00Z  
**Type**: Hard Handoff (Phase 0 Investigation Complete)  

---

## 1. Observation

1. **Storage & State Structure**:
   - `src/hooks/useHabits.js` (lines 11-23):
     ```javascript
     const [habits, setHabits] = useState(() => {
       const saved = localStorage.getItem('habitlyDataV2');
       return saved ? JSON.parse(saved) : [];
     });
     useEffect(() => {
       localStorage.setItem('habitlyDataV2', JSON.stringify(habits));
     }, [habits]);
     ```
   - Primary localStorage key is `'habitlyDataV2'`. The data is structured as an array of day objects: `{ date: 'YYYY-MM-DD', workouts: [...], foods: [...], steps, water, sleep }`.
   - `addWorkout(workout)` appends to `today.workouts` via `workouts: [...(current.workouts || []), workout]`.

2. **Pre-Existing Workout Schema**:
   - `src/components/ExerciseScreen.jsx` (lines 11-19):
     ```javascript
     onSave({
       type: type === 'Other' ? customType : type,
       duration: Number(duration),
       date: new Date().toISOString()
     });
     ```
   - `src/components/QuickLogModal.jsx` (lines 137-142):
     ```javascript
     addWorkout?.({
       type: finalType,
       duration,
       calories: calories && !isNaN(calories) ? calories : undefined,
       date: new Date().toISOString()
     });
     ```
   - Pre-existing workouts are strictly duration-only: `{ type, duration, date, calories? }`. No `exercises`, `sets`, `reps`, `distance`, `pace`, `laps`, or `entryPath` exist in pre-existing entries.

3. **Critical Downstream Invariant**:
   - `src/components/DashboardScreen.jsx` (lines 75, 82, 101, 117):
     ```javascript
     const todayWorkoutMins = (todayData.workouts || []).reduce((acc, w) => acc + w.duration, 0);
     ```
     `w.duration` is directly accumulated. If any new workout record lacks a numeric `duration`, this calculation produces `NaN`, breaking the Activity progress ring, Recharts trends, and streak heatmaps.
   - `src/components/TopBar.jsx` (lines 58-60):
     ```javascript
     detail: `${w.duration} min${w.calories ? ` • ${w.calories} kcal` : ''}`,
     ```
     TopBar indexes all historical workouts using `w.duration`.

4. **Existing Test Suite Baseline & Strict Static Assertions**:
   - The test suite uses Node's native test runner (`node --test tests/*.test.mjs`). All 17 test files and 196 tests currently pass (`npm run lint` has 0 errors, 2 warnings; `npm run build` exits 0).
   - `tests/m2_stress_suite.mjs` (lines 518-520, 530-531):
     - Requires `ExerciseScreen.jsx` source to include `onSave({`, `type:`, `duration:`.
     - Requires rendered HTML to include `'Log Workout'` and `'Running'`.
   - `tests/m1_stress_suite.mjs` (lines 158-181):
     - Requires Recent Activity titles to render inside `<p class="font-semibold text-white">{w.type}</p>`.
     - Requires filter badge text `'Filtering'`.
     - Requires empty search state: `No workouts matching "${searchQuery}".` (rendered as `&quot;`).
   - `tests/m2_stress_suite.mjs` (line 171) & `tests/m5_final_acceptance_judge.test.mjs` (line 144):
     - Requires `DashboardScreen.jsx` to include `'fixed bottom-8 right-8 z-40'`, `'aria-label="Quick Log"'`, and `'w-14 h-14 rounded-full'`.

5. **Root Cause of Floating Button Clipping (R5)**:
   - In `DashboardScreen.jsx` (line 132), the outer container uses `animate-in fade-in slide-in-from-bottom-4`.
   - CSS Specification: `transform` property on an ancestor element creates a new containing block for `position: fixed` descendants, constraining the button relative to the parent's container box (`max-w-6xl`) and scroll context rather than the viewport, causing edge cutoff on narrow viewports or horizontal overflow.

---

## 2. Logic Chain

1. **Safety of Stored Data (Observation 1 & 2)**:
   - Because `useHabits.js` loads `habitlyDataV2` directly via `JSON.parse(saved)` without a mutative migration script, old entries in localStorage will remain 100% intact if no startup migration is introduced.
   - When new workouts are appended via `addWorkout`, existing elements in `workouts` remain untouched.
   - Therefore, Requirement R4 is achieved by leaving the storage loader untouched and handling the schema variation at the presentation layer.

2. **Dual-Schema Presentation Layer (Observation 2 & 4)**:
   - A non-destructive discriminator `isDetailedWorkout(w)` detects whether a workout is new (`w.exercises`, `w.distance`, `w.poolLength`, `w.style`, `w.category`) or legacy (duration-only).
   - If legacy: render verbatim `w.type`, `${w.duration} min`, and `${w.calories} kcal` with badge *"Duration-only log"*, and preserve the DOM contract `<p class="font-semibold text-white">{w.type}</p>` to satisfy `m1_stress_suite.mjs`.
   - If detailed: render activity-specific summary (e.g. exercises & working sets for strength, distance & pace for running).
   - Both old and new workouts open the Workout Detail View on click (Requirement R3 & R4).

3. **Mandatory Duration Invariant (Observation 3)**:
   - Because `DashboardScreen.jsx` performs `acc + w.duration` on all workouts, every new workout (even Strength Training or Swimming) MUST have `duration: Number(durationInMinutes)`.
   - For live workouts, `duration = Math.max(1, Math.round(elapsedSeconds / 60))`.
   - This ensures the Activity Progress Ring, BarChart, and Heatmap continue to compute correctly without `NaN` regressions.

4. **Floating Button Remediation (Observation 5)**:
   - Moving the FAB outside the CSS transform container or placing it at the root of `DashboardScreen` eliminates the containing block trap.
   - Retaining the class string `'fixed bottom-8 right-8 z-40'` and `'aria-label="Quick Log"'` maintains 100% compliance with existing test suites.

---

## 3. Caveats

1. **Component Path Discrepancy**:
   - The user prompt refers to `src/screens/ExerciseScreen.jsx`, but the actual codebase path is `src/components/ExerciseScreen.jsx`. Implementation must target `src/components/ExerciseScreen.jsx` and avoid creating redundant files in `src/screens/`.
2. **QuickLogModal Coexistence**:
   - `QuickLogModal.jsx` continues to log duration-only workouts via `addWorkout({ type, duration, calories, date })`. The new `ExerciseScreen` will receive these QuickLog entries alongside legacy entries. Both must be treated identically as duration-only logs.
3. **Volume and Calorie Calculations**:
   - For bodyweight or assisted strength exercises, active lift volume cannot be calculated without assuming a body weight. In accordance with R2 ("Never derive or display invented calorie or volume totals from incomplete data"), volume must only be computed from weighted sets, and bodyweight sets must be reported by rep count only.
4. **Test Dependency on CSS Classes**:
   - Do NOT alter `<p className="font-semibold text-white">{w.type}</p>` in `ExerciseScreen.jsx` or `'fixed bottom-8 right-8 z-40'` in `DashboardScreen.jsx`. Removing these verbatim strings will cause regression failures in `m1_stress_suite.mjs` and `m2_stress_suite.mjs`.

---

## 4. Conclusion & Recommendations

1. **Zero-Migration Backward Compatibility**:
   - Never run a migration function on `localStorage['habitlyDataV2']`.
   - Use presentation-level discrimination (`isDetailedWorkout(w)`) to display legacy entries as-logged and new entries with activity-specific cards.
2. **Schema Invariant**:
   - Ensure all workout records written to state include:
     - `type`: string
     - `duration`: number (in minutes, > 0)
     - `date`: string (ISO)
     - `entryPath`: `'live'` | `'completed'`
     - `schemaVersion`: 2
3. **Form Architecture**:
   - Provide an entry path toggle: `"Start Workout"` (stopwatch with running timer and progressive set entry) vs `"Log Completed Workout"` (static entry).
   - Rename `"Weights"` to `"Strength Training"`.
   - Support set types (`'working'`, `'warmup'`), load types (`'weight'`, `'bodyweight'`, `'assisted'`), and optional RPE without requiring fake weights for bodyweight/assisted movements.
   - Use `getPreviousExerciseSession(habits, exerciseName)` to display previous session stats.
   - For Running/Walking: live pace calculation (`MM:SS/km`).
4. **Detail View Modal**:
   - Clicking any card in Recent Activity opens the session detail view, handling both detailed and legacy records cleanly.

---

## 5. Verification Method

1. **Build & Lint Verification**:
   ```bash
   npm run lint
   npm run build
   ```
   Both must pass with 0 errors.

2. **Existing Regression Suite**:
   ```bash
   node --test tests/*.test.mjs
   ```
   All 196 existing tests must continue to pass.

3. **New Test for Backward Compatibility (Seed Test)**:
   Create a dedicated test (e.g. `tests/workout_backward_compatibility.test.mjs`) that:
   - Seeds `localStorage['habitlyDataV2']` with legacy duration-only entries (`{ type: 'Running', duration: 45, calories: 350, date: '2026-09-01' }`).
   - Seeds new v2 detailed entries (`{ type: 'Strength Training', exercises: [...], duration: 50, date: '2026-09-25' }`).
   - Renders `ExerciseScreen` and verifies both old and new entries appear in Recent Activity with their appropriate formats and DOM classes.
   - Verifies that after logging a new workout, the pre-existing entries in `localStorage` retain their exact original keys and values without deletion or silent mutation.
   - Verifies pace calculation (`time / distance = pace`) for running/walking.
