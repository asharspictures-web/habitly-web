-- Habitly Phase 1 seed data — run AFTER schema.sql, in the Supabase SQL Editor.
-- Global catalog rows (is_global = true, created_by = null) can only be written
-- here (elevated SQL Editor connection) — RLS blocks normal authenticated users
-- from inserting is_global=true rows (see schema.sql policies).
-- Safe to re-run: ON CONFLICT DO NOTHING against each table's unique index.

-- =========================================================================
-- foods — merged union of src/lib/foodUtils.js's COMMON_FOODS (icon/category/
-- tags) and src/lib/gemini.js's COMMON_FOOD_DATABASE (keywords, for the AI
-- text matcher). 24 dishes shared between both files + 5 gemini-only generics.
-- =========================================================================
insert into public.foods (name, icon, category, tags, keywords, default_qty, cal, p, c, f, is_global) values
  ('Chicken Biryani', '🍗', 'Indian', array['Indian'], array['chicken biryani','biryani'], 1, 450, 28, 52, 14, true),
  ('Paneer Butter Masala', '🧀', 'Indian', array['Indian'], array['paneer butter masala','paneer butter'], 1, 340, 14, 12, 26, true),
  ('Dal Makhani', '🥣', 'Indian', array['Indian'], array['dal makhani','makhani'], 1, 260, 11, 28, 12, true),
  ('Masala Dosa', '🥞', 'Indian', array['Indian','Quick Snacks'], array['masala dosa','dosa'], 1, 280, 6, 42, 9, true),
  ('Chole Bhature', '🫓', 'Indian', array['Indian'], array['chole bhature','bhature','chole'], 1, 480, 14, 58, 22, true),
  ('Idli Sambar', '🍲', 'Indian', array['Indian','Healthy','Quick Snacks'], array['idli sambar','idlis','idli'], 1, 180, 8, 34, 2, true),
  ('Palak Paneer', '🥬', 'Indian', array['Indian','Healthy'], array['palak paneer'], 1, 260, 15, 8, 18, true),
  ('Roti with Ghee', '🫓', 'Indian', array['Indian','Quick Snacks'], array['roti with ghee','rotis with ghee','rotis','roti','chapati','chapatis'], 1, 140, 4, 22, 4, true),
  ('Tandoori Chicken', '🍗', 'Indian', array['Indian','Healthy'], array['tandoori chicken','tandoori'], 1, 260, 36, 3, 11, true),
  ('Rajma Chawal', '🍛', 'Indian', array['Indian','Healthy'], array['rajma chawal','rajma'], 1, 380, 14, 64, 6, true),
  ('Dal Tadka', '🥣', 'Indian', array['Indian','Healthy'], array['dal tadka','dal','daal','bowl of dal'], 1, 150, 9, 20, 4, true),
  ('Poha', '🍚', 'Indian', array['Indian','Healthy','Quick Snacks'], array['poha'], 1, 220, 4, 42, 5, true),
  ('Samosa', '🥟', 'Indian', array['Indian','Quick Snacks'], array['samosa','samosas'], 1, 260, 4, 32, 14, true),
  ('Avocado Toast', '🥑', 'International', array['International','Healthy','Quick Snacks'], array['avocado toast'], 1, 220, 5, 22, 13, true),
  ('Grilled Salmon & Quinoa', '🐟', 'International', array['International','Healthy'], array['grilled salmon & quinoa','salmon & quinoa','salmon and quinoa','grilled salmon','salmon'], 1, 420, 38, 32, 14, true),
  ('Chicken Caesar Salad', '🥗', 'International', array['International','Healthy'], array['chicken caesar salad','caesar salad'], 1, 330, 30, 10, 18, true),
  ('Oatmeal with Berries', '🥣', 'International', array['International','Healthy','Quick Snacks'], array['oatmeal with berries','oatmeal','oats with berries','oats'], 1, 210, 7, 40, 4, true),
  ('Greek Yogurt Parfait', '🍧', 'International', array['International','Healthy','Quick Snacks'], array['greek yogurt parfait','greek yogurt','yogurt parfait'], 1, 190, 18, 22, 3, true),
  ('Sushi Roll', '🍣', 'International', array['International','Healthy'], array['sushi roll','sushi'], 1, 290, 12, 42, 6, true),
  ('Pasta Primavera', '🍝', 'International', array['International'], array['pasta primavera','pasta'], 1, 380, 12, 62, 9, true),
  ('Protein Shake', '🥤', 'International', array['International','Healthy','Quick Snacks'], array['protein shake','whey protein','whey'], 1, 160, 28, 4, 2, true),
  ('Apple & Peanut Butter', '🍎', 'International', array['International','Healthy','Quick Snacks'], array['apple & peanut butter','apple and peanut butter'], 1, 200, 5, 24, 10, true),
  ('Hard Boiled Eggs', '🥚', 'International', array['International','Healthy','Quick Snacks'], array['hard boiled eggs','boiled eggs','eggs','egg'], 1, 140, 12, 1, 10, true),
  ('Chicken Breast & Rice', '🍗', 'International', array['International','Healthy'], array['chicken breast & rice','chicken & rice','chicken breast'], 1, 370, 35, 45, 4, true),
  ('Quinoa & Hummus Bowl', '🥙', 'International', array['International','Healthy','Quick Snacks'], array['quinoa & hummus bowl','hummus and pita','hummus'], 1, 280, 10, 44, 8, true),
  ('Rice', '🍚', 'International', array['Healthy'], array['rice','white rice','brown rice'], 1, 205, 4, 45, 0, true),
  ('Banana', '🍌', 'International', array['Healthy','Quick Snacks'], array['banana','bananas'], 1, 105, 1, 27, 0, true),
  ('Apple', '🍎', 'International', array['Healthy','Quick Snacks'], array['apple','apples'], 1, 95, 0, 25, 0, true),
  ('Salad', '🥗', 'International', array['Healthy'], array['salad'], 1, 50, 2, 10, 0, true)
