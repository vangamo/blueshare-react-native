---
type: Architecture
title: Shell layout
description: The root layout renders the header, the tab navigator with its custom footer, and the floating create button once, around every section.
tags: [layout, shell, root-layout]
resource: ../../src/app/_layout.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Shell layout

`src/app/_layout.tsx` builds the whole frame:

```
ThemeProvider value={NavigationThemes[scheme]}
└─ View  flex:1, bg=backgroundMain, onLayout → SplashScreen.hideAsync()
   ├─ StatusBar style="auto"
   ├─ AppHeader                      fixed, height 70 + insets.top
   ├─ Tabs (expo-router/js-tabs)     scenes + tabBar=FooterTabBar (75 + insets.bottom)
   │    screenOptions={{ headerShown: false }}
   │    Tabs.Screen index "Timeline" | circles "Circles" | events "Events"
   └─ CreateButton                   position:absolute, right 20, bottom 75 + insets.bottom + 10
```

## How it works

- The **header sits outside the navigator**, above it in the column. It mounts once, and content can never scroll under it. Why: [Shell at the root layout](../decisions/shell-at-root-layout.md).
- The **footer is the navigator's `tabBar`**, so it is drawn below the scenes. See [Footer tab bar](../components/footer-tab-bar.md) and [JS tabs with a custom tab bar](../decisions/js-tabs-custom-tab-bar.md).
- The **create button is drawn last**, so it floats over the content on every tab and is never re-mounted.
- **Theme:** `ThemeProvider` gets the BlueShare navigation theme, so scene backgrounds are `backgroundMain` and there is no white flash in dark mode. See [Theme module](../design-system/theme-module.md).
- **Safe areas:** components read `useSafeAreaInsets()`. Expo Router provides the provider at the root. If insets come back as 0 on a notched device, wrap the shell in `SafeAreaProvider`.
- **Splash:** `SplashScreen.preventAutoHideAsync()` runs at module scope, and the root `View`'s `onLayout` hides it. See [Splash hidden on first layout](../decisions/splash-hidden-on-layout.md).
- **Status bar:** `style="auto"`, so the icons are dark in light mode and light in dark mode. On Android (edge-to-edge) the header paints behind it.

A new main section plugs into this frame without touching the header, footer or button. See [Routing](routing.md).
