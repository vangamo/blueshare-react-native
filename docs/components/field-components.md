---
type: Component
title: Field components
description: BoxTextField (single-line field) and FieldLabel (label with an optional hint) for the image step and the image dialog, next to BoxTextArea.
tags: [component, form, accessibility, image]
resource: ../../src/components/box-text-field.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Field components

## `BoxTextField`

`BoxTextField({ value, onChangeText, accessibilityLabel, accessibilityHint?, maxLength })`: the single-line field of the "Pie de foto" caption, styled like `BoxTextArea` (`cardBg` fill, `primaryDark` border of `Layout.borderWidth`, `Layout.controlRadius`, `inputFont`) and at least `controlHeight` (44) tall. `maxLength` is the domain limit, passed by the caller.

## `FieldLabel`

`FieldLabel({ label, hint? })`: the bold `textMain` label at `fieldLabel`, and the muted `textMuted` hint at `fieldHint`. The hint is hidden from screen readers here and passed to the field as its `accessibilityHint`, so it is read once, after the field's name.

Both are used by `ImageFields` ([Creation box](creation-box.md), [Edit image dialog](edit-image-dialog.md)). Contrast: [Color palettes](../design-system/color-palettes.md). Accessibility rules: [Accessibility](../development/accessibility.md).

## Tests

`src/__tests__/unit/components/box-text-field-test.tsx` (`maxLength`, 44-point height, theme colors, typing) and `field-label-test.tsx` (label, hint colors and sizes, hint hidden from screen readers).
