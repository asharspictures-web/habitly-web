# Phase 0 Architecture Survey: Workout Logging Rebuild & Backward Compatibility

**Date**: 2026-09-24T22:30:00Z  
**Investigator**: Explorer 1 (`explorer_workout_survey_1`)  
**Project**: Habitly Web App (`React 19 + Vite + Tailwind CSS v4`)  
**Target Milestone**: Phase 0 — Full Workout System & Backward Compatibility Forensics  

---

## 1. Executive Summary

This survey provides a comprehensive architectural analysis for rebuilding the workout logging screen in Habitly as specified in `ORIGINAL_REQUEST.md` (Follow-up 2026-09-24T22:22:35Z).

### Core Goals:
1. Support activity-specific logging forms for **Strength Training**, **Running / Walking**, **Cycling**, **Swimming**, **Yoga / Mobility**, and **Other**.
2. Provide two distinct entry paths: **"Start Workout"** (live logging with running stopwatch) and **"Log Completed Workout"** (static post-session entry).
3. Implement **Rich Activity Cards** in Recent Activity with category-specific summaries and an interactive **Workout Detail View** for inspecting complete logged data.
4. Guarantee **Zero Data Loss & Backward Compatibility (R4)**: All existing duration-only entries in `localStorage['habitlyDataV2']` must remain untouched in their original shape, displayed alongside new entries with zero silent migrations or deletions.
5. Fix the **Floating Button (R5)** clipping issue on the Dashboard while preserving all regression test contracts.

---

## 2. Codebase Architecture & File Mapping

| File Path | Role | Workout Interactions |
|---|---|---|
| `src/components/ExerciseScreen.jsx` | Workout logging UI & Recent Activity screen | Entry form, activity selection, calls `onSave(workout)`, renders recent 5 workouts filtered by `searchQuery`. |
| `src/hooks/useHabits.js` | Core state manager & localStorage sync | Manages `habits` state, reads/writes `localStorage['habitlyDataV2']`, provides `addWorkout(workout)` callback. |
| `src/App.jsx` | Root application layout & screen router | Houses `Sidebar`, `TopBar`, and screen router; passes `habits`, `onSave={addWorkout}`, and `searchQuery` to `ExerciseScreen`. |
| `src/components/DashboardScreen.jsx` | Main dashboard & summary metrics | Sums `w.duration` for Activity Progress Ring and weekly chart; renders Floating Action Button (FAB). |
| `src/components/QuickLogModal.jsx` | Quick entry modal | Parallel producer of workouts; logs duration-only workouts via `addWorkout`. |
| `src/components/TopBar.jsx` | Global search & notifications | Indexes `day.workouts` into `historicalEntries`; filters by workout name, duration, and calories. |
| `src/lib/gemini.js` | AI assistant & daily summary | Consumes `workoutDuration` and `workoutType` for daily insights. |

*Note: The user request referred to `src/screens/ExerciseScreen.jsx`, but all screen components in this project are located in `src/components/ExerciseScreen.jsx`.*

---

## 3. Storage Architecture & Pre-Existing Workout Schema

### 3.1 LocalStorage Keys & Persistence Model
- **Primary Data Key**: `'habitlyDataV2'`
- **Goals Key**: `'habitlyGoals'`
- **Persistence Pattern** (in `src/hooks/useHabits.js`):
  ```javascript
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habitlyDataV2');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('habitlyDataV2', JSON.stringify(habits));
  }, [habits]);
  ```

### 3.2 State Structure (`habits`)
`habits` is an array of daily habit documents:
```json
[
  {
    "date": "2026-09-24",
    "workouts": [ ... ],
    "foods": [ ... ],
    "steps": 8500,
    "water": 7,
    "sleep": 7.5
  }
]
```

### 3.3 Existing Workout Schema (Duration-Only Format)
Workouts in the current codebase are generated from two places:
1. `ExerciseScreen.jsx`:
   ```javascript
   {
     "type": "Running",
     "duration": 30,
     "date": "2026-09-24T10:00:00.000Z"
   }
   ```
