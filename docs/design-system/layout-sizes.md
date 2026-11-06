---
type: Reference
title: Sizes and typography
description: The phone and tablet size sets, the four layout frames and the fixed Layout values, plus the spacing, radius, font size and weight scales, all in points.
tags: [layout, sizes, typography, spacing]
resource: ../../src/constants/theme.ts
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:30:00Z
---

# Sizes and typography

## Which size comes from where

The window decides one of four layouts (`layoutFor(width, height)`: wider than tall is landscape, a short side of 600 or more is a tablet). Sizes come from three places:

- **`Sizes.phone` / `Sizes.tablet`**: component and font sizes. They depend only on the device size, never on the orientation.
- **`Frames[kind]`**: what depends on the whole layout (bar heights, tab bar position, tab width, title field and content column widths, create button offset).
- **`Layout`**: values that never change.

Components read `Sizes` and `Frames` through `useShellLayout()` and pass them inline, like colors. Static structure stays in `StyleSheet.create`.

## `Sizes` (phone column = `sketches/mobile-portrait.html`, tablet column = `sketches/tablet-portrait.html`)

| Key | Phone | Tablet | Used for |
| --- | --- | --- | --- |
| `contentPadding` | 16 | 20 | feed and placeholder screens |
| `headerPaddingHorizontal` | 16 | 24 | header side padding |
| `menuButton` / `menuGlyph` | 44 / 18 | 48 / 20 | header menu button |
| `fieldHeight` / `fieldFont` | 42 / 16 | 46 / 17 | title field (a spec exception to 44 on phones) |
| `avatar` / `avatarEmoji` | 42 / 20 | 46 / 22 | avatar circle and emoji |
| `tabHeight` / `tabLabel` | 44 / 14 | 48 / 15 | tabs |
| `fab` / `fabFont` / `fabRight` | 56 / 28 / 20 | 60 / 30 / 28 | create button |
| `cardPadding` / `cardRadius` / `itemGap` | 16 / 16 / 16 | 20 / 18 / 20 | card, creation box, dialog |
| `cardText` / `cardLineHeight` | 15 / 22.5 | 16 / 24 | card body |
| `actionHeight` / `actionLabel` | 44 / 14 | 48 / 15 | card actions |
| `boxTitle` / `inputFont` | 14 / 16 | 15 / 17 | box, dialog, select, text area |
| `controlHeight` / `buttonLabel` | 44 / 15 | 48 / 16 | select, box and dialog buttons |
| `optionRow` | 56 | 60 | type list rows |
| `textAreaMin` / `textAreaMax` | 96 / 200 | 104 / 240 | text area: about three lines, then grows and scrolls |
| `placeholderTitle` / `placeholderBody` | 18 / 15 | 20 / 16 | placeholder screens |
| `captionText` | 14 | 15 | image card caption (italic) |
| `fieldLabel` / `fieldHint` | 14 / 14 | 15 / 15 | labels and hints of the image and event fields |
| `eventTitle` / `badgeText` | 17 / 14 | 19 / 15 | event card title (bold) and category badge (bold) |
| `thumbColumns` | 3 | 4 | thumbnails per row in the event step and dialog |

Tablet values come from the tablet portrait mock, rounded up to 44-point targets. `textAreaMin/Max` and `optionRow` on tablets are not in the mock: they are scaled to the larger font and tuned in the visual review. After the visual review on the tablet emulator the tablet values were kept as listed (no tuning was needed for the text area heights or the option rows). Tablet landscape has no mock, so it combines the tablet sizes with the landscape structure.

## `Frames`

| Layout | Header | Tab bar | Position | Tab width | Title max | Column | FAB gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `phone-portrait` | 70 | 75 | bottom | stretch | none | none | 10 above the bar |
| `phone-landscape` | 56 | 56 | top | 120 | 300 | 550 | 16 above the bottom inset |
| `tablet-portrait` | 75 | 80 | bottom | 150 | 350 | 500 | 16 above the bar |
| `tablet-landscape` | 75 | 64 | top | 150 | 400 | 600 | 16 above the bottom inset |

