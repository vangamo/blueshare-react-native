---
type: Component
title: Edit text dialog
description: Dialog over the Timeline opened by a card's Editar button, to change or delete a text item. An edit step (text area, Cancelar, Guardar, Borrar este texto) and a deletion confirmation step.
tags: [component, edit-dialog, items, accessibility]
resource: ../../src/components/edit-text-dialog.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T10:00:00Z
---

# Edit text dialog

`EditTextDialog({ item, onClose })`. The [Timeline feed](timeline-feed.md) renders it with `key={item.id}` while an item is being edited, so each open starts from the stored text. It reads `useTimeline().updateText` and `deleteItem`.

## Structure and styles

**Adaptive:** the box is `columnWidth` wide and centered (550 phone landscape, 500 tablet portrait, 600 tablet landscape), with padding, radius and text sizes from `sizes` (`cardPadding`, `cardRadius`, `boxTitle`, `cardText`). The scroll content pads for all four insets plus 16. On phones in landscape Android's full-screen editor may cover the dialog while typing. The values below are the phone set.


- A React Native `Modal` (`transparent`, `fade`, translucent status and navigation bars, like the [type select](type-select.md)) over an `overlay`-colored `View`. The overlay is **not** pressable: tapping outside does nothing.
- A `ScrollView` (`keyboardShouldPersistTaps="handled"`) puts the box at `insets.top + Spacing.lg` from the top, so the keyboard, which rises from the bottom, doesn't cover it. "Borrar este texto" can be reached by scrolling.
- Box: `creationBg`, a 2-point **solid** `primaryBlue` border (the creation box's is dashed), `Radius.lg`, `Spacing.lg` padding, `Layout.creationGap` between children, `accessibilityViewIsModal`.
- Header: the title (14-point bold `textMain`, role `header`) and the close button, a 44x44 `Pressable` with a "✕" glyph, labeled "Cerrar".
- **Edit step:** "Editar elemento de texto:", the shared `BoxTextArea` (label "Editar elemento de texto", no `autoFocus`), "Cancelar" and "Guardar", a `divider` line and a full-width "Borrar este texto" (`dangerOutline` [box button](box-button.md)).
- **Confirm step:** "¿Borrar este texto?", "Desaparecerá de tu línea de tiempo." (15-point `textMain`), "No, volver" (secondary) and "Sí, borrar" (`danger`).

## State and behavior

- A local `useReducer` (`step`, `text`, `busy`, `error`), started from `item.body`. There is no provider: the dialog is modal, so tabs can't change while it is open. The feed only keeps the id being edited.
- **Guardar** is enabled when the trimmed text is non-empty and differs from the stored text. It calls `updateText`, then `Keyboard.dismiss()` and `onClose`. The card updates in place.
- **Borrar este texto** dismisses the keyboard and shows the confirm step. "Sí, borrar" calls `deleteItem`, then closes. "No, volver" returns to the edit step with the edited text.
- A `busyRef` ignores a second tap before the "busy" render.
- **Closing:** the close button and Cancelar close without changes. `Modal.onRequestClose` (Android back) closes in the edit step and returns to the edit step from the confirm step.
- **Errors:** "⚠️ No se pudo guardar. Inténtalo de nuevo." (edit step) and "⚠️ No se pudo borrar. Inténtalo de nuevo." (confirm step), with `accessibilityLiveRegion="polite"` and `announceForAccessibility` on iOS. The text is kept and the button can retry.

## Tests

`src/__tests__/unit/components/edit-text-dialog-test.tsx`, through `EditDialogHarness` and `seededAdapters` (`src/test-utils/edit-dialog-harness.tsx`): prefilled text, Guardar enabled rules, saving and closing, a double tap (`GatedSqlDatabase`), failed saves and deletions with a retry (`FailingSqlDatabase`), every way of closing, the confirm step, both palettes, and the iOS announcements.

Specs: [item-editing](../specs/item-editing.md), [app-theming](../specs/app-theming.md). Decision: [Edit dialog](../decisions/edit-dialog.md).
