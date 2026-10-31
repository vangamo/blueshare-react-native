---
type: Reference
title: Color palettes
description: Every BlueShare color role in light and dark mode, the component that uses it, and the WCAG contrast ratios the palettes must keep.
tags: [colors, dark-mode, contrast, wcag]
resource: ../../src/constants/design-system.json
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Color palettes

| Role (`theme.*`) | Light | Dark | Used by |
| --- | --- | --- | --- |
| `primaryDark` (strong ink) | `#0f172a` | `#e2e8f0` | title-field border at rest, avatar border |
| `primaryBlue` | `#0084ff` | `#4da3ff` | FAB fill, menu glyph and border, focused field border, cursor |
| `primaryBlueHover` | `#006fe6` | `#80bdff` | active tab background |
| `primaryBlueDeep` | `#0058b8` | `#b3d7ff` | active tab border |
| `primaryShadow` | `rgba(0,132,255,0.3)` | `rgba(77,163,255,0.3)` | active tab and FAB shadow |
| `onPrimary` | `#ffffff` | `#0f172a` | active tab label, FAB `+` |
| `backgroundMain` | `#faf9f6` | `#0b1120` | content, scenes, root view |
| `backgroundBody` | `#f1f5f9` | `#020617` | reserved for later |
| `cardBg` | `#ffffff` | `#0f172a` | header, footer, focused field, FAB ring |
| `surfaceMuted` | `#f8fafc` | `#1e293b` | field at rest, inactive tabs |
| `avatarBg` | `#fdf6f0` | `#3a2e25` | avatar |
| `creationBg` | `#f0f7ff` | `#0c2340` | menu button background |
| `borderColor` | `#e2e8f0` | `#334155` | header and footer separators |
| `borderDark` | `#cbd5e1` | `#64748b` | inactive tab border |
| `textMain` | `#0f172a` | `#f1f5f9` | field text, placeholder title |
| `textSecondary` | `#334155` | `#cbd5e1` | inactive tab label, placeholder body |
| `textMuted` | `#475569` | `#94a3b8` | "Buscar..." placeholder |
| `badgeBg` / `badgeText` | `#e0f2fe` / `#0369a1` | `#0c2a4a` / `#7dd3fc` | reserved for feed cards |

## Contrast rules (tested in `theme-test.ts`)

- Text needs **≥ 4.5:1**. Large text (≥ 24 pt, or bold ≥ 18.66 pt) needs ≥ 3:1.
- Icons and borders that are a control's only boundary need **≥ 3:1**.

Checked pairs (light / dark):

| Pair | Ratio |
| --- | --- |
| field text on rest background | 17.06 / 13.35 |
| placeholder on focused background | 7.58 / 6.96 |
| inactive tab label | 9.90 / 9.85 |
| active tab label | 4.75 / 9.05 |
| menu glyph on its background | 3.39 / 6.01 |
| title border | 17.06 / 11.87 |

## Dark palette logic

- Same slate and blue family as light.
- "Hover" and "deep" get **lighter** in dark mode, because emphasis on a dark background means more light.
- `onPrimary` turns navy, because white on a light blue fails contrast. See [Active tab contrast](../decisions/active-tab-contrast.md).
- The light inactive-tab border (`#cbd5e1` on `#f8fafc`, 1.42:1) is decorative. The tab is identified by its label and background.
