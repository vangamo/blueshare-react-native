---
type: Specification
title: app-theming
description: Light palette from the tokens, a matching dark palette, WCAG contrast guarantees, live system scheme switching, and themed backgrounds and status bar.
tags: [spec, implemented, theming]
resource: ../../openspec/specs/app-theming/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# app-theming (implemented)

Full text: `openspec/specs/app-theming/spec.md`. From `basic-app-layout`, extended by `add-text-items` to the creation box and the timeline.

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Light palette matches the design tokens | Colors from `design_system.json`, and the HTML wins where they disagree. Header and footer `#ffffff`, content `#faf9f6`, borders `#e2e8f0`, FAB `#0084ff`. The exceptions are the active tab and the creation box's Guardar and Crear (`#006fe6`). | [Design tokens](../design-system/design-tokens.md) |
| Dark palette | Same roles, dark backgrounds, light text, and blue stays blue. | [Color palettes](../design-system/color-palettes.md) |
| Text contrast | Every text pair in the shell, creation box, type list, cards and timeline messages is ≥ 4.5:1 (large text ≥ 3:1) in both palettes. Disabled button labels are exempt. | `theme-test.ts` |
| Contrast of icons and control boundaries | Menu glyph, `+`, select chevron, and the menu, title field, type select and text area borders are ≥ 3:1. | `theme-test.ts` |
| Follows the system color scheme live | Switching with the app open re-themes everything at once and keeps the section and the title text. A launch in dark mode starts dark. | [Theme module](../design-system/theme-module.md) |
| Screen backgrounds match the theme | Navigation containers use `backgroundMain`. No white flash between tabs. | `NavigationThemes`, root `View` |
| Status bar follows the scheme | Dark icons in light mode, light icons in dark mode. | `<StatusBar style="auto" />` |
| All shell colors come from the theme | Covers the shell, placeholders, creation box and timeline. No fixed color values in components. Changing a palette value changes every use of it. | [Theme module](../design-system/theme-module.md) |

Tests: `src/__tests__/unit/constants/theme-test.ts`, `design-system-test.ts`, `src/__tests__/unit/hooks/use-theme-test.tsx`, and the dark-scheme checks in the component tests. Device checks: [Visual review](../development/visual-review.md).
