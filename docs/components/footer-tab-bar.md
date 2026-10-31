---
type: Component
title: Footer tab bar
description: Replaces the default JS tab bar with three equal text tabs that show the active section with a blue style and the selected accessibility state.
tags: [component, footer, tabs, navigation]
resource: ../../src/components/footer-tab-bar.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Footer tab bar

`FooterTabBar(props: BottomTabBarProps)`, passed to the navigator as `tabBar={(props) => <FooterTabBar {...props} />}`.

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

- Bar: height `Layout.footerHeight + insets.bottom`, `paddingBottom: insets.bottom`, horizontal padding 10, `cardBg` background, 2-point `borderColor` top border.
- Tab: `flex: 1`, height 44, horizontal margin 4, radius 10, 2-point border, 14-point bold label, opacity 0.7 when pressed.
- **Inactive:** `surfaceMuted` background, `borderDark` border, `textSecondary` label.
- **Active:** `primaryBlueHover` background, `primaryBlueDeep` border, `onPrimary` label, shadow `0 3px 8px primaryShadow`. Why not `primaryBlue`: [Active tab contrast](../decisions/active-tab-contrast.md).

## Accessibility

The container has `accessibilityRole="tablist"`. Each tab has `accessibilityRole="tab"`, `accessibilityState={{ selected }}` and `accessibilityLabel={label}`. TalkBack was checked on a device.

## Tests

`src/__tests__/unit/components/footer-tab-bar-test.tsx` renders through `renderRouter`:
- the tab order, and the footer height plus inset
- Timeline is selected at start
- pressing Events goes to `/events`, and pressing it again stays there
- each tab is at least 44 tall
- the light and dark colors

Spec: [app-shell](../specs/app-shell.md). Decision: [JS tabs with a custom tab bar](../decisions/js-tabs-custom-tab-bar.md).
