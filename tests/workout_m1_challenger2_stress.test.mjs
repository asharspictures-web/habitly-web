import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findPreviousExercisePerformance,
  isDetailedWorkout,
  formatWorkoutSummary
} from '../src/lib/workoutUtils.js';

// =========================================================================
// SECTION 1: Adversarial Testing of isDetailedWorkout & R4 Backward Compat
// =========================================================================

test('isDetailedWorkout: strictly returns false for actual legacy duration-only records', () => {
  const legacyCases = [
    // Standard prompt legacy record
    { type: 'Running', duration: 30, calories: 250, date: '2026-09-24T12:00:00.000Z' },
    // Weights duration-only
    { type: 'Weights', duration: 45, date: '2026-09-24' },
    // Swimming duration-only with calories
    { type: 'Swimming', duration: 40, calories: 300, date: '2026-09-24T08:30:00Z' },
    // Yoga duration-only
    { type: 'Yoga', duration: 60, date: '2026-09-24' },
    // Cycling duration-only
    { type: 'Cycling', duration: 50, calories: 450, date: '2026-09-24' },
    // Walking duration-only
    { type: 'Walking', duration: 25, date: '2026-09-24' },
    // Other duration-only
    { type: 'Other', duration: 20, date: '2026-09-24' },
    // Custom name in type field (legacy format from pre-upgrade ExerciseScreen)
    { type: 'Powerlifting', duration: 60, calories: 400, date: '2026-09-24' },
    { type: 'Jump Rope', duration: 15, calories: 120, date: '2026-09-24' },
    { type: 'Pilates', duration: 35, date: '2026-09-24' },
    // Legacy record with miscellaneous legacy metadata (id, notes, timestamp)
    { type: 'Running', duration: 30, id: 'rec_99', notes: 'Felt tired today', timestamp: 1727184000000 },
    // Legacy record with duration: 0
    { type: 'Walking', duration: 0, date: '2026-09-24' }
  ];

  for (const rec of legacyCases) {
    assert.strictEqual(
      isDetailedWorkout(rec),
      false,
      `Expected legacy record ${JSON.stringify(rec)} to evaluate to false in isDetailedWorkout`
    );

    // Verify R4: formatWorkoutSummary MUST tag legacy records as duration-only logs
    const summary = formatWorkoutSummary(rec);
    assert.ok(
      summary.includes('(Duration-only log)'),
      `Summary "${summary}" must include "(Duration-only log)" for legacy record`
    );
    assert.ok(
      summary.startsWith(rec.type),
      `Summary "${summary}" must start with verbatim type "${rec.type}"`
    );
  }
});

test('isDetailedWorkout: handles empty/falsy/malformed fields without false positives', () => {
  // Edge cases where rich properties exist but are null, undefined, or empty string
  const emptyRichFields = [
    { type: 'Strength Training', duration: 45, exercises: [] },
    { type: 'Running', duration: 30, distance: '' },
    { type: 'Running', duration: 30, distance: null },
    { type: 'Running', duration: 30, distance: undefined },
    { type: 'Swimming', duration: 40, laps: '', poolLength: '', stroke: '' },
    { type: 'Swimming', duration: 40, laps: null, poolLength: null, stroke: null },
    { type: 'Yoga', duration: 45, style: '', effort: '', effortLevel: '' },
    { type: 'Other', duration: 30, customName: '', customType: '', category: '', entryPath: '' },
    { type: 'Weights', duration: 30, schemaVersion: 0 },
    { type: 'Weights', duration: 30, schemaVersion: 1 },
    { type: 'Weights', duration: 30, schemaVersion: '1' }
  ];

  for (const rec of emptyRichFields) {
    assert.strictEqual(
      isDetailedWorkout(rec),
      false,
      `Record with empty/nil fields ${JSON.stringify(rec)} should NOT be detailed`
    );
  }

  // Non-object or empty inputs
  assert.strictEqual(isDetailedWorkout(null), false);
  assert.strictEqual(isDetailedWorkout(undefined), false);
  assert.strictEqual(isDetailedWorkout({}), false);
  assert.strictEqual(isDetailedWorkout([]), false);
  assert.strictEqual(isDetailedWorkout('Running'), false);
  assert.strictEqual(isDetailedWorkout(12345), false);
  assert.strictEqual(isDetailedWorkout(true), false);
  assert.strictEqual(isDetailedWorkout(NaN), false);
});

