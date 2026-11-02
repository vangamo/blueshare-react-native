---
type: Specification
title: app-shell
description: The persistent frame: a sticky header, a tab bar with three tabs (at the bottom in portrait, under the header in landscape), the floating create button and its per-section action, content that scrolls only between them, and touch targets of at least 44 points.
tags: [spec, implemented, shell]
resource: ../../openspec/specs/app-shell/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T18:00:00Z
---

# app-shell (implemented)

Full text: `openspec/specs/app-shell/spec.md`. From `basic-app-layout`, changed by `add-text-items` (Timeline feed, `+` action per section, `+` hidden while creating) and by `adaptive-layout` (sizes and positions depend on the layout, safe areas on every side, the title field keeps focus on rotation). The layouts themselves are in [adaptive-layout](adaptive-layout.md).

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Main sections as tabs | Timeline, Circles and Events. The app opens on Timeline. Each scrolls with the layout's content padding (16 on phones). Timeline shows the feed; Circles and Events show a placeholder. | `src/app/*`, [Timeline feed](../components/timeline-feed.md), [Placeholder screen](../components/placeholder-screen.md) |
| Shell stays fixed around content | The header never moves, and the tab bar stays where the layout puts it (bottom in portrait, under the header in landscape). Content scrolls only in the space left by them. Nothing re-mounts on a tab switch. The `+` shows or hides only as its own requirements say. | [Shell layout](../architecture/shell-layout.md) |
| Safe-area aware header and tab bar | Header height plus the top inset (70 on phone portrait), a bottom tab bar plus the bottom inset (75), a top tab bar without one. Controls clear of the left and right insets. | [App header](../components/app-header.md), [Tab bar](../components/tab-bar.md) |
| Header layout | Menu, title field (up to the layout's maximum width, centered), avatar. `cardBg` background, 2-point bottom border, the size set's padding (16 on phones, 24 on tablets). | [App header](../components/app-header.md) |
| Menu button | `≡`, ≥ 44×44, blue glyph and border, `creationBg`, radius 10, label "Menu". Pressing does nothing. | [App header](../components/app-header.md) |
| Title field at rest | 42 tall, 2-point strong-ink border, radius 12, muted background, "BlueShare" centered in 16-point bold. | [Title search field](../components/title-search-field.md) |
| Title field on focus | Blue border, card background, left-aligned. "BlueShare" is cleared to show "Buscar...". | same |
| Title field on blur | Blank → "BlueShare" again. Other text is kept. Submit does nothing. A rotation does not blur it. | same |
| Avatar | 42×42 circle, strong-ink border, `avatarBg`, `👵`, label "Profile", display only. | [App header](../components/app-header.md) |
| Tab bar | `cardBg`, 2-point border on the side facing the content, 10-point padding, three tabs (equal on phone portrait, 120 or 150 wide and centered elsewhere; 44 tall on phones, margin 4, radius 10, 14-point bold). | [Tab bar](../components/tab-bar.md) |
| Active tab indication | Hover-blue background, deep-blue border, on-primary label (≥ 4.5:1), shadow. Selected state for assistive technologies. | same |
| Tab switching | A press shows that section, also from the top tab bar. Pressing the active tab keeps it. | same |
| Floating create button | Blue, 3-point ring, shadow, bold `+`, sized by the size set (56 on phones, 60 on tablets), placed by the layout (right 20 and 10 above the tab bar on phone portrait; above the bottom inset in landscape), label "Create". Hidden on Timeline while the creation box is open. | [Create button](../components/create-button.md) |
| Create button action per section | Timeline: opens the creation box. Circles and Events: press feedback only. | `useCreateAction()`, [Create action per route](../decisions/create-action-per-route.md) |
| Create button hidden while creating | Not rendered (so not in the accessibility tree) while Timeline shows an open box. Shown on Circles and Events even with a pending draft. | same |
| Accessible touch targets | Every control is ≥ 44×44, except the 42-tall title field (spec exception). | all |

Tests: `src/__tests__/unit/components/*`, `src/__tests__/e2e/navigation-test.tsx` and `create-text-item-test.tsx`.
