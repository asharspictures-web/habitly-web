# Project: Habitly Workout Logging Rebuild & UI Fixes

## Architecture
- **Framework**: Vite 8.3 + React 19.2 + Tailwind CSS v4 + Lucide React + Recharts
- **Storage Layer**: `localStorage` (`'habitlyDataV2'`) loaded via `useHabits.js`. Stores array of daily habit logs with `workouts: [...]`.
- **Backward Compatibility Contract**: Pre-existing workout records `{ type, duration, calories?, date }` are preserved verbatim without migration or mutation. Dual-schema presentation layer detects legacy vs rich v2 records.
- **Mandatory Invariant**: Every workout record MUST include numeric `duration` (in minutes) so downstream aggregators in `DashboardScreen.jsx` and `TopBar.jsx` compute correctly without `NaN`.
- **Anti-Fabrication Contract**: Never invent calories or volume totals from incomplete data. Clearly label elapsed time so it is never confused with active lift time.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Workout Utilities & Helpers | Pure math, pace calculation, reverse session lookup, summary formatter | M1 | R1, R2, R3, R4 |
| 2 | Activity-Specific Forms | Forms for Strength, Running, Walking, Cycling, Swimming, Yoga, Other | M2 | R1 |
| 3 | Bodyweight & Assisted Strength Sets | Support bodyweight and assisted sets without fake weights | M2 | R1 |
| 4 | Previous Session Lookup | Historical stats lookup by exercise name from workout history | M2 | R1 |
| 5 | Two Entry Paths & Live Timer | "Start Workout" with running stopwatch vs "Log Completed Workout" | M2 | R2 |
| 6 | Clear Elapsed Time Labelling | Clearly distinguish elapsed session time from active lift time | M2 | R2 |
| 7 | Rich Activity Cards | Recent Activity cards with category-specific summaries | M3 | R3 |
| 8 | Workout Detail View Modal | Full view modal displaying all logged data on card click | M3 | R3 |
| 9 | Backward Compatibility Layer | Preserve and render duration-only logs without silent migration | M3 | R4 |
| 10 | Floating Button Positioning Fix | Fix containing block trap and padding in DashboardScreen | M4 | R5 |
| 11 | Automated Acceptance Test Suite | Seeded localStorage test, strength schema test, pace test, build test | M4 | Acceptance Criteria |
| 12 | Final E2E & Agent-as-Judge Pass | Verification against all automated checks and Agent-as-Judge UI rubric | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Workout Utilities & Data Model | `src/lib/workoutUtils.js`, `tests/workout_utils.test.mjs` | None | PLANNED |
| M2 | Activity-Specific Logging Forms & Live Timer | `src/components/exercise/*` (forms, selector, live timer) | M1 | PLANNED |
| M3 | Exercise Screen Integration, Cards & Detail Modal | `WorkoutCard.jsx`, `WorkoutDetailModal.jsx`, `ExerciseScreen.jsx` | M2 | PLANNED |
| M4 | Floating Button Fix & Automated Test Suite | `DashboardScreen.jsx`, `tests/workout_acceptance.test.mjs` | M1, M2, M3 | PLANNED |
| M5 | Final E2E Pass, Rubric Verification & Victory Audit | Full test suite, lint, build, Agent-as-Judge UI rubric, forensic audit | M4 | PLANNED |

## Interface Contracts
### `src/lib/workoutUtils.js`
- `calculatePace(minutes, distance, unit)` -> `{ paceSeconds, paceString, paceUnit }` (e.g. `"5:25/km"`)
- `formatWorkoutSummary(workout)` -> `string` (e.g. `"Upper body · 5 exercises · 14 working sets"`)
- `isDetailedWorkout(workout)` -> `boolean`
- `findPreviousExercisePerformance(habits, exerciseName)` -> `{ date, sets: [{ reps, load, loadType, rpe }] } | null`
- `calculateStrengthVolume(workout)` -> `{ totalWorkingSets, totalWeightedTonnage, exerciseCount }`

### Workout Submission Contract (ExerciseScreen -> `addWorkout`)
```json
{
  "type": "Strength Training",
  "category": "strength",
  "duration": 45,
  "date": "2026-09-24T22:30:00.000Z",
  "entryPath": "live",
  "startTime": "2026-09-24T21:45:00.000Z",
  "endTime": "2026-09-24T22:30:00.000Z",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": [
        { "type": "warmup", "reps": 10, "load": 40, "loadType": "weight", "rpe": 6 },
        { "type": "working", "reps": 8, "load": 80, "loadType": "weight", "rpe": 8 }
      ]
    },
    {
      "name": "Pull-ups",
      "sets": [
        { "type": "working", "reps": 10, "load": 0, "loadType": "bodyweight", "rpe": 8 },
        { "type": "working", "reps": 8, "load": 15, "loadType": "assisted", "rpe": 7 }
      ]
    }
  ]
}
```

## Code Layout
- `src/lib/workoutUtils.js`: Pure workout domain logic, math, formatting, historical lookup
- `src/components/exercise/WorkoutTypeSelector.jsx`: Activity type switcher
- `src/components/exercise/StrengthWorkoutForm.jsx`: Multi-exercise strength logger
- `src/components/exercise/CardioWorkoutForm.jsx`: Running, Walking, Cycling logger
- `src/components/exercise/SwimmingWorkoutForm.jsx`: Swimming logger
- `src/components/exercise/YogaWorkoutForm.jsx`: Yoga & Mobility logger
- `src/components/exercise/OtherWorkoutForm.jsx`: Flexible free-form logger
- `src/components/exercise/WorkoutTimerBanner.jsx`: Live stopwatch timer banner
- `src/components/exercise/WorkoutCard.jsx`: Interactive card with activity-specific summary
- `src/components/exercise/WorkoutDetailModal.jsx`: Full workout detail view modal
- `src/components/ExerciseScreen.jsx`: Main screen coordinating forms, timer, cards, and search
- `src/components/DashboardScreen.jsx`: Un-clipped floating button and extended bottom clearance
- `tests/workout_utils.test.mjs`: Unit tests for workout utilities
- `tests/workout_acceptance.test.mjs`: Automated acceptance test suite (4 checks)
