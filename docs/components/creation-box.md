---
type: Component
title: Creation box
description: Inline box at the top of the Timeline for creating an item: a choose step (type select, Cancelar, Guardar) and, for Texto, a write step (text area, Cancelar, Crear).
tags: [component, creation-box, items]
resource: ../../src/components/creation-box.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Creation box

`CreationBox`, no props. The [Timeline feed](timeline-feed.md) renders it as the list header while the box is open. It reads [the creation box state](creation-box-provider.md) and `useTimeline().createText` and `createImage`, and renders nothing while closed.

## Styles

**Sizes come from the layout:** padding, radius and bottom margin from `sizes.cardPadding`, `cardRadius` and `itemGap`, title and error text `sizes.boxTitle`. The values below are the phone set (tablet: [Sizes and typography](../design-system/layout-sizes.md)). The box fills the feed's centered content column.


- Box: 2-point **dashed** `primaryBlue` border, `creationBg`, `Radius.lg` (16), `Spacing.lg` padding and bottom margin, `Layout.creationGap` (10) between children.
- Title: 14-point bold `textMain` ("Crear nuevo elemento:" or "Crear nuevo elemento de texto:").
- Buttons: a row of two [box buttons](box-button.md), each `flex: 1`, `Layout.creationGap` apart. Cancelar on the left.
- Text area: the shared `BoxTextArea` (`src/components/box-text-area.tsx`, also used by the [edit dialog](edit-text-dialog.md)): multi-line, `Layout.textAreaMinHeight` (96) to `Layout.textAreaMaxHeight` (200), then it scrolls inside. 2-point `primaryDark` border, `Layout.controlRadius`, `cardBg`, 16-point `textMain`, `textAlignVertical="top"`, `maxLength={TEXT_MAX_LENGTH}`.
- Save error: 14-point bold `textMain` on `creationBg`.

## Behavior

- **Choose step:** the [type select](type-select.md). Guardar is disabled until a type is chosen. With Texto it moves to the write step, with Imagen to the image step; with Evento it does nothing yet.
- **Write step:** the text area has `maxLength={TEXT_MAX_LENGTH}`, `autoFocus` and the label "Crear nuevo elemento de texto". It mounts only when entering the step, so returning from another tab does not refocus it or open the keyboard.
- **Crear** is disabled while the text is blank (`text.trim()` empty) and while saving. It calls `createText`, then `Keyboard.dismiss()` and `close`. A ref guard ignores a second tap that lands before the "saving" render.
- **Failed save:** `saveFailed`. The text stays, "⚠️ No se pudo guardar. Inténtalo de nuevo." shows with `accessibilityLiveRegion="polite"` (Android) and `AccessibilityInfo.announceForAccessibility` (iOS), and Crear stays usable to retry. Typing hides the message.
- **Image step** (title "Crear nuevo elemento de imagen:", no keyboard on entry): `ImageFields` (`src/components/image-fields.tsx`, also used by the [edit image dialog](edit-image-dialog.md)) shows, top to bottom, the [photo preview](photo-preview.md) labeled "Foto elegida" (once a photo is chosen), the "Elegir foto" or "Cambiar foto" button (a secondary [box button](box-button.md)), the "Texto alternativo" label, hint ("Describe la foto para quien no pueda verla.") and multi-line field (`ALT_TEXT_MAX_LENGTH`), and the "Pie de foto" label and single-line [`BoxTextField`](field-components.md) (`CAPTION_MAX_LENGTH`). Then Cancelar and Crear.
  - The photo button calls `usePickPhoto()`: no permission prompt, a cancelled pick changes nothing, and picking again keeps the typed texts. A picker error dispatches `pickerFailed`, and "⚠️ No se pudo abrir la galería. Inténtalo de nuevo." shows with a live region (and `announceForAccessibility` on iOS). Pressing the button again retries.
  - **Crear** is disabled until a photo is chosen (texts alone don't enable it) and while saving. It calls `createImage({ photo, altText, caption })`, which copies the photo and trims the texts. A ref guard ignores a second tap. A failed save keeps the photo and the fields and shows "⚠️ No se pudo guardar. Inténtalo de nuevo.".
  - The draft holds the picker's cache URI. The copy into app storage happens only on Crear.
- **Cancelar** dismisses the keyboard and dispatches `close`: the type, text, photo and texts are discarded, and the next open starts at the choose step.
- The Android back button acts like Cancelar while the box is on screen; that listener lives in the [Timeline feed](timeline-feed.md).

## Tests

`src/__tests__/unit/components/creation-box-test.tsx`, through `CreationBoxHarness` (`src/test-utils/creation-box-harness.tsx`): Guardar enabled per type, Evento and Imagen staying, Texto moving on, the box style in both palettes, Crear disabled for blank text, `maxLength`, saving and closing, a double tap creating one item (with `GatedSqlDatabase`), a failing save keeping the text and retrying (with `FailingSqlDatabase`), and Cancelar discarding.

The image step is covered in the same file (`describe('CreationBox, image step')`) with `expo-image-picker` mocked: the step, picking, cancelling, replacing, picker errors, Crear's rule, saving, a double tap, a failing save, Cancelar, the limits and hint, and the tablet sizes.

Spec: [item-creation](../specs/item-creation.md). Decisions: [Text limit](../decisions/text-limit.md), [Spanish copy and labels](../decisions/spanish-copy-labels.md).
