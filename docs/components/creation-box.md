---
type: Component
title: Creation box
description: Inline box at the top of the Timeline for creating an item: a choose step (type select, Cancelar, Guardar) and, for Texto, a write step (text area, Cancelar, Crear).
tags: [component, creation-box, items]
resource: ../../src/components/creation-box.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Creation box

`CreationBox`, no props. The [Timeline feed](timeline-feed.md) renders it as the list header while the box is open. It reads [the creation box state](creation-box-provider.md) and `useTimeline().createText`, and renders nothing while closed.

## Styles

- Box: 2-point **dashed** `primaryBlue` border, `creationBg`, `Radius.lg` (16), `Spacing.lg` padding and bottom margin, `Layout.creationGap` (10) between children.
- Title: 14-point bold `textMain` ("Crear nuevo elemento:" or "Crear nuevo elemento de texto:").
- Buttons: a row of two [box buttons](box-button.md), each `flex: 1`, `Layout.creationGap` apart. Cancelar on the left.
- Text area: multi-line, `Layout.textAreaMinHeight` (96) to `Layout.textAreaMaxHeight` (200), then it scrolls inside. 2-point `primaryDark` border, `Layout.controlRadius`, `cardBg`, 16-point `textMain`, `textAlignVertical="top"`.
- Save error: 14-point bold `textMain` on `creationBg`.

## Behavior

- **Choose step:** the [type select](type-select.md). Guardar is disabled until a type is chosen. With Texto it moves to the write step; with Evento or Imagen it does nothing yet.
- **Write step:** the text area has `maxLength={TEXT_MAX_LENGTH}`, `autoFocus` and the label "Crear nuevo elemento de texto". It mounts only when entering the step, so returning from another tab does not refocus it or open the keyboard.
- **Crear** is disabled while the text is blank (`text.trim()` empty) and while saving. It calls `createText`, then `Keyboard.dismiss()` and `close`. A ref guard ignores a second tap that lands before the "saving" render.
- **Failed save:** `saveFailed`. The text stays, "⚠️ No se pudo guardar. Inténtalo de nuevo." shows with `accessibilityLiveRegion="polite"` (Android) and `AccessibilityInfo.announceForAccessibility` (iOS), and Crear stays usable to retry. Typing hides the message.
- **Cancelar** dismisses the keyboard and dispatches `close`: the type and text are discarded, and the next open starts at the choose step.
- The Android back button acts like Cancelar while the box is on screen; that listener lives in the [Timeline feed](timeline-feed.md).

## Tests

`src/__tests__/unit/components/creation-box-test.tsx`, through `CreationBoxHarness` (`src/test-utils/creation-box-harness.tsx`): Guardar enabled per type, Evento and Imagen staying, Texto moving on, the box style in both palettes, Crear disabled for blank text, `maxLength`, saving and closing, a double tap creating one item (with `GatedSqlDatabase`), a failing save keeping the text and retrying (with `FailingSqlDatabase`), and Cancelar discarding.

Spec: [item-creation](../specs/item-creation.md). Decisions: [Text limit](../decisions/text-limit.md), [Spanish copy and labels](../decisions/spanish-copy-labels.md).
