# Forensic Audit Report — Milestone 1: Core Workout Utilities & Data Model

**Date**: 2026-09-24T22:35:00Z  
**Auditor**: Forensic Auditor (`auditor_workout_m1`)  
**Work Product**: `src/lib/workoutUtils.js` and `tests/workout_utils.test.mjs`  
**Profile**: General Project  
**Integrity Mode**: Demo Mode (from `ORIGINAL_REQUEST.md`)  
**Verdict**: **CLEAN**

---

## Forensic Audit Summary

### Phase Results
- **Hardcoded Output Detection**: PASS — No hardcoded test result maps, cheat branches, or test-specific constants.
- **Facade Detection**: PASS — Genuine computational logic across all 6 exported functions and helpers.
- **Pre-populated Artifact Detection**: PASS — Zero pre-generated `.log`, `output`, or result files.
- **Build and Test Verification**: PASS — Build succeeded cleanly (`vite build` in 317ms), all 18 M1 unit tests passed with 0 skipped/todo, and all 214 project regression tests passed.
- **Output & Logic Verification**: PASS — Pure mathematical calculations confirmed for pace, volume, and formatting.
- **Anti-Fabrication Verification (Rule R2)**: PASS — Zero calories fabricated, and bodyweight/assisted strength volume strictly adds zero tonnage.
- **Backward Compatibility Discrimination**: PASS — Legacy duration-only logs preserved and recognized without silent mutation.

---

## 1. Observation

### File & Codebase Inspection
- **Implementation File**: `src/lib/workoutUtils.js` (474 lines, 15,461 bytes)
  - Exports: `ACTIVITY_TYPES`, `COMMON_EXERCISES`, `normalizeActivityType`, `calculatePace`, `getPaceDetails`, `isDetailedWorkout`, `formatWorkoutSummary`, `findPreviousExercisePerformance`, `calculateStrengthVolume`.
- **Test File**: `tests/workout_utils.test.mjs` (570 lines, 19,434 bytes)
  - Contains 18 unit tests utilizing Node.js built-in `node:test` and `node:assert/strict`.
- **Directory Boundaries**:
  - No source, test, or data files were written into `.agents/teamwork/`.
  - All implementation artifacts reside in standard project directories (`src/lib/`, `tests/`).

### Empirical Test Execution

1. **Unit Test Suite**: `node --test tests/workout_utils.test.mjs`
```
✔ calculatePace: exact math matches prompt specifications (1.111ms)
✔ calculatePace: safely returns null on zero, negative, or invalid inputs (0.145958ms)
✔ getPaceDetails: returns structured breakdown for valid and invalid inputs (0.099875ms)
✔ isDetailedWorkout: correctly identifies legacy duration-only logs vs rich v2 logs (0.129542ms)
✔ formatWorkoutSummary: formats legacy duration-only logs clearly with tag (0.167ms)
✔ formatWorkoutSummary: Strength Training with and without title (0.091292ms)
✔ formatWorkoutSummary: Running / Walking with distance, time, and pace (0.078333ms)
✔ formatWorkoutSummary: Cycling with and without speed (0.0615ms)
✔ formatWorkoutSummary: Swimming with distance, laps, and stroke (0.183209ms)
✔ formatWorkoutSummary: Yoga / Mobility with style and effort (0.189792ms)
✔ formatWorkoutSummary: Other / Custom workouts (0.118333ms)
✔ findPreviousExercisePerformance: locates most recent session across multi-day history (0.259959ms)
✔ findPreviousExercisePerformance: respects same-day multiple workout ordering (0.074625ms)
✔ calculateStrengthVolume: calculates working sets and tonnage accurately (0.173542ms)
✔ calculateStrengthVolume: NEVER inflates tonnage from bodyweight or assisted sets (0.06275ms)
✔ calculateStrengthVolume: handles empty/missing/corrupt inputs safely (0.3775ms)
✔ normalizeActivityType: converts Weights to Strength Training and preserves others (0.070791ms)
✔ ACTIVITY_TYPES and COMMON_EXERCISES arrays are non-empty and well-formed (0.184833ms)
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 49.736125
```

2. **Full Project Regression Test Suite**: `node --test tests/*.test.mjs`
```
ℹ tests 214
ℹ suites 13
ℹ pass 214
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 163.16825
```

3. **Linter Execution**: `npm run lint` (`oxlint`)
```
Found 2 warnings and 0 errors.
Finished in 28ms on 35 files with 104 rules using 15 threads.
```
*(Warnings are pre-existing unused imports in unrelated test files).*

