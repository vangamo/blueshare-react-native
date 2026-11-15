---
type: Component
title: Event item card
description: An event item in the Timeline - strong border with a deep-blue accent bar, bold title with a category badge, a sideways row of square cropped photo tiles where the next one peeks out, the description, and the Editar and Compartir actions.
tags: [component, card, event, photos, accessibility]
resource: ../../src/components/event-item-card.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T22:00:00Z
---

# Event item card

`EventItemCard({ item, onEdit })`, rendered by the [Timeline feed](timeline-feed.md) for `item.type === 'event'`. Design source: `sketches/mobile-portrait-event-item.png`, except the tiles, which are squares instead of the sketch's 110×90 (user request, see [Design tokens](../design-system/design-tokens.md)).

## Parts, top to bottom

- **Frame:** the shared `ItemCardFrame` with `accent`: the text card's background, radius, padding, shadow and spacing, but a 2-point `primaryDark` border and a `Layout.accentBarWidth` (6) `primaryBlueDeep` left border (the user chose the deep blue so the bar sets event cards apart), which RN draws inside the rounded corners. The visual review checks how Android draws it (a clipped inner bar is the fallback).
- **Header row** (`alignItems: 'flex-start'`, `Spacing.sm` gap): the title (`accessibilityRole="header"`, `flex: 1`, bold `sizes.eventTitle` in `textMain`, wraps in full) and `CategoryBadge` (`src/components/category-badge.tsx`): bold `sizes.badgeText` `badgeText` on `badgeBg`, `Radius.pill`, `Layout.badgePaddingH/V`, `flexShrink: 0` and `alignSelf: 'flex-start'`, so it stays at the right of the first line and is never truncated. It is read as "Categoría: <category>".
- **Photo row** (`Spacing.md` below the header): a horizontal `ScrollView` with no indicator and `Layout.eventTileGap` (10) between tiles. At most 10 tiles, so no virtualization. Each `EventPhotoTile` (`src/components/event-photo-tile.tsx`) is an `eventTileSize` square (from `useShellLayout()`, two whole tiles and 40% of a third per card width; when that would be taller than `imageMaxHeight` (phone landscape), one more whole tile at a smaller size, so a tile always peeks out; see [Sizes and typography](../design-system/layout-sizes.md)) on `imageBackdrop` with `Layout.photoRadius` corners, holding an `expo-image` with `contentFit="cover"`. The tile has its size before the photo loads, so cards don't move. It is an image named "Foto N de M de <title>". Tapping does nothing.
- **Missing photo:** a tile whose `onError` fires shows "⚠️ Imagen no disponible" in `textMuted` (local state keyed on the URI, as in the [photo preview](photo-preview.md)); the other tiles keep their photos.
- **Description** (only when there is one): `sizes.cardText` with `cardLineHeight` in `textSecondary`, `Layout.photoGap` below the row, in full with its line breaks. With none, the action row follows the photo row directly.
- **Actions:** the shared `CardActions` (Editar calls `onEdit`, Compartir does nothing yet).

## Tests

`src/__tests__/unit/components/event-item-card-test.tsx`: the frame, accent bar, title and badge colors in both palettes, the header and wrapping with a 24-character category, square tiles of `eventTileSize` in order with their labels and cropped sources, the row props, one photo, no description, a failing tile, the actions, the screen reader order (`readingOrder()`), tablet sizes and resizing. `timeline-feed-test.tsx` checks a feed mixing the three types.

Spec: [timeline-feed](../specs/timeline-feed.md), [adaptive-layout](../specs/adaptive-layout.md).
