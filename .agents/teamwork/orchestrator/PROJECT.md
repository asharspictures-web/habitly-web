# Project: Habitly Web App UI/UX Upgrades and Fixes

## Architecture
- **Framework & Tooling**: Vite 8.3 + React 19.2 + Tailwind CSS v4 + Lucide React + Recharts + Oxlint.
- **Routing**: Single-page state-driven navigation managed in `src/App.jsx` (`currentView`: `'dashboard' | 'exercise' | 'food' | 'steps' | 'goals' | 'ai' | 'connect'`).
- **State Management**: Centralized custom hook `src/hooks/useHabits.js` backed by `localStorage` (`'habitlyDataV2'` and `'habitlyGoals'`). Provides today's habits record (`workouts`, `foods`, `steps`, `water`, `sleep`) and updater functions.
- **Data Flow**: `App.jsx` invokes `useHabits()`, renders global `TopBar` and `Sidebar`, and passes habit data and updater callbacks down to individual screen components.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Top Bar Search | Wire search bar to filter logged entries by name as typed | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Notification Dropdown | Notification bell dropdown displaying "No new notifications yet" | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Profile Dropdown | Profile icon dropdown displaying user name and "Sign Out" option | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Sidebar Logo | Replace red "H" badge with 3D pulse barbell image (`public/logo.jpg`) | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Ring "+ Log" Buttons | Add "+ Log" buttons directly to Water and Sleep progress rings on Dashboard | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Floating Quick-Log Button | Fixed bottom-right FAB opening quick entry for Water, Sleep, Steps, Workout | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Water & Sleep State Handlers | Add `updateWater` and `updateSleep` to `useHabits.js` and wire to Dashboard | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Expanded Food Quick-Add | Expand Food quick-add with Indian and international foods with icons | M3 | ORIGINAL_REQUEST §R3 |
| 9 | Custom Food Photo Upload | Allow adding custom food item with `<input type="file">` photo upload | M3 | ORIGINAL_REQUEST §R3 |
| 10 | AI Assistant Fix | Fix AI Assistant page load error so chat loads without console errors and responds | M3 | ORIGINAL_REQUEST §R3 |
| 11 | AI Food Confirmation Card | Render rich confirmation card (Cal/P/C/F) when AI logs food instead of silent add | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Health/Fitness Background Overlays | Subtle health/fitness background imagery with dark overlays across major sections | M4 | ORIGINAL_REQUEST §R4 |
| 13 | Connect Devices Screen | Build Connect Devices page (Fitbit, Apple Health, Whoop, Garmin, Oura) with "coming soon" modal | M4 | ORIGINAL_REQUEST §R4 |
| 14 | E2E Acceptance Verification | Comprehensive verification of all 11 Agent-as-Judge rubric criteria | M5 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Top Bar & Sidebar Updates | Features 1, 2, 3, 4 (`TopBar.jsx`, `Sidebar.jsx`, `App.jsx`, `ExerciseScreen.jsx`) | None | DONE |
| M2 | Dashboard Logging & Floating Button | Features 5, 6, 7 (`DashboardScreen.jsx`, `useHabits.js`, `App.jsx`, `QuickLogModal.jsx`) | M1 | DONE |
| M3 | Food Section & AI Assistant | Features 8, 9, 10, 11 (`FoodScreen.jsx`, `AIAssistantScreen.jsx`, `gemini.js`, `App.jsx`) | M2 | DONE |
| M4 | Visuals & Wearables Screen | Features 12, 13 (`DeviceConnectScreen.jsx`, `App.jsx`, screen headers) | M3 | DONE |
| M5 | Final E2E Acceptance & Rubric Pass | Feature 14 (Full rubric validation across all screens) | M4 | DONE |
