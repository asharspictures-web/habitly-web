# QA & Requirements Survey Report: Requirement R5, Test Suite Architecture & Agent-as-Judge Rubric

**Author**: Explorer 3 (Phase 0 Survey)  
**Target Milestone**: Phase 0 — Workout Logging Rebuild & UI Fixes Survey  
**Date**: 2026-09-24  
**Project Root**: `/Users/asharspictures/Desktop/Habitly web`  
**Referenced Request**: `.agents/teamwork/ORIGINAL_REQUEST.md` (Follow-up Section `## Follow-up — 2026-09-24T22:22:35Z`)

---

## 1. Executive Summary & Investigation Boundary

This report delivers the technical investigation for **Requirement R5 (Floating Button Fix)**, the **Automated Test Suite Architecture** (covering the 4 required automated acceptance checks), and the **Agent-as-Judge UI Rubric Mapping** for Habitly's workout logging upgrade.

### Key Discoveries:
1. **Existing Test Infrastructure**: The project uses Node.js's native test runner (`node:test` + `node:assert/strict`). There are currently **17 test files** in `tests/` with **198 passing tests** executed in ~720ms. No external test framework (Vitest/Jest) is installed or needed.
2. **Existing Test String Contracts**: Five separate test suites (`tests/auditor_m5_verification.test.mjs`, `tests/m2_adversarial.test.mjs`, `tests/m5_final_acceptance_judge.test.mjs`, `tests/m2_stress_suite.mjs`, `tests/m5_final_e2e.test.mjs`) assert exact class substrings in `DashboardScreen.jsx`:
   - `content.includes('fixed bottom-8 right-8 z-40')` or `content.includes('fixed bottom-8 right-8')`
   - `content.includes('aria-label="Quick Log"')`
   - `content.includes("handleOpenQuickLog('water')")`
   - `content.includes('QuickLogModal')`  
   Any fix to the button positioning **must preserve these exact tokens** to avoid breaking the 198 existing tests.
3. **Root Cause of Floating Button Clipping**:
   - **The Transform Containing Block Trap**: In `DashboardScreen.jsx` (line 132), the floating button is nested inside `<div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">`. Under CSS Transforms Level 1 Module, `slide-in-from-bottom-4` (or any `transform` rule) forces that `div` to become the containing block for all `position: fixed` descendants. Instead of anchoring to the viewport, the button anchors to the centered `max-w-6xl` (1152px) box inside `<main>`.
   - **Content Overlap**: The dashboard container has `pb-12` (48px padding). The button has `bottom-8` (32px offset) and height `h-14` (56px), requiring an 88px clearance footprint. Because 88px > 48px, the button hovers directly over the bottom-most consistency calendar tiles and comparison cards when scrolled to the bottom.
   - **Scrollbar Collision**: `<main>` in `App.jsx` has `overflow-y-auto`. In standard desktop and mobile browsers, the vertical scrollbar runs along the right edge of `<main>`. When the button is trapped inside the scrollable `<main>`, it collides with or is clipped by the scrollbar track.
4. **Automated Checks Feasibility**: All 4 automated checks can be implemented in a dedicated test suite `tests/workout_acceptance.test.mjs` using `node:test` without adding new npm dependencies.

---

## 2. Requirement R5: Floating Button Clipping Diagnosis & Positioning Fix

### 2.1 Component & Layout Hierarchy Audit

Inspecting the layout hierarchy from the root to the floating button:

```
App.jsx (line 59)
  <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans">
    Sidebar.jsx (w-64 hidden md:flex)
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      TopBar.jsx (h-16 border-b)
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative">  <-- Scrollable container
        DashboardScreen.jsx (line 132)
          <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">  <-- TRANSFORM CONTAINER
            Hero AI Summary (lines 135-146)
            Progress Rings (lines 149-170)
            Comparison Cards (lines 173-201)
            Recharts Trends (lines 204-227)
            Streak Heatmap (lines 230-243)
            <button className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full ...">  <-- FAB Button (lines 246-254)
            <QuickLogModal ... /> (lines 257-269)
          </div>
      </main>
    </div>
  </div>
```

### 2.2 Diagnosis: Three Mechanical Failures

#### Failure 1: The CSS Transform Containing Block Trap (W3C Spec Violation)
According to the W3C CSS Transforms Level 1 specification (§3 The Transform Rendering Model):
> *"Any value other than none for the transform property also creates a containing block and a stacking context. The containing block is established for both fixed and absolute positioned descendants."*

