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

- Height `Layout.headerHeight + insets.top`, `paddingTop: insets.top`, horizontal padding `Spacing.lg` (16).
- `cardBg` background, with a 2-point `borderColor` bottom border.
- Row, left to right:
  1. **Menu button:** a `Pressable`, at least 44×44, `≡` glyph in `primaryBlue`, `creationBg` background, 2-point `primaryBlue` border, radius 10.
  2. **[Title search field](title-search-field.md):** `flex: 1`, horizontal margin `Spacing.md`.
  3. **Avatar:** a `View`, 42×42, round, 2-point `primaryDark` border, `avatarBg` background, `👵` at 20 pt.

## Behavior and accessibility

- Menu: `accessibilityRole="button"`, `accessibilityLabel="Menu"`, a **no-op** `onPress` (the side menu is not built yet), opacity 0.7 when pressed.
- Avatar: `accessible` with `accessibilityLabel="Profile"` and **no press handler** (display only).

## Tests

`src/__tests__/unit/components/app-header-test.tsx`:
- the menu button is at least 44×44, and pressing it neither navigates nor throws
- the Profile label is present
- the height equals 70 plus the top inset
- the colors follow the dark palette when dark mode is forced

Spec: [app-shell](../specs/app-shell.md) (header layout, menu button, avatar).
