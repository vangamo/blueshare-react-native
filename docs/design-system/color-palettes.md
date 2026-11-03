---
type: Reference
title: Color palettes
description: Every BlueShare color role in light and dark mode, the component that uses it, and the WCAG contrast ratios the palettes must keep.
tags: [colors, dark-mode, contrast, wcag]
resource: ../../src/constants/design-system.json
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Color palettes

| Role (`theme.*`) | Light | Dark | Used by |
| --- | --- | --- | --- |
| `primaryDark` (strong ink) | `#0f172a` | `#e2e8f0` | title-field border at rest, avatar border, type select and text area borders, event card border, category suggestion and photo remove button borders |
| `primaryBlue` | `#0084ff` | `#4da3ff` | FAB fill, menu glyph and border, focused field border, cursor, creation box dashed border, event card accent bar (decorative) |
| `primaryBlueHover` | `#006fe6` | `#80bdff` | active tab background, Guardar and Crear buttons |
| `primaryBlueDeep` | `#0058b8` | `#b3d7ff` | active tab border |
| `primaryShadow` | `rgba(0,132,255,0.3)` | `rgba(77,163,255,0.3)` | active tab and FAB shadow |
| `onPrimary` | `#ffffff` | `#0f172a` | active tab label, FAB `+`, Guardar and Crear labels |
| `backgroundMain` | `#faf9f6` | `#0b1120` | content, scenes, root view |
| `backgroundBody` | `#f1f5f9` | `#020617` | reserved for later |
| `cardBg` | `#ffffff` | `#0f172a` | header, footer, focused field, FAB ring, text cards, type select, type list sheet, text area |
| `surfaceMuted` | `#f8fafc` | `#1e293b` | field at rest, inactive tabs, Cancelar, card actions |
| `avatarBg` | `#fdf6f0` | `#3a2e25` | avatar |
| `creationBg` | `#f0f7ff` | `#0c2340` | menu button background, creation box, selected type option |
| `borderColor` | `#e2e8f0` | `#334155` | header and footer separators, text card border |
| `borderDark` | `#cbd5e1` | `#64748b` | inactive tab border, Cancelar and card action borders |
| `textMain` | `#0f172a` | `#f1f5f9` | field text, placeholder title, creation box text, button labels except primary |
| `textSecondary` | `#334155` | `#cbd5e1` | inactive tab label, placeholder body, card text, timeline messages |
| `textMuted` | `#475569` | `#94a3b8` | "Buscar..." placeholder |
| `badgeBg` / `badgeText` | `#e0f2fe` / `#0369a1` | `#0c2a4a` / `#7dd3fc` | category badge of the event card |
| `cardShadow` | `rgba(15,23,42,0.04)` | `rgba(2,6,23,0.5)` | text card shadow |
| `divider` | `#f1f5f9` | `#1e293b` | line above the card action row (decorative) |
| `overlay` | `rgba(15,23,42,0.5)` | `rgba(2,6,23,0.7)` | type list and edit dialog backdrop |
| `danger` | `#b91c1c` | `#f87171` | "Borrar este texto" border and label, "Sí, borrar" background |
| `onDanger` | `#ffffff` | `#0f172a` | "Sí, borrar" label |
| `imageBackdrop` | `#e2e8f0` | `#1e293b` | box behind a photo (image card, image step and dialog, event tiles and thumbnails), and the missing-photo message |

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
| creation box title and save error (`textMain` on `creationBg`) | 16.54 / 14.41 |
| Guardar and Crear labels (`onPrimary` on `primaryBlueHover`) | 4.75 / 9.05 |
| Cancelar and card action labels (`textMain` on `surfaceMuted`) | 17.06 / 13.35 |
| card text (`textSecondary` on `cardBg`) | 10.35 / 12.02 |
| empty and error messages (`textSecondary` on `backgroundMain`) | 9.83 / 12.68 |
| select, options and text area text (`textMain` on `cardBg`) | 17.85 / 16.30 |
| select and text area border (`primaryDark` on `cardBg`) | 17.85 / 14.48 |
| Sí, borrar label (`onDanger` on `danger`) | 6.47 / 6.45 |
| Borrar este texto label (`danger` on `surfaceMuted`) | 6.18 / 5.29 |
| Borrar este texto border (`danger` on `creationBg`) | 5.99 / 5.71 |
| Image caption (`textMuted` on `cardBg`) | 7.58 / 6.96 |
| Alternative text hint (`textMuted` on `creationBg`) | 7.02 / 6.16 |
| Missing photo message (`textMuted` on `imageBackdrop`) | 6.15 / 5.71 |
| Category badge (`badgeText` on `badgeBg`) | 5.17 / 8.71 |
| Event title (`textMain` on `cardBg`) | 17.85 / 16.30 |
| Category suggestion labels and photo remove `✕` (`textMain` on `surfaceMuted`) | 17.06 / 13.35 |
| Category suggestion border (`primaryDark` on `creationBg`) | 16.54 / 12.81 |
| Photo remove button border (`primaryDark` on `surfaceMuted`) | 17.06 / 11.87 |

The event card's accent bar (`primaryBlue` on `cardBg`, 3.66 / 6.80) is decorative: the card is identified by its heading. The event description uses the card text pair, and the limit message the creation box text pair.

## Dark palette logic

- Same slate and blue family as light.
- "Hover" and "deep" get **lighter** in dark mode, because emphasis on a dark background means more light.
- `onPrimary` turns navy, because white on a light blue fails contrast. See [Active tab contrast](../decisions/active-tab-contrast.md).
- The light inactive-tab border (`#cbd5e1` on `#f8fafc`, 1.42:1) is decorative. The tab is identified by its label and background. The Cancelar border (`borderDark` on `creationBg`, about 1.4:1) is decorative for the same reason.
- Guardar and Crear use `primaryBlueHover`, not the mock's `#0084ff`: white on `#0084ff` is 3.66:1, below AA for 15 pt bold. Disabled button labels are exempt from contrast rules.
