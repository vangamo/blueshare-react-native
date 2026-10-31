---
type: Guide
title: Dependencies
description: Add packages with npx expo install, prefer Expo modules, keep everything inside Expo Go, and check usage and peers before removing anything.
tags: [dependencies, packages, expo-go]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Dependencies

## Adding

- **Always** `npx expo install <pkg>` (dev: `npx expo install <pkg> -- --dev`), never `npm install <pkg>`. It picks SDK 58-compatible versions.
- Prefer recommended Expo modules over third-party libraries, and check the available skills before adding a dependency.
- **Expo Go constraint:** Expo Go only includes its bundled native modules. A library with other native code needs a development build (`npx expo run:android|ios` or `eas build --profile development`). That would break the [app-platform spec](../specs/app-platform.md), so propose a spec change first.
- After adding: run `npx expo install --check` and `npx expo-doctor`.

## Removing

1. `grep -rn "<pkg>" src app.json` finds nothing.
2. `npm ls <pkg>` shows no kept package that needs it as a **required** peer.
3. `npm uninstall <pkg>`, then run `npx expo-doctor`.

The current kept and removed list, with reasons: [Kept and removed dependencies](../decisions/kept-dependencies.md).

## Dev dependencies

`jest`, `jest-expo`, `@types/jest`, `@testing-library/react-native`, `eslint`, `eslint-config-expo`, `typescript` and `@types/react`. They do not affect Expo Go.

Known issue: `eslint` is listed in both `dependencies` and `devDependencies`. See [Known limitations](../product/known-limitations.md).
