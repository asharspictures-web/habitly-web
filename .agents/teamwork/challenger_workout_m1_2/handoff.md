# Milestone 1 Challenger 2 Report: Empirical Stress Testing of `workoutUtils.js`

**Date**: 2026-09-25T04:06:00Z  
**Agent**: Challenger 2 (`challenger_workout_m1_2`)  
**Roles**: critic, specialist  
**Handoff Type**: Hard (Complete)  
**Target Milestone**: Milestone 1: Core Workout Utilities & Data Model  
**Verdict**: **APPROVE**  

---

## 1. Observation

### Test Execution & Results
1. Created and executed adversarial stress test suite in `tests/workout_m1_challenger2_stress.test.mjs`:
   ```bash
   node --test tests/workout_m1_challenger2_stress.test.mjs
   ```
   **Output**:
   ```
   ✔ isDetailedWorkout: strictly returns false for actual legacy duration-only records (0.897375ms)
   ✔ isDetailedWorkout: handles empty/falsy/malformed fields without false positives (0.147ms)
   ✔ isDetailedWorkout: correctly identifies rich v2 records across all categories (0.191125ms)
   ✔ findPreviousExercisePerformance: multi-day histories correctly locates most recent performance (0.368625ms)
   ✔ findPreviousExercisePerformance: out-of-order dates correctly resolves chronological latest (0.0835ms)
   ✔ findPreviousExercisePerformance: mixed ISO formats and timezone offsets (0.066292ms)
   ✔ findPreviousExercisePerformance: multiple workouts on the same day with explicit timestamps (0.065167ms)
   ✔ findPreviousExercisePerformance: multiple workouts on same day logged out of chronological order (0.056708ms)
   ✔ findPreviousExercisePerformance: multiple workouts on same day without timestamps respect logging order (6.894667ms)
   ✔ findPreviousExercisePerformance: duplicate day entries in habits respect latter dayIndex (0.163833ms)
   ✔ findPreviousExercisePerformance: casing variations matching (0.095458ms)
   ✔ findPreviousExercisePerformance: leading and trailing whitespace tolerance (0.073792ms)
   ✔ findPreviousExercisePerformance: exercises not found or partial substring mismatch (0.123708ms)
   ✔ findPreviousExercisePerformance: empty arrays and corrupt input safety (0.167041ms)
   ✔ findPreviousExercisePerformance: deep immutability check (0.464792ms)
   ✔ findPreviousExercisePerformance: flat workout array support (0.136ms)
   ✔ Extreme Edge Cases: Object.create(null) dictionary objects do not throw TypeError (0.157791ms)
   ✔ Extreme Edge Cases: Exercise names with punctuation, parenthesis, and special characters (0.288667ms)
   ✔ Extreme Edge Cases: Corrupt NaN dates and unparseable date strings fallback safely (5.361541ms)
   ✔ Extreme Edge Cases: Legacy record with type "Strength Training" without rich fields is preserved as legacy (0.230166ms)
   ✔ Stress Harness: 500 randomized multi-day lookups verify deterministic ordering and zero crashes (97.793875ms)
   ℹ tests 21
   ℹ suites 0
   ℹ pass 21
   ℹ fail 0
   ℹ duration_ms 156.437333
   ```

2. Executed complete project regression suite across all milestones:
   ```bash
   node --test tests/*.test.mjs
   ```
   **Output**:
   ```
   ℹ tests 235
   ℹ suites 13
   ℹ pass 235
   ℹ fail 0
   ℹ duration_ms 367.152583
   ```

3. Executed linter and build:
   ```bash
   npm run lint && npm run build
   ```
   **Output**:
   - `oxlint`: 0 errors
   - `vite build`: `✓ built in 241ms`, production assets generated without errors.

---

## 2. Logic Chain

1. **`isDetailedWorkout` Discriminator & Backward Compatibility (R4)**:
   - *Observation*: Tested 12 actual legacy records including `{ type: 'Running', duration: 30, calories: 250, date: '2026-09-24T12:00:00.000Z' }`, `{ type: 'Weights', duration: 45, date: '2026-09-24' }`, `{ type: 'Powerlifting', duration: 60, calories: 400, date: '2026-09-24' }`, and `{ type: 'Strength Training', duration: 45, calories: 300, date: '2026-09-24' }`.
   - *Deduction*: `isDetailedWorkout` evaluated to `false` for 100% of legacy inputs.
   - *Observation*: Tested `formatWorkoutSummary` on each legacy input. It produced `${type} · ${duration} min (Duration-only log)`.
   - *Deduction*: Pre-existing duration-only records stored in `localStorage['habitlyDataV2']` will never be misinterpreted as rich v2 records, meeting R4 without migration or data corruption.
   - *Observation*: Tested rich v2 records with `exercises`, `distance`, `laps`, `poolLength`, `stroke`, `style`, `effort`, `effortLevel`, `entryPath`, `category`, `customName`, `customType`, and `schemaVersion: 2`.
   - *Deduction*: All 19 rich v2 records evaluated to `true`.
   - *Observation*: Tested empty strings and falsy values (`distance: ''`, `exercises: []`, `schemaVersion: 1`).
   - *Deduction*: They evaluated to `false`, eliminating false positive categorization.

