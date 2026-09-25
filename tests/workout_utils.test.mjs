// tests/workout_utils.test.mjs
import assert from "node:assert";
import { isOldFormat, convertOldToNew, calculatePace, validateWorkout } from "../src/lib/workoutUtils.js";
import { describe, it } from "node:test";

// Simple test suite for M1 utilities.

describe("Workout Utils - M1 backward compatibility", () => {
  it("detects old format correctly", () => {
    const oldEntry = { date: "2024-01-01", workoutType: "Weights", workoutDuration: 45 };
    assert.strictEqual(isOldFormat(oldEntry), true);
    const newEntry = { date: "2024-01-01", workouts: [] };
    assert.strictEqual(isOldFormat(newEntry), false);
  });

  it("converts old entry to new schema preserving data", () => {
    const oldEntry = {
      date: "2024-01-01",
      workoutType: "Running",
      workoutDuration: 30,
      steps: 4000,
      water: 2,
      sleep: 7,
    };
    const converted = convertOldToNew(oldEntry);
    assert.strictEqual(converted.date, "2024-01-01");
    assert.strictEqual(converted.workouts.length, 1);
    const w = converted.workouts[0];
    assert.strictEqual(w.activity, "Other");
    assert.strictEqual(w.timeMinutes, 30);
    assert.strictEqual(w.notes, "Running – 30 min");
    // legacy habit fields should still be present
    assert.strictEqual(converted.steps, 4000);
    assert.strictEqual(converted.water, 2);
    assert.strictEqual(converted.sleep, 7);
  });
});

describe("Workout Utils - calculatePace", () => {
  it("calculates pace correctly", () => {
    const pace = calculatePace(5, 25); // 5 km, 25 min
    assert.strictEqual(pace, "5:00/km");
  });
  it("returns null for invalid inputs", () => {
    assert.strictEqual(calculatePace(0, 10), null);
    assert.strictEqual(calculatePace(5, 0), null);
  });
});

describe("Workout Utils - validateWorkout", () => {
  it("validates strength training fields", () => {
    const wt = { activity: "Strength Training", exerciseName: "Squat", reps: 8 };
    const errors = validateWorkout(wt);
    assert.deepStrictEqual(errors, []);
  });
  it("reports missing required fields", () => {
    const wt = { activity: "Strength Training" };
    const errors = validateWorkout(wt);
    assert.ok(errors.includes("exerciseName is required for Strength Training"));
    assert.ok(errors.includes("reps is required for Strength Training"));
  });
});