2. `QuickLogModal.jsx`:
   ```javascript
   {
     "type": "Weights",
     "duration": 45,
     "calories": 250,
     "date": "2026-09-24T14:30:00.000Z"
   }
   ```
3. Test mocks in `tests/`:
   ```javascript
   {
     "type": "Swimming",
     "duration": 45,
     "date": "2026-09-24T10:00:00Z"
   }
   ```

**Characteristics of Pre-Existing Entries**:
- `type`: String (e.g. `'Running'`, `'Weights'`, `'Yoga'`, `'Swimming'`, `'Cycling'`, `'Other'`)
- `duration`: Number (in minutes, integer or float)
- `date`: String (ISO timestamp or YYYY-MM-DD date string)
- `calories`: Optional number (kcal)
- **Absent Fields**: No `exercises`, no `sets`, no `reps`, no `load`, no `distance`, no `pace`, no `poolLength`, no `laps`, no `stroke`, no `style`, no `entryPath`.

---

## 4. Critical Mathematical & Downstream Dependencies

### 4.1 Danger: `DashboardScreen.jsx` Duration Summation
In `DashboardScreen.jsx`:
- Line 75: `const todayWorkoutMins = (todayData.workouts || []).reduce((acc, w) => acc + w.duration, 0);`
- Line 82: `workoutDuration: h.workouts?.reduce((a,w)=>a+w.duration,0) || 0,`
- Line 101: `workout: (habit?.workouts || []).reduce((acc, w) => acc + w.duration, 0)`
- Line 117: `const wMins = (h.workouts || []).reduce((a, w) => a + w.duration, 0);`

**⚠️ CRITICAL INVARIANT**:
`DashboardScreen.jsx` performs a direct addition `acc + w.duration` across all workouts.
If any new workout record omits `duration` or stores it as `undefined`, `null`, or non-numeric (e.g. `"45m"`), `acc + w.duration` evaluates to `NaN`!
This will immediately break:
- Today's Activity Progress Ring (`NaN / 30 min`)
- Weekly Recharts BarChart (`NaN` bars)
- 28-day consistency heatmap calculation

**Resolution**:
EVERY new workout entry — regardless of whether it is Strength Training, Running with distance, or Swimming — **MUST ALWAYS** include a valid numeric `duration` field in minutes:
```javascript
duration: Number(durationInMinutes) || Math.max(1, Math.round(elapsedSeconds / 60))
```

### 4.2 Downstream TopBar Search Indexing
In `src/components/TopBar.jsx` (lines 52-62):
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
TopBar safely reads `w.type`, `w.duration`, `w.date`, and `w.calories`. If `w.duration` is a number, it displays cleanly without error.

---

## 5. Requirement R4: Backward Compatibility Deep-Dive

### 5.1 The Backward Compatibility Contract
Requirement R4 states:
> "All existing duration-only logs stored in localStorage are preserved exactly as logged and displayed clearly alongside new detailed entries. No silent migration, deletion, or reinterpretation of old data is permitted."

### 5.2 Preservation Rules
1. **No Migration Script on Startup**:
   `useHabits.js` MUST NOT run an in-place transformation or migration over `habitlyDataV2`. The raw JSON from localStorage must be parsed directly as-is.
2. **No Data Mutation on Save**:
   When `addWorkout(newWorkout)` is invoked, it appends `newWorkout` to the active day's `workouts` array:
   ```javascript
   workouts: [...(current.workouts || []), workout]
   ```
   All pre-existing items in `current.workouts` remain unchanged in reference and value.
3. **No Fabricated / Invented Data**:
   For legacy entries, the application must NEVER invent fake sets, fake 0 km distances, or fake calorie counts.
4. **Coexistence with QuickLogModal**:
   The user can still log duration-only workouts via the Quick-Log button on the Dashboard. The Recent Activity list and detail views must gracefully treat QuickLogModal entries and legacy entries identically.