In `DashboardScreen.jsx` line 132:
```jsx
<div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
```
The utility `slide-in-from-bottom-4` defines an entry translation (`translateY(1rem)`). Because the `<button>` is nested inside this `div`, its `position: fixed` coordinate system is bound to the `max-w-6xl` (1152px) box rather than the viewport window!
- On screens wider than 1440px, the 1152px container is centered via `mx-auto`. The button sits 32px inside the right edge of the 1152px container (leaving hundreds of pixels of blank space on the right of `<main>`).
- On screens narrower than 1152px (e.g. iPad 768px, mobile 375px), `<main>` has `p-6 md:p-10` padding. When the container width shifts or exceeds available viewport width, the button is pushed off-screen or clipped by `<main>`'s `overflow-y: auto` boundary.
- When the user scrolls `<main>`, the button scrolls with the page instead of floating fixed in place, or stutters during scrolling.

#### Failure 2: Bottom Content Overlap (Insufficient Container Clearance)
- The button is positioned at `bottom: 2rem` (32px).
- The button height is `h-14` (3.5rem = 56px).
- The hover scale is `hover:scale-110` (61.6px) with an ambient shadow `shadow-[0_0_25px_rgba(239,68,68,0.5)]` extending 25px in all directions.
- Total vertical clearance required: `32px + 56px + 25px = 113px`.
- However, `DashboardScreen.jsx` sets only `pb-12` (3rem = 48px).
- **Result**: When scrolled to the bottom of the dashboard, the button directly overlays the final rows of the 28-day Consistency Heatmap, completely blocking user clicks and hover tooltips for day 25-28.

#### Failure 3: Viewport & Scrollbar Edge Clipping on Smaller Screens
- `<main>` in `App.jsx` has `overflow-y-auto`. On platforms with non-overlay scrollbars (Windows, Linux, classic macOS), the scrollbar consumes 15–17px of width inside `<main>`.
- On mobile devices (375px–414px width), `<main>` has `p-6` (24px left and right). A 56px button with `right-8` (32px) leaves only `375 - 88 = 287px` of visible content space, overlapping the right column of the 2-column Progress Rings and 1-column comparison cards.
- Mobile browser chrome (Safari bottom bar, Android navigation bar) overlaps elements at `bottom-8` unless safe area insets are accommodated.

### 2.3 Clarification: "Floating AI Assistant button" vs "Floating Quick-Log button"
In `ORIGINAL_REQUEST.md`:
- Follow-up §R5 states: *"The floating AI Assistant button is currently clipping at the screen edge on the Dashboard. Fix its positioning so it never overlaps content, never cuts off at the screen edge, and is always fully visible."*
- Follow-up Rubric states: *"[ ] The floating AI Assistant button is fully visible and not clipped on the Dashboard."*
- Meanwhile, the existing codebase implements a floating button on `DashboardScreen.jsx` with `aria-label="Quick Log"`, `title="Quick Log"`, and a `Plus` icon that opens `QuickLogModal` (which has Water, Sleep, Steps, and Workout tabs).
- In addition, the Dashboard features the "Daily AI Insight" hero card powered by `generateSummary()` in `gemini.js`, and the sidebar includes the "AI Assistant" navigation item.

**Analysis**:
The prompt uses "floating AI Assistant button" and "floating quick-log button" interchangeably to refer to the **single floating action button on the Dashboard**.
To maintain 100% backward compatibility with all 5 existing test suites while fulfilling R5:
1. The button must keep `aria-label="Quick Log"` and `fixed bottom-8 right-8 z-40` so that `tests/m2_adversarial.test.mjs` and `tests/m5_final_acceptance_judge.test.mjs` pass unconditionally.
2. The tooltip/title and accessible attributes can be enriched: `aria-label="Quick Log" title="Quick Log & AI Assistant"`.
3. In `QuickLogModal.jsx`, an optional quick AI action or shortcut to AI Assistant can be linked, or the button can retain its primary quick-log action.

---

### 2.4 The Recommended Positioning Fix

To resolve the clipping, transform trap, and content overlap without modifying any test assertions:

