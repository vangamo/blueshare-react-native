---
type: Decision
title: Tokens in JSON
description: Colors and token sizes live in src/constants/design-system.json, and theme.ts maps it to typed exports with the same names as before.
tags: [decision, theming, design-tokens]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Tokens in JSON (D4)

**Decision:** `src/constants/design-system.json` is a corrected copy of `sketches/design_system.json`, with a `colors_dark` block added. `theme.ts` imports it (`resolveJsonModule` is on) and maps snake_case to camelCase and `"12px"` to `12`. `Layout` stays in TypeScript.

**Why:**
- One file holds the design system, in the same shape as the designer's file.
- Changing a value changes every place that uses it.
- `theme.ts` and the components hold no color literals.
- Tokens must be module-level constants, because `StyleSheet.create` uses `Spacing`, `Radius` and `FontSize` outside components. That rules out reading them inside a hook.

**Kept unchanged:** `sketches/design_system.json` stays the original mock.

**Guards:**
- The typecheck fails if `colors_dark` is missing a key.
- `design-system-test.ts` checks that the JSON and the exports stay in sync.
- `px()` throws on an unsupported size.

See [Design tokens](../design-system/design-tokens.md).
