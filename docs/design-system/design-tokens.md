---
type: Reference
title: Design tokens
description: All colors and token sizes live in src/constants/design-system.json, a corrected copy of sketches/design_system.json with a dark palette added.
tags: [design-tokens, json, colors, theming]
resource: ../../src/constants/design-system.json
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Design tokens

`src/constants/design-system.json` is the **only place where color values live**. [theme.ts](theme-module.md) reads it.

## Structure

- `design_tokens.colors`: the light palette (snake_case keys, `#rrggbb` or `rgba()`).
- `design_tokens.colors_dark`: the dark palette, with **exactly the same keys**.
- `design_tokens.typography.sizes` and `weights`, `spacing`, `border_radius`: `"12px"` strings, and `"50%"` for the pill radius.
- `device_sizes` and `components`: **reference only**. They describe the HTML mock (header, footer, FAB, creation box, feed cards) and are not read by code. Use `components.creation_box` and `feed_cards` when you build those features.

## Differences from `sketches/design_system.json`

The sketch file stays untouched. The copy adds:
- the color roles `surface_muted`, `avatar_bg`, `primary_blue_deep`, `primary_shadow` and `on_primary`
- the full `colors_dark` block
- `components.footer.border_top` set to `2px solid #e2e8f0` (the HTML wins)
- `components.footer.tab_active` set to `#006fe6` with a `#0058b8` border (see [Active tab contrast](../decisions/active-tab-contrast.md))

Why JSON: [Tokens in JSON](../decisions/tokens-in-json.md).

## Adding or changing a token

1. Add the key to **both** `colors` and `colors_dark`. The typecheck fails if `colors_dark` is missing a key, because `dark` is typed as `ThemeColors`.
2. Use it from code as `theme.<camelCaseKey>`. The mapping is automatic.
3. If it is a text, icon or boundary color, add its pair to `src/__tests__/unit/constants/theme-test.ts` (contrast) and record it in [Color palettes](color-palettes.md).
4. A size token must be `"<n>px"` (or `"50%"`). Anything else throws when the app loads.
5. Run `npm test`: `design-system-test.ts` checks that the JSON and the exports stay in sync.
