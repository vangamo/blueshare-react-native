---
type: Guide
title: Native config and EAS
description: There are no ios/ or android/ folders. Native behavior is configured in app.json and config plugins, and builds go through EAS.
tags: [native, app-json, eas, cng]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Native config and EAS

## Continuous Native Generation

- There are no `ios/` or `android/` folders. They are generated. **Never create or edit them by hand.** Configure native behavior in `app.json` and config plugins.
- Current `app.json` highlights:
  - `orientation: "portrait"`
  - `userInterfaceStyle: "automatic"` (needs `expo-system-ui` on Android)
  - `scheme: "blueshare"`
  - Android adaptive icons, `predictiveBackGestureEnabled: false`
  - plugins `expo-router` and `expo-splash-screen` (background `#208AEF`, `splash-icon.png`, width 76)
  - experiments `typedRoutes` and `reactCompiler`
  - no `web` block (see [Mobile only](../decisions/mobile-only.md))
- Assets: `assets/images/icon.png`, `android-icon-*.png`, `splash-icon.png`, `assets/expo.icon` (iOS). Check that every path in `app.json` exists after you change assets.

## EAS

- Build, sign and submit in the cloud with `eas build` and `eas submit`. Ship over-the-air updates with `eas update`. No local Xcode or Android Studio is needed.
- Run it as `npx eas-cli@latest <command>`, in place of bare `eas` in docs examples.
- There is no `eas.json` yet. Create it when the first build is needed.
- Docs: `https://docs.expo.dev/eas/index.md`.