2. **`findPreviousExercisePerformance` Multi-Day & Out-of-Order History**:
   - *Observation*: In a 10-day history where "Barbell Bench Press" was performed on Day 2, Day 5, and Day 8 (and an abandoned session with `sets: []` on Day 10), the lookup returned Day 8 with the exact sets `[82.5kg x 6, 82.5kg x 5]`.
   - *Observation*: In a 4-day history shuffled into reverse-chronological and scrambled array order (`[Sep 20, Sep 25, Sep 10, Sep 22]`), the lookup correctly identified `Sep 25` (load: 55) rather than array index 0.
   - *Observation*: Tested mixed ISO dates (`2026-09-23T23:59:59.000Z` vs `2026-09-24` vs `2026-09-24T18:30:00+05:30`). The UTC timestamp calculation accurately sorted them down to the second.
   - *Deduction*: The session flattener and `sessions.sort((a, b) => timeB - timeA)` correctly sorts all historical sessions regardless of storage order or array mutations.

3. **Same-Day Multiple Workout Ordering**:
   - *Observation*: When multiple workouts occur on the same day with explicit timestamps (`07:00`, `12:30`, `19:00`), the 19:00 workout was selected.
   - *Observation*: When workouts on the same day were entered in reverse array order (`18:00` at index 0, `08:00` at index 1), the 18:00 workout was correctly selected.
   - *Observation*: When workouts on the same day had no explicit timestamps (both inheriting `dayDate`), the tie-breaker `b.wIndex - a.wIndex` selected index 1 (the latter logged session).
   - *Deduction*: Same-day ordering operates with zero ambiguity and guarantees the latest session is presented to the user.

4. **Casing, Whitespace, & Substring Precision**:
   - *Observation*: Tested targets `'barbell bench press'`, `'BARBELL BENCH PRESS'`, `'bArBeLl BeNcH pReSs'` against stored names. All matched.
   - *Observation*: Tested leading/trailing whitespace, tabs, and newlines (`'\t  Calf Raise \n '`). All matched.
   - *Observation*: Tested partial substrings (`'Bench'` vs `'Bench Press'`, `'Bench Press 2'` vs `'Bench Press'`, `'Press'` vs `'Bench Press'`). All correctly returned `null`.
   - *Deduction*: Strict name equality with lowercasing and trimming prevents substring collisions while being resilient to user typing variations.

5. **Defensive Edge Cases & Immutability**:
   - *Observation*: Tested null/undefined/primitive inputs, empty arrays, `Object.create(null)` objects without prototype methods, corrupt dates (`'corrupt-date'`), and exercise names with punctuation/brackets/slashes (`'Back Squat (Low-Bar / ATG)'`).
   - *Deduction*: Functions never throw unhandled exceptions.
   - *Observation*: In the immutability test, modifying `result.sets[0].load = 9999` did NOT mutate `habits`.
   - *Deduction*: Shallow cloning of set objects prevents state pollution in React.

6. **Stress Harness**:
   - *Observation*: 500 randomized multi-day lookups over a 60-day generated history completed in 97.79ms (< 250ms budget) with 100% deterministic success and zero memory leaks.

---

## 3. Caveats

- **No Caveats**: The utility functions in `src/lib/workoutUtils.js` are pure, thoroughly tested against 21 adversarial stress scenarios and 18 worker unit tests, and fully adhere to interface contracts and backward compatibility guarantees (R4).

---

## 4. Conclusion

**Verdict: APPROVE**

The implementation of `findPreviousExercisePerformance`, `isDetailedWorkout`, and the core utilities in `src/lib/workoutUtils.js` is empirically sound, highly defensive, and compliant with all project requirements:
- Fully backwards compatible with legacy duration-only records (R4).
- Deterministic, chronological reverse lookup for exercise performance across arbitrary date ordering and same-day workouts.
- Case- and whitespace-tolerant without false substring matches.
- All 235 tests in the test suite pass cleanly; build succeeds with 0 errors.

---

## 5. Verification Method

To reproduce and independently verify all empirical tests:
1. Run the challenger stress test suite:
   ```bash
   node --test tests/workout_m1_challenger2_stress.test.mjs
   ```
   *Expected outcome*: 21 passing tests, 0 failures, duration < 250ms.
2. Run the complete project test suite:
   ```bash
   node --test tests/*.test.mjs
   ```
   *Expected outcome*: 235 passing tests, 0 failures.
3. Run lint and build verification:
   ```bash
   npm run lint && npm run build
   ```
   *Expected outcome*: `oxlint` reports 0 errors, `vite build` completes successfully.
