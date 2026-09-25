## 2026-09-24T22:25:00Z

<USER_REQUEST>
You are Explorer 2 conducting the Phase 0 Survey for Habitly workout logging rebuild and UI fixes.
Your working directory: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/explorer_workout_survey_2/
Project root: /Users/asharspictures/Desktop/Habitly web
Original request file: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/ORIGINAL_REQUEST.md

You MUST read /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/ORIGINAL_REQUEST.md first (specifically section ## Follow-up — 2026-09-24T22:22:35Z).

Your objective:
Investigate requirements R1, R2, and R3 in detail:
1. Requirement R1: Activity-Specific Logging Forms
   - Replace single 'Activity Type + Duration' form with per-activity forms.
   - Rename 'Weights' to 'Strength Training'.
   - Strength Training form: Exercise name, set type (working / warm-up), reps, load (kg or lb), optional RPE. Support bodyweight and assisted exercises without requiring a fake weight.
   - Historical lookup: Show previous session's numbers for each exercise where available. How can this be efficiently queried from localStorage workout history?
   - Running / Walking: Distance, time, calculated pace (time / distance formatted e.g. min:sec / km or / mi).
   - Cycling: Distance, time, optional elevation or speed.
   - Swimming: Distance, pool length or laps, stroke, time.
   - Yoga / Mobility: Duration, style, optional effort level.
   - Other: Flexible free-form fields.
2. Requirement R2: Two Entry Paths & Session Context
   - 'Start Workout' (live logging with a running timer) vs 'Log Completed Workout' (enter after the fact).
   - Session start/end time context displayed as elapsed time.
   - Rules: Never derive or display invented calorie or volume totals from incomplete data! Label elapsed time clearly so it is never confused with active lift time.
3. Requirement R3: Rich Activity Cards & Workout Detail View
   - Update Recent Activity list cards with activity-specific summary (e.g. 'Upper body · 5 exercises · 14 working sets' for strength, or '5.2 km · 28:10 · 5:25/km' for run).
   - Tapping/clicking a card opens a full workout detail view modal or drawer showing all logged data for that session.
4. Map out component architecture, UI state handling, form validation, and user interaction flow.
5. Write your comprehensive survey to `/Users/asharspictures/Desktop/Habitly web/.agents/teamwork/explorer_workout_survey_2/survey_forms.md`.
6. Write `/Users/asharspictures/Desktop/Habitly web/.agents/teamwork/explorer_workout_survey_2/handoff.md`.
7. Send a concise message to parent when finished referencing the handoff path.
</USER_REQUEST>
