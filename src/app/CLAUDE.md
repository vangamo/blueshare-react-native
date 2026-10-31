# src/app: routes only

Every file here is an Expo Router screen. Never put components, hooks, helpers or tests here.

- Before changing `_layout.tsx` or adding a route, read `docs/architecture/shell-layout.md` and `docs/architecture/routing.md`.
- Adding a main section (a new tab)? Use the `add-main-section` skill.
- Tabs come from `expo-router/js-tabs`. Every route needs a `Tabs.Screen`, or SDK 58 hides it.
- After adding or renaming a route, run `npx expo start` once so typed routes regenerate, then `npx tsc --noEmit`.
- The header, footer and create button live in the root layout. Screens never draw their own (`docs/decisions/shell-at-root-layout.md`).
