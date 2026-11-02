---
type: Component
title: Text item card
description: A text item in the Timeline: the full text with its line breaks, then a divider and the Editar and Compartir actions. Editar opens the edit dialog; Compartir does nothing yet.
tags: [component, card, timeline, items]
resource: ../../src/components/text-item-card.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Text item card

`TextItemCard({ item, onEdit })`. The [Timeline feed](timeline-feed.md) renders one per text item. The card frame and the Editar and Compartir row live in `item-card-frame.tsx` (`ItemCardFrame`, `CardActions`) and are shared with the [Image item card](image-item-card.md).

## Styles

**Sizes come from the layout** (`useShellLayout().sizes`): card padding, radius and bottom margin (`cardPadding`, `cardRadius`, `itemGap`), body `cardText` and `cardLineHeight`, action `actionHeight` and `actionLabel`. The values below are the phone set; the tablet set is in [Sizes and typography](../design-system/layout-sizes.md).


- Card: `cardBg`, 2-point `borderColor` border, `Radius.lg` (16), `Spacing.lg` padding and bottom margin, shadow `0 2px 6px cardShadow`.
- Text: the full body, 15 pt, line height `Layout.cardTextLineHeight` (22.5), `textSecondary`. No truncation, line breaks kept.
- Action row: a `Layout.hairlineWidth` `divider` top border, `Spacing.md` above and below it, buttons aligned right, `Layout.creationGap` (10) apart.
- Card actions: at least 44 tall, `surfaceMuted`, 1-point `borderDark` border, `Radius.sm` (8), 14-point bold `textMain`. Opacity 0.8 when pressed.

## Behavior

- "Editar" and "Compartir" are buttons named by their labels. "Editar" calls the `onEdit` prop, and the [Timeline feed](timeline-feed.md) opens the [edit dialog](edit-text-dialog.md). "Compartir" is a no-op: sharing over Bluetooth comes in Phase 4.
- The body has `testID="text-item-body"`, which tests use to read card texts in order.

## Tests

`src/__tests__/unit/components/text-item-card-test.tsx`: the text with line breaks, the card, text and action colors in both palettes, action sizes and order, that Editar calls `onEdit`, and that Compartir changes nothing.

Spec: [timeline-feed](../specs/timeline-feed.md).
