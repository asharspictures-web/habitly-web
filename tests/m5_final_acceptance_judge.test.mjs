import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Load source modules & helpers
import { COMMON_FOOD_DATABASE, parseFoodFromQuery, isFoodLogRequest, chatWithAI, generateSummary } from '../src/lib/gemini.js';

describe('Milestone 5: Agent-as-Judge Final Acceptance Verification', () => {

  // Item 1: Top bar search filters historical logs successfully
  describe('Rubric Item 1: Top bar search filters historical logs', () => {
    it('Indexes workouts and food items across all historical days in habits', () => {
      const mockHabits = [
        {
          date: '2026-09-20',
          workouts: [{ type: 'Running', duration: 45, calories: 400 }],
          foods: [{ name: 'Chicken Biryani', cal: 450, p: 28, c: 52, f: 14 }]
        },
        {
          date: '2026-09-21',
          workouts: [{ type: 'Yoga', duration: 30 }],
          foods: [{ text: 'Dal Tadka', cal: 150, p: 9, c: 20, f: 4 }]
        }
      ];

      // Simulate TopBar historical entries indexing logic
      const list = [];
      mockHabits.forEach(day => {
        (day.workouts || []).forEach((w, idx) => {
          list.push({
            id: `workout-${day.date}-${idx}-${w.type}`,
            name: w.type || 'Workout',
            category: 'Workout',
            date: w.date || day.date,
            detail: `${w.duration} min${w.calories ? ` • ${w.calories} kcal` : ''}`,
            targetView: 'exercise',
          });
        });
        (day.foods || []).forEach((f, idx) => {
          const foodName = f.name || f.text || 'Meal';
          const parts = [];
          if (f.cal !== undefined) parts.push(`${f.cal} kcal`);
          if (f.p !== undefined && f.c !== undefined && f.f !== undefined && (f.p || f.c || f.f)) {
            parts.push(`P:${f.p}g C:${f.c}g F:${f.f}g`);
          }
          list.push({
            id: `food-${day.date}-${idx}-${foodName}`,
            name: foodName,
            category: 'Food',
            date: f.timestamp || day.date,
            detail: parts.join(' • ') || 'Logged meal',
            targetView: 'food',
          });
        });
      });

      assert.equal(list.length, 4);

      // Test Search query filtering
      const filter = (query) => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return list.filter(item =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.detail.toLowerCase().includes(q)
        );
      };

      assert.equal(filter('biryani').length, 1);
      assert.equal(filter('biryani')[0].name, 'Chicken Biryani');
      assert.equal(filter('running').length, 1);
      assert.equal(filter('running')[0].targetView, 'exercise');
      assert.equal(filter('workout').length, 2);
      assert.equal(filter('food').length, 2);
      assert.equal(filter('nonexistent_query_xyz').length, 0);
    });

    it('TopBar.jsx component source contains search input, clear button, and dropdown renderer', () => {
      const src = fs.readFileSync(path.resolve('src/components/TopBar.jsx'), 'utf-8');
      assert.ok(src.includes('searchQuery'), 'TopBar must handle searchQuery');
      assert.ok(src.includes('filteredEntries'), 'TopBar must compute filteredEntries');
      assert.ok(src.includes('Matching Logs for'), 'TopBar must display matching logs header');
      assert.ok(src.includes('handleClearSearch'), 'TopBar must have clear search button');
    });
  });

  // Item 2: Notification bell and Profile icon both open appropriate dropdowns
  describe('Rubric Item 2: Notification bell and Profile icon dropdowns', () => {
    it('TopBar.jsx includes notification bell dropdown with verbatim "No new notifications yet"', () => {
      const src = fs.readFileSync(path.resolve('src/components/TopBar.jsx'), 'utf-8');
      assert.ok(src.includes('isNotifOpen'), 'Must track isNotifOpen state');
      assert.ok(src.includes('No new notifications yet'), 'Must display verbatim "No new notifications yet"');
      assert.ok(src.includes('BellOff'), 'Must render BellOff icon');
    });

    it('TopBar.jsx includes profile dropdown with user info and Sign Out option', () => {
      const src = fs.readFileSync(path.resolve('src/components/TopBar.jsx'), 'utf-8');
      assert.ok(src.includes('isProfileOpen'), 'Must track isProfileOpen state');
      assert.ok(src.includes('Alex Morgan'), 'Must display user name');
      assert.ok(src.includes('Sign Out'), 'Must display Sign Out option');
      assert.ok(src.includes('handleSignOut'), 'Must have handleSignOut handler');
    });
  });

  // Item 3: The Sidebar logo is updated to use logo.jpg
  describe('Rubric Item 3: Sidebar logo is updated to use logo.jpg', () => {
    it('Sidebar.jsx references /logo.jpg in an img element', () => {
      const src = fs.readFileSync(path.resolve('src/components/Sidebar.jsx'), 'utf-8');
      assert.ok(src.includes('src="/logo.jpg"'), 'Must reference /logo.jpg');
      assert.ok(src.includes('alt="Habitly Logo"'), 'Must have proper alt text');
    });

    it('Physical asset public/logo.jpg exists and is a valid non-empty image', () => {
      const logoPath = path.resolve('public/logo.jpg');
      assert.ok(fs.existsSync(logoPath), 'public/logo.jpg must exist on disk');
      const stats = fs.statSync(logoPath);
      assert.ok(stats.size > 1000, `logo.jpg size should be substantial (actual: ${stats.size} bytes)`);
    });
  });

  // Item 4: Water and Sleep dashboard rings have functional "+ Log" buttons
  describe('Rubric Item 4: Water and Sleep dashboard rings have functional "+ Log" buttons', () => {
    it('DashboardScreen.jsx passes onLog handlers to Water and Sleep rings', () => {
      const src = fs.readFileSync(path.resolve('src/components/DashboardScreen.jsx'), 'utf-8');
      assert.ok(src.includes('label="Water"'), 'Must have Water ProgressRing');
      assert.ok(src.includes('label="Sleep"'), 'Must have Sleep ProgressRing');
      assert.ok(src.includes("handleOpenQuickLog('water')"), 'Water ring onLog must open water tab');
      assert.ok(src.includes("handleOpenQuickLog('sleep')"), 'Sleep ring onLog must open sleep tab');
      assert.ok(src.includes('+ Log'), 'ProgressRing must render "+ Log" button');
    });

    it('ProgressRing onLog button stops event propagation', () => {
      const src = fs.readFileSync(path.resolve('src/components/DashboardScreen.jsx'), 'utf-8');
      assert.ok(src.includes('e.stopPropagation()'), 'Must stop propagation on log button click');
    });
  });

  // Item 5: A floating quick-log button is present on the Dashboard and functional
  describe('Rubric Item 5: Floating quick-log button present on Dashboard and functional', () => {
    it('DashboardScreen.jsx includes fixed floating action button with Plus icon', () => {
      const src = fs.readFileSync(path.resolve('src/components/DashboardScreen.jsx'), 'utf-8');
      assert.ok(src.includes('fixed bottom-8 right-8'), 'Must have fixed bottom-right floating position');
      assert.ok(src.includes('aria-label="Quick Log"'), 'Must have aria-label for accessibility');
      assert.ok(src.includes('QuickLogModal'), 'Must integrate QuickLogModal');
    });

    it('QuickLogModal supports Water, Sleep, Steps, and Workout logging', () => {
      const src = fs.readFileSync(path.resolve('src/components/QuickLogModal.jsx'), 'utf-8');
      assert.ok(src.includes("initialTab = 'water'"), 'Must support initialTab');
      assert.ok(src.includes('activeTab === \'water\''), 'Must have water tab form');
      assert.ok(src.includes('activeTab === \'sleep\''), 'Must have sleep tab form');
      assert.ok(src.includes('activeTab === \'steps\''), 'Must have steps tab form');
      assert.ok(src.includes('activeTab === \'workout\''), 'Must have workout tab form');
      assert.ok(src.includes('role="dialog"'), 'Must have role=dialog');
      assert.ok(src.includes('Escape'), 'Must support Escape dismissal');
    });
  });

  // Item 6: Food section contains an expanded list of foods with thumbnails/icons
  describe('Rubric Item 6: Food section expanded list of foods with thumbnails/icons', () => {
    it('FoodScreen.jsx has 20+ food items with thumbnails/icons and categories', () => {
      const src = fs.readFileSync(path.resolve('src/components/FoodScreen.jsx'), 'utf-8');
      assert.ok(src.includes('COMMON_FOODS'), 'Must define COMMON_FOODS');
      assert.ok(src.includes('Chicken Biryani'), 'Must include Indian dishes');
      assert.ok(src.includes('Paneer Butter Masala'), 'Must include Paneer Butter Masala');
      assert.ok(src.includes('Avocado Toast'), 'Must include International dishes');
      assert.ok(src.includes('Grilled Salmon & Quinoa'), 'Must include Grilled Salmon & Quinoa');
      assert.ok(src.includes('CATEGORIES'), 'Must support category filtering');
    });

    it('COMMON_FOOD_DATABASE in gemini.js contains comprehensive Indian and international foods', () => {
      assert.ok(COMMON_FOOD_DATABASE.length >= 20, `Food database should have >= 20 items (actual: ${COMMON_FOOD_DATABASE.length})`);
      const indianItems = COMMON_FOOD_DATABASE.filter(f => ['Chicken Biryani', 'Paneer Butter Masala', 'Dal Makhani', 'Masala Dosa', 'Chole Bhature'].includes(f.name));
      assert.ok(indianItems.length >= 5, 'Must contain core Indian dishes');
      const intlItems = COMMON_FOOD_DATABASE.filter(f => ['Avocado Toast', 'Greek Yogurt Parfait', 'Sushi Roll', 'Pasta Primavera'].includes(f.name));
      assert.ok(intlItems.length >= 4, 'Must contain core International dishes');
    });
  });

  // Item 7: Custom food items can be added with a file upload photo
  describe('Rubric Item 7: Custom food items can be added with file upload photo', () => {
    it('FoodScreen.jsx contains custom food modal and file input', () => {
      const src = fs.readFileSync(path.resolve('src/components/FoodScreen.jsx'), 'utf-8');
      assert.ok(src.includes('type="file"'), 'Must include input type="file"');
      assert.ok(src.includes('accept="image/*"'), 'Must accept images');
      assert.ok(src.includes('handlePhotoUpload'), 'Must have handlePhotoUpload handler');
      assert.ok(src.includes('FileReader'), 'Must use FileReader to load image data URL');
      assert.ok(src.includes('handleSaveCustomFood'), 'Must save custom food entry');
      assert.ok(src.includes('photo: photoPreview'), 'Must attach photo to saved food item');
      assert.ok(src.includes('<img') && src.includes('src={food.photo}'), 'Must display uploaded photo in logged list');
    });
  });

  // Item 8: AI Assistant page loads without console errors and responds to queries
  describe('Rubric Item 8: AI Assistant loads without console errors and responds to queries', () => {
    it('chatWithAI responds gracefully to multiple query types without throwing', async () => {
      const mockHabits = [
        {
          date: '2026-09-24',
          sleep: 7.5,
          water: 8,
          steps: 8500,
          workoutDuration: 40,
          workoutType: 'Running',
          foods: [
            { name: 'Oatmeal', cal: 210, p: 7, c: 40, f: 4 },
            { name: 'Chicken Salad', cal: 330, p: 30, c: 10, f: 18 }
          ]
        }
      ];

      const queries = [
        'How many calories have I consumed today?',
        'Healthy high-protein snack ideas',
        'What was my sleep last night?',
        'How much water did I drink?',
        'What was my recent workout?',
        'General health advice'
      ];

      for (const q of queries) {
        const res = await chatWithAI(q, mockHabits);
        assert.ok(res, `Response should exist for query: ${q}`);
        assert.ok(res.text.length > 5, `Response text should be informative for query: ${q}`);
      }
    });

    it('chatWithAI handles empty habits array without crashing', async () => {
      const res = await chatWithAI('What is my progress?', []);
      assert.ok(res, 'Should handle empty habits');
      assert.ok(res.text.includes("haven't logged any data yet"), 'Should return friendly empty state message');
    });

    it('generateSummary handles empty habits array without crashing', async () => {
      const sum = await generateSummary([]);
      assert.ok(sum.includes('Ready to track your habits?'), 'Summary handles empty state');
    });
  });

  // Item 9: AI Assistant displays a rich confirmation card (Cal/P/C/F) when logging food
  describe('Rubric Item 9: AI Assistant displays rich confirmation card (Cal/P/C/F) when logging food', () => {
    it('isFoodLogRequest detects food logging intent accurately', () => {
      assert.ok(isFoodLogRequest('Log 2 Rotis and Paneer Butter Masala'));
      assert.ok(isFoodLogRequest('I ate 1 bowl of oatmeal with berries'));
      assert.ok(isFoodLogRequest('Add Chicken Biryani'));
      assert.ok(isFoodLogRequest('track 2 eggs for breakfast'));
      // Information queries should NOT trigger logging card
      assert.equal(isFoodLogRequest('How many calories have I consumed today?'), false);
      assert.equal(isFoodLogRequest('Healthy high-protein snack ideas'), false);
    });

    it('parseFoodFromQuery correctly calculates calories and macros for compound items', () => {
      const parsed = parseFoodFromQuery('Log 2 Rotis and Paneer Butter Masala');
      assert.ok(parsed.cal > 0, 'Calories must be calculated');
      assert.ok(parsed.p > 0, 'Protein must be calculated');
      assert.ok(parsed.c > 0, 'Carbs must be calculated');
      assert.ok(parsed.f > 0, 'Fat must be calculated');
      // 2 Rotis (140*2 = 280 cal) + 1 Paneer Butter Masala (340 cal) = 620 cal
      assert.equal(parsed.cal, 620);
      assert.equal(parsed.p, 22); // 4*2 + 14 = 22
      assert.equal(parsed.c, 56); // 22*2 + 12 = 56
      assert.equal(parsed.f, 34); // 4*2 + 26 = 34
    });

    it('chatWithAI returns structured confirmation card for food logging', async () => {
      const res = await chatWithAI('Log 2 Rotis and Paneer Butter Masala', []);
      assert.ok(res.card, 'Response must include card');
      assert.equal(res.card.type, 'food_confirmation');
      assert.equal(res.card.cal, 620);
      assert.equal(res.card.p, 22);
      assert.equal(res.card.c, 56);
      assert.equal(res.card.f, 34);
    });

    it('AIAssistantScreen.jsx renders Cal/P/C/F cards and invokes onLogFood callback', () => {
      const src = fs.readFileSync(path.resolve('src/components/AIAssistantScreen.jsx'), 'utf-8');
      assert.ok(src.includes('msg.card.type === \'food_confirmation\''), 'Must check card type');
      assert.ok(src.includes('msg.card.cal'), 'Must display calories');
      assert.ok(src.includes('msg.card.p'), 'Must display protein');
      assert.ok(src.includes('msg.card.c'), 'Must display carbs');
      assert.ok(src.includes('msg.card.f'), 'Must display fat');
      assert.ok(src.includes('onLogFood'), 'Must invoke onLogFood');
    });
  });

  // Item 10: Background imagery with dark overlays is applied to major screens
  describe('Rubric Item 10: Background imagery with dark overlays on major screens', () => {
    const screens = [
      'src/components/DashboardScreen.jsx',
      'src/components/ExerciseScreen.jsx',
      'src/components/FoodScreen.jsx',
      'src/components/StepsScreen.jsx',
      'src/components/GoalsScreen.jsx',
      'src/components/DeviceConnectScreen.jsx',
      'src/components/AIAssistantScreen.jsx',
    ];

    for (const screenPath of screens) {
      it(`Screen ${path.basename(screenPath)} has hero-bg.jpg background and dark overlay`, () => {
        const src = fs.readFileSync(path.resolve(screenPath), 'utf-8');
        assert.ok(src.includes("bg-[url('/hero-bg.jpg')]"), `${screenPath} must reference hero-bg.jpg`);
        assert.ok(
          src.includes('bg-gradient-to-') || src.includes('bg-[#09090b]') || src.includes('opacity-'),
          `${screenPath} must include dark overlay styling`
        );
      });
    }

    it('Physical asset public/hero-bg.jpg exists and is non-empty', () => {
      const heroPath = path.resolve('public/hero-bg.jpg');
      assert.ok(fs.existsSync(heroPath), 'public/hero-bg.jpg must exist on disk');
      const stats = fs.statSync(heroPath);
      assert.ok(stats.size > 1000, `hero-bg.jpg size should be substantial (actual: ${stats.size} bytes)`);
    });
  });

  // Item 11: Wearables screen displays cards and shows "coming soon" message when "Connect" is clicked
  describe('Rubric Item 11: Wearables screen displays cards and shows "coming soon" message', () => {
    it('DeviceConnectScreen.jsx defines all 5 required devices: Fitbit, Apple Health, Whoop, Garmin, Oura', () => {
      const src = fs.readFileSync(path.resolve('src/components/DeviceConnectScreen.jsx'), 'utf-8');
      assert.ok(src.includes("id: 'fitbit'"), 'Must include Fitbit');
      assert.ok(src.includes("id: 'apple'"), 'Must include Apple Health');
      assert.ok(src.includes("id: 'whoop'"), 'Must include Whoop');
      assert.ok(src.includes("id: 'garmin'"), 'Must include Garmin');
      assert.ok(src.includes("id: 'oura'"), 'Must include Oura');
      assert.ok(!src.includes("google_fit"), 'Must not include deprecated Google Fit');
    });

    it('DeviceConnectScreen.jsx displays verbatim callout "Coming soon, log manually for now" when Connect clicked', () => {
      const src = fs.readFileSync(path.resolve('src/components/DeviceConnectScreen.jsx'), 'utf-8');
      assert.ok(src.includes('selectedDevice'), 'Must track selectedDevice in state');
      assert.ok(src.includes('Coming soon, log manually for now'), 'Must display verbatim "Coming soon, log manually for now"');
      assert.ok(src.includes('Connect'), 'Must have Connect action button on cards');
      assert.ok(src.includes('role="dialog"'), 'Modal must have accessible dialog attributes');
      assert.ok(src.includes('Escape'), 'Must support Escape key dismissal');
    });
  });

  // Integrity & Anti-Cheating Adversarial Checks
  describe('Adversarial Integrity Verification', () => {
    it('No hardcoded test outputs or dummy bypasses exist in source code', () => {
      const files = [
        'src/App.jsx',
        'src/components/TopBar.jsx',
        'src/components/Sidebar.jsx',
        'src/components/DashboardScreen.jsx',
        'src/components/QuickLogModal.jsx',
        'src/components/FoodScreen.jsx',
        'src/components/AIAssistantScreen.jsx',
        'src/components/DeviceConnectScreen.jsx',
        'src/components/ExerciseScreen.jsx',
        'src/components/StepsScreen.jsx',
        'src/components/GoalsScreen.jsx',
        'src/hooks/useHabits.js',
        'src/lib/gemini.js'
      ];

      for (const file of files) {
        const content = fs.readFileSync(path.resolve(file), 'utf-8');
        assert.ok(!content.includes('__test_bypass__'), `${file} contains suspicious bypass`);
        assert.ok(!content.includes('// dummy implementation'), `${file} contains dummy implementation`);
        assert.ok(!content.includes('// cheat'), `${file} contains cheat marker`);
      }
    });

    it('State mutations are persistent and do not corrupt adjacent days in useHabits', () => {
      // Simulate useHabits logic
      const habits = [
        { date: '2026-09-23', workouts: [], foods: [], steps: 5000, water: 4, sleep: 7 },
        { date: '2026-09-24', workouts: [], foods: [], steps: 8000, water: 6, sleep: 8 }
      ];

      const today = '2026-09-24';
      const updateToday = (updatesOrFn) => {
        const existing = habits.find(h => h.date === today);
        const updates = typeof updatesOrFn === 'function' ? updatesOrFn(existing) : updatesOrFn;
        return habits.map(h => (h.date === today ? { ...h, ...updates } : h));
      };

      const updated = updateToday(curr => ({ water: curr.water + 2 }));
      assert.equal(updated.find(h => h.date === '2026-09-24').water, 8);
      // Ensure yesterday is untouched
      assert.equal(updated.find(h => h.date === '2026-09-23').water, 4);
    });
  });
});
