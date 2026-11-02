---
type: Component
title: Tab bar
description: Replaces the default JS tab bar with three text tabs, at the bottom in portrait and at the top in landscape, that show the active section with a blue style and the selected accessibility state.
tags: [component, tab-bar, tabs, navigation]
resource: ../../src/components/tab-bar.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Tab bar

`TabBar(props: BottomTabBarProps)`, passed to the navigator as `tabBar={(props) => <TabBar {...props} />}`.

It reads `useShellLayout()`. The navigator keeps the default `tabBarPosition`, so the bar always renders in the bottom slot after the screens. In landscape it is only **drawn** at the top (see [Tab bar stays in one slot](../decisions/tab-bar-single-slot.md)).

## Props used (expo-router 58 API)

- `state.routes` and `state.index`: the tabs and which one is focused.
- `descriptors[route.key].options.title`: the label, falling back to `route.name`.
- `emitter` and `navigateToTab(routeKey)`. In expo-router 58, `BottomTabBarProps` has these **instead of** `navigation`.

## Press logic (same pattern as the default bar)

```ts
const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
if (!focused && !event.defaultPrevented) navigateToTab(route.key);
```

Pressing the active tab does nothing harmful.

## Styles

- **Portrait:** in the flow below the screens, height `frame.tabBarHeight + insets.bottom`, `paddingBottom: insets.bottom`, 2-point top border.
- **Landscape:** `position: 'absolute'`, `top: 0`, `left: 0`, `right: 0`, height `frame.tabBarHeight`, no bottom inset, 2-point bottom border. The root layout sets `sceneStyle.paddingTop` to the same height, so screens start below it.
- Both: `cardBg` background, `borderColor` border, horizontal padding `Layout.tabBarPaddingHorizontal` (10) plus the left and right insets, tabs centered.
- Tab: height `sizes.tabHeight`, margin 4, radius 10, 2-point border, bold label of `sizes.tabLabel`, opacity 0.7 when pressed. Width: `flex: 1` in phone portrait, and `frame.tabWidth` (120 or 150) elsewhere.
- **Inactive:** `surfaceMuted` background, `borderDark` border, `textSecondary` label.
- **Active:** `primaryBlueHover` background, `primaryBlueDeep` border, `onPrimary` label, shadow `0 3px 8px primaryShadow`. Why not `primaryBlue`: [Active tab contrast](../decisions/active-tab-contrast.md).

## Accessibility

The container has `accessibilityRole="tablist"`. Each tab has `accessibilityRole="tab"`, `accessibilityState={{ selected }}` and `accessibilityLabel={label}`. TalkBack was checked on a device.

## Tests

`src/__tests__/unit/components/tab-bar-test.tsx` renders through `renderRouter`:
- the tab order, and the height plus inset in portrait
- phone landscape (absolute at the top, bottom border, 120-point tabs), tablet portrait (150-point tabs) and the scene padding
- Timeline is selected at start
- pressing Events goes to `/events`, and pressing it again stays there
- each tab is at least 44 tall
- the light and dark colors

Spec: [app-shell](../specs/app-shell.md). Decision: [JS tabs with a custom tab bar](../decisions/js-tabs-custom-tab-bar.md).
