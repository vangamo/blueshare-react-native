---
type: Decision
title: Creation box buttons
description: Guardar and Crear use the active-tab blue for contrast, a disabled primary is faded rather than gray, and three new color roles were added.
tags: [decision, accessibility, colors, components]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Creation box buttons (add-text-items D10)

**Decision:**
- **Primary** (Guardar, Crear): `primaryBlueHover` with an `onPrimary` label, not the mock's `#0084ff`, because white on `#0084ff` at 15 points is 3.66:1, below AA. Same reason as [Active tab contrast](active-tab-contrast.md).
- **Disabled primary:** the same button at `Layout.disabledOpacity`, not gray, so it never looks like Cancelar. Disabled labels are exempt from contrast (WCAG inactive controls).
- **Secondary** (Cancelar) and **card actions** (Editar, Compartir): `surfaceMuted` with a `borderDark` border and a `textMain` label. The Cancelar border is decorative (about 1.4:1, like the inactive tab border); the label identifies the button.
- **New color roles** in both palettes: `card_shadow`, `divider` and `overlay`. New `Layout` sizes for the box, text area, card and option rows. Eight new contrast pairs in `theme-test.ts`.

See [Box button](../components/box-button.md), [Color palettes](../design-system/color-palettes.md) and [Sizes and typography](../design-system/layout-sizes.md).
