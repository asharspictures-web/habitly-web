# Original User Request

## 2026-09-24T20:22:28Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval.
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Full team

The goal is to implement 12 specific UI/UX upgrades and fixes across the Habitly web app without breaking the existing core logging logic (Goals, Exercise, Food, Steps).

Working directory: ~/Desktop/Habitly web
Integrity mode: demo

## Requirements

### R1. Top Bar & Sidebar Updates
- Wire the search bar to filter logged entries by name as typed.
- Add a dropdown to the notification bell saying "No new notifications yet".
- Add a dropdown to the profile icon with the user's name and a "Sign Out" option.
- Replace the red "H" sidebar logo with the provided 3D pulse barbell image (`public/logo.jpg`).

### R2. Dashboard Logging & Floating Button
- Add "+ Log" buttons directly to the Water and Sleep progress rings on the Dashboard.
- Add a single floating quick-log button (bottom right) that opens a quick entry for Water, Sleep, Steps, or Workout.

### R3. Food Section & AI Assistant
- Expand the Food quick-add list with a larger set of Indian and international foods, each with a thumbnail/icon.
- Allow users to add a custom food item with a photo (using a file upload input from device storage).
- Fix the AI Assistant page error so the chat loads and responds.
- When the AI logs food via chat, display a confirmation card showing the food name, calories, and macro breakdown (P/C/F) rather than silently adding it.

### R4. Visuals & Wearables Screen
- Apply subtle health/fitness background imagery with dark overlays to all major sections (not just the AI hero card).
- Build the Connect Devices page with cards for Fitbit, Apple Health, Whoop, Garmin, and Oura. The "Connect" button should open a "coming soon, log manually for now" message (no live backend connection).

## Acceptance Criteria

*Verification mechanism: An independent agent acting as a judge will review the UI and functionality against this rubric.*

### Agent-as-Judge Rubric
- [ ] Top bar search filters historical logs successfully.
- [ ] Notification bell and Profile icon both open appropriate dropdowns.
- [ ] The Sidebar logo is updated to use `logo.jpg`.
- [ ] Water and Sleep dashboard rings have functional "+ Log" buttons.
- [ ] A floating quick-log button is present on the Dashboard and functional.
- [ ] Food section contains an expanded list of foods with thumbnails/icons.
- [ ] Custom food items can be added with a file upload photo.
- [ ] AI Assistant page loads without console errors and responds to queries.
- [ ] AI Assistant displays a rich confirmation card (Cal/P/C/F) when logging food.
- [ ] Background imagery with dark overlays is applied to major screens.
- [ ] Wearables screen displays cards and shows a "coming soon" message when "Connect" is clicked.

---
*Next: when approved → delegate via invoke_subagent (see Delegation Protocol)*

## Follow-up — 2026-09-24T22:22:35Z

Rebuild the workout logging screen in Habitly (an existing React + Vite + Tailwind app using browser localStorage) so it supports activity-specific logging with rich per-exercise detail for strength training, real data fields for cardio and swimming, two entry paths (live and post-session), and meaningful summary cards — while leaving all existing logged data and every other screen completely untouched.

Working directory: ~/Desktop/Habitly web
Integrity mode: demo

Before writing any code, inspect the current codebase thoroughly. This is an improvement to a working project, not a rebuild. Preserve the dark charcoal surfaces, red accent, existing user data, and every feature that already works.

## Requirements

### R1. Activity-Specific Logging Forms
Replace the single "Activity Type + Duration" form with per-activity forms. Rename "Weights" to "Strength Training." Each activity type has its own relevant fields:
- **Strength Training**: Exercise name, set type (working/warm-up), reps, load (kg or lb), optional RPE. Support bodyweight and assisted exercises without requiring a fake weight. Show the previous session's numbers for each exercise where available.
- **Running / Walking**: Distance, time, calculated pace.
- **Cycling**: Distance, time, optional elevation or speed.
- **Swimming**: Distance, pool length or laps, stroke, time.
- **Yoga / Mobility**: Duration, style, optional effort level.
- **Other**: Flexible free-form fields.

### R2. Two Entry Paths & Session Context
Offer "Start Workout" (live logging with a running timer) and "Log Completed Workout" (enter after the fact). Session start/end time is optional context displayed as elapsed time. Never derive or display invented calorie or volume totals from incomplete data. Label elapsed time clearly so it is never confused with active lift time.

### R3. Rich Activity Cards & Workout Detail View
Update the Recent Activity list so each card shows an activity-specific summary (e.g., "Upper body · 5 exercises · 14 working sets" for strength, or "5.2 km · 28:10 · 5:25/km" for a run). Tapping/clicking a card opens the full workout detail view showing all logged data for that session.

### R4. Backward Compatibility
All existing duration-only logs stored in localStorage are preserved exactly as logged and displayed clearly alongside new detailed entries. No silent migration, deletion, or reinterpretation of old data is permitted.

### R5. Floating Button Fix
The floating AI Assistant button is currently clipping at the screen edge on the Dashboard. Fix its positioning so it never overlaps content, never cuts off at the screen edge, and is always fully visible.

## Acceptance Criteria

### Automated Checks (run first)
- [ ] All pre-existing entries in localStorage survive the upgrade with their original shape and values intact (write a test that seeds localStorage with old-format entries and checks they are still readable and rendered after the update).
- [ ] The new strength training data schema correctly stores and retrieves exercise name, set type, reps, load, and optional RPE.
- [ ] Pace calculation for running/walking entries is correct (time / distance = pace).
- [ ] The app builds clean with zero lint errors (`npm run build`).

### Agent-as-Judge Rubric (UI quality, run after automated checks pass)
- [ ] Strength Training form supports bodyweight and assisted exercises without a fake weight input being required.
- [ ] Previous session numbers for an exercise are visible when logging a new strength session.
- [ ] "Start Workout" shows a live timer; "Log Completed Workout" is a static entry form.
- [ ] Each Recent Activity card shows a category-specific summary (not a generic "X min" label for new entries).
- [ ] Clicking a card opens a workout detail view with the actual logged data.
- [ ] Old duration-only entries still appear in the Recent Activity list, clearly displayed as-logged.
- [ ] The floating AI Assistant button is fully visible and not clipped on the Dashboard.

