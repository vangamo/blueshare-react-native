---
type: Specification
title: user-profile
description: The header avatar opens a profile dialog to change the user's name and avatar photo, with Guardar, Cancelar, a discard confirmation, a Bluetooth placeholder button and the saved photo shown in the header avatar.
tags: [spec, implemented, profile, dialog, avatar]
resource: ../../openspec/specs/user-profile/spec.md
status: stable
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-15T19:00:00Z
---

# user-profile (implemented)

Full text: `openspec/specs/user-profile/spec.md`. From the change `user-profile` (archived 2026-11-15 in `openspec/changes/archive/2026-11-15-user-profile/`).

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| The avatar opens the profile dialog | Tapping the header avatar opens the dialog from any tab, dismissing the keyboard first. | [App header](../components/app-header.md) |
| Closing returns to the previous section | The tab underneath never changes, so closing always returns to it. | [Profile dialog](../components/profile-dialog.md), [Profile dialog decision](../decisions/profile-dialog.md) |
| Profile dialog appearance | An edit-style dialog at the content column width, not full screen on tablets, over the header, tabs and `+`. | [Profile dialog](../components/profile-dialog.md), [Shared edit dialog frame](../decisions/shared-edit-dialog-frame.md) |
| Profile form contents | Avatar preview, photo buttons, "Nombre", Cancelar, Guardar and "Compartir por Bluetooth". | same |
| Fields start from the saved profile | Every open starts from what is saved. | `key` counter in `AppHeader` |
| Name field | One line, at most 60 characters, a hint, capitals per word. | `PROFILE_NAME_MAX_LENGTH` |
| Choosing and removing the avatar photo | The picker offers one photo, shown cropped in a circle; "Quitar foto" goes back to the emoji. | [Avatar image](../components/avatar-image.md) |
| Guardar is enabled only for a real change | A different trimmed name or a new or removed photo. | `ProfileDialog` |
| Guardar saves, the name is required, an unusable photo blocks the save | Errors are shown and announced and the dialog stays open. A failed save keeps the edit. | `updateProfile`, [Profile module](../architecture/profile-module.md) |
| Closing without changes, confirmation before discarding | Cancelar, the close button and Android back close at once when nothing changed, otherwise ask "¿Descartar los cambios?". | `EditDialogFrame` `confirmDiscard` |
| Bluetooth sharing placeholder | "Compartir por Bluetooth" does nothing yet. | Phase 4 |
| Profile that can't be loaded | The dialog opens with only an error message. | `PROFILE_LOAD_ERROR_MESSAGE` |
| Header avatar shows the profile photo | The saved photo, or 👵 when there is none. | [Avatar image](../components/avatar-image.md) |
| Profile dialog accessibility | Roles and labels on every control, touch targets of at least 44×44, WCAG AA in both palettes. | [Accessibility](../development/accessibility.md) |
