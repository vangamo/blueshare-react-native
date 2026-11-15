---
type: Component
title: Avatar image
description: The round avatar, a circle with a strong-ink border showing the profile photo cropped to fill it, or the 👵 emoji when there is no photo or it can't be read. Used by the header avatar and the profile dialog's preview.
tags: [component, avatar, profile]
resource: ../../src/components/avatar-image.tsx
status: stable
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-15T12:00:00Z
---

# Avatar image

`AvatarImage({ uri, size, emojiSize, label? })`.

- A circle of `size` (border included), a 2-point (`Layout.borderWidth`) `primaryDark` border, `avatarBg` background and `overflow: hidden`.
- With a `uri` it draws the photo with `expo-image` and `contentFit="cover"`. With no `uri`, or after the image fails to load (`onError`), it draws `👵` at `emojiSize`. A different `uri` tries to load again.
- With a `label` the circle is `accessible` with role `image` and that name ("Foto de perfil" or "Sin foto de perfil" in the dialog). Without one it is hidden from screen readers (`no-hide-descendants`): the header button around it already carries "Profile".
- Sizes come from the caller: `sizes.avatar` and `sizes.avatarEmoji` in the [header](app-header.md), `sizes.profileAvatar` and `sizes.profileAvatarEmoji` in the [profile dialog](profile-dialog.md).

## Tests

`src/__tests__/unit/components/avatar-image-test.tsx`: the emoji with no photo, the cropped photo, the fallback and retry, the label and role, and size and colors in both palettes.
