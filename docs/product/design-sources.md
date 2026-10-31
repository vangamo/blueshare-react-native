---
type: Reference
title: Design sources
description: The files in sketches/ that define BlueShare's look. The HTML mock wins over the token JSON, and the app uses a corrected copy of the tokens.
tags: [design, sketches, source-of-truth]
resource: ../../sketches/
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Design sources

Everything lives in `sketches/` and is **reference only**. Never edit it to change the app.

| File | What it is |
| --- | --- |
| `mobile-portrait.html` | The HTML prototype (Spanish UI, 380×780 frame). **Source of truth** for the shell's sizes and colors. |
| `mobile-portrait.png`, `header-mobile-portrait.png`, `footer-mobile-portrait.png` | Renders of the prototype, used in the [visual review](../development/visual-review.md). |
| `design_system.json` | The original design tokens. Kept unchanged. The app reads a corrected copy, see [Design tokens](../design-system/design-tokens.md). |
| `mobile-landscape.html`, `tablet-portrait.html` | Landscape and tablet mocks. Out of scope: the app is phone-only and portrait-only. |
| `BlueShare-Mobile-Portrait-*.excalidraw/.png/.svg` | The first wireframe. |
| `Screenshot_*_com.adoptaunabuelo.app.webp` | Screenshots of another app, used as inspiration. |

## Precedence rules

1. Where `design_system.json` and the HTML disagree, **the HTML wins**. For example, the footer top border is `#e2e8f0`.
2. Accessibility beats both. The active tab uses `#006fe6`, not `#0084ff`, see [Active tab contrast](../decisions/active-tab-contrast.md).
3. The dark palette has no sketch. It was designed in the same slate and blue family, see [Color palettes](../design-system/color-palettes.md).
