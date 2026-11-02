---
type: Component
title: Photo preview
description: A photo shown whole on the image backdrop, as wide as a card's content and as tall as its proportions allow (up to the layout's maximum), with a missing-photo message. Shared by the image card, the image step and the image dialog.
tags: [component, image, photo, accessibility]
resource: ../../src/components/photo-preview.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Photo preview

`PhotoPreview({ uri, width, height, label })` and the pure function `photoBoxHeight(width, height, boxWidth, maxHeight)`. Used by [Image item card](image-item-card.md), the image step of the [Creation box](creation-box.md) and the [Edit image dialog](edit-image-dialog.md). Spec: [timeline-feed](../specs/timeline-feed.md).

## Sizing

- **Width:** `columnWidth − 2·(cardPadding + borderWidth)` from `useShellLayout()`. The card, the creation box and the dialog all have that inner width.
- **Height:** `min(width·h/w, width·Layout.imageMaxRatio, imageMaxHeight)`. A 4000×3000 photo at 300 points is 225 tall. A 1000×3000 photo is capped at 5/4 of the width or `imageMaxHeight`, whichever is smaller. See [Sizes and typography](../design-system/layout-sizes.md).
- The box has its final size before the photo loads, so cards don't move while scrolling.

## Styles

- Box: `imageBackdrop` background, `Layout.photoRadius` (12), clipped.
- Photo: `expo-image` with `contentFit="contain"`: never cropped or stretched. A tall photo is centered with the backdrop on both sides.
- Missing photo: when `expo-image` reports an error for the `uri`, the box shows "⚠️ Imagen no disponible" in `textMuted` at `captionText`. It is local state keyed by the failed `uri`, so a different photo tries to load again.

## Accessibility

The box is one accessible element with `accessibilityRole="image"` and `label` as its name (the inner `Image` is not accessible). The label is chosen by the caller: the card uses `altText ?? caption ?? 'Foto'`, the step and the dialog use "Foto elegida".

## Tests

`src/__tests__/unit/components/photo-preview-test.tsx`: the 225-point and tall-photo cases, the backdrop in both palettes, the image role and label, `contentFit`, the fallback after an error, retrying with another photo, and the tablet layout.