test('isDetailedWorkout: correctly identifies rich v2 records across all categories', () => {
  const v2Cases = [
    // 1. Strength Training with exercises
    {
      type: 'Strength Training',
      duration: 45,
      exercises: [{ name: 'Barbell Squat', sets: [{ reps: 5, load: 100, loadType: 'weight' }] }]
    },
    // 2. Strength with bodyweight only
    {
      type: 'Strength Training',
      duration: 30,
      exercises: [{ name: 'Pull-ups', sets: [{ reps: 10, load: 0, loadType: 'bodyweight' }] }]
    },
    // 3. Running with distance
    { type: 'Running', duration: 28, distance: 5.2 },
    // 4. Running with distance = 0 (boundary check: 0 is numeric distance)
    { type: 'Running', duration: 5, distance: 0 },
    // 5. Walking with distance string
    { type: 'Walking', duration: 30, distance: '3.5' },
    // 6. Swimming with laps
    { type: 'Swimming', duration: 45, laps: 40 },
    // 7. Swimming with pool length
    { type: 'Swimming', duration: 30, poolLength: 50 },
    // 8. Swimming with stroke
    { type: 'Swimming', duration: 40, stroke: 'Butterfly' },
    // 9. Yoga with style
    { type: 'Yoga', duration: 60, style: 'Ashtanga' },
    // 10. Yoga with effort
    { type: 'Yoga', duration: 45, effort: 'High' },
    // 11. Yoga with numeric effortLevel
    { type: 'Yoga', duration: 30, effortLevel: 8 },
    // 12. Explicit entryPath
    { type: 'Cycling', duration: 45, entryPath: 'live' },
    { type: 'Other', duration: 25, entryPath: 'completed' },
    // 13. Explicit category
    { type: 'Weights', duration: 45, category: 'strength' },
    { type: 'Cardio', duration: 30, category: 'running' },
    // 14. Custom activity fields
    { type: 'Other', duration: 60, customName: 'Bouldering' },
    { type: 'Other', duration: 45, customType: 'Martial Arts' },
    // 15. Explicit schemaVersion
    { type: 'Weights', duration: 45, schemaVersion: 2 },
    { type: 'Weights', duration: 45, schemaVersion: '2' },
    { type: 'Running', duration: 30, schemaVersion: 3 }
  ];

  for (const rec of v2Cases) {
    assert.strictEqual(
      isDetailedWorkout(rec),
      true,
      `Expected v2 record ${JSON.stringify(rec)} to evaluate to true in isDetailedWorkout`
    );
  }
});

// =========================================================================
// SECTION 2: Adversarial Testing of findPreviousExercisePerformance
// =========================================================================

