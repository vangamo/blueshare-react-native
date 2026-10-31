---
type: Reference
title: Tech stack
description: Expo SDK 58 with Expo Router 58, React Native 0.88, React 19.3 and strict TypeScript 6, with npm as the package manager.
tags: [stack, versions, expo]
resource: ../../package.json
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Tech stack

| Area | Choice | Version |
| --- | --- | --- |
| Framework | Expo (managed, Continuous Native Generation) | `expo ~58.0.22` (SDK 58) |
| Routing | Expo Router (file-based), JS tabs | `expo-router ~58.0.29` |
| UI runtime | React Native, New Architecture | `0.88.1` |
| React | React, with React Compiler on | `19.3.0` |
| Language | TypeScript, `strict` | `~6.0.3` |
| Lint | ESLint flat config + `eslint-config-expo` | eslint 9.39.5 installed, config `~58.0.4` |
| Tests | Jest + `jest-expo` + React Native Testing Library | Jest `~30.5`, RNTL `^14.1` |
| Package manager | **npm** (`package-lock.json`, no `bun.lock`) | use `npx` |

## `app.json` experiments

- `typedRoutes: true`: `href` values are typechecked. See [Routing](routing.md).
- `reactCompiler: true`: automatic memoization, so components do not use `useMemo` or `useCallback` for styles. See [Coding conventions](../development/coding-conventions.md).

## Runtime packages kept on purpose

`expo-system-ui`, `expo-status-bar`, `expo-splash-screen`, `expo-constants`, `expo-linking`, `expo-font`, `expo-image`, `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`, `react-native-safe-area-context`, `react-native-screens`, `react-dom`. Why: [Kept and removed dependencies](../decisions/kept-dependencies.md).

Expo changes fast. Always check the versioned docs first: [Expo docs policy](../development/expo-docs-policy.md).
