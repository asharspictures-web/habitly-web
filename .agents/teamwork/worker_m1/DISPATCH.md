## 2026-09-24T20:30:21Z
You are Worker 1 implementing Milestone 1: Top Bar & Sidebar Updates (Requirement R1).
Working directory: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/worker_m1/
Project workspace root: /Users/asharspictures/Desktop/Habitly web/
Original request file: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/ORIGINAL_REQUEST.md
Project specification: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/orchestrator/PROJECT.md
Explorer Survey 1 report: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/explorer_survey_1/survey_r1.md

Read ORIGINAL_REQUEST.md, PROJECT.md, and survey_r1.md before writing any code.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Write Ownership:
You own exclusively:
- src/components/TopBar.jsx
- src/components/Sidebar.jsx
- src/App.jsx (wiring TopBar props, habits data, and search query state)
- src/components/ExerciseScreen.jsx (support filtering recentWorkouts by search query if applicable)

Requirements to Implement:
1. Top Bar Search Wiring:
   - Wire the search bar input in TopBar.jsx to filter historical logged entries (workouts and foods across habits) by name as typed.
   - Display a dropdown panel directly under the search bar listing matching entries (showing item name, type/category, date/time, and metrics like duration/calories).
   - Also allow passing the search query to App.jsx to filter on-screen historical lists (e.g. recentWorkouts in ExerciseScreen).
   - Support clearing search and keyboard escape / clicking outside to close.
2. Notification Bell Dropdown:
   - Clicking the notification bell in TopBar.jsx opens a styled dropdown menu.
   - Displays "No new notifications yet" with a subtle icon and clean dark theme styling.
   - Closes on click outside or clicking the bell again.
3. Profile Dropdown:
   - Clicking the profile icon in TopBar.jsx opens a styled dropdown menu.
   - Displays the user's name ("Alex Morgan"), email/account info, and an interactive "Sign Out" button (with LogOut icon).
   - Clicking "Sign Out" performs a clean client-side action/toast notification.
   - Closes on click outside or clicking the profile icon again.
4. Sidebar Logo Update:
   - In Sidebar.jsx, replace the red "H" box with the 3D pulse barbell image at `/logo.jpg` (from public/logo.jpg). Ensure it renders crisply (`w-8 h-8 rounded-lg object-cover`) alongside the "Habitly" brand name.

Verification requirements:
- Run `npm run lint` and verify no errors.
- Run `npm run build` and verify successful Vite production build.
- Test UI functionality thoroughly.
- Write your completion report to `/Users/asharspictures/Desktop/Habitly web/.agents/teamwork/worker_m1/handoff.md` with:
  - Observation (files modified, changes made)
  - Logic chain
  - Verification commands run and exact outputs
  - Verification checklist against R1 requirements.
When done, send a message to parent with the report summary.
