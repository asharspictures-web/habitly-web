# Habitly Frontend Plan

This file is the forward plan for the UI. For the full history of what has already been built, every prompt used, and every bug that got fixed, see `docs/project-log/PROGRESS.md` in this same repo. This file does not repeat that, it only says what comes next and why.

This plan folds together three sources: the original 9-stage build already in progress, the roadmap that came out of that build, and the feature ideas the team raised in two WhatsApp conversations (one with Anish, one group discussion with Stella and Amarja). Nothing here is final, the team still needs to look at it and agree before building starts on anything past the MVP list.

## Design and brand rules

Keep the existing dark charcoal surfaces and red accent color. Stella shared a set of reference screenshots from a different app called Vitality, login screen, dashboard with activity rings, food scan screen, and a meal planner. These are useful for layout and flow ideas only, things like how the OTP login works, how the activity rings are laid out, how the food scan screen shows macros with progress bars. The green accent color and the Vitality branding in those screenshots should not carry over. Habitly keeps its own look.

## Navigation

Reference layout used a bottom bar with five tabs, Home, Nutrition, Mind, Log, Profile. Adapt this for Habitly with clear, separate entry points for Food, Water, Exercise, Mind, and Profile, so nothing important is buried inside another section. Water specifically needs its own visible spot, Amarja asked the team directly whether water was hidden under food, which means it currently is not easy to find. Fix that.

Drop the standalone Steps page. Steps already show on the Dashboard, a separate page for it just adds a click with no new information. This was Stella's suggestion and it is a fair simplification.

## MVP, build this first

These are the items already committed from the existing roadmap plus the smaller, clearly scoped new asks. All of this can be built before the backend work lands, or right as it lands.

1. Food quantity and serving size step before saving any food entry, so calories and macros scale with the real amount eaten, not a fixed guess. Already planned, not yet built.
2. Previous session numbers shown on the strength training form, pulling the last time that same exercise was logged, so the user can see what they lifted last time.
3. Two real workout entry paths, Start workout for logging live with a running timer, and Log a completed workout for entering it after the fact.
4. A workout detail view, so tapping a past session in Recent Activity opens a full breakdown of what was logged.
5. Exercise library, listing exercises by level and age group, with a separate category for people with health conditions like cardiac issues who cannot safely do every exercise. This needs input from Amarja given her physiotherapy background.
6. Food logging gets two ways in, type a food name with AI assisted search, or scan the plate with the camera and let AI read off the macros. Both feed the same quantity and serving size step from item 1, they should not be built as two separate, disconnected flows.
7. Weight goal added alongside the existing steps, sleep, and water goals.
8. Homepage finished as the true front door, explaining what Habitly does and how the program levels work, before anyone reaches the dashboard. Two distinct views are needed here, one for a visitor who has not signed up yet, one for a logged in user landing on their dashboard.

## Phase 2, after the team reviews the MVP

These need backend support (accounts, real data storage) to work properly, and should wait until the team has looked at the MVP build and agreed on direction. See `backend.md` for how these connect to the data side.

- Wearable or health tracker connection, with an AI assistant that helps the user set and track goals based on that data.
- Mental health section, a mood tracker, meditation and guided videos, with the option to link Spotify or Apple Music for background audio during a session or a workout.
- Menstrual and pregnancy tracker for female users.
- Exercise page upgrades, letting a user save YouTube links for workout tutorials they plan to follow, or pick from premade routines sorted by style and target muscle group.
- Workout calendar with reminders for classes the user has booked.
- Revenue features, partnerships with gyms and personal trainers so a user can connect with a trainer through the app, plus local deals or ads from nearby gyms and supplement brands, triggered by the user's location.

## Phase 3, bigger scope, needs the backend security work done first

- Medical history page, bloodwork, lab reports, existing conditions. Amarja flagged this directly, it goes beyond MVP and needs real security thought before any patient style data gets stored. Do not build the UI for this ahead of the backend having a real plan for it, see `backend.md`.
- Emergency contact alerts, notifying a chosen group if a connected wearable shows a dangerous vital reading. This depends on wearable integration and reliable real time alerts already working, it is not a good first project.
- Social features, following other users, a habit tracking game, planning shared activities like hiking, pickleball, or running together, and including family and friends in that circle.
- Video gaming options, Amarja raised this but the scope is not clear yet. Flag it as an open question for the team rather than building anything until it is defined.

## Open questions for the team

- What exactly did Amarja mean by video gaming options, is this a rewards or gamification layer, or literal games inside the app.
- How far does the social layer go for a v1, just following and activity planning, or does it need a full feed.
- Who owns writing the actual exercise content (levels, age categories, health condition flags), this likely needs Amarja's input directly rather than guessing.