test('findPreviousExercisePerformance: multi-day histories correctly locates most recent performance', () => {
  // Construct a 10-day history with target exercise occurring on days 2, 5, and 8
  const tenDayHistory = [
    {
      date: '2026-09-10',
      workouts: [
        {
          type: 'Running',
          duration: 30,
          distance: 5
        }
      ]
    },
    {
      date: '2026-09-11', // Day 2: Bench Press @ 60kg
      workouts: [
        {
          type: 'Strength Training',
          exercises: [
            {
              name: 'Barbell Bench Press',
              sets: [{ type: 'working', load: 60, reps: 10, loadType: 'weight', rpe: 7 }]
            }
          ]
        }
      ]
    },
    {
      date: '2026-09-12',
      workouts: [{ type: 'Yoga', duration: 45, style: 'Vinyasa' }]
    },
    {
      date: '2026-09-13',
      workouts: [{ type: 'Cycling', duration: 45, distance: 20 }]
    },
    {
      date: '2026-09-14', // Day 5: Bench Press @ 70kg
      workouts: [
        {
          type: 'Strength Training',
          exercises: [
            {
              name: 'Barbell Bench Press',
              sets: [
                { type: 'working', load: 70, reps: 8, loadType: 'weight', rpe: 8 },
                { type: 'working', load: 70, reps: 8, loadType: 'weight', rpe: 8.5 }
              ]
            }
          ]
        }
      ]
    },
    {
      date: '2026-09-15',
      workouts: [{ type: 'Swimming', duration: 30, laps: 30 }]
    },
    {
      date: '2026-09-16',
      workouts: [{ type: 'Strength Training', exercises: [{ name: 'Barbell Squat', sets: [{ reps: 5, load: 120 }] }] }]
    },
    {
      date: '2026-09-17', // Day 8: Bench Press @ 82.5kg (Most recent valid)
      workouts: [
        {
          type: 'Strength Training',
          exercises: [
            {
              name: 'Barbell Bench Press',
              sets: [
                { type: 'working', load: 82.5, reps: 6, loadType: 'weight', rpe: 9 },
                { type: 'working', load: 82.5, reps: 5, loadType: 'weight', rpe: 9.5 }
              ]
            }
          ]
        }
      ]
    },
    {
      date: '2026-09-18',
      workouts: [{ type: 'Running', duration: 25, distance: 4.5 }]
    },
    {
      date: '2026-09-19', // Day 10: Has Bench Press but with empty sets (e.g. abandoned exercise)
      workouts: [
        {
          type: 'Strength Training',
          exercises: [
            {
              name: 'Barbell Bench Press',
              sets: []
            }
          ]
        }
      ]
    }
  ];

  // Must skip Day 10 (empty sets) and return Day 8 (82.5kg x 6, 5)
  const result = findPreviousExercisePerformance(tenDayHistory, 'Barbell Bench Press');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.date, '2026-09-17');
  assert.strictEqual(result.sets.length, 2);
  assert.strictEqual(result.sets[0].load, 82.5);
  assert.strictEqual(result.sets[0].reps, 6);
  assert.strictEqual(result.sets[1].load, 82.5);
  assert.strictEqual(result.sets[1].reps, 5);

  // Exercise present on day 7 only
  const squatResult = findPreviousExercisePerformance(tenDayHistory, 'Barbell Squat');
  assert.notStrictEqual(squatResult, null);
  assert.strictEqual(squatResult.date, '2026-09-16');
  assert.strictEqual(squatResult.sets[0].load, 120);

  // Exercise present nowhere
  assert.strictEqual(findPreviousExercisePerformance(tenDayHistory, 'Romanian Deadlift'), null);
});

test('findPreviousExercisePerformance: out-of-order dates correctly resolves chronological latest', () => {
  // Shuffled dates array: array index order is completely decoupled from date order
  const shuffledHabits = [
    {
      date: '2026-09-20', // Middle date
      workouts: [
        {
          type: 'Strength Training',
          exercises: [{ name: 'Overhead Press', sets: [{ reps: 8, load: 45 }] }]
        }
      ]
    },
    {
      date: '2026-09-25', // LATEST date
      workouts: [
        {
          type: 'Strength Training',
          exercises: [{ name: 'Overhead Press', sets: [{ reps: 5, load: 55 }] }]
        }
      ]
    },
    {
      date: '2026-09-10', // EARLIEST date
      workouts: [
        {
          type: 'Strength Training',
          exercises: [{ name: 'Overhead Press', sets: [{ reps: 10, load: 40 }] }]
        }
      ]
    },
    {
      date: '2026-09-22', // Second latest
      workouts: [
        {
          type: 'Strength Training',
          exercises: [{ name: 'Overhead Press', sets: [{ reps: 6, load: 50 }] }]
        }
      ]
    }
  ];

  // Must select 2026-09-25 (load: 55), NOT index 0 (2026-09-20)
  const result = findPreviousExercisePerformance(shuffledHabits, 'Overhead Press');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.date, '2026-09-25');
  assert.strictEqual(result.sets[0].load, 55);
  assert.strictEqual(result.sets[0].reps, 5);
});