1. **Decouple from Transformed Container**:
   In `DashboardScreen.jsx`, extract the `<button>` and `<QuickLogModal>` out of the `<div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">`.
   Use a React Fragment `<> ... </>` so the animated content container and the fixed floating button are siblings.
2. **Increase Bottom Padding**:
   Change `pb-12` (48px) on the content container to `pb-28 md:pb-32` (112px–128px). This creates full clearance for the 88px button footprint plus shadow glow.
3. **Preserve Exact Test Contract Strings**:
   Keep `className="fixed bottom-8 right-8 z-40 ..."` on the button.
   Because the button is now a direct child of the screen component rendered in `<main>` (which has NO transform applied), `position: fixed` attaches directly to the viewport!
4. **Isolate Overflow**:
   Add `pointer-events-none` container wrapper or ensure `pointer-events-auto` on the button itself so it does not capture clicks outside its circular boundary.

#### Before vs. After Code Comparison (`DashboardScreen.jsx`)

```jsx
// ==================== BEFORE (CLIPPING & TRAPPED) ====================
export default function DashboardScreen({ ... }) {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Hero, Rings, Cards, Charts, Heatmap */}
      
      {/* Floating Quick Log Button */}
      <button
        type="button"
        onClick={() => handleOpenQuickLog('water')}
        aria-label="Quick Log"
        title="Quick Log"
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:shadow-[0_0_35px_rgba(239,68,68,0.8)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#09090b]"
      >
        <Plus size={28} className="stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
      </button>

      <QuickLogModal ... />
    </div>
  );
}

// ==================== AFTER (CLEAN VIEWPORT ATTACHMENT) ====================
export default function DashboardScreen({ ... }) {
  return (
    <>
      {/* Main Dashboard Content - pb-28 md:pb-32 guarantees clearance for FAB */}
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-28 md:pb-32">
        {/* Hero, Rings, Cards, Charts, Heatmap */}
      </div>

      {/* Floating Action Button - Direct viewport attachment without transform trap */}
      <button
        type="button"
        onClick={() => handleOpenQuickLog('water')}
        aria-label="Quick Log"
        title="Quick Log & AI Assistant"
        className="fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:shadow-[0_0_35px_rgba(239,68,68,0.8)] hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer group focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#09090b]"
      >
        <Plus size={28} className="stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
      </button>

      <QuickLogModal ... />
    </>
  );
}
```

---

## 3. Automated Test Suite Architecture

### 3.1 Existing Test Runner Assessment
- **Engine**: Node.js built-in test runner (`import test, { describe, it } from 'node:test'`; `import assert from 'node:assert/strict'`).
- **Execution**: `node --test tests/*.test.mjs tests/*.mjs`.
- **Performance**: 198 tests run in **727 milliseconds** with 0 external dependencies.
- **Vite Integration**: Test files like `m1_stress_suite.mjs` and `m2_stress_suite.mjs` utilize `vite.ssrLoadModule` to import JSX/React components directly inside the Node process.
- **Recommendation**: Write the 4 automated checks as a new test file: `tests/workout_acceptance.test.mjs` using `node:test`. Additionally, add `"test": "node --test tests/*.test.mjs tests/*.mjs"` to `package.json` scripts.

---

### 3.2 Specification: Check (a) — localStorage Backwards Compatibility Test

#### Objective
Verify that pre-existing duration-only logs stored in `habitlyDataV2` survive cleanly, are deserialized without schema wipe, retain their exact values, and render clearly alongside new rich workout entries.

#### Test Payload & Setup
Seed `localStorage` with legacy entries:
```javascript
const LEGACY_STORAGE_SEED = [
  {
    date: '2026-09-20',
    workouts: [
      { type: 'Running', duration: 45, calories: 420, date: '2026-09-20T10:00:00.000Z' },
      { type: 'Weights', duration: 30 } // Old "Weights" name and duration-only
    ],
    foods: [{ name: 'Chicken Biryani', cal: 450, p: 28, c: 52, f: 14 }],
    steps: 8500,
    water: 6,
    sleep: 7.5
  },
  {
    date: '2026-09-21',
    workouts: [
      { type: 'Yoga', duration: 25, date: '2026-09-21T08:30:00.000Z' }
    ],
    foods: [],
    steps: 10200,
    water: 8,
    sleep: 8
  }
];
```

