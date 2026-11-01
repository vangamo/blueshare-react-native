---
type: Reference
title: Sizes and typography
description: Fixed shell sizes in Layout, plus the spacing, radius, font size and weight scales, all in points.
tags: [layout, sizes, typography, spacing]
resource: ../../src/constants/theme.ts
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:30:00Z
---

# Sizes and typography

## `Layout` (shell sizes from `sketches/mobile-portrait.html`)

| Key | Value | Used for |
| --- | --- | --- |
| `headerHeight` | 70 | header, plus `insets.top` |
| `footerHeight` | 75 | footer, plus `insets.bottom` |
| `footerPaddingHorizontal` | 10 | footer side padding |
| `tabMarginHorizontal` | 4 | gap around each tab (8 between tabs) |
| `touchTarget` | 44 | minimum control size, tab height |
| `fieldHeight` | 42 | title field (a spec exception to 44) |
| `avatarSize` / `avatarEmojiSize` | 42 / 20 | avatar circle and emoji |
| `fabSize` / `fabFontSize` | 56 / 28 | create button and its `+` |
| `fabOffsetRight` / `fabOffsetBottom` | 20 / 10 | create button position |
| `controlRadius` | 10 | menu button and tabs |
| `borderWidth` / `fabBorderWidth` | 2 / 3 | control borders, FAB ring |
| `creationGap` | 10 | space between creation box controls and between its two buttons |
| `textAreaMinHeight` / `textAreaMaxHeight` | 96 / 200 | text area: about three lines, then grows to the max and scrolls |
| `cardTextLineHeight` | 22.5 | text card body (15 × 1.5) |
| `hairlineWidth` | 1 | card divider, card action border |
| `optionRowHeight` | 56 | type list rows |
| `disabledOpacity` | 0.45 | disabled Guardar and Crear (a faded primary, not gray) |

The creation box values are starting points, tuned in the visual review.

A value from the HTML that is not a design token belongs in `Layout`, never inline.

## Token scales (from the JSON)

- `Spacing`: xs 4, sm 8, md 12, lg 16 (screen and header padding), xl 20, xxl 24.
- `Radius`: sm 8, md 12 (title field), lg 16 (cards), xl 18, pill 9999.
- `FontSize`: caption 12, small 14 (tab labels), body 15, bodyLarge 16 (title field), titleCard 18, titleTablet 20.
- `FontWeight`: regular `'400'`, medium `'600'`, bold `'700'`, extrabold `'800'`.

There are no custom fonts. The platform system font is used everywhere.

Related: [Theme module](theme-module.md), [Accessibility](../development/accessibility.md).
