# Proposal

## Why

The app is still the default Expo starter: demo screens, an animated Expo splash, web support and a two-tab "Home/Explore" navigator. BlueShare's Phase 1 (core layout and main feed) needs its own app shell first, so later work (feed cards, creation box, menu, search) has a fixed frame to plug into. The sketches and design tokens in `sketches/` are ready, so the shell can now be built to match them.

## What Changes

- **BREAKING** Remove the Expo starter demo: the `explore` screen, the demo content of the home screen, demo components (`animated-icon`, `hint-row`, `web-badge`, `external-link`, `app-tabs`, `ui/collapsible`), demo images, `scripts/reset-project.js` and its npm script, and the related README sections.
- Remove the animated Expo splash overlay. The native splash from `expo-splash-screen` stays and is hidden once the app has rendered.
- **BREAKING** Drop web as a target: delete `src/global.css`, all `*.web.ts(x)` files, web font variants, the `web` npm script and the `web` block in `app.json`. Android and iOS only, portrait only.
- Uninstall packages nothing imports after the cleanup (after checking each one), with no new runtime dependencies, so the app keeps running in Expo Go.
- Replace the starter theme with BlueShare design tokens (colors, spacing, radius, typography) in a light palette (from the design tokens) and a matching dark palette that meets WCAG AA. The navigation theme and status bar follow the active scheme, and components take every color from the theme.
- Add the app shell: a sticky header (menu button, title/search field, avatar), a custom footer tab bar (Timeline, Circles, Events) and a floating "+" button. Each is rendered once at layout level.
- Add three tab routes with placeholder screens. Timeline is the default.
- Interactive behavior in scope: switching tabs and the title field's focus/blur. Menu, search, avatar and "+" are visual only for now.
- All TypeScript / React Native code added or changed in this change must pass the project's ESLint setup (`npx expo lint --max-warnings 0`: no errors, no warnings) with no new `eslint-disable` comments.
- Add unit tests (Jest with the `jest-expo` preset and React Native Testing Library) that check the spec scenarios: title field behavior, tab switching, accessibility labels, shell sizes and palette contrast. Each task group writes the tests for its own code.
- Review the result visually: take screenshots of the app on an Android device in light and dark mode, compare them with the sketches, and fix the differences. The approved screenshots are kept as references for future automated screenshot tests.

## Capabilities

### New Capabilities
- `app-shell`: the persistent frame around every main screen: header with menu button, title/search field and avatar; footer tab navigation between Timeline, Circles and Events; floating create button; and how content scrolls between header and footer.
- `app-theming`: the visual theme: the light and dark palettes from BlueShare design tokens, following the system color scheme live, contrast requirements, and theme-driven colors for the status bar and screen backgrounds.
- `app-platform`: supported platforms and runtime: Android and iOS in portrait, runs in Expo Go with no extra native modules, no web target, native splash screen behavior, and no leftover starter content.

### Modified Capabilities
<!-- None: there are no existing specs. -->

## Impact

- **Code**: `src/app/` (root layout rewritten as the tab shell; `explore.tsx` removed; `index.tsx` becomes Timeline; new `circles.tsx` and `events.tsx`). New shell components in `src/components/`. `src/constants/theme.ts` rewritten. `src/hooks/use-color-scheme.web.ts` removed; `use-color-scheme.ts` and `use-theme.ts` kept.
- **Routes**: `/explore` is removed. `/`, `/circles` and `/events` are added (typed routes regenerate).
- **Config**: `app.json` (`web` block removed), `package.json` (scripts, dependencies and Jest config), `tsconfig.json` (Jest types), README.
- **Tests and evidence**: unit tests in `src/**/__tests__/`. Approved device screenshots in `openspec/changes/basic-app-layout/screenshots/`.
- **Dependencies**: removal candidates are `react-native-web`, `react-dom`, `expo-web-browser`, `expo-symbols`, `expo-glass-effect`, `@expo/ui` and `expo-device`. Kept: `expo-system-ui` and `expo-status-bar`, plus anything Expo Router needs as a required peer. ESLint is already set up (`eslint` 9, `eslint-config-expo` 58, `eslint.config.js`, `npm run lint`). This change adds no lint dependencies and keeps the `lint` script. Adds dev-only test dependencies, installed with `npx expo install … --dev` so their versions match SDK 58: `jest-expo`, `jest`, `@types/jest` and `@testing-library/react-native`. They do not affect Expo Go.
- **Assets**: starter images deleted. App icons and splash images kept.