test('findPreviousExercisePerformance: mixed ISO formats and timezone offsets', () => {
  const mixedDateHabits = [
    {
      date: '2026-09-23T23:59:59.000Z', // 1 second before midnight on Sep 24
      workouts: [
        {
          exercises: [{ name: 'Deadlift', sets: [{ reps: 3, load: 150 }] }]
        }
      ]
    },
    {
      date: '2026-09-24', // Midnight UTC Sep 24 -> 1 second LATER than above
      workouts: [
        {
          exercises: [{ name: 'Deadlift', sets: [{ reps: 3, load: 160 }] }]
        }
      ]
    },
    {
      date: '2026-09-24T18:30:00+05:30', // Sep 24 13:00 UTC -> 13 hours LATER than midnight UTC
      workouts: [
        {
          exercises: [{ name: 'Deadlift', sets: [{ reps: 1, load: 180 }] }]
        }
      ]
    }
  ];

  // 18:30+05:30 (13:00 UTC) is the latest
  const result = findPreviousExercisePerformance(mixedDateHabits, 'Deadlift');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.date, '2026-09-24T18:30:00+05:30');
  assert.strictEqual(result.sets[0].load, 180);
});

test('findPreviousExercisePerformance: multiple workouts on the same day with explicit timestamps', () => {
  const sameDayHabits = [
    {
      date: '2026-09-24',
      workouts: [
        {
          // Morning workout at 07:00
          date: '2026-09-24T07:00:00.000Z',
          type: 'Strength Training',
          exercises: [{ name: 'Pull-ups', sets: [{ reps: 8, loadType: 'bodyweight' }] }]
        },
        {
          // Midday workout at 12:30
          date: '2026-09-24T12:30:00.000Z',
          type: 'Strength Training',
          exercises: [{ name: 'Pull-ups', sets: [{ reps: 10, loadType: 'bodyweight' }] }]
        },
        {
          // Evening workout at 19:00 (LATEST)
          date: '2026-09-24T19:00:00.000Z',
          type: 'Strength Training',
          exercises: [{ name: 'Pull-ups', sets: [{ reps: 12, loadType: 'bodyweight' }] }]
        }
      ]
    }
  ];

  const result = findPreviousExercisePerformance(sameDayHabits, 'Pull-ups');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.date, '2026-09-24T19:00:00.000Z');
  assert.strictEqual(result.sets[0].reps, 12);
});

test('findPreviousExercisePerformance: multiple workouts on same day logged out of chronological order', () => {
  const sameDayShuffled = [
    {
      date: '2026-09-24',
      workouts: [
        {
          // Evening workout at 18:00 was logged FIRST in array
          date: '2026-09-24T18:00:00.000Z',
          type: 'Strength Training',
          exercises: [{ name: 'Dips', sets: [{ reps: 15, loadType: 'bodyweight' }] }]
        },
        {
          // Morning workout at 08:00 was logged SECOND in array
          date: '2026-09-24T08:00:00.000Z',
          type: 'Strength Training',
          exercises: [{ name: 'Dips', sets: [{ reps: 10, loadType: 'bodyweight' }] }]
        }
      ]
    }
  ];

  // Must select the 18:00 workout based on timestamp, even though it was index 0
  const result = findPreviousExercisePerformance(sameDayShuffled, 'Dips');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.date, '2026-09-24T18:00:00.000Z');
  assert.strictEqual(result.sets[0].reps, 15);
});

test('findPreviousExercisePerformance: multiple workouts on same day without timestamps respect logging order', () => {
  const sameDayUntimed = [
    {
      date: '2026-09-24',
      workouts: [
        {
          type: 'Strength Training',
          // wIndex 0 (first workout logged)
          exercises: [{ name: 'Bicep Curl', sets: [{ reps: 10, load: 12 }] }]
        },
        {
          type: 'Strength Training',
          // wIndex 1 (second workout logged -> more recent)
          exercises: [{ name: 'Bicep Curl', sets: [{ reps: 8, load: 14 }] }]
        }
      ]
    }
  ];

  // Must select wIndex 1 (the latter logged session)
  const result = findPreviousExercisePerformance(sameDayUntimed, 'Bicep Curl');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.date, '2026-09-24');
  assert.strictEqual(result.sets[0].load, 14);
  assert.strictEqual(result.sets[0].reps, 8);
});

