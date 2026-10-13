# Growise

Growise is a local-first personal productivity and growth workspace.

## Cloud sync

Growise supports Supabase email/password accounts and synchronizes the user profile,
preferences, workspace collections, and focus timer state across devices.
Before authentication, the interface follows the operating system theme. After
sign-in, each user can choose Light, Dark, or System in Settings, and that
preference is synchronized with the account.

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the browser-safe Supabase project values.
3. Run `supabase/migrations/0001_growise_cloud_sync.sql` in the Supabase SQL editor.
4. Start the app with `npm run dev`.

Only the publishable/anon key belongs in the browser. Never place a Supabase
service-role key in `.env.local` or source control.

## Development

```sh
npm install
npm run dev
```

Create a local account to try onboarding and the app shell. The account verifier and app preferences are stored in this browser; this prototype does not provide cloud accounts, synchronization, or account recovery.

## Current foundation

- React, TypeScript, Vite, Tailwind CSS, and Zustand
- First-run module selection and settings-based module management
- Projects and resources modules, including local project/goal connections and saved links that open in a new tab
- Responsive circular module launcher: hover on pointer/desktop devices and click on touch devices
- Working local basics for tasks, notes, focus sessions, habit check-ins, calendar events, income and expenses, goals, daily journaling, and fitness plans/workout logs
- Workspace records are saved in browser storage per local account; they do not sync, and browser storage is not encrypted
- Shared TypeScript domain types for goals linked from tasks, date-based journal entries, fitness plans and workout tracking, and other core data
- Device-local password verifier using PBKDF2; this is not a replacement for a production identity or encrypted-data system
