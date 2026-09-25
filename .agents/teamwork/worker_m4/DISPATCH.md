## 2026-09-24T21:12:47Z

You are Worker 4 implementing Milestone 4: Visuals & Wearables Screen (Requirement R4).
Working directory: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/worker_m4/
Project workspace root: /Users/asharspictures/Desktop/Habitly web/
Original request file: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/ORIGINAL_REQUEST.md
Project specification: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/orchestrator/PROJECT.md
Explorer Survey 3 report: /Users/asharspictures/Desktop/Habitly web/.agents/teamwork/explorer_survey_3/survey_r3_r4.md

Read ORIGINAL_REQUEST.md, PROJECT.md, and survey_r3_r4.md before writing any code.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope & Write Ownership:
You own exclusively:
- src/components/DeviceConnectScreen.jsx
- src/App.jsx (uncomment DeviceConnectScreen import and wire case 'connect' in renderScreen)
- src/components/ExerciseScreen.jsx (apply subtle fitness background with dark overlay)
- src/components/StepsScreen.jsx (apply subtle fitness background with dark overlay)
- src/components/GoalsScreen.jsx (apply subtle fitness background with dark overlay)

Requirements to Implement:
1. Connect Devices Screen (`src/components/DeviceConnectScreen.jsx` & `src/App.jsx`):
   - In `src/App.jsx`: uncomment `import DeviceConnectScreen from './components/DeviceConnectScreen';` and add `case 'connect': return <DeviceConnectScreen />;` in `renderScreen()`.
   - In `DeviceConnectScreen.jsx`:
     - Redesign the entire screen to match Habitly's dark theme aesthetics (`#09090b`, `#18181b`, `#27272a`, `text-white`, `text-zinc-400`).
     - Render device cards for the 5 exact wearables requested in R4:
       1. **Fitbit**
       2. **Apple Health**
       3. **Whoop**
       4. **Garmin** (replace Google Fit with Garmin)
       5. **Oura**
     - Each card must display:
       - Brand logo/icon
       - Device name and feature/category subtitle (e.g. Activity & Sleep Tracker, Biometrics, GPS multisport)
       - Status badge (e.g. "Disconnected" / "Ready to Sync")
       - An interactive "Connect" button
     - Clicking the "Connect" button on any device opens a stylish dark-themed modal/dialog:
       - Displays a clear message: "Coming soon, log manually for now" (or "Live sync coming soon, log manually for now through Dashboard or Quick-Log").
       - Includes device name, helpful guidance, and a "Got It" / "Close" action button.
       - Dismissible via Escape key, backdrop click, or Close button.
       - No live backend connection or fake simulation.
2. Visuals & Background Imagery Across All Major Sections:
   - Apply subtle health/fitness background imagery with dark overlays (`bg-[url('/hero-bg.jpg')] bg-cover bg-center` with dark vignette/gradient overlays like `from-[#09090b] via-[#09090b]/85 to-[#09090b]/50`) to all major sections:
     - `ExerciseScreen.jsx`: hero card / header section with fitness background imagery and dark overlay.
     - `StepsScreen.jsx`: hero card / header section with fitness background imagery and dark overlay.
     - `GoalsScreen.jsx`: hero card / header section with fitness background imagery and dark overlay.
     - `DeviceConnectScreen.jsx`: hero card / header section with fitness background imagery and dark overlay.
     - Ensure text contrast, labels, and all existing controls remain crystal clear and highly readable.
3. Verification & Testing:
   - Add automated test coverage in `tests/m4_adversarial.test.mjs` verifying:
     - All 5 required devices (Fitbit, Apple Health, Whoop, Garmin, Oura) exist in `DeviceConnectScreen`.
     - Clicking "Connect" triggers the "coming soon, log manually for now" modal/message.
     - Route `connect` is properly mounted in `App.jsx`.
     - Background imagery and dark overlay classes exist across `ExerciseScreen`, `StepsScreen`, `GoalsScreen`, `DeviceConnectScreen`, `DashboardScreen`, `FoodScreen`, and `AIAssistantScreen`.
   - Run `npm run lint` and verify 0 errors.
   - Run `npm run build` and verify Vite build passes cleanly.
   - Run `node --test tests/*.test.mjs` and confirm all test suites pass.
   - Write your completion report to `/Users/asharspictures/Desktop/Habitly web/.agents/teamwork/worker_m4/handoff.md`.
When done, message parent with your report summary.