Bar heights are added to the safe-area insets. `columnWidth` (from `useShellLayout()`) is the window minus the side insets and twice `contentPadding`, capped at the frame's column.

`imageMaxHeight` (also from `useShellLayout()`) is the tallest photo box, so a whole image card fits below the header and tab bar: window height, minus the top and bottom insets, `headerHeight`, `tabBarHeight`, twice `contentPadding` and the card chrome (card padding and border, `photoGap`, one caption line of `captionText × 1.5`, and the action row), never less than `Layout.imageMinHeight` (120). On the test windows the floor wins in phone landscape (363 points high). Each photo box is then `min(width × h / w, width × imageMaxRatio, imageMaxHeight)` tall.

`eventTileSize` (also from `useShellLayout()`) is the side of an event card's square photo tiles: `(eventInnerWidth − 2 × eventTileGap) / eventTilePeek`, where `eventInnerWidth = columnWidth − 2 × cardPadding − borderWidth − accentBarWidth`. Two tiles and 40% of a third fit the card. That is about 118 points on a 375-point phone and about 133 on the 411-point test phone (180 and 221 on the tablet). When that side would pass `imageMaxHeight`, the row holds more whole tiles: `(eventInnerWidth − n × eventTileGap) / (n + 0.4)` for the smallest `n` that fits under the cap. In phone landscape that is four tiles of about 107 points and a peek; a plain cap (120) made exactly four tiles fill the row with nothing peeking out. The event step and dialog thumbnails use `thumbColumns` per row instead, sized from the box's inner width and rounded down to whole device pixels with one pixel free (a row of exactly the box's width wraps on Android).

## `Layout` (fixed values)

| Key | Value | Used for |
| --- | --- | --- |
| `tabBarPaddingHorizontal` | 10 | tab bar side padding |
| `tabMarginHorizontal` | 4 | gap around each tab (8 between tabs) |
| `touchTarget` | 44 | minimum control size |
| `controlRadius` | 10 | menu button, tabs, box controls |
| `borderWidth` / `fabBorderWidth` | 2 / 3 | control borders, FAB ring |
| `creationGap` | 10 | space between creation box controls and between its two buttons |
| `hairlineWidth` | 1 | card divider, card action border |
| `disabledOpacity` | 0.45 | disabled Guardar and Crear (a faded primary, not gray) |
| `keyboardHideGraceMs` | 400 | how long the title field waits before blurring after the keyboard hides |
| `photoRadius` | 12 | corner radius of the photo box |
| `photoGap` | 8 | space between photo, caption and actions |
| `imageMinHeight` | 120 | floor of the photo box height |
| `imageMaxRatio` | 1.25 | tallest photo box, as a multiple of its width |
| `accentBarWidth` | 6 | deep-blue bar on the event card's left edge |
| `eventTileGap` | 10 | space between event photo tiles |
| `eventTilePeek` | 2.4 | tiles that fit the event card's width (two whole, 40% of the third) |
| `badgePaddingH` / `badgePaddingV` | 10 / 4 | inner space of the category badge |
| `thumbRemoveInset` | 4 | how far the remove button sits inside a thumbnail's corner |

A value from the HTML that is not a design token belongs in `Sizes`, `Frames` or `Layout`, never inline.

## Token scales (from the JSON)

- `Spacing`: xs 4, sm 8, md 12, lg 16 (screen and header padding), xl 20, xxl 24.
- `Radius`: sm 8, md 12 (title field), lg 16 (cards), xl 18, pill 9999.
- `FontSize`: caption 12, small 14 (tab labels), body 15, bodyLarge 16 (title field), titleCard 18, titleTablet 20.
- `FontWeight`: regular `'400'`, medium `'600'`, bold `'700'`, extrabold `'800'`.

There are no custom fonts. The platform system font is used everywhere.

Related: [Theme module](theme-module.md), [Accessibility](../development/accessibility.md).
