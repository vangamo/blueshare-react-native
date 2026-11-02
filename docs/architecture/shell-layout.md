---
type: Architecture
title: Shell layout
description: The root layout renders the header, the tab navigator with its custom tab bar, and the floating create button once, around every section.
tags: [layout, shell, root-layout]
resource: ../../src/app/_layout.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:30:00Z
---

# Shell layout

`src/app/_layout.tsx` builds the whole frame:

```
ThemeProvider value={NavigationThemes[scheme]}
└─ ItemsProvider                           items module (timeline store), created once
   └─ CreationBoxProvider                  creation box state (step, draft, openCount)
      └─ View  flex:1, bg=backgroundMain, onLayout → SplashScreen.hideAsync()
         ├─ StatusBar style="auto"
         ├─ AppHeader                      fixed, frame.headerHeight + insets.top
         ├─ Tabs (expo-router/js-tabs)     scenes + tabBar=TabBar (always in the bottom slot)
         │    screenOptions={{ headerShown: false, sceneStyle: { paddingTop: landscape ? frame.tabBarHeight : 0 } }}
         │    Tabs.Screen index "Timeline" | circles "Circles" | events "Events"
         └─ CreateButton                   position:absolute, right and bottom from the layout
```

## How it works

- The **header sits outside the navigator**, above it in the column. It mounts once, and content can never scroll under it. Why: [Shell at the root layout](../decisions/shell-at-root-layout.md).
- **One of four layouts** (phone or tablet, portrait or landscape) comes from the window size through `useShellLayout()`. It gives the bar heights, the tab bar position and the sizes. See [Sizes and typography](../design-system/layout-sizes.md).
- The **tab bar is the navigator's `tabBar`**, so it always renders in the navigator's bottom slot, after the scenes. In portrait it sits there. In landscape it is drawn at the top (`position: absolute`, `top: 0`), and the root layout pads the scenes by `frame.tabBarHeight` so nothing hides under it. It never moves between slots because that moves the screens' native view and loses the focused field on rotation: see [Tab bar stays in one slot](../decisions/tab-bar-single-slot.md), [Tab bar](../components/tab-bar.md) and [JS tabs with a custom tab bar](../decisions/js-tabs-custom-tab-bar.md).
- **Safe areas on all sides:** the header and tab bar add the left and right insets to their padding, the create button adds the right (and, in landscape, the bottom) inset, and in landscape the section content adds the bottom inset because no bar sits below.
- The **create button is drawn last**, so it floats over the content on every tab and is never re-mounted. It hides only while the creation box is open on Timeline.
- **Providers above the tabs:** [ItemsProvider](../components/items-provider.md) and [CreationBoxProvider](../components/creation-box-provider.md) wrap the whole shell, so the Timeline feed, the creation box and the `+` button share one store and one draft, and a tab switch keeps the draft.
- **Theme:** `ThemeProvider` gets the BlueShare navigation theme, so scene backgrounds are `backgroundMain` and there is no white flash in dark mode. See [Theme module](../design-system/theme-module.md).
- **Safe areas:** components read `useSafeAreaInsets()`. Expo Router provides the provider at the root. If insets come back as 0 on a notched device, wrap the shell in `SafeAreaProvider`.
- **Splash:** `SplashScreen.preventAutoHideAsync()` runs at module scope, and the root `View`'s `onLayout` hides it. See [Splash hidden on first layout](../decisions/splash-hidden-on-layout.md).
- **Status bar:** `style="auto"`, so the icons are dark in light mode and light in dark mode. On Android (edge-to-edge) the header paints behind it.

A new main section plugs into this frame without touching the header, footer or button. See [Routing](routing.md).
