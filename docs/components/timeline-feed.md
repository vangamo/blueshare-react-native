---
type: Component
title: Timeline feed
description: The Timeline section: a FlatList with the creation box as its header and text and image cards newest first, plus the empty, loading and error states, scroll to top and the Android back button.
tags: [component, timeline, feed, list]
resource: ../../src/components/timeline-feed.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Timeline feed

`TimelineFeed`, no props. Rendered by `src/app/index.tsx`. It reads `useTimeline()` and `useCreationBox()`.

## Layout

**Adaptive:** content padding is `sizes.contentPadding` (16 phone, 20 tablet) plus the side insets, and in landscape the bottom padding adds `insets.bottom` (no bar below). Outside phone portrait the content container is `columnWidth + 2 × padding + the side insets` wide (the insets are padding too, so the content is exactly `columnWidth`) and centered (550 phone landscape, 500 tablet portrait, 600 tablet landscape). Phone portrait stays a plain `padding`. Computed by `useContentStyle()` (`src/hooks/use-content-style.ts`), shared with the placeholder screen.


- A `FlatList` (the feed has no upper bound) with `flex: 1`, `backgroundMain`, and `Spacing.lg` content padding. It scrolls only between the header and the footer.
- **Edit dialog:** the feed keeps `editingId` in `useState`, derives the item during render and renders `<EditTextDialog key={item.id} />` next to the list. Each card's `onEdit` sets the id and the dialog's `onClose` clears it. A deleted item makes the dialog disappear by itself. See [Edit text dialog](edit-text-dialog.md).
- `ListHeaderComponent` is always `<CreationBox />`, which renders nothing while closed. Keeping the same component type means the text area never remounts and loses focus while typing.
- Items: a [text item card](text-item-card.md), an [image item card](image-item-card.md) or an [event item card](event-item-card.md) each (by `item.type`), newest first. Editar opens the dialog that matches the type ([Edit text dialog](edit-text-dialog.md), [Edit image dialog](edit-image-dialog.md), [Edit event dialog](edit-event-dialog.md)). The event card's horizontal photo row is a `ScrollView` nested in the feed's `FlatList`; the scroll view locks the axis, so swiping sideways scrolls the row and swiping up or down scrolls the feed.
- `keyboardShouldPersistTaps="handled"`, so Crear and Cancelar work on the first tap while the keyboard is up.

## States

| Status | Box | Shows |
| --- | --- | --- |
| `loading` | any | nothing (so a timeline with items never flashes the empty message) |
| `ready`, no items | closed | "Sin publicaciones todavía. Pulsa en el botón + para crear una." in `textSecondary` |
| `ready`, no items | open | only the box |
| `error` | any | "⚠️ No se pudieron cargar las publicaciones." in `textSecondary`, with a live region (and an iOS announcement) |

## Effects (none set state)

- **Scroll to top:** keyed on `openCount`, it calls `scrollToOffset({ offset: 0, animated: true })`.
- **Back button:** while Timeline is focused (`useIsFocused()`) and the box is open, a `hardwareBackPress` listener dismisses the keyboard, dispatches `close` and returns `true`. Listeners run newest first, so it runs before React Navigation's. With the type list open, the Modal's `onRequestClose` gets the press instead. On other tabs nothing is registered, so back returns to Timeline and the draft stays.

## Tests

- `src/__tests__/unit/components/timeline-feed-test.tsx`: the empty message, hidden while the box is open and while loading (`GatedSqlDatabase`), the load error (`FailingSqlDatabase` through a `createAppAdapters` spy), two creations newest first, feeds mixing text, image and event items in newest-first order, and `scrollToOffset` on open.
- `src/__tests__/unit/components/timeline-back-button-test.tsx`: uses `spyOnBackHandler()` (`src/test-utils/back-handler.ts`), because React Native 0.88 ships no BackHandler mock.
- `src/__tests__/e2e/create-text-item-test.tsx`: the full journeys.

Spec: [timeline-feed](../specs/timeline-feed.md) and [item-creation](../specs/item-creation.md).