test('findPreviousExercisePerformance: duplicate day entries in habits respect latter dayIndex', () => {
  const duplicateDays = [
    {
      date: '2026-09-24', // dayIndex 0
      workouts: [
        {
          type: 'Strength Training',
          exercises: [{ name: 'Tricep Pushdown', sets: [{ reps: 12, load: 20 }] }]
        }
      ]
    },
    {
      date: '2026-09-24', // dayIndex 1 (latter day entry)
      workouts: [
        {
          type: 'Strength Training',
          exercises: [{ name: 'Tricep Pushdown', sets: [{ reps: 10, load: 25 }] }]
        }
      ]
    }
  ];

  const result = findPreviousExercisePerformance(duplicateDays, 'Tricep Pushdown');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.sets[0].load, 25);
});

test('findPreviousExercisePerformance: casing variations matching', () => {
  const habits = [
    {
      date: '2026-09-24',
      workouts: [
        {
          type: 'Strength Training',
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: 8, load: 80 }] },
            { name: 'lat pulldown', sets: [{ reps: 10, load: 50 }] },
            { name: 'INCLINE DUMBBELL PRESS', sets: [{ reps: 6, load: 30 }] }
          ]
        }
      ]
    }
  ];

  // All lower
  const res1 = findPreviousExercisePerformance(habits, 'barbell bench press');
  assert.notStrictEqual(res1, null);
  assert.strictEqual(res1.sets[0].load, 80);

  // All upper
  const res2 = findPreviousExercisePerformance(habits, 'BARBELL BENCH PRESS');
  assert.notStrictEqual(res2, null);
  assert.strictEqual(res2.sets[0].load, 80);

  // Mixed case
  const res3 = findPreviousExercisePerformance(habits, 'bArBeLl BeNcH pReSs');
  assert.notStrictEqual(res3, null);
  assert.strictEqual(res3.sets[0].load, 80);

  // Target all upper, stored all lower
  const res4 = findPreviousExercisePerformance(habits, 'LAT PULLDOWN');
  assert.notStrictEqual(res4, null);
  assert.strictEqual(res4.sets[0].load, 50);

  // Target title case, stored all upper
  const res5 = findPreviousExercisePerformance(habits, 'Incline Dumbbell Press');
  assert.notStrictEqual(res5, null);
  assert.strictEqual(res5.sets[0].load, 30);
});

test('findPreviousExercisePerformance: leading and trailing whitespace tolerance', () => {
  const habits = [
    {
      date: '2026-09-24',
      workouts: [
        {
          type: 'Strength Training',
          exercises: [
            { name: '   Leg Press   ', sets: [{ reps: 10, load: 150 }] },
            { name: '\tCalf Raise\n', sets: [{ reps: 15, load: 60 }] }
          ]
        }
      ]
    }
  ];

  // Spaces around target and stored
  const res1 = findPreviousExercisePerformance(habits, '   Leg Press   ');
  assert.notStrictEqual(res1, null);
  assert.strictEqual(res1.sets[0].load, 150);

  // Clean target against spaced stored
  const res2 = findPreviousExercisePerformance(habits, 'Leg Press');
  assert.notStrictEqual(res2, null);
  assert.strictEqual(res2.sets[0].load, 150);

  // Tab and newline target against tab/newline stored
  const res3 = findPreviousExercisePerformance(habits, 'Calf Raise');
  assert.notStrictEqual(res3, null);
  assert.strictEqual(res3.sets[0].load, 60);

  // Target with tab and newline
  const res4 = findPreviousExercisePerformance(habits, '\t  Calf Raise \n ');
  assert.notStrictEqual(res4, null);
  assert.strictEqual(res4.sets[0].load, 60);
});

