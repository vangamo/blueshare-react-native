---
type: Decision
title: Splash hidden on first layout
description: The native splash stays until the root view's first onLayout, and the starter's animated splash overlay was removed.
tags: [decision, splash, startup]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Splash hidden on first layout (D6)

**Decision:** `SplashScreen.preventAutoHideAsync()` at module scope in `src/app/_layout.tsx`, and `SplashScreen.hideAsync()` from the root `View`'s `onLayout`. There is no animated overlay. The splash image and color are set in `app.json` (`expo-splash-screen` plugin).

**Why:**
- It is explicit about when the shell is ready.
- It gives one place to wait for future async work, such as fonts or a session.

**Rejected:**
- Automatic hiding without `preventAutoHideAsync`: less explicit.

**Spec:** [app-platform](../specs/app-platform.md) (native splash until first render, never stuck).
