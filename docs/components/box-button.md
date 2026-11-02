---
type: Component
title: Box button
description: The creation box and edit dialog buttons: primary (Guardar, Crear) on the active-tab blue, secondary (Cancelar, No, volver) on the muted surface, danger variants for deletion, and a faded disabled state.
tags: [component, button, creation-box, accessibility]
resource: ../../src/components/box-button.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Box button

`BoxButton({ label, variant, disabled?, onPress, style? })`.

## Styles

| Variant | Background | Border | Label |
| --- | --- | --- | --- |
| `primary` | `primaryBlueHover` | none | `onPrimary`, 15-point bold |
| `secondary` | `surfaceMuted` | 2-point `borderDark` | `textMain`, 15-point bold |
| `danger` | `danger` | none | `onDanger`, 15-point bold |
| `dangerOutline` | `surfaceMuted` | 2-point `danger` | `danger`, 15-point bold |

`danger` ("Sí, borrar") is the deletion confirmation. `dangerOutline` ("Borrar este texto") is the quieter button that asks for it, so Guardar stays the main action of the [edit dialog](edit-text-dialog.md).

- At least `Layout.touchTarget` (44) tall, `Layout.controlRadius` corners. Opacity 0.8 when pressed.
- **Disabled:** view opacity `Layout.disabledOpacity` (0.45). It is a faded primary, not gray, so a disabled Guardar never looks like Cancelar. Disabled labels are exempt from contrast rules.
- Primary uses `primaryBlueHover`, not the mock's `#0084ff`: white on `#0084ff` is 3.66:1, below AA for 15 pt text. See [Color palettes](../design-system/color-palettes.md).
- The Cancelar border is decorative (about 1.4:1 on `creationBg`); the label identifies the button.

## Behavior

`accessibilityRole="button"`, `accessibilityLabel` equal to the visible text, and `accessibilityState={{ disabled }}`. A disabled button ignores presses.

## Tests

`src/__tests__/unit/components/box-button-test.tsx`: height and label, colors per variant (including both danger variants) in both palettes, and the disabled state (opacity, announced, `onPress` not called).

Spec: [item-creation](../specs/item-creation.md) (creation box buttons) and [app-theming](../specs/app-theming.md). Decision: [Creation box buttons](../decisions/creation-box-buttons.md).
