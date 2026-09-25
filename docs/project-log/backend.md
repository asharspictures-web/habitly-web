# Habitly Backend Plan

Right now Habitly has no backend at all. Everything is stored in the browser through a `useHabits` hook, meaning data lives only on one device, in one browser, and disappears if that browser's storage is cleared. This is fine for a demo, but it blocks almost everything in Phase 2 and Phase 3 of the frontend plan, wearables, social features, emergency alerts, medical records, cross device access, all of it needs real accounts and a real database first.

This file lays out the recommended backend approach. For the build history so far, see `docs/project-log/PROGRESS.md`. For the matching frontend plan, see `frontend.md`.

## Recommended stack

Use Supabase. It bundles a Postgres database, user accounts and login, file storage, and real time updates, all in one place, with a generous free tier to start on. Two more reasons this fits Habitly specifically, one of the team's own members already used Supabase successfully on a related project shown in the group chat, so there is already some familiarity on the team, and it is well suited to being built by an AI coding assistant like Antigravity, since the setup is mostly configuration rather than custom server code.

Confidence, high. The main alternative would be a custom Node or Python backend, which gives more control but means building and hosting auth, database, and file storage by hand, real work with no clear benefit for a team that is not confident writing backend code from scratch. Go with Supabase unless a specific feature later turns out to need something it cannot do.

## Auth

Match the login flow from the reference screenshots the team shared, phone number with an OTP code as the primary path, plus Google and Apple sign in as quick alternatives. Supabase Auth supports all three directly.

## Core data to store

This is what the database needs to hold, described in plain terms, not as finished code. Antigravity should turn this into real tables once the plan is agreed.

- User profiles, name, basic info, goals (steps, sleep, water, weight).
- Workouts, one record per session, linked to a list of exercises done in that session.
- Exercise entries, exercise name, sets, reps, load, RPE, linked to a workout.
- An exercise library table, holding the master list of exercises with their level, age category, and any health condition flags, this is what Item 5 in the frontend MVP list reads from.
- Food logs, one record per food entry, linked to quantity, calories, and macros.
- A foods table, the master list of known foods plus a way to store a user's own custom foods.
- Water logs, timestamped entries, kept separate from food so the app can show water on its own, addressing the confusion Amarja raised.
- Weigh ins, one record per logged weight.
- Wearable connections, phase 2, which device or service a user has linked.
- Emergency contacts, phase 3, name and contact method per user, plus the alert rule (what vital, what threshold).
- Social data, phase 3, who follows who, and any planned shared activities.
- Medical records, phase 3, kept in its own table with its own stricter access rules, see the security section below.

## Security

Every table needs row level security turned on in Supabase, so a user can only ever read or write their own rows, never anyone else's, by default. This should be set up from the very first table, not bolted on later.

The medical history table needs extra care beyond that default rule. Amarja specifically flagged that this goes past MVP and needs a real security plan, not just the same row level rule as everything else. Before this table gets built, decide, who besides the user themselves should ever be able to see it, does it need encryption at rest beyond what Supabase gives by default, and does storing health records like this bring in any compliance requirement worth checking on first. Do not build the medical history page until this is answered.

## Phased rollout

Phase 1, right after the MVP frontend work. Stand up Supabase, wire up auth, and migrate the core tables, profiles, workouts, exercises, food logs, water logs, weigh ins, goals. This replaces the local `useHabits` storage. Plan for a one time migration step so a user testing the app now does not lose their existing local data when this switch happens, do not skip this.

Phase 2. Wearable connections and the AI goal assistant, this needs whichever wearable API is targeted first, likely Apple Health or Google Fit, plus the mental health, meditation, and Spotify or Apple Music linking, which are mostly separate integrations and do not depend on wearables.

Phase 3. Emergency contact alerts, this needs real time vital readings coming in from Phase 2's wearable connection, plus a way to actually notify someone, an SMS service such as Twilio is the common choice here. Also in this phase, the medical history table once its security plan is settled, and the social features, following, activity planning, the habit game.

## Open questions for the team

- Which wearable or health platform to support first, Apple Health, Google Fit, or a specific device brand.
- Who is deciding the medical history security plan, this should not be guessed by whoever happens to be building that week.
- Whether emergency alerts go out by SMS, push notification, or both, this affects which service gets set up.
