---
type: Component
title: Create button
description: The floating round "+" button, sized by the layout, 20 points (phone) or 28 (tablet) from the right and above the tab bar or the bottom inset. On Timeline it opens the creation box and hides while the box is open; on Circles and Events it does nothing yet.
tags: [component, fab, shell]
resource: ../../src/components/create-button.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Create button

`CreateButton`, no props. It reads its action from `useCreateAction()` (`src/hooks/use-create-action.ts`). It is the last child of the root `View` in [the shell layout](../architecture/shell-layout.md), so it floats over every section and is never re-mounted.

## Styles

- `position: absolute`, `right: sizes.fabRight + insets.right` (20 phone, 28 tablet).
- `bottom`: in portrait `frame.tabBarHeight + insets.bottom + frame.fabBottom` (10 phone, 16 tablet), in landscape `insets.bottom + frame.fabBottom` (16), because no bar sits below.
- `sizes.fab` square (56 phone, 60 tablet), round, `primaryBlue` fill, 3-point `cardBg` ring, shadow `0 4px 12px primaryShadow`.
- `+` in `onPrimary`, `sizes.fabFont` bold (28 or 30), with `includeFontPadding: false` so it stays centered on Android.
- Opacity 0.8 when pressed.

## Behavior

- `accessibilityRole="button"`, `accessibilityLabel="Create"`.
- `useCreateAction()` returns `{ visible, onPress }` from `usePathname()` and the [creation box state](creation-box-provider.md):

  | Pathname | Box | Visible | Press does |
  | --- | --- | --- | --- |
  | `/` | closed | yes | opens the creation box |
  | `/` | open | no (not rendered) | – |
  | `/circles` | any | yes | nothing yet (contact pairing comes later) |
  | `/events` | any | yes | nothing yet (event creation comes later) |

- Hidden means not rendered, so it is also out of the accessibility tree. The look never changes.
- The FAB keeps `#0084ff` in light mode: white `sizes.fabFont` bold (28 or 30) text is large text and only needs 3:1.

## Tests

`src/__tests__/unit/components/create-button-test.tsx` checks the label, the size and position in phone portrait, phone landscape, tablet portrait and tablet landscape, the palette, that pressing it on Timeline hides it, that pressing it on Circles or Events changes nothing, and that with the box open it shows on Events and hides again on Timeline.

Spec: [app-shell](../specs/app-shell.md) (floating create button, action per section, hidden while creating). Decision: [Create action per route](../decisions/create-action-per-route.md).