### 5.3 Non-Destructive Schema Discrimination
We define a robust discriminator to detect legacy vs. detailed entries:

```javascript
export function isDetailedWorkout(w) {
  if (!w || typeof w !== 'object') return false;
  if (w.schemaVersion && w.schemaVersion >= 2) return true;
  if (Array.isArray(w.exercises) && w.exercises.length > 0) return true;
  if (w.distance !== undefined && w.distance !== null && w.distance !== '') return true;
  if (w.poolLength !== undefined || w.laps !== undefined || w.stroke !== undefined) return true;
  if (w.style !== undefined || w.effort !== undefined) return true;
  return false;
}
```

### 5.4 Dual-Mode Display in Recent Activity
1. **Legacy Duration-Only Card**:
   - Title: `{w.type}` (rendered in `<p className="font-semibold text-white">`)
   - Subtitle: Date + Duration + Calories (if recorded)
   - Badge: `Duration-only log` (or `Logged as duration`)
   - Duration badge: `{w.duration} min`
2. **Click Interaction**:
   - Clicking opens the **Workout Detail View**.
   - For legacy entries, the detail view explicitly states: *"Duration-only session logged prior to detailed tracking."* It displays the logged activity type, duration in minutes, calories burned (if recorded), and the date logged.

---

## 6. Proposed Extended Workout Schema (v2)

### 6.1 Unified Base Properties
Every workout record contains:
```typescript
interface BaseWorkout {
  id: string;                      // Unique ID (e.g. `workout_${Date.now()}_${random}`)
  type: string;                    // Activity type name: 'Strength Training', 'Running', etc.
  category: 'strength' | 'running' | 'walking' | 'cycling' | 'swimming' | 'yoga' | 'other';
  duration: number;                // In minutes (mandatory integer/number, keeps dashboard metrics intact)
  date: string;                    // ISO timestamp (e.g. new Date().toISOString())
  entryPath: 'live' | 'completed'; // 'live' stopwatch vs 'completed' post-session
  schemaVersion: 2;                // Explicit schema tag
  calories?: number;               // Optional, user-entered only (never fabricated)
  startTime?: string;              // Optional ISO timestamp
  endTime?: string;                // Optional ISO timestamp
  elapsedSeconds?: number;         // Session elapsed time (seconds)
  notes?: string;                  // Optional user notes
}
```

### 6.2 Activity-Specific Extensions

#### A. Strength Training (`category: 'strength'`)
```typescript
interface StrengthSet {
  id: string;
  type: 'working' | 'warmup';
  loadType: 'weight' | 'bodyweight' | 'assisted';
  reps: number;
  weight?: number;                 // Omitted for bodyweight/assisted if none used
  unit?: 'kg' | 'lb';              // Defaults to 'kg'
  rpe?: number;                    // 1-10 (optional)
}

interface StrengthExercise {
  id: string;
  name: string;                    // e.g. "Barbell Bench Press"
  sets: StrengthSet[];
}

interface StrengthWorkout extends BaseWorkout {
  category: 'strength';
  exercises: StrengthExercise[];
}
```
*Key UX Requirements Met*:
- Bodyweight sets require zero fake weights.
- Assisted exercises support assistance values without requiring positive fake loads.
- Previous session numbers for an exercise are looked up via `getPreviousExerciseSession(habits, exerciseName)` across historical logs.

#### B. Running / Walking (`category: 'running' | 'walking'`)
```typescript
interface RunningWorkout extends BaseWorkout {
  category: 'running' | 'walking';
  distance: number;                // e.g. 5.2
  distanceUnit: 'km' | 'mi';       // 'km' default
  pace: string;                    // e.g. "5:25/km" (computed as time / distance)
}
```
*Pace Formula*:
```javascript
export function calculatePace(durationMinutes, distanceKm) {
  if (!distanceKm || distanceKm <= 0 || !durationMinutes || durationMinutes <= 0) return '—';
  const paceMinutes = durationMinutes / distanceKm;
  const mins = Math.floor(paceMinutes);
  const secs = Math.round((paceMinutes - mins) * 60);
  const formattedSecs = secs === 60 ? '00' : String(secs).padStart(2, '0');
  const actualMins = secs === 60 ? mins + 1 : mins;
  return `${actualMins}:${formattedSecs}/km`;
}
```

