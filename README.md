# Growise

Growise is a local-first personal productivity and growth workspace.

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
