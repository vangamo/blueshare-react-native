---
type: Component
title: App header
description: The fixed header, rendered once by the root layout, with the menu button, title/search field and avatar button in one row. The avatar opens the profile dialog, whose open state the header holds.
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
  3. **Avatar:** a `Pressable` of at least `Layout.touchTarget` (44) square around an [`AvatarImage`](avatar-image.md) of `sizes.avatar` (42 or 46): the saved photo cropped to the circle, or `👵` at `sizes.avatarEmoji` (20 or 22).

## Behavior and accessibility

- Menu: `accessibilityRole="button"`, `accessibilityLabel="Menu"`, a **no-op** `onPress` (the side menu is not built yet), opacity 0.7 when pressed.
- Avatar: `accessibilityRole="button"`, `accessibilityLabel="Profile"`, opacity 0.7 when pressed. Pressing it dismisses the keyboard and opens the [profile dialog](profile-dialog.md) (nothing happens while the profile is still loading; if it failed to load the dialog opens with only the error). The header holds `profileOpen` and an open counter used as the dialog's `key`, so each open starts from the saved profile and a rotation keeps the dialog, because the header never remounts.

## Tests

`src/__tests__/unit/components/app-header-test.tsx`:
- the menu button is at least 44×44, and pressing it neither navigates nor throws
- the avatar is a "Profile" button of at least 44×44 in all four test windows, showing the emoji, and pressing it opens the profile dialog
- the height equals the frame height plus the top inset, in phone portrait, phone landscape and tablet portrait (paddings with side insets, title max width, tablet sizes)
- the colors follow the dark palette when dark mode is forced

Spec: [app-shell](../specs/app-shell.md) (header layout, menu button, avatar), user-profile (the dialog the avatar opens).