#### C. Cycling (`category: 'cycling'`)
```typescript
interface CyclingWorkout extends BaseWorkout {
  category: 'cycling';
  distance: number;                // in km or mi
  distanceUnit: 'km' | 'mi';
  elevation?: number;              // in meters or feet
  speed?: number;                  // calculated speed (km/h) = distance / (duration / 60)
}
```

#### D. Swimming (`category: 'swimming'`)
```typescript
interface SwimmingWorkout extends BaseWorkout {
  category: 'swimming';
  distance?: number;               // in meters or yards
  poolLength?: number;             // e.g. 25 or 50
  poolLengthUnit?: 'm' | 'yd';
  laps?: number;                   // count
  stroke?: 'Freestyle' | 'Breaststroke' | 'Backstroke' | 'Butterfly' | 'Mixed' | string;
}
```

#### E. Yoga / Mobility (`category: 'yoga'`)
```typescript
interface YogaWorkout extends BaseWorkout {
  category: 'yoga';
  style?: 'Vinyasa' | 'Hatha' | 'Yin' | 'Ashtanga' | 'Power' | 'Restorative' | 'Mobility' | string;
  effort?: 'Gentle' | 'Moderate' | 'Vigorous';
}
```

#### F. Other (`category: 'other'`)
```typescript
interface OtherWorkout extends BaseWorkout {
  category: 'other';
  customType: string;              // e.g. 'Bouldering', 'Pilates'
}
```

---

## 7. Requirement R2: Two Entry Paths & Session Context

### 7.1 "Start Workout" (Live Stopwatch)
- Active running timer displaying `HH:MM:SS` (or `MM:SS`).
- Controls: "Pause", "Resume", "Finish Workout".
- Exercises/sets or distance can be logged progressively while the stopwatch ticks.
- On "Finish Workout":
  - Captures `elapsedSeconds`.
  - Calculates `duration = Math.max(1, Math.round(elapsedSeconds / 60))`.
  - Marks `entryPath = 'live'`.
  - Records `startTime` and `endTime`.

### 7.2 "Log Completed Workout" (Static Entry)
- Tab for logging after session completion.
- Direct input of duration in minutes.
- Optional session start/end time.
- Marks `entryPath = 'completed'`.

### 7.3 Rule on Calories & Elapsed Time
- **Elapsed Time**: Clearly labeled *"Session Elapsed Time: XX min"*, never *"Active lift time"*.
- **No Invented Metrics**: Calorie count is left blank unless explicitly entered by the user. Volume totals are calculated ONLY from weighted sets (`reps * weight`); bodyweight sets are reported by total reps without assuming a fabricated body weight.

---

## 8. Requirement R5: Floating Button Fix Analysis

### 8.1 Current Implementation in `DashboardScreen.jsx`
```jsx
<button
  type="button"
  onClick={() => handleOpenQuickLog('water')}
  aria-label="Quick Log"
  title="Quick Log"
  className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:shadow-[0_0_35px_rgba(239,68,68,0.8)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#09090b]"
>
  <Plus size={28} className="stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
</button>
```

### 8.2 Why It Clips
1. **CSS Transform Trap**: The root element of `DashboardScreen.jsx` (line 132) uses:
   `className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12"`
   In CSS, any transform (such as `slide-in-from-bottom-4` / translate) establishes a **new containing block for `position: fixed` descendants**.
   This causes the button to position relative to `DashboardScreen`'s max-width container or scroll box instead of the viewport.
2. **Screen Margin Clipping on Narrow Screens**: On narrow displays (< 640px) or with scrollbars, `right-8` (32px) and `bottom-8` (32px) can collide with container padding or screen bounds.

