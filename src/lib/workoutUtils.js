// src/lib/workoutUtils.js
// Utility functions and schema helpers for the workout logging rebuild.
// This file implements the data model (M1) and provides backward compatibility
// with the historic duration‑only logs that the app already stores in
// localStorage under the key "habitlyDataV2".

/**
 * Old format (pre‑rebuilt) entry shape.
 * Only a single workout object with type and duration was stored.
 * Example:
 *   { date: "2024‑09‑10", workoutType: "Weights", workoutDuration: 45 }
 */
export const OLD_WORKOUT_SCHEMA = {
  date: "string", // YYYY‑MM‑DD
  workoutType: "string",
  workoutDuration: "number", // minutes
  // optional legacy fields that may be present
  steps: "number",
  water: "number",
  sleep: "number",
  meals: "string",
};

/**
 * New format for a workout entry (per‑activity).
 * Each day can have an array of workout objects.
 */
export const NEW_WORKOUT_SCHEMA = {
  date: "string",
  workouts: "array", // array of Workout objects defined below
};

export const EXERCISE_LIBRARY = {
  categories: ['All', 'Beginner', 'Intermediate', 'Advanced', 'Cardiac Safe', 'Low Impact', 'Seniors (65+)'],
  exercises: [
    // Chest
    { name: 'Bench Press', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Incline Bench Press', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Decline Bench Press', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Dumbbell Flyes', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Push Up', level: 'Beginner', met: 6.0, tags: ['Low Impact'] },
    { name: 'Knee Push Up', level: 'Beginner', met: 6.0, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Cable Crossover', level: 'Intermediate', met: 3.5, tags: ['Low Impact'] },
    { name: 'Chest Press Machine', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Pec Deck Machine', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },

    // Back
    { name: 'Deadlift', level: 'Advanced', met: 6.0, tags: [] },
    { name: 'Pull Up', level: 'Advanced', met: 6.0, tags: [] },
    { name: 'Chin Up', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Lat Pulldown', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Seated Cable Row', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Barbell Row', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Dumbbell Row', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
    { name: 'T-Bar Row', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Back Extension', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
    { name: 'Face Pull', level: 'Beginner', met: 3.5, tags: ['Low Impact', 'Cardiac Safe'] },

    // Shoulders
    { name: 'Overhead Press', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Dumbbell Shoulder Press', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Lateral Raise', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Front Raise', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Reverse Pec Deck', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Upright Row', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Shrugs', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
    { name: 'Arnold Press', level: 'Intermediate', met: 4.0, tags: [] },

    // Arms (Biceps/Triceps)
    { name: 'Bicep Curl', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Hammer Curl', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Preacher Curl', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
    { name: 'Tricep Pushdown', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Overhead Tricep Extension', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
    { name: 'Skull Crusher', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Tricep Kickback', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
    { name: 'Tricep Dips', level: 'Intermediate', met: 4.0, tags: [] },

    // Legs (Quads/Hamstrings/Calves/Glutes)
    { name: 'Squat', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Front Squat', level: 'Advanced', met: 4.0, tags: [] },
    { name: 'Goblet Squat', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
    { name: 'Leg Press', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Leg Extension', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Lying Leg Curl', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Seated Leg Curl', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Romanian Deadlift (RDL)', level: 'Intermediate', met: 6.0, tags: [] },
    { name: 'Lunges', level: 'Beginner', met: 4.0, tags: [] },
    { name: 'Bulgarian Split Squat', level: 'Advanced', met: 4.0, tags: [] },
    { name: 'Calf Raise', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Hip Thrust', level: 'Intermediate', met: 3.5, tags: ['Low Impact'] },
    { name: 'Glute Bridge', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },
    { name: 'Box Jump', level: 'Advanced', met: 4.0, tags: [] },
    { name: 'Wall Sit', level: 'Beginner', met: 3.5, tags: ['Cardiac Safe', 'Low Impact', 'Seniors (65+)'] },

    // Core
    { name: 'Crunch', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
    { name: 'Plank', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
    { name: 'Russian Twist', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Leg Raise', level: 'Intermediate', met: 3.5, tags: ['Low Impact'] },
    { name: 'Ab Wheel Rollout', level: 'Advanced', met: 4.0, tags: [] },
    { name: 'Cable Woodchopper', level: 'Intermediate', met: 4.0, tags: [] },
    { name: 'Bicycle Crunch', level: 'Beginner', met: 3.5, tags: ['Low Impact'] },
  ]
};

/**
 * New per‑activity workout object schema.
 */
export const WORKOUT_ACTIVITY_SCHEMA = {
  // Common fields
  activity: "string", // e.g. "Strength Training", "Running", etc.
  // Strength Training fields
  exerciseName: "string?",
  setType: "string?", // "working" | "warm‑up"
  reps: "number?",
  loadKg: "number?",
  loadLb: "number?",
  rpe: "number?",
  // Cardio fields (running, cycling, swimming)
  distanceKm: "number?",
  timeMinutes: "number?",
  // Additional optional fields for future use
  notes: "string?",
};

/**
 * Detect if a stored entry follows the old schema.
 * @param {Object} entry
 * @returns {boolean}
 */
export function isOldFormat(entry) {
  return (
    entry &&
    typeof entry.workoutType === "string" &&
    typeof entry.workoutDuration === "number"
  );
}

/**
 * Convert an old‑format entry to the new schema while preserving the
 * original duration‑only data under a generic "Other" activity.
 * This ensures backward compatibility – old logs are still displayed.
 *
 * @param {Object} oldEntry
 * @returns {Object} new entry matching NEW_WORKOUT_SCHEMA
 */
export function convertOldToNew(oldEntry) {
  const { date, workoutType, workoutDuration, steps, water, sleep, meals } = oldEntry;
  const newEntry = {
    date: date || new Date().toISOString().split("T")[0],
    workouts: [],
    // preserve other habit data (steps, water, sleep) for UI components that read it directly
    steps: steps ?? 0,
    water: water ?? 0,
    sleep: sleep ?? 0,
    meals: meals ?? "",
  };

  // Map the old activity into a generic "Other" entry that contains the
  // original duration.
  const genericWorkout = {
    activity: "Other",
    notes: `${workoutType} – ${workoutDuration} min`,
    timeMinutes: workoutDuration,
  };
  newEntry.workouts.push(genericWorkout);
  return newEntry;
}

/**
 * Calculate a pace string (minutes:seconds per km) given distance (km) and
 * time (minutes). Returns null if inputs are invalid.
 * @param {number} distanceKm
 * @param {number} timeMinutes
 * @returns {string|null}
 */
export function calculatePace(distanceKm, timeMinutes) {
  if (!distanceKm || distanceKm <= 0 || !timeMinutes || timeMinutes <= 0) {
    return null;
  }
  const totalSeconds = timeMinutes * 60;
  const paceSecPerKm = totalSeconds / distanceKm;
  const mins = Math.floor(paceSecPerKm / 60);
  const secs = Math.round(paceSecPerKm % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}/km`;
}

/**
 * Validate a new workout object against the schema. Returns an array of error
 * messages – empty means the object is valid.
 * @param {Object} workout
 * @returns {string[]}
 */
export function validateWorkout(workout) {
  const errors = [];
  if (!workout.activity) {
    errors.push("activity is required");
  }
  // Activity‑specific validation
  switch (workout.activity) {
    case "Strength Training":
      if (!workout.exerciseName) errors.push("exerciseName is required for Strength Training");
      if (workout.reps == null) errors.push("reps is required for Strength Training");
      break;
    case "Running":
    case "Walking":
    case "Cycling":
    case "Swimming":
      if (workout.distanceKm == null) errors.push("distanceKm is required for cardio activities");
      if (workout.timeMinutes == null) errors.push("timeMinutes is required for cardio activities");
      break;
    default:
      // no extra fields required for "Other" or yoga
      break;
  }
  return errors;
}

/**
 * Helper to merge a new workout into today's habit entry.
 * @param {Object} todayEntry – the object returned by useHabits.getTodayHabit()
 * @param {Object} newWorkout – a validated workout object
 * @returns {Object} updated entry
 */
export function mergeWorkoutIntoToday(todayEntry, newWorkout) {
  const updated = { ...todayEntry };
  updated.workouts = [...(todayEntry.workouts || []), newWorkout];
  return updated;
}

/**
 * Calculate estimated calories burnt for a workout based on MET values or volume.
 * Assuming a standard weight of 70kg (154 lbs) for globally accepted formulas.
 * @param {Object} workout
 * @returns {number}
 */
export function calculateCaloriesBurnt(workout) {
  const WEIGHT_KG = 70;
  let calories = 0;

  if (workout.activity === 'Strength Training') {
    // A standard set of weightlifting (e.g., 10 reps) burns about 10-15 calories including rest.
    // We estimate based on reps and load. If bodyweight, we assume 70kg.
    const reps = workout.reps || 10;
    const load = workout.loadKg || (workout.loadLb ? workout.loadLb * 0.453592 : 0);
    // Simple heuristic: 1.5 calories per rep (moderate intensity).
    // Adjust slightly for higher load: base 1 kcal + 0.01 kcal per kg moved per rep.
    calories = reps * (1.2 + (load * 0.01));
  } else if (['Running', 'Walking', 'Cycling', 'Swimming', 'Yoga'].includes(workout.activity)) {
    const timeHours = (workout.timeMinutes || 0) / 60;
    let met = 4; // default generic
    if (workout.activity === 'Running') met = 9.8;
    if (workout.activity === 'Walking') met = 3.8;
    if (workout.activity === 'Cycling') met = 7.5;
    if (workout.activity === 'Swimming') met = 7.0;
    if (workout.activity === 'Yoga') met = 3.0;
    
    calories = met * WEIGHT_KG * timeHours;
  } else if (workout.activity === 'Other') {
    const timeHours = (workout.timeMinutes || 0) / 60;
    calories = 4 * WEIGHT_KG * timeHours; // Moderate MET 4.0
  }

  return Math.round(calories) || 0;
}

/**
 * Export a shallow copy of the schemas for external inspection (e.g., tests).
 */
export const SCHEMAS = {
  OLD_WORKOUT_SCHEMA,
  NEW_WORKOUT_SCHEMA,
  WORKOUT_ACTIVITY_SCHEMA,
};
