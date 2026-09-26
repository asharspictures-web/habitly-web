import { supabase } from './supabaseClient';
import { COMMON_FOODS } from './foodUtils';
import { EXERCISE_LIBRARY } from './workoutUtils';

let foodCatalogCache = null;
let exerciseCatalogCache = null;

function foodRowToCatalogItem(row) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon || '🍽️',
    category: row.category || 'Custom',
    tags: row.tags || [],
    keywords: row.keywords && row.keywords.length ? row.keywords : [row.name.toLowerCase()],
    defaultQty: row.default_qty || 1,
    cal: row.cal,
    p: row.p,
    c: row.c,
    f: row.f,
  };
}

function exerciseRowToCatalogItem(row) {
  return {
    id: row.id,
    name: row.name,
    level: row.level || 'Beginner',
    met: row.met || 4.0,
    tags: row.tags || [],
  };
}

// Fetches the shared food catalog once per session, falling back to the
// static COMMON_FOODS list (from foodUtils.js) while loading or on error, so
// FoodScreen/GoalsScreen/AI parsing never render an empty grid.
export async function loadFoodCatalog() {
  if (foodCatalogCache) return foodCatalogCache;

  const { data, error } = await supabase.from('foods').select('*').order('name');
  if (error || !data || data.length === 0) {
    if (error) console.error('Failed to load food catalog, using static fallback', error);
    return COMMON_FOODS;
  }

  foodCatalogCache = data.map(foodRowToCatalogItem);
  return foodCatalogCache;
}

// Fetches the shared exercise library once per session, falling back to the
// static EXERCISE_LIBRARY.exercises list while loading or on error.
export async function loadExerciseLibrary() {
  if (exerciseCatalogCache) return exerciseCatalogCache;

  const { data, error } = await supabase.from('exercise_library').select('*').order('name');
  if (error || !data || data.length === 0) {
    if (error) console.error('Failed to load exercise library, using static fallback', error);
    return EXERCISE_LIBRARY.exercises;
  }

  exerciseCatalogCache = data.map(exerciseRowToCatalogItem);
  return exerciseCatalogCache;
}
