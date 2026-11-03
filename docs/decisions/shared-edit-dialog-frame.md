---
type: Decision
title: Shared edit dialog frame
description: The text and image edit dialogs share one EditDialogFrame (modal, title, buttons, confirmation, busy and error state), and each keeps its own body state.
tags: [decision, edit-dialog, components, image]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Shared edit dialog frame (add-image-items D10)

**Decision:** `EditDialogFrame` (`src/components/edit-dialog-frame.tsx`) holds everything around an edit dialog's fields: the `Modal` and overlay, the `ScrollView` and column width, the title and close button, the edit step (the body, Cancelar and Guardar, a divider and the deletion button), the confirmation step, busy and error state, the double-tap guard, the Android back button and the error announcements. It takes `title`, `deleteLabel`, `confirmTitle`, `canSave`, `onSave`, `onDelete`, `onClose` and a render-prop body.

- `EditTextDialog` is the text body (one text state), `EditImageDialog` the image body (`newPhoto`, `altText`, `caption`), and `EditEventDialog` the event body (`photos` drafts, `title`, `category`, `description`, added by `event-items`). The event dialog needed no change to the frame.
- **The body's state stays in the body's component**, outside the frame, so it survives the confirmation step ("No, volver" keeps the edit).
- The body receives `clearError`, so typing hides a failure message as before.
- The frame disables Guardar while busy, so a body only says whether it holds a real change.
- The picker message is shown by the image and event bodies, because only they have a picker. The event body shares its fields with the creation box through `EventFields`, as the image body does through `ImageFields`.

**Why:** two copies of the confirmation, error and back-button logic would drift.

**Rejected:** a separate image dialog copied from the text one.

**Guard:** `edit-text-dialog-test.tsx`, `edit-text-item-test.tsx` and `timeline-back-button-test.tsx` passed unchanged after the move, before the image dialog was added.

See [Edit dialog](edit-dialog.md) (the original modal and in-dialog confirmation decisions), [Edit text dialog](../components/edit-text-dialog.md), [Edit image dialog](../components/edit-image-dialog.md) and [Edit event dialog](../components/edit-event-dialog.md).
