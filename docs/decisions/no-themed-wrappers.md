---
type: Decision
title: No themed wrappers
description: The starter ThemedText and ThemedView were deleted. Each component reads useTheme() and applies colors inline.
tags: [decision, theming, components]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# No themed wrappers (D3)

**Decision:** delete `themed-text.tsx` and `themed-view.tsx`. Every component calls `useTheme()` and passes colors in inline style arrays.

**Why:**
- The shell's text styles are too specific for generic wrappers to help.
- A direct hook call keeps each component readable and self-contained.

**Consequence:** when feed cards need shared text styles, add a purpose-built text component on top of the tokens in [Theme module](../design-system/theme-module.md). Do not bring back the generic wrappers.

The icons are plain `Text` glyphs (`≡`, `+`, `👵`). There is no icon library.