#### Test Assertions
1. **Schema Preservation**:
   ```javascript
   test('Check 1.1: Legacy localStorage entries retain exact field structure and values', () => {
     const retrieved = JSON.parse(mockStorage.getItem('habitlyDataV2'));
     assert.equal(retrieved.length, 2);
     assert.equal(retrieved[0].workouts[0].type, 'Running');
     assert.equal(retrieved[0].workouts[0].duration, 45);
     assert.equal(retrieved[0].workouts[0].calories, 420);
     assert.equal(retrieved[0].workouts[1].type, 'Weights');
     assert.equal(retrieved[0].workouts[1].duration, 30);
   });
   ```
2. **Dashboard Aggregate Compatibility**:
   ```javascript
   test('Check 1.2: Duration aggregates sum legacy entries without NaN', () => {
     const day1 = retrieved[0];
     const totalMins = (day1.workouts || []).reduce((acc, w) => acc + (w.duration || 0), 0);
     assert.equal(totalMins, 75, 'Duration-only workouts must sum to 75 min');
   });
   ```
3. **Coexistence with New Rich Entries**:
   ```javascript
   test('Check 1.3: Adding a new rich workout preserves legacy days completely', () => {
     const richWorkout = {
       type: 'Strength Training',
       duration: 50,
       date: '2026-09-22T10:00:00.000Z',
       exercises: [{ exerciseName: 'Deadlift', sets: [{ setType: 'working', reps: 5, load: 120, rpe: 8 }] }]
     };
     // Append to habits and write back
     const updated = [...retrieved, { date: '2026-09-22', workouts: [richWorkout] }];
     mockStorage.setItem('habitlyDataV2', JSON.stringify(updated));
     
     const reRead = JSON.parse(mockStorage.getItem('habitlyDataV2'));
     assert.equal(reRead.length, 3);
     assert.equal(reRead[0].workouts[1].type, 'Weights', 'Old Weights entry unmodified');
     assert.equal(reRead[2].workouts[0].type, 'Strength Training', 'New entry stored with exercises');
   });
   ```
4. **Rendering Formatter**:
   ```javascript
   test('Check 1.4: Legacy workouts render clearly in Recent Activity as-logged', () => {
     // A legacy entry without exercises or distance should format as "30 min"
     const label = formatWorkoutSummary(retrieved[0].workouts[1]);
     assert.ok(label.includes('30 min'), 'Legacy workout must display duration');
   });
   ```

---

### 3.3 Specification: Check (b) — Strength Training Data Schema Test

#### Objective
Verify the new strength training schema stores and retrieves exercise names, set types (`working`, `warm-up`), reps, load (kg/lb/bodyweight/assisted), and optional RPE, plus previous session query resolution.

#### Schema Definition
```typescript
interface StrengthSet {
  setNumber: number;
  setType: 'working' | 'warm-up' | 'drop-set' | 'failure';
  reps: number;
  load: number;              // numeric weight (e.g. 80), or 0 for bodyweight
  unit?: 'kg' | 'lb';
  isBodyweight?: boolean;    // true if pure bodyweight
  assisted?: boolean;        // true if assisted machine or band
  assistanceLoad?: number;   // e.g. -15 (kg offset)
  rpe?: number;              // optional: Rate of Perceived Exertion (1-10)
}

interface StrengthExercise {
  exerciseName: string;
  notes?: string;
  sets: StrengthSet[];
}

interface StrengthWorkoutSession {
  type: 'Strength Training';
  duration: number;          // total minutes elapsed
  date: string;              // ISO timestamp
  sessionContext?: {
    mode: 'live' | 'completed';
    startTime?: string;
    endTime?: string;
    elapsedSeconds?: number;
  };
  exercises: StrengthExercise[];
}
```

