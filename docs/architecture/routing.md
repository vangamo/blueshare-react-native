---
type: Architecture
title: Routing
description: Expo Router file routes in src/app with JS tabs. Every route needs a Tabs.Screen, typed routes are on, and the deep-link scheme is blueshare.
tags: [routing, expo-router, navigation, deep-links]
resource: ../../src/app/
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Routing

- **Expo Router** handles all navigation. Import `Link`, `router`, `useLocalSearchParams`, `ThemeProvider`, `DefaultTheme` and `DarkTheme` from `expo-router`. React Navigation is bundled inside it.
- **Tabs come from `expo-router/js-tabs`**, not from `expo-router`: the `Tabs` export of `expo-router` is `@deprecated` in SDK 58. `BottomTabBarProps` is exported from `expo-router/js-tabs`.
- **SDK 58 shows only declared screens.** Every route file needs a matching `Tabs.Screen` in `_layout.tsx`, or it is not shown.
- Routes are flat for now: `/` (Timeline, `index.tsx`), `/circles` and `/events`. There is no `(tabs)` group and no stack. Add them when the first screen has to open on top of the tabs.
- **Back behavior:** Android back from another tab returns to Timeline (the first tab, the JS tabs default).

## Adding a main section

1. Create `src/app/<name>.tsx` with a default-export screen.
2. Add `<Tabs.Screen name="<name>" options={{ title: '<Label>' }} />` in `src/app/_layout.tsx`. The footer reads `options.title`.
3. Start the dev server once (`npx expo start`) so typed routes regenerate in `.expo/types`. Then run `npx tsc --noEmit`.
4. Extend `src/__tests__/e2e/navigation-test.tsx` and `footer-tab-bar-test.tsx`. Check the footer still fits: it uses equal-width tabs.

## Deep links

- The scheme is `blueshare` (`app.json`).
- In **Expo Go**, `blueshare://` does not resolve. Use `exp://<host>:8081/--/<path>`, for example `exp://127.0.0.1:8081/--/circles`.
- Unknown routes, such as the old starter `/explore`, show Expo Router's "Unmatched Route" page. That is tested in the e2e suite.

## Testing routes

Use `renderRouter('./src/app', { initialUrl })` and `toHavePathname()` from `expo-router/testing-library`. See [Testing](../development/testing.md).

Related: [Shell layout](shell-layout.md), [JS tabs with a custom tab bar](../decisions/js-tabs-custom-tab-bar.md).