test('findPreviousExercisePerformance: exercises not found or partial substring mismatch', () => {
  const habits = [
    {
      date: '2026-09-24',
      workouts: [
        {
          type: 'Strength Training',
          exercises: [
            { name: 'Bench Press', sets: [{ reps: 8, load: 80 }] }
          ]
        }
      ]
    }
  ];

  // Partial substring "Bench" must NOT match "Bench Press"
  assert.strictEqual(findPreviousExercisePerformance(habits, 'Bench'), null);

  // Superset name "Bench Press 2" must NOT match "Bench Press"
  assert.strictEqual(findPreviousExercisePerformance(habits, 'Bench Press 2'), null);

  // Substring "Press" must NOT match
  assert.strictEqual(findPreviousExercisePerformance(habits, 'Press'), null);

  // Unrelated name
  assert.strictEqual(findPreviousExercisePerformance(habits, 'Squat'), null);

  // Empty string or whitespace only
  assert.strictEqual(findPreviousExercisePerformance(habits, ''), null);
  assert.strictEqual(findPreviousExercisePerformance(habits, '   '), null);
  assert.strictEqual(findPreviousExercisePerformance(habits, '\t\n'), null);
});

test('findPreviousExercisePerformance: empty arrays and corrupt input safety', () => {
  const validExercise = 'Bench Press';

  // Empty habits array
  assert.strictEqual(findPreviousExercisePerformance([], validExercise), null);

  // Null/undefined/primitive habits
  assert.strictEqual(findPreviousExercisePerformance(null, validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance(undefined, validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance('not an array', validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance(12345, validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance({}, validExercise), null);

  // Habits with empty or corrupt days
  assert.strictEqual(findPreviousExercisePerformance([{}], validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance([null, undefined], validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance([{ date: '2026-09-24' }], validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance([{ date: '2026-09-24', workouts: [] }], validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance([{ date: '2026-09-24', workouts: [null, undefined, 'string'] }], validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance([{ date: '2026-09-24', workouts: [{ type: 'Strength Training' }] }], validExercise), null);
  assert.strictEqual(findPreviousExercisePerformance([{ date: '2026-09-24', workouts: [{ exercises: [] }] }], validExercise), null);

  // Workouts with corrupt exercise objects
  const corruptHabits = [
    {
      date: '2026-09-24',
      workouts: [
        {
          exercises: [
            null,
            undefined,
            42,
            'string',
            {},
            { name: null },
            { name: 123 },
            { name: 'Bench Press', sets: null },
            { name: 'Bench Press', sets: 'not an array' },
            { name: 'Bench Press', sets: [] }
          ]
        }
      ]
    }
  ];
  assert.strictEqual(findPreviousExercisePerformance(corruptHabits, validExercise), null);

  // Invalid exerciseName argument types
  const validHabits = [
    {
      date: '2026-09-24',
      workouts: [
        {
          type: 'Strength Training',
          exercises: [{ name: 'Bench Press', sets: [{ reps: 5, load: 100 }] }]
        }
      ]
    }
  ];
  assert.strictEqual(findPreviousExercisePerformance(validHabits, null), null);
  assert.strictEqual(findPreviousExercisePerformance(validHabits, undefined), null);
  assert.strictEqual(findPreviousExercisePerformance(validHabits, 123), null);
  assert.strictEqual(findPreviousExercisePerformance(validHabits, {}), null);
  assert.strictEqual(findPreviousExercisePerformance(validHabits, []), null);
  assert.strictEqual(findPreviousExercisePerformance(validHabits, true), null);
});

test('findPreviousExercisePerformance: deep immutability check', () => {
  const habits = [
    {
      date: '2026-09-24',
      workouts: [
        {
          type: 'Strength Training',
          exercises: [
            {
              name: 'Barbell Bench Press',
              sets: [
                { type: 'working', load: 80, reps: 8, loadType: 'weight', rpe: 8 }
              ]
            }
          ]
        }
      ]
    }
  ];

  const result = findPreviousExercisePerformance(habits, 'Barbell Bench Press');
  assert.notStrictEqual(result, null);

  // Mutate the returned object and sets array
  result.date = 'CORRUPTED_DATE';
  result.sets[0].load = 9999;
  result.sets[0].reps = 0;
  result.sets.push({ type: 'working', load: 0, reps: 0 });

  // Original habit data structure MUST remain completely untouched
  assert.strictEqual(habits[0].date, '2026-09-24');
  assert.strictEqual(habits[0].workouts[0].exercises[0].sets.length, 1);
  assert.strictEqual(habits[0].workouts[0].exercises[0].sets[0].load, 80);
  assert.strictEqual(habits[0].workouts[0].exercises[0].sets[0].reps, 8);
});

test('findPreviousExercisePerformance: flat workout array support', () => {
  // If caller passes a flat array of workouts rather than nested habit days
  const flatWorkouts = [
    {
      date: '2026-09-20',
      exercises: [{ name: 'Squat', sets: [{ reps: 5, load: 100 }] }]
    },
    {
      date: '2026-09-24',
      exercises: [{ name: 'Squat', sets: [{ reps: 5, load: 110 }] }]
    }
  ];

  const result = findPreviousExercisePerformance(flatWorkouts, 'Squat');
  assert.notStrictEqual(result, null);
  assert.strictEqual(result.date, '2026-09-24');
  assert.strictEqual(result.sets[0].load, 110);
});

// =========================================================================
// SECTION 4: Extreme Hostile Edge Cases & Prototype Safety
// =========================================================================

test('Extreme Edge Cases: Object.create(null) dictionary objects do not throw TypeError', () => {
  // Objects with null prototype have no Object.prototype methods (like hasOwnProperty)
  const nullProtoLegacy = Object.create(null);
  nullProtoLegacy.type = 'Running';
  nullProtoLegacy.duration = 30;
  nullProtoLegacy.date = '2026-09-24';

  assert.strictEqual(isDetailedWorkout(nullProtoLegacy), false);
  assert.strictEqual(formatWorkoutSummary(nullProtoLegacy), 'Running · 30 min (Duration-only log)');

  const nullProtoV2 = Object.create(null);
  nullProtoV2.type = 'Strength Training';
  nullProtoV2.duration = 45;
  nullProtoV2.category = 'strength';
  nullProtoV2.exercises = [
    { name: 'Dumbbell Curl', sets: [{ reps: 10, load: 14, loadType: 'weight' }] }
  ];

  assert.strictEqual(isDetailedWorkout(nullProtoV2), true);

  const nullProtoHabits = [
    {
      date: '2026-09-24',
      workouts: [nullProtoV2]
    }
  ];
  const perf = findPreviousExercisePerformance(nullProtoHabits, 'Dumbbell Curl');
  assert.notStrictEqual(perf, null);
  assert.strictEqual(perf.sets[0].load, 14);
});

test('Extreme Edge Cases: Exercise names with punctuation, parenthesis, and special characters', () => {
  const habits = [
    {
      date: '2026-09-24',
      workouts: [
        {
          type: 'Strength Training',
          exercises: [
            { name: 'Bench Press (Barbell - Pause Reps)', sets: [{ reps: 5, load: 90 }] },
            { name: 'Cable Lateral Raise [1.5x]', sets: [{ reps: 15, load: 10 }] },
            { name: 'Back Squat (Low-Bar / ATG)', sets: [{ reps: 6, load: 140 }] }
          ]
        }
      ]
    }
  ];

  // Match with parentheses and dashes
  const res1 = findPreviousExercisePerformance(habits, 'bench press (barbell - pause reps)');
  assert.notStrictEqual(res1, null);
  assert.strictEqual(res1.sets[0].load, 90);

  // Match with brackets
  const res2 = findPreviousExercisePerformance(habits, 'cable lateral raise [1.5x]');
  assert.notStrictEqual(res2, null);
  assert.strictEqual(res2.sets[0].load, 10);

  // Match with slashes
  const res3 = findPreviousExercisePerformance(habits, 'BACK SQUAT (LOW-BAR / ATG)');
  assert.notStrictEqual(res3, null);
  assert.strictEqual(res3.sets[0].load, 140);
});

test('Extreme Edge Cases: Corrupt NaN dates and unparseable date strings fallback safely', () => {
  const habits = [
    {
      date: 'corrupt-date-1',
      workouts: [
        {
          type: 'Strength Training',
          exercises: [{ name: 'Squat', sets: [{ reps: 5, load: 100 }] }]
        }
      ]
    },
    {
      date: 'corrupt-date-2',
      workouts: [
        {
          type: 'Strength Training',
          exercises: [{ name: 'Squat', sets: [{ reps: 5, load: 120 }] }]
        }
      ]
    }
  ];

  // Must not throw error even with unparseable dates
  assert.doesNotThrow(() => {
    const res = findPreviousExercisePerformance(habits, 'Squat');
    assert.notStrictEqual(res, null);
  });
});

test('Extreme Edge Cases: Legacy record with type "Strength Training" without rich fields is preserved as legacy', () => {
  const legacyStrength = {
    type: 'Strength Training',
    duration: 45,
    calories: 300,
    date: '2026-09-24'
  };

  assert.strictEqual(isDetailedWorkout(legacyStrength), false);
  assert.strictEqual(
    formatWorkoutSummary(legacyStrength),
    'Strength Training · 45 min (Duration-only log)'
  );
});

// =========================================================================
// SECTION 3: High-Stress Random Generator & Invariant Harness
// =========================================================================

test('Stress Harness: 500 randomized multi-day lookups verify deterministic ordering and zero crashes', () => {
  const exercisesPool = [
    'Barbell Bench Press',
    'Incline Dumbbell Press',
    'Barbell Squat',
    'Romanian Deadlift',
    'Barbell Deadlift',
    'Overhead Press',
    'Pull-ups'
  ];

  const generatedHabits = [];
  const baseDate = new Date('2026-01-01T12:00:00Z').getTime();

  // Generate 60 days of workouts
  for (let i = 0; i < 60; i++) {
    const dayDate = new Date(baseDate + i * 86400000).toISOString().split('T')[0];
    const workoutCount = (i % 3) + 1; // 1 to 3 workouts per day
    const dayWorkouts = [];

    for (let w = 0; w < workoutCount; w++) {
      const exerciseForWorkout = exercisesPool[(i + w) % exercisesPool.length];
      const isCardio = (i + w) % 4 === 0;

      if (isCardio) {
        dayWorkouts.push({
          type: 'Running',
          duration: 30,
          distance: 5 + (w % 3),
          date: `${dayDate}T${10 + w}:00:00.000Z`
        });
      } else {
        dayWorkouts.push({
          type: 'Strength Training',
          date: `${dayDate}T${10 + w * 4}:00:00.000Z`,
          exercises: [
            {
              name: exerciseForWorkout,
              sets: [
                { type: 'working', load: 50 + i + w, reps: 8, loadType: 'weight' },
                { type: 'working', load: 50 + i + w, reps: 6, loadType: 'weight' }
              ]
            }
          ]
        });
      }
    }

    generatedHabits.push({
      date: dayDate,
      workouts: dayWorkouts
    });
  }

  // Shuffle habits to test out-of-order tolerance
  const shuffled = [...generatedHabits].sort(() => Math.random() - 0.5);

  const start = performance.now();
  for (let iter = 0; iter < 500; iter++) {
    const target = exercisesPool[iter % exercisesPool.length];
    const res = findPreviousExercisePerformance(shuffled, target);
    assert.notStrictEqual(res, null, `Target ${target} should be found in 60-day history`);
    assert.ok(res.date >= '2026-01-01', 'Date should be within range');
    assert.ok(Array.isArray(res.sets) && res.sets.length > 0, 'Sets should be populated');

    // Also test isDetailedWorkout on workouts
    const sampleWorkout = shuffled[iter % shuffled.length].workouts[0];
    assert.strictEqual(isDetailedWorkout(sampleWorkout), true);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 250, `500 iterations took ${duration.toFixed(2)}ms, expected < 250ms`);
});
