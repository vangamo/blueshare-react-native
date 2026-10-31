---
type: Decision
title: JS tabs with a custom tab bar
description: Navigation uses Tabs from expo-router/js-tabs with a custom tabBar component, because it is stable and handles back behavior.
tags: [decision, navigation, tabs]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# JS tabs with a custom tab bar (D1)

**Decision:** `<Tabs tabBar={(props) => <FooterTabBar {...props} />} screenOptions={{ headerShown: false }}>` from `expo-router/js-tabs`.

**Why:**
- It is stable, not experimental.
- It handles Android back (it returns to the first tab), lazy scenes, and scene theming through `ThemeProvider`.
- It renders our own component in place of the bar, with no native look.

**Rejected:**
- Headless `expo-router/ui` tabs (`TabList`, `TabTrigger`, `TabSlot`): experimental in SDK 58, with no back behavior or screen options. This is the **fallback** if `tabBar` ever stops working.
- `NativeTabs`: the design needs a custom-drawn bar.
- `Tabs` from `expo-router`: deprecated in SDK 58.

**Consequence:** in expo-router 58 the tab bar receives `emitter` and `navigateToTab`, not `navigation`. See [Footer tab bar](../components/footer-tab-bar.md) and [Routing](../architecture/routing.md).
