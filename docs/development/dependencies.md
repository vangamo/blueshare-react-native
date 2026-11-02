---
type: Guide
title: Dependencies
description: Add packages with npx expo install, prefer Expo modules, keep everything inside Expo Go, and check usage and peers before removing anything.
tags: [dependencies, packages, expo-go]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:30:00Z
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

## Runtime dependencies added for items

- `expo-sqlite`: the local database for items (`blueshare.db`). Included in Expo Go. `npx expo install` also added its config plugin to `app.json`.
- `expo-crypto`: `randomUUID()` for item IDs (UUID v4). Included in Expo Go.

Only `src/items/infrastructure/expo-sql-database.ts` and `app-adapters.ts` import them. See [Items module](../architecture/items-module.md).

## Runtime dependencies added for image items

- `expo-image-picker`: opens the system photo picker (`launchImageLibraryAsync`, no permission needed). Included in Expo Go. Imported only by `src/hooks/use-pick-photo.ts`. Its config plugin is in `app.json` with a Spanish `photosPermission` and `cameraPermission` and `microphonePermission` set to `false`, so builds outside Expo Go ask only for what the app uses (`CAMERA` and `RECORD_AUDIO` are removed from the Android manifest).
- `expo-file-system`: copies each chosen photo into `<documents>/images/` (`File`, `Directory`, `Paths`). Already installed through `expo`, now a direct dependency. Imported only by `src/items/infrastructure/expo-photo-store.ts`.

**Android storage permissions:** the library adds `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`, limited to Android 12 and older (`maxSdkVersion` 32). The plugin cannot block them. They are harmless, because the system photo picker needs no permission.

## Dev dependencies

`jest`, `jest-expo`, `@types/jest`, `@testing-library/react-native`, `eslint`, `eslint-config-expo`, `typescript`, `@types/react` and `@types/node`. They do not affect Expo Go.

`@types/node` is a direct dev dependency (it used to come only through Jest) because the test SQLite driver uses `node:sqlite`. Only `src/test-utils/node-sql-database.ts` references it, with `/// <reference types="node" />`. `tsconfig.json` keeps `"types": ["jest"]`, so Node globals don't leak into app code.

## Node version

Tests need **Node 22.13 or later**, the first release where `node:sqlite` works without a flag. `package.json` declares it in `engines`. No extra test package is needed: the same SQL runs on `node:sqlite` in Jest and on `expo-sqlite` on the phone.

Known issue: `eslint` is listed in both `dependencies` and `devDependencies`. See [Known limitations](../product/known-limitations.md).
