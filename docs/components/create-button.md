---
type: Component
title: Create button
description: The floating round "+" button, 56×56, 20 points from the right and 10 points above the footer. Pressing it does nothing until the creation box exists.
tags: [component, fab, shell]
resource: ../../src/components/create-button.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Create button

`CreateButton`, no props. It is the last child of the root `View` in [the shell layout](../architecture/shell-layout.md), so it floats over every section and is never re-mounted.

## Styles

- `position: absolute`, `right: Layout.fabOffsetRight` (20), `bottom: Layout.footerHeight + insets.bottom + Layout.fabOffsetBottom` (75 + inset + 10).
- 56×56, round, `primaryBlue` fill, 3-point `cardBg` ring, shadow `0 4px 12px primaryShadow`.
- `+` in `onPrimary`, 28-point bold, with `includeFontPadding: false` so it stays centered on Android.
- Opacity 0.8 when pressed.

## Behavior

- `accessibilityRole="button"`, `accessibilityLabel="Create"`.
- `onPress` is a no-op. Later it will open the creation box (Evento, Texto, Imagen), see `components.creation_box` in the [design tokens](../design-system/design-tokens.md).
- The FAB keeps `#0084ff` in light mode: white 28-point bold text is large text and only needs 3:1.

## Tests

`src/__tests__/unit/components/create-button-test.tsx` checks the label, the 56×56 size, `right` 20, `bottom` 75 + inset + 10, and that pressing it is a no-op.

Spec: [app-shell](../specs/app-shell.md) (floating create button).
