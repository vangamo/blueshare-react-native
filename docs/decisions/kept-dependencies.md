---
type: Decision
title: Kept and removed dependencies
description: Web and demo packages were uninstalled. Expo Router peers, system UI and the animation and image packages planned for the feed were kept.
tags: [decision, dependencies, packages]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Kept and removed dependencies (D8)

**Removed** (nothing imported them, and no kept package needed them as a required peer): `react-native-web`, `expo-web-browser`, `expo-symbols`, `@expo/ui`, `expo-device`. `expo-glass-effect` is no longer a direct dependency, but it stays installed because expo-router depends on it.

**Kept, even though `src/` does not import them:**
- `expo-system-ui`: needed on Android, or `userInterfaceStyle` is ignored.
- `expo-status-bar` and `expo-splash-screen`: used by the root layout.
- `expo-constants`, `expo-linking` and `expo-font`: required peers of expo or expo-router.
- `react-dom`: a **required** peer of the `@radix-ui/*` packages that expo-router depends on. It is unused on native.
- `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` and `expo-image`: navigation and animation infrastructure bundled in Expo Go, which the Phase 1 feed (images, carousels) is expected to use.

**Rule:** before removing a package, check `grep -rn "<pkg>" src app.json` and `npm ls <pkg>`. Removal uses `npm uninstall`. Adding a package always uses `npx expo install`. See [Dependencies](../development/dependencies.md).