on conflict (name, coalesce(created_by, '00000000-0000-0000-0000-000000000000'::uuid)) do nothing;

-- =========================================================================
-- exercise_library — from src/lib/workoutUtils.js's EXERCISE_LIBRARY.exercises
-- =========================================================================
insert into public.exercise_library (name, level, met, tags, is_global) values
  ('Bench Press', 'Intermediate', 4.0, array[]::text[], true),
  ('Incline Bench Press', 'Intermediate', 4.0, array[]::text[], true),
  ('Decline Bench Press', 'Intermediate', 4.0, array[]::text[], true),
  ('Dumbbell Flyes', 'Intermediate', 4.0, array[]::text[], true),
  ('Push Up', 'Beginner', 6.0, array['Low Impact'], true),
  ('Knee Push Up', 'Beginner', 6.0, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Cable Crossover', 'Intermediate', 3.5, array['Low Impact'], true),
  ('Chest Press Machine', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Pec Deck Machine', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Deadlift', 'Advanced', 6.0, array[]::text[], true),
  ('Pull Up', 'Advanced', 6.0, array[]::text[], true),
  ('Chin Up', 'Intermediate', 4.0, array[]::text[], true),
  ('Lat Pulldown', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Seated Cable Row', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Barbell Row', 'Intermediate', 4.0, array[]::text[], true),
  ('Dumbbell Row', 'Beginner', 3.5, array['Low Impact'], true),
  ('T-Bar Row', 'Intermediate', 4.0, array[]::text[], true),
  ('Back Extension', 'Beginner', 3.5, array['Low Impact'], true),
  ('Face Pull', 'Beginner', 3.5, array['Low Impact','Cardiac Safe'], true),
  ('Overhead Press', 'Intermediate', 4.0, array[]::text[], true),
  ('Dumbbell Shoulder Press', 'Intermediate', 4.0, array[]::text[], true),
  ('Lateral Raise', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Front Raise', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Reverse Pec Deck', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Upright Row', 'Intermediate', 4.0, array[]::text[], true),
  ('Shrugs', 'Beginner', 3.5, array['Low Impact'], true),
  ('Arnold Press', 'Intermediate', 4.0, array[]::text[], true),
  ('Bicep Curl', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Hammer Curl', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Preacher Curl', 'Beginner', 3.5, array['Low Impact'], true),
  ('Tricep Pushdown', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Overhead Tricep Extension', 'Beginner', 3.5, array['Low Impact'], true),
  ('Skull Crusher', 'Intermediate', 4.0, array[]::text[], true),
  ('Tricep Kickback', 'Beginner', 3.5, array['Low Impact'], true),
  ('Tricep Dips', 'Intermediate', 4.0, array[]::text[], true),
  ('Squat', 'Intermediate', 4.0, array[]::text[], true),
  ('Front Squat', 'Advanced', 4.0, array[]::text[], true),
  ('Goblet Squat', 'Beginner', 3.5, array['Low Impact'], true),
  ('Leg Press', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Leg Extension', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Lying Leg Curl', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Seated Leg Curl', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Romanian Deadlift (RDL)', 'Intermediate', 6.0, array[]::text[], true),
  ('Lunges', 'Beginner', 4.0, array[]::text[], true),
  ('Bulgarian Split Squat', 'Advanced', 4.0, array[]::text[], true),
  ('Calf Raise', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Hip Thrust', 'Intermediate', 3.5, array['Low Impact'], true),
  ('Glute Bridge', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Box Jump', 'Advanced', 4.0, array[]::text[], true),
  ('Wall Sit', 'Beginner', 3.5, array['Cardiac Safe','Low Impact','Seniors (65+)'], true),
  ('Crunch', 'Beginner', 3.5, array['Low Impact'], true),
  ('Plank', 'Beginner', 3.5, array['Low Impact'], true),
  ('Russian Twist', 'Intermediate', 4.0, array[]::text[], true),
  ('Leg Raise', 'Intermediate', 3.5, array['Low Impact'], true),
  ('Ab Wheel Rollout', 'Advanced', 4.0, array[]::text[], true),
  ('Cable Woodchopper', 'Intermediate', 4.0, array[]::text[], true),
  ('Bicycle Crunch', 'Beginner', 3.5, array['Low Impact'], true)
on conflict (name, coalesce(created_by, '00000000-0000-0000-0000-000000000000'::uuid)) do nothing;
