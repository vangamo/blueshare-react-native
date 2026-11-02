---
type: Decision
title: Adaptive layout
description: The layout comes from the window size in one pure function, two size sets and four frames replace the fixed sizes, and Android's full-screen editor stays on.
tags: [decision, layout, tablet, landscape]
resource: ../../src/constants/theme.ts
status: stable
---

# Adaptive layout (adaptive-layout D1, D2, D9)

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

## The full-screen editor stays on (D9)

`disableFullscreenUI` is not set. On phones in landscape, Android's full-screen editor gives seniors a large typing area, and a device spike showed it keeps the text and the focus. Tablets do not use it.

Related: [Tab bar stays in one slot](tab-bar-single-slot.md), [Mobile only, no web](mobile-only.md).
