---
type: Decision
title: Adaptive layout
description: The layout comes from the window size in one pure function, two size sets and four frames replace the fixed sizes, the title field waits out a rotation, safe areas and the content column are explicit, and Android's full-screen editor stays on.
tags: [decision, layout, tablet, landscape]
resource: ../../src/constants/theme.ts
status: stable
---

# Adaptive layout (adaptive-layout D1, D2, D4 to D9)

From the change `adaptive-layout` (`openspec/changes/archive/2026-11-02-adaptive-layout/`). D3 (the tab bar stays in one slot) has its own page: [Tab bar stays in one slot](tab-bar-single-slot.md).

## Layout from the window size (D1)

`layoutFor(width, height)` returns one of four layouts: landscape when the window is wider than tall, tablet when its shorter side is at least 600 points. `useWindowSize()` wraps `useWindowDimensions()` (so Jest mocks one module) and `useShellLayout()` computes `{ kind, device, landscape, frame, sizes, columnWidth }` during render. The window is used, not the screen, so split screen and freeform windows get the layout that fits.

**Rejected:**
- `expo-device` `deviceType`: wrong in split screen, one more dependency, says nothing about orientation.
- `expo-screen-orientation` listeners: the window size already changes on rotation, and they would duplicate the source of truth.
- A `LayoutProvider` context: `useWindowDimensions` already re-renders its users.

## Two size sets and four frames (D2)

`Sizes.phone` and `Sizes.tablet` hold component and font sizes (they depend only on the device size). `Frames[kind]` holds bar heights, the tab bar position, tab and title widths, the content column and the create button offset (they depend on the whole layout). `Layout` keeps only values that never vary. The phone set is today's phone portrait look, so it did not change. See [Sizes and typography](../design-system/layout-sizes.md).

**Rejected:**
- One scale factor (tablet = phone × 1.1): the mock's values are not proportional, and rounding would give sizes nobody designed.
- Two `StyleSheet`s per component: doubles every style block and drifts.
- The platform font scale: it is a user setting, not a device-size setting.

## The title field ignores the keyboard hide caused by a rotation (D4)

A rotation fires `keyboardDidHide` once, which used to blur the title field. The field now waits `Layout.keyboardHideGraceMs` (400 ms) and blurs only if no `keyboardDidShow` came and the window size is unchanged. The size check covers platforms that do not fire `keyboardDidShow` after a rotation. A real dismissal still blurs, 400 ms later. See [Title search field](../components/title-search-field.md).

**Rejected:** removing the listener (Android keeps the field focused after Back, and the rest state must return); ignoring hides for a fixed time after any window change (the hide can arrive before the size change).

## Safe areas on every side (D5) and the content column (D6)

The header, tab bar, create button, feed and dialogs add the left and right insets, and in landscape, with no bar below, the content and the create button add the bottom inset. The column is an explicit width (`columnWidth` from `useShellLayout()`, `useContentStyle()` for the feed) instead of `maxWidth` with percentages, which makes the Jest assertions exact and behaves the same inside `ScrollView` content containers.

## App configuration (D7) and tests (D8)

`app.json` has `orientation: "default"` and `ios.supportsTablet: true`, `requireFullScreen` stays at its default (iPad Split View works), and there is no config plugin. Jest mocks `use-window-size`, starts in phone portrait (Jest's own 750×1334 window counts as a tablet) and switches with `setMockWindow()`; a rotation journey test asserts that text inputs keep the same host instance. See [Testing](../development/testing.md).

## The full-screen editor stays on (D9)

`disableFullscreenUI` is not set. On phones in landscape, Android's full-screen editor gives seniors a large typing area, and a device spike showed it keeps the text and the focus. Tablets do not use it.

Related: [Tab bar stays in one slot](tab-bar-single-slot.md), [Mobile only, no web](mobile-only.md).
