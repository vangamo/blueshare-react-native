---
type: Component
title: Image item card
description: An image item in the Timeline: the photo whole on its backdrop, an italic muted caption when there is one, then the shared Editar and Compartir actions. Editar opens the image dialog; Compartir does nothing yet.
tags: [component, card, timeline, items, image]
resource: ../../src/components/image-item-card.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Image item card

`ImageItemCard({ item, onEdit })`. The [Timeline feed](timeline-feed.md) renders one per image item. It must be inside `ItemsProvider`, because the photo's URI comes from `usePhotoUri(item.photo.file)`.

## Structure

- **Frame:** `ItemCardFrame` (shared with [Text item card](text-item-card.md)): `cardBg`, 2-point `borderColor` border, card radius, padding, bottom margin and shadow from the layout's size set.
- **Photo:** [Photo preview](photo-preview.md) with the item's size and the label `altText ?? caption ?? 'Foto'`.
- **Caption:** only when the item has one. Italic, `textMuted`, `captionText` size with a 1.5 line height, `Layout.photoGap` (8) below the photo, in full (no `numberOfLines`). Without a caption nothing sits between the photo and the actions.
- **Actions:** `CardActions` (shared): divider, then Editar and Compartir. Editar calls `onEdit`, Compartir is a no-op until Phase 4.

## Behavior

- A photo file that can't be read shows "⚠️ Imagen no disponible" inside the photo box. The caption and the actions stay.
- The photo box has its final size before the photo loads (from the stored width and height), so cards don't move while scrolling.

## Tests

`src/__tests__/unit/components/image-item-card-test.tsx`: frame and caption style in both palettes, the backdrop, the photo URI from the store, sizes, caption present or absent, the three label cases, actions, the missing photo and the tablet layouts. The mixed feed is covered in `timeline-feed-test.tsx`.

Spec: [timeline-feed](../specs/timeline-feed.md).
