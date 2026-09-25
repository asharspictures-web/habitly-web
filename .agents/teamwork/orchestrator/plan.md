# Orchestration Plan: Habitly Web App UI/UX Upgrades and Fixes

## Objectives
Implement the 12 UI/UX upgrades and fixes across Habitly web app without breaking existing core logging logic (Goals, Exercise, Food, Steps), satisfying all 11 points on the Agent-as-Judge rubric in ORIGINAL_REQUEST.md.

## Phases

### Phase 0: Survey & Codebase Exploration
- Spawn 3 parallel Explorers:
  - Explorer 1: Inspect Top Bar, Navigation, Sidebar, existing search, notification, profile, and logo components/assets.
  - Explorer 2: Inspect Dashboard component, ring progress components (Water, Sleep), quick-log mechanics, modal systems.
  - Explorer 3: Inspect Food section/database, custom food creation, AI Assistant page/routes/chat, background styling, and Connect Devices / Wearables page.
- Merge findings into `PROJECT.md` (Feature Inventory, Architecture, Code Layout, Interfaces).

### Phase 1: Milestone 1 - Top Bar & Sidebar Updates (R1)
- Wire search bar to filter logged entries by name as typed.
- Add notification bell dropdown ("No new notifications yet").
- Add profile icon dropdown (user name + "Sign Out").
- Replace sidebar logo with `public/logo.jpg`.
- Verification cycle: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Forensic Auditor -> Gate.

### Phase 2: Milestone 2 - Dashboard Logging & Floating Button (R2)
- Add "+ Log" buttons directly to Water and Sleep progress rings.
- Add single floating quick-log button (bottom right) opening quick entry for Water, Sleep, Steps, Workout.
- Verification cycle: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Forensic Auditor -> Gate.

### Phase 3: Milestone 3 - Food Section & AI Assistant (R3)
- Expand Food quick-add list with Indian and international foods with icons/thumbnails.
- Custom food with photo file upload input.
- Fix AI Assistant page load error so chat responds.
- Rich confirmation card for AI food logging (Cal, P, C, F).
- Verification cycle: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Forensic Auditor -> Gate.

### Phase 4: Milestone 4 - Visuals & Wearables Screen (R4)
- Subtle health/fitness background imagery with dark overlays across major sections.
- Build Connect Devices page (Fitbit, Apple Health, Whoop, Garmin, Oura) with "coming soon, log manually for now" modal/message on Connect.
- Verification cycle: Explorer -> Worker -> Reviewers (2) -> Challengers (2) -> Forensic Auditor -> Gate.

### Phase 5: Final Milestone - E2E Verification & Agent-as-Judge Acceptance
- Full end-to-end audit and validation of all 11 rubric items.
- Adversarial and forensic integrity checks.
- Final completion handoff report to Sentinel parent.
