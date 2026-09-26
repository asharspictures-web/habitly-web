import { supabase } from './supabaseClient';
import { isOldFormat, convertOldToNew } from './workoutUtils';

const MIGRATION_FLAG_PREFIX = 'habitlyMigrationDone_';

const numOrNull = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const isValidDate = (v) => {
  if (!v) return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
};

const chunkArray = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

async function insertInChunks(table, rows, upsertOptions) {
  if (!rows || rows.length === 0) return;
  for (const chunk of chunkArray(rows, 200)) {
    const query = upsertOptions ? supabase.from(table).upsert(chunk, upsertOptions) : supabase.from(table).insert(chunk);
    const { error } = await query;
    if (error) throw error;
  }
}

async function uploadBase64Photo(userId, dataUrl) {
  const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error('Not a base64 image');
  const mime = match[1];
  const ext = mime.split('/')[1] || 'jpg';
  const base64 = match[2];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const path = `${userId}/migrated-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('food-photos').upload(path, bytes, { contentType: mime });
  if (error) throw error;
  return path;
}

async function markMigrated(userId) {
  const { error } = await supabase
    .from('migration_state')
    .upsert({ user_id: userId, migrated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) console.error('Failed to mark migration complete', error);
}

// One-time migration of the pre-Supabase localStorage data (habitlyDataV2 /
// habitlyGoals) into the user's Supabase account, run once right after a
// session first becomes available. Never deletes the local data — it's kept
// as a safety net even after a successful migration.
export async function migrateLocalDataToSupabase(userId) {
  if (!userId || typeof window === 'undefined') return;

  const fastPathKey = `${MIGRATION_FLAG_PREFIX}${userId}`;
  if (localStorage.getItem(fastPathKey) === 'true') return;

  const { data: stateRow, error: stateError } = await supabase
    .from('migration_state')
    .select('migrated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (stateError) {
    console.error('Failed to check migration state', stateError);
    return;
  }
  if (stateRow?.migrated_at) {
    localStorage.setItem(fastPathKey, 'true');
    return;
  }

  const rawHabits = localStorage.getItem('habitlyDataV2');
  let localHabits = [];
  try {
    localHabits = rawHabits ? JSON.parse(rawHabits) : [];
  } catch {
    localHabits = [];
  }

  if (!Array.isArray(localHabits) || localHabits.length === 0) {
    await markMigrated(userId);
    localStorage.setItem(fastPathKey, 'true');
    return;
  }

  try {
    const rawGoals = localStorage.getItem('habitlyGoals');
    if (rawGoals) {
      let localGoals = null;
      try {
        localGoals = JSON.parse(rawGoals);
      } catch {
        localGoals = null;
      }
      if (localGoals) {
        const { error } = await supabase.from('goals').upsert(
          {
            user_id: userId,
            water_glasses: numOrNull(localGoals.water) ?? 8,
            sleep_hours: numOrNull(localGoals.sleep) ?? 8,
            steps: numOrNull(localGoals.steps) ?? 10000,
            workout_minutes: numOrNull(localGoals.workout) ?? 30,
            current_weight_kg: numOrNull(localGoals.currentWeight),
            target_weight_kg: numOrNull(localGoals.targetWeight),
            age: numOrNull(localGoals.age),
            height_cm: numOrNull(localGoals.height),
            gender: localGoals.gender || null,
            activity_level: localGoals.activityLevel || null,
            health_conditions: localGoals.healthConditions || null,
            dietary_preferences: localGoals.dietaryPreferences || null,
            wake_time: localGoals.wakeTime || null,
            sleep_time: localGoals.sleepTime || null,
            active_routine: localGoals.activeRoutine || [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
        if (error) throw error;
      }
    }

    const dailyMetricsRows = [];
    const waterRows = [];
    const workoutRows = [];
    const foodRows = [];

    for (const rawEntry of localHabits) {
      const entry = isOldFormat(rawEntry) ? convertOldToNew(rawEntry) : rawEntry;
      const dateStr = entry.date || new Date().toISOString().split('T')[0];
      const anchorIso = `${dateStr}T12:00:00.000Z`;

      dailyMetricsRows.push({
        user_id: userId,
        log_date: dateStr,
        steps: Math.max(0, Number(entry.steps) || 0),
        sleep_hours: Math.max(0, Number(entry.sleep) || 0),
      });

      const waterVal = Number(entry.water) || 0;
      if (waterVal > 0) {
        waterRows.push({ user_id: userId, glasses: waterVal, logged_at: anchorIso });
      }

      (entry.workouts || []).forEach((w) => {
        workoutRows.push({
          user_id: userId,
          activity: w.activity || w.type || 'Other',
          exercise_name: w.exerciseName || null,
          session_id: w.sessionId != null ? Number(w.sessionId) : null,
          duration_minutes: numOrNull(w.duration ?? w.timeMinutes),
          distance_km: numOrNull(w.distanceKm),
          calories: numOrNull(w.calories),
          details: { ...w },
          logged_at: isValidDate(w.date) ? w.date : anchorIso,
        });
      });

      (entry.foods || []).forEach((f) => {
        foodRows.push({
          user_id: userId,
          name: f.name || f.text || 'Meal',
          cal: numOrNull(f.cal) ?? 0,
          p: numOrNull(f.p) ?? 0,
          c: numOrNull(f.c) ?? 0,
          f: numOrNull(f.f) ?? 0,
          quantity: numOrNull(f.quantity) ?? 1,
          category: f.category || null,
          logged_at: isValidDate(f.timestamp) ? f.timestamp : anchorIso,
          _photo: f.photo || null,
        });
      });
    }

    await insertInChunks('daily_metrics', dailyMetricsRows, { onConflict: 'user_id,log_date' });
    await insertInChunks('water_logs', waterRows);
    await insertInChunks('workouts', workoutRows);

    for (const chunk of chunkArray(foodRows, 50)) {
      const prepared = await Promise.all(
        chunk.map(async ({ _photo, ...row }) => {
          if (_photo && typeof _photo === 'string' && _photo.startsWith('data:')) {
            try {
              const path = await uploadBase64Photo(userId, _photo);
              return { ...row, photo_url: path };
            } catch (err) {
              console.warn('Skipping photo for a migrated food entry (upload failed)', err);
              return row;
            }
          }
          return row;
        })
      );
      const { error } = await supabase.from('food_logs').insert(prepared);
      if (error) throw error;
    }

    await markMigrated(userId);
    localStorage.setItem(fastPathKey, 'true');
  } catch (err) {
    console.error('Local data migration failed, will retry next login', err);
  }
}
