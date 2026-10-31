---
type: Decision
title: Active tab contrast
description: Light mode uses #006fe6 for the active tab, because white on #0084ff fails AA. Dark mode uses navy text on light-blue fills.
tags: [decision, accessibility, colors]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Active tab contrast (D5)

**Decision (agreed with the user):**
- **Light:** the active tab is `primaryBlueHover` `#006fe6` (white text at 4.75:1), not `#0084ff` (3.66:1, which fails AA for 14-point bold text). Its border goes one step darker, to `primaryBlueDeep` `#0058b8`, so it keeps the darker edge from the sketch.
- **Dark:** `onPrimary` is navy `#0f172a`. A blue light enough to stand out on dark backgrounds (`#4da3ff`) cannot carry white text (2.9:1). Navy text gives 6.80:1 on the FAB and 9.05:1 on the active tab (`#80bdff`).

**Exception kept:** the light FAB stays `#0084ff`, because its `+` is 28-point bold (large text, which needs 3:1).

**Consequence:** this is one of the intentional differences from the sketch. See [Color palettes](../design-system/color-palettes.md) and [Accessibility](../development/accessibility.md).
