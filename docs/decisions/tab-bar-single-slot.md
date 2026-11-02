---
type: Decision
title: Tab bar stays in one slot
description: The tab bar never changes slot in the navigator. In landscape it is drawn at the top with absolute positioning, because moving it loses the focused field on rotation.
tags: [decision, tabs, layout, rotation]
resource: ../../src/components/tab-bar.tsx
status: stable
---

# Tab bar stays in one slot

**Decision:** `<Tabs>` keeps the default `tabBarPosition` (`'bottom'`). In landscape the bar is drawn at the top (`position: 'absolute'`, `top: 0`) and the root layout sets `sceneStyle.paddingTop` to the bar height. In portrait it sits in the flow at the bottom. Only styles change on rotation.

**Why:** the installed `BottomTabView` renders `[top ? bar : null, screens, bottom ? bar : null]`. When the bar changes slot, the screens' native view changes index, Android detaches it and the focused field loses focus. Android then focuses the first `EditText` in the window, the search field. A device spike hit this on landscape to portrait in 4 of 4 runs. With the bar kept in the bottom slot and drawn at the top, focus, keyboard and draft survived every rotation on the phone and tablet emulators, and tab presses and Android back still worked.

**Rejected:**
- **`tabBarPosition` switching between `'top'` and `'bottom'`:** loses focus, as above.
- **Two always-mounted slots outside the navigator** (`tabBar={() => null}` and the bar in the root layout): it kept focus, but the bar would lose `BottomTabBarProps` (`state`, `emitter`, `navigateToTab`) and need its own route matching. See [JS tabs with a custom tab bar](js-tabs-custom-tab-bar.md).
- **Headless `expo-router/ui` tabs:** still experimental in SDK 58.

**Consequences:** the bar height and the scene padding must stay in sync. Both read `frame.tabBarHeight`, and a test checks it. A future change to `BottomTabView`'s child order could bring the focus jump back: the rotation journey test catches a remount.

See [Tab bar](../components/tab-bar.md), [Shell layout](../architecture/shell-layout.md).
