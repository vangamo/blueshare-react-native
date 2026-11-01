---
type: Component
title: Type select
description: The creation box field that picks Evento, Texto or Imagen. A 44-point field that opens a list in a transparent Modal; tapping outside or pressing back closes only the list.
tags: [component, select, creation-box, accessibility]
resource: ../../src/components/type-select.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Type select

`TypeSelect({ value, onChange })`. Used by the [creation box](creation-box.md) choose step. The options (`TYPE_OPTIONS`) live in the component: "📅 Evento", "📝 Texto", "📷 Imagen". The placeholder "Selecciona una opción" is never an option.

## Styles

- Field: at least `Layout.touchTarget` (44) tall, 2-point `primaryDark` border, `Layout.controlRadius`, `cardBg`, 16-point semibold `textMain`, with a `▾` chevron.
- List: a transparent `Modal` (`animationType="fade"`, `statusBarTranslucent`, `navigationBarTranslucent`) over an `overlay` backdrop. The sheet is `cardBg` with a `borderColor` border and `Radius.lg`. Rows are at least `Layout.optionRowHeight` (56) tall; the selected one has a `creationBg` background and a `✓`.

## Behavior

- The field is a button labeled "Crear nuevo elemento", with the selection or the placeholder as its `accessibilityValue`.
- Rows have `accessibilityRole="radio"` and `accessibilityState.checked`.
- Picking a row calls `onChange` and closes the list. Tapping the backdrop (a button labeled "Cerrar lista") or the Modal's `onRequestClose` (Android back) closes only the list and keeps the value.
- Why a custom select instead of `@react-native-picker/picker`: it looks the same on both platforms, never draws an iOS wheel inside the box, and keeps the placeholder out of the list.

## Tests

`src/__tests__/unit/components/type-select-test.tsx`: the placeholder value, the field style, the three options in order, picking, checked states, and closing by backdrop and by `onRequestClose` (found through `testID="type-select-list"`).

Spec: [item-creation](../specs/item-creation.md). Decision: [Custom type select](../decisions/custom-type-select.md).
