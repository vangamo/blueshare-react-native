---
type: Component
title: App header
description: The fixed header, rendered once by the root layout, with the menu button, title/search field and avatar in one row.
tags: [component, header, shell]
resource: ../../src/components/app-header.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# App header

`AppHeader`, no props. It is rendered above `Tabs` in [the root layout](../architecture/shell-layout.md).

## Layout

- Height `frame.headerHeight + insets.top` (70, 56, 75, 75 by layout), `paddingTop: insets.top`, horizontal padding `sizes.headerPaddingHorizontal` (16 phone, 24 tablet) plus the left and right insets.
- `cardBg` background, with a 2-point `borderColor` bottom border.
- Row, left to right:
  1. **Menu button:** a `Pressable`, at least `sizes.menuButton` (44 phone, 48 tablet), `≡` glyph in `primaryBlue`, `creationBg` background, 2-point `primaryBlue` border, radius 10.
  2. **[Title search field](title-search-field.md):** `flex: 1`, horizontal margin `Spacing.md`. Capped at `frame.titleMaxWidth` (none, 300, 350, 400) and centered with auto margins; the field height and font come from `sizes`.
  3. **Avatar:** a `View`, `sizes.avatar` (42 or 46), round, 2-point `primaryDark` border, `avatarBg` background, `👵` at `sizes.avatarEmoji` (20 or 22).

## Behavior and accessibility

- Menu: `accessibilityRole="button"`, `accessibilityLabel="Menu"`, a **no-op** `onPress` (the side menu is not built yet), opacity 0.7 when pressed.
- Avatar: `accessible` with `accessibilityLabel="Profile"` and **no press handler** (display only).

## Tests

`src/__tests__/unit/components/app-header-test.tsx`:
- the menu button is at least 44×44, and pressing it neither navigates nor throws
- the Profile label is present
- the height equals the frame height plus the top inset, in phone portrait, phone landscape and tablet portrait (paddings with side insets, title max width, tablet sizes)
- the colors follow the dark palette when dark mode is forced

Spec: [app-shell](../specs/app-shell.md) (header layout, menu button, avatar).