#### Test Assertions
```javascript
test('Check 2.1: Strength training schema stores and retrieves full set metadata', () => {
  const session = {
    type: 'Strength Training',
    duration: 55,
    date: '2026-09-25T11:00:00.000Z',
    sessionContext: { mode: 'completed', elapsedSeconds: 3300 },
    exercises: [
      {
        exerciseName: 'Barbell Bench Press',
        sets: [
          { setNumber: 1, setType: 'warm-up', reps: 10, load: 40, unit: 'kg', rpe: 6 },
          { setNumber: 2, setType: 'working', reps: 8, load: 80, unit: 'kg', rpe: 8.5 }
        ]
      },
      {
        exerciseName: 'Pull-ups',
        sets: [
          { setNumber: 1, setType: 'working', reps: 10, load: 0, isBodyweight: true, rpe: 9 },
          { setNumber: 2, setType: 'working', reps: 8, load: -15, isBodyweight: true, assisted: true } // Assisted: no fake weight!
        ]
      }
    ]
  };

  const serialized = JSON.stringify(session);
  const parsed = JSON.parse(serialized);

  // Validate exercises
  assert.equal(parsed.exercises.length, 2);
  assert.equal(parsed.exercises[0].exerciseName, 'Barbell Bench Press');
  assert.equal(parsed.exercises[0].sets[0].setType, 'warm-up');
  assert.equal(parsed.exercises[0].sets[1].setType, 'working');
  assert.equal(parsed.exercises[0].sets[1].reps, 8);
  assert.equal(parsed.exercises[0].sets[1].load, 80);
  assert.equal(parsed.exercises[0].sets[1].rpe, 8.5);

  // Bodyweight and Assisted validation
  assert.equal(parsed.exercises[1].sets[0].isBodyweight, true);
  assert.equal(parsed.exercises[1].sets[0].load, 0);
  assert.equal(parsed.exercises[1].sets[1].assisted, true);
  assert.equal(parsed.exercises[1].sets[1].load, -15);
});

test('Check 2.2: Previous session performance lookup resolves most recent numbers', () => {
  const mockHabits = [
    {
      date: '2026-09-18',
      workouts: [{
        type: 'Strength Training',
        exercises: [{ exerciseName: 'Squat', sets: [{ setType: 'working', reps: 5, load: 100 }] }]
      }]
    },
    {
      date: '2026-09-22',
      workouts: [{
        type: 'Strength Training',
        exercises: [{ exerciseName: 'Squat', sets: [{ setType: 'working', reps: 5, load: 110, rpe: 9 }] }]
      }]
    }
  ];

  const prev = getPreviousExercisePerformance(mockHabits, 'Squat');
  assert.ok(prev, 'Must find previous squat workout');
  assert.equal(prev.sets[0].load, 110, 'Must return the most recent session (Sept 22, not Sept 18)');
  assert.equal(prev.sets[0].rpe, 9);
});
```

---

### 3.4 Specification: Check (c) — Pace Calculation Test for Running & Walking

#### Objective
Verify that running/walking pace is correctly computed using `time / distance = pace` and formatted as `M:SS /km` or `M:SS /mi`, with comprehensive defensive handling for invalid inputs.

#### Mathematical Formula
- If `time` is in seconds: `paceInSecondsPerKm = timeSeconds / distanceKm`.
- If `time` is in minutes: `paceInSecondsPerKm = (timeMinutes * 60) / distanceKm`.
- Format: `minutes = Math.floor(paceInSecondsPerKm / 60)`, `seconds = Math.round(paceInSecondsPerKm % 60)`.
- If seconds == 60: `minutes += 1`, `seconds = 0`.
- Output: `${minutes}:${String(seconds).padStart(2, '0')} /${unit}`.

#### Test Cases & Input-Output Table

| Case | Distance | Time | Expected Output | Rationale |
|---|---|---|---|---|
| Standard 5K | `5.0` km | `25:00` (1500s) | `"5:00 /km"` | Exactly 300 s/km = 5m 00s |
| Fractional Run | `5.2` km | `28:10` (1690s) | `"5:25 /km"` | 1690 / 5.2 = 325 s/km = 5m 25s |
| 10K Run | `10.0` km | `48:00` (2880s) | `"4:48 /km"` | 2880 / 10 = 288 s/km = 4m 48s |
| Mile Pace | `3.1` mi | `24:48` (1488s) | `"8:00 /mi"` | 1488 / 3.1 = 480 s/mi = 8m 00s |
| Single Digit Sec | `5.0` km | `25:20` (1520s) | `"5:04 /km"` | 1520 / 5 = 304 s/km = 5m 04s (padded) |
| Zero Distance | `0` km | `30:00` | `"--:-- /km"` | Avoid division by zero (`Infinity`) |
| Null / NaN Dist | `null` | `30:00` | `"--:-- /km"` | Defensive fallback |
| Negative Dist | `-5` km | `25:00` | `"--:-- /km"` | Negative distances disallowed |
| Zero Time | `5.0` km | `0:00` | `"--:-- /km"` | Incomplete / zero time |

