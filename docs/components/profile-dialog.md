---
type: Component
title: Profile dialog
description: Dialog over the whole app, opened from the header avatar, to change the user's name and avatar photo. Built on the shared edit dialog frame with a discard confirmation and a Bluetooth placeholder button.
tags: [component, profile, dialog, accessibility]
resource: ../../src/components/profile-dialog.tsx
status: stable
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-15T12:00:00Z
---

# Profile dialog

`ProfileDialog({ onClose })`, rendered by the [app header](app-header.md) while `profileOpen` is true, with a new `key` on every open so its fields start from the saved profile. It reads `useProfile()` ([Items provider](items-provider.md)) and uses the shared `EditDialogFrame` (see [Shared edit dialog frame](../decisions/shared-edit-dialog-frame.md)), so the box, overlay, close button, double-tap guard and Android back are the edit dialogs'. It is a `Modal`, so it covers the header, the section and the tab bar; the section underneath never changes, which is how "return to the last screen" works.

## Contents, top to bottom

- Title "Editar perfil:" and the close button.
- A centered [`AvatarImage`](avatar-image.md) at `sizes.profileAvatar` (112 phone, 136 tablet), labelled "Foto de perfil" or "Sin foto de perfil".
- "Elegir foto" (or "Cambiar foto" when a photo is shown) and, with a photo, "Quitar foto". Picking uses `usePickPhoto()`, with a re-entry guard and the gallery message `PICKER_ERROR_MESSAGE` (announced on iOS).
- "Nombre" label with the hint "Tu nombre completo o cómo te llaman." and a `BoxTextField` (60 characters, `autoCapitalize="words"`, no `autoFocus`).
- Cancelar and Guardar, a divider, and "Compartir por Bluetooth" (`secondary`, does nothing yet).

## State and rules

- `name`, `avatar: AvatarInput` (`keep`, `remove` or `picked`) and `pickerFailed`. `canSave` is computed during render: the trimmed name differs from the saved one, or the avatar is not `keep`. Removing a photo the profile never had returns to `keep`.
- Guardar calls `updateProfile({ name, avatar })`. Messages (`saveErrorMessage`): an `InvalidProfileError` on the name gives "⚠️ Escribe tu nombre.", on the avatar "⚠️ No se pudo usar esa foto. Elige otra.", anything else "⚠️ No se pudo guardar. Inténtalo de nuevo." Editing the name or the photo clears the message.
- `confirmDiscard` is on: Cancelar, Cerrar and back ask "¿Descartar los cambios?" when `canSave` is true.
- If the profile could not be loaded the frame is `editable={false}` and shows "⚠️ No se pudo cargar tu perfil." with Cancelar only.

## Tests

`src/__tests__/unit/components/profile-dialog-test.tsx`, with `src/test-utils/profile-dialog-harness.tsx` (adapters on a database with a seeded profile; the picker is mocked).

Specs: user-profile (OpenSpec change `user-profile`).