4. **Production Build**: `npm run build` (`vite build`)
```
✓ built in 317ms
dist/index.html                   0.46 kB │ gzip:   0.29 kB
dist/assets/index-BjTD9f80.css   62.99 kB │ gzip:  10.27 kB
dist/assets/index-Br9QE5cA.js   717.06 kB │ gzip: 204.78 kB
```

5. **Independent Auditor Stress & Edge Case Probing**:
- Dynamic pace calculation verified for arbitrary non-fixture values (e.g. 5.2km in 28:10 -> 5:25/km, 3mi in 26:15 -> 8:45/mi, 1km in 5:03 -> 5:03/km).
- Division-by-zero protection confirmed (distance = 0 returns `null`, distance = -5 returns `null`, minutes = 0 returns `null`).
- Tonnage calculation for bodyweight (`loadType: 'bodyweight'`) and assisted sets (`loadType: 'assisted'`) returns strictly 0 tonnage.
- Reverse-chronological historical lookup accurately handles out-of-order date entries and returns deep copies preventing history pollution.

---

## 2. Logic Chain

1. **Rule R2 Anti-Fabrication Compliance**:
   - `workoutUtils.js` contains no calorie estimation routines.
   - In `calculateStrengthVolume`, external tonnage is accumulated strictly when `set.loadType === 'weight'` and `load > 0 && reps > 0`. Bodyweight and assisted sets are explicitly excluded from tonnage multiplication, guaranteeing no fictitious numbers are shown to the user.
2. **Authentic Pace Arithmetic**:
   - Pace is calculated via standard physics formula: `paceSeconds = Math.round((minutes * 60) / distance)`.
   - Modulo arithmetic splits seconds into minutes and remainder seconds, with zero-padding formatting.
   - Boundary checks ensure negative numbers, strings, and zero divisors return `null` safely without generating `NaN` or runtime crashes.
3. **Backward Compatibility Preservation**:
   - `isDetailedWorkout` verifies the presence of rich v2 properties (`exercises`, `distance`, `stroke`, `style`, etc.).
   - Legacy records `{ type: 'Weights', duration: 45, date: '...', calories: 250 }` evaluate to `false`.
   - `formatWorkoutSummary` formats legacy records as `${type} · ${duration} min (Duration-only log)`.
4. **Historical Lookup Robustness**:
   - `findPreviousExercisePerformance` normalizes queries (case-insensitive, trimmed) and handles both nested habit structures (`day.workouts`) and flat workout arrays.
   - It sorts sessions descending by date with deterministic tie-breaking based on logging index, returning the latest logged performance and isolating internal records from mutation.

---

## 3. Caveats

- **No Caveats**: All unit, regression, lint, and build checks passed cleanly. Milestone 1 meets all specifications in `ORIGINAL_REQUEST.md` and `PROJECT_WORKOUT.md`.

---

## 4. Conclusion

- **Verdict**: **CLEAN**
- The implementation in `src/lib/workoutUtils.js` and test suite `tests/workout_utils.test.mjs` is authentic, robust, and completely free of hardcoded shortcuts, facades, or integrity violations.
- Downstream milestones (Milestone 2: Activity-Specific Logging Forms & Live Timer) may proceed using this module without reservation.

---

## 5. Verification Method

To reproduce the auditor's verification independently, execute:

```bash
# 1. Run Milestone 1 unit tests
node --test tests/workout_utils.test.mjs

# 2. Run full regression test suite
node --test tests/*.test.mjs

# 3. Verify clean lint and production build
npm run lint && npm run build

# 4. In-memory stress check of pace and volume anti-fabrication
node -e "
import('./src/lib/workoutUtils.js').then(u => {
  assert = (await import('node:assert/strict')).default;
  assert.equal(u.calculatePace(28 + 10/60, 5.2, 'km'), '5:25/km');
  assert.equal(u.calculatePace(30, 0), null);
  const vol = u.calculateStrengthVolume({
    type: 'Strength Training',
    exercises: [
      { name: 'Pull-ups', sets: [{ type: 'working', loadType: 'bodyweight', reps: 10, load: 80 }] },
      { name: 'Assisted Dips', sets: [{ type: 'working', loadType: 'assisted', reps: 8, load: 20 }] },
      { name: 'Bench', sets: [{ type: 'working', loadType: 'weight', reps: 10, load: 100 }] }
    ]
  });
  assert.equal(vol.totalWeightedTonnage, 1000);
  assert.equal(vol.totalWorkingSets, 3);
  console.log('Independent stress check: PASS');
});
"
```