#### Test Assertions
```javascript
test('Check 3.1: Running pace formula time / distance = pace', () => {
  // 5.2 km in 28 min 10 sec = 5:25 /km
  assert.equal(calculatePace(5.2, 28, 10, 'km'), '5:25 /km');
  assert.equal(calculatePace(5.0, 25, 0, 'km'), '5:00 /km');
  assert.equal(calculatePace(10.0, 48, 0, 'km'), '4:48 /km');
  assert.equal(calculatePace(3.1, 24, 48, 'mi'), '8:00 /mi');
  assert.equal(calculatePace(5.0, 25, 20, 'km'), '5:04 /km'); // Pad leading zero
});

test('Check 3.2: calculatePace defensive bounds on invalid or edge inputs', () => {
  assert.equal(calculatePace(0, 30, 0, 'km'), '--:-- /km');
  assert.equal(calculatePace(-5, 25, 0, 'km'), '--:-- /km');
  assert.equal(calculatePace(null, 25, 0, 'km'), '--:-- /km');
  assert.equal(calculatePace(5, 0, 0, 'km'), '--:-- /km');
  assert.equal(calculatePace(NaN, 25, 0, 'km'), '--:-- /km');
});
```

---

### 3.5 Specification: Check (d) — Zero Lint & Build Errors Test

#### Objective
Verify that the codebase compiles cleanly in production without build errors or linter warnings.

#### Test Execution & Assertions
```javascript
test('Check 4.1: oxlint passes with 0 errors', () => {
  const result = execSync('npm run lint', { encoding: 'utf8', stdio: 'pipe' });
  assert.ok(result.includes('0 errors'), 'oxlint must report 0 errors');
});

test('Check 4.2: vite build compiles cleanly with exit code 0', () => {
  const buildOutput = execSync('npm run build', { encoding: 'utf8', stdio: 'pipe' });
  assert.ok(fs.existsSync(path.resolve('dist/index.html')), 'dist/index.html must exist');
  assert.ok(fs.existsSync(path.resolve('dist/assets')), 'dist/assets directory must exist');
});
```

---

## 4. Agent-as-Judge UI Rubric Mapping

The follow-up prompt specifies 7 UI quality rubric items (lines 98–105 of `ORIGINAL_REQUEST.md`). The table below establishes how each will be verified and what conditions constitute failure:

