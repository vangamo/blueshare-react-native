---
type: Specification
title: adaptive-layout
description: How the app picks one of four layouts (phone or tablet, portrait or landscape) from the window size, the phone and tablet size sets, each layout's frame, the content column, safe areas on every side, and rotation keeping the user's place.
tags: [spec, implemented, layout, tablet, landscape, rotation]
resource: ../../openspec/specs/adaptive-layout/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T18:00:00Z
---

# adaptive-layout (implemented)

Full text: `openspec/specs/adaptive-layout/spec.md`. From the change `adaptive-layout` (`openspec/changes/archive/2026-11-02-adaptive-layout/`), which also changed app-platform, app-shell, timeline-feed, item-creation and item-editing.

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Layout chosen from the window size | Wider than tall is landscape, a short side of 600 points or more is a tablet. It follows the window live (rotation, split screen). | `layoutFor()` in `src/constants/theme.ts`, `useShellLayout()` |
| Phone and tablet size sets | Component and font sizes depend only on phone or tablet, never on orientation. The phone set is the old phone portrait look. | `Sizes` in `theme.ts`, [Sizes and typography](../design-system/layout-sizes.md) |
| Frame of each layout | Header and tab bar heights, tab bar position, tab width and title field maximum width per layout. | `Frames` in `theme.ts` |
| Tab bar position | At the bottom (top border) in portrait, below the header (bottom border) in landscape, with the same tabs and behavior. | [Tab bar](../components/tab-bar.md), [Tab bar stays in one slot](../decisions/tab-bar-single-slot.md) |
| Header horizontal padding on tablets | 24 points plus the side insets. | [App header](../components/app-header.md) |
| Create button position per layout | 20 (phone) or 28 (tablet) from the right, 10 or 16 above the tab bar in portrait, 16 above the bottom inset in landscape. | [Create button](../components/create-button.md) |
| Centered content column | Outside phone portrait the feed, cards, creation box, type list and edit dialog sit in a column of at most 550, 500 or 600 points. | `useContentStyle()`, [Timeline feed](../components/timeline-feed.md) |
| Safe areas on every side | Header, tab bar, create button and content clear the side insets, and in landscape the bottom inset too. | [Shell layout](../architecture/shell-layout.md) |
| Rotation keeps the user's place | The section, scroll position, creation box, edit dialog and the focused field with its keyboard survive a rotation. | `src/__tests__/e2e/rotation-test.tsx`, [Title search field](../components/title-search-field.md) |
| Landscape keyboard on phones | Android's full-screen editor is allowed, and closing it keeps the text and the focus. | [Adaptive layout](../decisions/adaptive-layout.md) |

Tests: `src/__tests__/unit/constants/theme-test.ts`, `unit/hooks/use-shell-layout-test.tsx`, the component tests per layout and the rotation e2e. Device results: [Device testing](../development/device-testing.md). Decisions: [Adaptive layout](../decisions/adaptive-layout.md), [Tab bar stays in one slot](../decisions/tab-bar-single-slot.md).
