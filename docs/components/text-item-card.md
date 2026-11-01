---
type: Component
title: Text item card
description: A text item in the Timeline: the full text with its line breaks, then a divider and the Editar and Compartir actions, which do nothing yet.
tags: [component, card, timeline, items]
resource: ../../src/components/text-item-card.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:30:00Z
---

# Text item card

`TextItemCard({ item })`. The [Timeline feed](timeline-feed.md) renders one per text item.

## Styles

- Card: `cardBg`, 2-point `borderColor` border, `Radius.lg` (16), `Spacing.lg` padding and bottom margin, shadow `0 2px 6px cardShadow`.
- Text: the full body, 15 pt, line height `Layout.cardTextLineHeight` (22.5), `textSecondary`. No truncation, line breaks kept.
- Action row: a `Layout.hairlineWidth` `divider` top border, `Spacing.md` above and below it, buttons aligned right, `Layout.creationGap` (10) apart.
- Card actions: at least 44 tall, `surfaceMuted`, 1-point `borderDark` border, `Radius.sm` (8), 14-point bold `textMain`. Opacity 0.8 when pressed.

## Behavior

- "Editar" and "Compartir" are buttons named by their labels. Both are no-ops for now: editing and sharing over Bluetooth come in later changes.
- The body has `testID="text-item-body"`, which tests use to read card texts in order.

## Tests

`src/__tests__/unit/components/text-item-card-test.tsx`: the text with line breaks, the card, text and action colors in both palettes, action sizes and order, and that pressing either action changes nothing.

Spec: `timeline-feed` (OpenSpec change `add-text-items`).
