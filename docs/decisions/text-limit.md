---
type: Decision
title: Text limit
description: Texts are trimmed and limited to TEXT_MAX_LENGTH (8192) UTF-16 code units, one setting enforced in the domain and in the text area.
tags: [decision, items, validation]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Text limit (add-text-items D9)

**Decision:** `src/constants/limits.ts` holds `TEXT_MAX_LENGTH = 8192`, the single setting. The text area uses `maxLength`, and the domain's `normalizeTextBody` trims and rejects blank or too-long text, whatever the source (later, items received over Bluetooth too). "Crear" is enabled when `text.trim().length > 0`.

**Why:** one value in one place, checked where every item enters the domain. No SQL constraint, so changing it needs no migration.

**Accepted gap:** the length counts UTF-16 code units, like `TextInput.maxLength`, so an emoji can count as 2. Fine at 8192.
