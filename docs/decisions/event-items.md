---
type: Decision
title: Event items
description: Events are their own item type with an ordered photo list, picked several at a time with the system picker, and shown as a sideways row of square cropped tiles where the next tile peeks out.
tags: [decision, event, items, photos, card]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-06T12:00:00Z
---

# Event items (event-items D1, D6, D11)

Taken in the `event-items` change (its `design.md`, now in `openspec/changes/archive/2026-11-06-event-items/`). The tables (D2, D3) are in [Items schema](items-schema.md), and the dialog's keyboard handling (D10) in [Shared edit dialog frame](shared-edit-dialog-frame.md).

## Its own type (D1)

**Decision:** `EventItem` (`src/items/domain/event-item.ts`) is a separate type with a title, a category, an optional description and 1 to 10 photos (`StoredPhoto`, reused from image items). `TimelineItem` is `TextItem | ImageItem | EventItem`.

**Why:** the image card's rules (whole photo, never cropped, alt text, caption) don't apply to events.

**Rejected:** generalizing `ImageItem` to hold a list of photos and treating an event as an image with a title. Both types would grow optional fields.

## Several photos per pick (D6)

**Decision:** `usePickPhotos()` (`src/hooks/use-pick-photos.ts`) opens the system picker with `allowsMultipleSelection`, `selectionLimit` set to the slots left and `orderedSelection`. If a picker ignores the limit, the caller keeps only the first photos up to 10, so the limit message shows. Copies run one after another, so a failed save removes exactly the copies it made.

**Why:** no permission prompt and no new dependency. On Android 37 the system picker returns photos in the order they were tapped and honors the limit (see [Device testing](../development/device-testing.md)).

**Rejected:** copying in parallel (harder rollback and memory spikes with ten large originals). Reordering photos is out of scope: a photo can be removed and added again to move it to the end.

## Card photo row (D11)

**Decision:** a horizontal `ScrollView` of square, cropped tiles (`EventPhotoTile`), sized by `eventTileSize` from `useShellLayout()` so two tiles and 40% of a third fit. Where that would be taller than `imageMaxHeight` (phone landscape), the row holds one more whole tile at a smaller size so a tile still peeks out. The card frame gets a 6-point accent bar in `primaryBlueDeep`, chosen by the user over the sketch's `primary_blue` to set events apart.

**Why:** the peeking tile tells the user there are more photos. At most 10 tiles need no virtualization.

**Rejected:**
- A horizontal `FlatList`: no need to virtualize 10 items, and a list nested in the feed's `FlatList` adds warnings.
- Tiles at the photo's natural proportions, like the image card: the user asked for squares.
- One photo per page: hides the "more photos" cue.

See [Event item card](../components/event-item-card.md), [Event fields](../components/event-fields.md), [Edit event dialog](../components/edit-event-dialog.md) and [Sizes and typography](../design-system/layout-sizes.md).