### 8.3 Invariant Test Constraints
Existing test suites (`tests/m2_stress_suite.mjs` line 171 and `tests/m5_final_acceptance_judge.test.mjs` line 144) assert:
- `src.includes('fixed bottom-8 right-8')` or `src.includes('fixed bottom-8 right-8 z-40')`
- `src.includes('aria-label="Quick Log"')`
- `src.includes('w-14 h-14 rounded-full')`

### 8.4 Recommended Fix
- Move the floating button outside the transformed DOM container or render it at the top-level of `DashboardScreen` without transform parents.
- Retain the exact class string `fixed bottom-8 right-8 z-40` for test compliance, while adding safe-area padding or `max-w-full overflow-x-hidden` on parent containers to prevent clipping.

---

## 9. Existing Test Suite Analysis & Regression Prevention

The project has **17 test files and 196 automated tests** using Node's built-in test runner (`node --test tests/*.test.mjs`), all currently passing with 0 failures.

### Strict Test Assertions on `ExerciseScreen.jsx`:
1. **Source Code Inclusions**:
   - `onSave({` (must call onSave with an object)
   - `type:` (must include type property)
   - `duration:` (must include duration property)
   - `searchQuery = ''` (must accept searchQuery default prop)
   - `filteredWorkouts` (must filter workouts against search query)
   - `Filtering` (must display filter badge when query is present)
   - `hero-bg.jpg` (must reference fitness hero background image)
2. **SSR HTML Render Assertions**:
   - Must render header containing `'Log Workout'`
   - Must render activity list containing `'Running'`
   - In Recent Activity list, workout title must render as `<p class="font-semibold text-white">{w.type}</p>`
   - When filter matches: includes `<p class="font-semibold text-white">{match.type}</p>`
   - When filter has no matches: includes `No workouts matching "${searchQuery}".` (renders as `No workouts matching &quot;...&quot;.`)
   - When filter is cleared: includes all workouts with `<p class="font-semibold text-white">...</p>`

Any implementation of the new workout screen **must strictly maintain these class names and string patterns** to ensure all 196 tests remain passing.

---

## 10. Summary Matrix: Requirements vs. Technical Approach

| Requirement | Technical Solution | Validation Strategy |
|---|---|---|
| **R1. Per-Activity Forms** | Modular form state based on selected activity ('Strength Training', 'Running', etc.); bodyweight/assisted support with no fake weight inputs. | Automated unit tests for each activity form state. |
| **R1. Previous Session Numbers** | Pure helper `getPreviousExerciseSession(habits, exerciseName)` that scans history without mutating state. | Verification with multi-day mock habits data. |
| **R1. Pace Calculation** | Helper `calculatePace(durationMinutes, distanceKm)` producing `MM:SS/km`. | Automated math verification tests with fractional distance/times. |
| **R2. Two Entry Paths** | Mode switcher: Live Stopwatch (with interval timer) vs. Static Entry; elapsed time clearly labeled. | Test timer start/pause/finish and completed form submission. |
| **R2. Honest Metrics** | No derived fake calories or volume from partial data; elapsed time labeled "Session Elapsed Time". | Inspect rendered labels and submitted payloads. |
| **R3. Rich Activity Cards** | Format summary string per category (e.g. exercises & sets for strength, km & pace for running). | Render tests for each activity type card. |
| **R3. Workout Detail View** | Modal or expandable detail view showing all exercises, sets, reps, distance, laps, etc. | Click event test verifying modal opens with session data. |
| **R4. Backward Compatibility** | Dual-mode card renderer (`isDetailedWorkout`); pre-existing entries preserved byte-for-byte in localStorage. | Seed localStorage with old entries; verify they render and survive updates. |
| **R5. Floating Button Fix** | Prevent transform trap and screen edge clipping while preserving required test strings. | Test FAB visibility and run existing M2/M5 test suites. |
