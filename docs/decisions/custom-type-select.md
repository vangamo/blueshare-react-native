---
type: Decision
title: Custom type select
description: The type select is a Pressable field with a transparent Modal list, instead of the platform picker, so it looks the same on Android and iOS.
tags: [decision, components, accessibility]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Custom type select (add-text-items D8)

**Decision:** `TypeSelect` is a 44-point `Pressable` (a button named "Crear nuevo elemento", with the selection as its value) that opens a transparent fading `Modal`: an `overlay` backdrop that closes it, and a card-like sheet with three option rows (`radio` role with a `checked` state). The placeholder is never an option.

**Rejected:**
- `@react-native-picker/picker` (in Expo Go): a ~200-point wheel on iOS, a hard-to-style closed field on Android, a disabled placeholder only on Android, and a different look per platform, against the product principle.
- Three large buttons in place of the select plus Guardar: one tap instead of three, but the user kept the sketch's select.

See [Type select](../components/type-select.md).
