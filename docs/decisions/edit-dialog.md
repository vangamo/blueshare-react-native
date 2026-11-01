---
type: Decision
title: Edit dialog
description: Editing happens in a local-state RN Modal over the Timeline, not in a route, and deletion is confirmed inside the dialog, not with the system Alert.
tags: [decision, edit-dialog, components, accessibility]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T10:00:00Z
---

# Edit dialog (edit-text-items D5 to D7)

**Decision:**
- **Local state, no provider.** The feed holds only `editingId`. The item is derived during render, and the dialog (`key={item.id}`) is mounted per open, so its draft starts from the stored text. The creation box needs a provider above the tabs so its draft survives tab switches. A modal dialog doesn't.
- **A React Native `Modal`, not a route.** A route needs a navigation stack above the tabs (see [Known limitations](../product/known-limitations.md)), a route file and a deep link. The dialog only lives over the feed.
- **Confirmation inside the dialog, not `Alert.alert`.** The system alert has small, low-contrast buttons on Android that our tokens, AA tests and 44-point targets can't reach, it can clash with a visible `Modal` on iOS, and it is harder to test.
- **Quiet "Borrar este texto", solid "Sí, borrar".** The outline keeps Guardar as the main action. The solid danger style is for the confirmation itself.
- **New roles** `danger` (`#b91c1c` / `#f87171`) and `on_danger` (`#ffffff` / `#0f172a`), AA in both palettes. See [Color palettes](../design-system/color-palettes.md).
- **No `autoFocus`** on the text area, so the keyboard doesn't hide the dialog's other actions. The box sits near the top of the screen for the same reason.

See [Edit text dialog](../components/edit-text-dialog.md) and [Items schema](items-schema.md).
