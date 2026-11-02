---
type: Specification
title: app-shell
description: The persistent frame: a sticky header, a footer with three tabs, the floating create button and its per-section action, content that scrolls only between them, and touch targets of at least 44 points.
tags: [spec, implemented, shell]
resource: ../../openspec/specs/app-shell/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# app-shell (implemented)

Full text: `openspec/specs/app-shell/spec.md`. From `basic-app-layout`, changed by `add-text-items` (Timeline feed, `+` action per section, `+` hidden while creating).

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Main sections as tabs | Timeline, Circles and Events. The app opens on Timeline. Each scrolls with 16-point padding. Timeline shows the feed; Circles and Events show a placeholder. | `src/app/*`, [Timeline feed](../components/timeline-feed.md), [Placeholder screen](../components/placeholder-screen.md) |
| Shell stays fixed around content | The header and footer never move. Content scrolls only between them. Nothing re-mounts on a tab switch. The `+` shows or hides only as its own requirements say. | [Shell layout](../architecture/shell-layout.md) |
| Safe-area aware header and footer | Header 70 + top inset, footer 75 + bottom inset. | header, footer |
| Header layout | Menu, title field, avatar. `cardBg` background, 2-point bottom border, 16-point padding. | [App header](../components/app-header.md) |
| Menu button | `≡`, ≥ 44×44, blue glyph and border, `creationBg`, radius 10, label "Menu". Pressing does nothing. | [App header](../components/app-header.md) |
| Title field at rest | 42 tall, 2-point strong-ink border, radius 12, muted background, "BlueShare" centered in 16-point bold. | [Title search field](../components/title-search-field.md) |
| Title field on focus | Blue border, card background, left-aligned. "BlueShare" is cleared to show "Buscar...". | same |
| Title field on blur | Blank → "BlueShare" again. Other text is kept. Submit does nothing. | same |
| Avatar | 42×42 circle, strong-ink border, `avatarBg`, `👵`, label "Profile", display only. | [App header](../components/app-header.md) |
| Footer tab bar | `cardBg`, 2-point top border, 10-point padding, three equal tabs (44 tall, margin 4, radius 10, 14-point bold). | [Footer tab bar](../components/footer-tab-bar.md) |
| Active tab indication | Hover-blue background, deep-blue border, on-primary label (≥ 4.5:1), shadow. Selected state for assistive technologies. | same |
| Tab switching | A press shows that section. Pressing the active tab keeps it. | same |
| Floating create button | 56×56, blue, 3-point ring, shadow, 28-point `+`, right 20, 10 above the footer, label "Create". Hidden on Timeline while the creation box is open. | [Create button](../components/create-button.md) |
| Create button action per section | Timeline: opens the creation box. Circles and Events: press feedback only. | `useCreateAction()`, [Create action per route](../decisions/create-action-per-route.md) |
| Create button hidden while creating | Not rendered (so not in the accessibility tree) while Timeline shows an open box. Shown on Circles and Events even with a pending draft. | same |
| Accessible touch targets | Every control is ≥ 44×44, except the 42-tall title field (spec exception). | all |

Tests: `src/__tests__/unit/components/*`, `src/__tests__/e2e/navigation-test.tsx` and `create-text-item-test.tsx`.