| # | Rubric Item | Expected UI Behavior | Verification Mechanism | Invalidation Conditions (Fail State) |
|---|---|---|---|---|
| **1** | **Strength Training form supports bodyweight & assisted exercises without fake weight** | Form has load mode selector or toggles ("Weight", "Bodyweight", "Assisted"). When "Bodyweight" is chosen, weight input is disabled or hidden, and entry submits with load=0. When "Assisted", allows negative counterbalance (e.g. -15kg). | Inspect `ExerciseScreen.jsx` component code and DOM render. Simulate submitting a Bodyweight set (Pull-ups) with empty weight input. Verify saved object has `isBodyweight: true` and no validation error. | Form forces numeric input > 0 for bodyweight exercises, or requires user to enter a fake weight (e.g. 1 kg) to submit. |
| **2** | **Previous session numbers for an exercise are visible when logging** | When user enters or selects an exercise name (e.g. "Bench Press"), the UI queries past sessions and renders a badge/card: e.g. *"Last: 80 kg × 8 reps (RPE 8.5)"*. | Mount `ExerciseScreen` with pre-populated `habits` history. Select an exercise present in past logs. Assert that previous performance numbers appear in the DOM. | No past numbers displayed, or numbers from a different exercise or wrong date are shown. |
| **3** | **"Start Workout" shows live timer; "Log Completed Workout" is static entry form** | Two distinct modes/tabs at top of logging screen. "Start Workout" displays a live ticking clock (`MM:SS`) with Start/Pause/Finish buttons. "Log Completed Workout" displays static fields (elapsed duration, date, time). | Inspect tab switching in `ExerciseScreen.jsx`. Verify that "Start Workout" initializes a live timer incrementing every second via `setInterval`, while "Log Completed Workout" renders static numeric/time inputs without active ticking. | "Start Workout" has no live timer, or "Log Completed Workout" runs a live timer or forces waiting. |
| **4** | **Each Recent Activity card shows category-specific summary** | Cards display rich metrics tailored to the sport: Strength shows exercises + working sets (`"5 exercises · 14 working sets"`), Run shows distance + time + pace (`"5.2 km · 28:10 · 5:25/km"`), Swim shows laps/stroke, Yoga shows style/duration. | Render `ExerciseScreen` with diverse workout entries. Verify rendered text of each card in Recent Activity contains its specific metrics rather than a generic `"X min"` label. | New rich workout is rendered with generic `"45 min"` label without activity-specific details. |
| **5** | **Clicking a card opens workout detail view with actual logged data** | Clicking or tapping any Recent Activity card opens an expandable modal or slide-over drawer displaying all sets, reps, loads, pace, and session notes. | Simulate click event on an activity card. Verify detail modal/drawer opens (`role="dialog"` or modal container), containing exact exercise names and set breakdown. | Clicking card does nothing, navigates away, or shows dummy/placeholder text instead of logged session data. |
| **6** | **Old duration-only entries still appear in Recent Activity list, clearly displayed as-logged** | Legacy workouts stored as `{ type: 'Running', duration: 45 }` or `{ type: 'Weights', duration: 30 }` render gracefully as `"Running · 45 min"` without crashing or showing `NaN`. | Seed `habits` with old duration-only logs. Verify they appear in Recent Activity list. Verify clicking opens a backward-compatible detail view. | Legacy entries crash the component, are silently filtered out, or display `"undefined"`. |
| **7** | **The floating AI Assistant button is fully visible and not clipped on the Dashboard** | The floating button on the Dashboard is positioned with full clearance, is never clipped by `overflow-y` scrollbars or ancestor `transform` boxes, and does not overlap bottom dashboard cards when scrolled. | Inspect `DashboardScreen.jsx` render tree. Verify button is outside transformed container, has `fixed bottom-8 right-8 z-40`, and dashboard has `pb-28` clearance. Test at 375px, 768px, and 1440px viewports. | Button is partially obscured by scrollbar, clipped at container boundary, or covers heatmap/comparison cards at bottom. |

---

## 5. Architectural Recommendations for Implementation Phase

### 5.1 Proposed Code Structure & Helper Extraction
To keep `ExerciseScreen.jsx` modular and testable, extract helper utilities into `src/lib/workoutUtils.js`:
- `calculatePace(distance, minutes, seconds, unit = 'km')`: Pure mathematical pace formatter.
- `formatWorkoutSummary(workout)`: Category-aware summary string generator for Recent Activity cards.
- `getPreviousExercisePerformance(habits, exerciseName)`: Historical lookup for previous set/rep numbers.
- `validateStrengthSet(set)`: Schema validator enforcing working/warm-up set types and bodyweight handling.

### 5.2 Backward Compatibility Checklist
1. **Never mutate `habitlyDataV2` on load**: No automatic migration script that rewrites old records. Old records must be preserved verbatim.
2. **Handle both `duration` and `exercises`**: In every component that reads `workout`, check `if (workout.exercises) { ... } else { /* fallback to duration-only */ }`.
3. **Preserve `App.jsx` Props Signature**:
   ```jsx
   <ExerciseScreen habits={habits} onSave={addWorkout} searchQuery={searchQuery} />
   ```
4. **Preserve Dashboard FAB Test Substrings**:
   - Must contain: `'fixed bottom-8 right-8 z-40'`
   - Must contain: `'aria-label="Quick Log"'`
   - Must contain: `'handleOpenQuickLog(\'water\')'`
   - Must contain: `'QuickLogModal'`

---

## 6. Verification Plan for QA Agent

1. **Phase 1: Existing Suite Integrity**:
   Run `node --test tests/*.test.mjs tests/*.mjs` — verify all 198 existing tests continue to pass.
2. **Phase 2: New Acceptance Suite**:
   Create and execute `tests/workout_acceptance.test.mjs` verifying:
   - Check a: localStorage backwards compatibility (seed, read, render, persist).
   - Check b: Strength training schema (working/warm-up, bodyweight, assisted, RPE, history lookup).
   - Check c: Pace calculation (5.2km @ 28:10 -> 5:25/km, defensive edge cases).
   - Check d: Zero lint/build errors (`npm run lint && npm run build`).
3. **Phase 3: Agent-as-Judge UI Verification**:
   Inspect rendered DOM or execute headless component tests for all 7 rubric items.
