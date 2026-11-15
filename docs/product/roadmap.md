---
type: Overview
title: Roadmap
description: BlueShare is built in four phases. Phase 1 (core layout and main feed) has delivered the app shell and text, image and event items, and locations for image and event items are next.
tags: [product, roadmap, planning]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-06T12:00:00Z
---

# Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Core layout and main feed | Shell, text, image and event items and Editar done. Item locations next. Compartir waits for Phase 4. |
| 2 | Circles (contacts management) | Not started |
| 3 | User events management | Not started |
| 4 | Bluetooth sharing | Not started |

## Delivered in Phase 1

The OpenSpec change `basic-app-layout` (branch `01-layout`, archived 2026-11-01 in `openspec/changes/archive/2026-11-01-basic-app-layout/`):
- removed the Expo starter and web support
- built the theme from JSON tokens
- built the header, footer tabs and create button
- set up Jest tests and the device screenshot review

Specs: [app-shell](../specs/app-shell.md), [app-theming](../specs/app-theming.md), [app-platform](../specs/app-platform.md).

The OpenSpec change `add-text-items` (branch `02-text-items`, archived 2026-11-01 in `openspec/changes/archive/2026-11-01-add-text-items/`):
- the `+` button opens a creation box on Timeline, to choose a type and write a text
- text items are saved in a local SQLite database and listed newest first as cards
- the hexagonal `src/items/` module, with the real SQL tested on `node:sqlite`

Specs: [item-creation](../specs/item-creation.md), [item-storage](../specs/item-storage.md), [timeline-feed](../specs/timeline-feed.md), and changes to app-shell and app-theming.

The OpenSpec change `edit-text-items` (branch `02-text-items`, archived 2026-11-02 in `openspec/changes/archive/2026-11-02-edit-text-items/`):
- "Editar" on a text card opens an edit dialog to change the text or delete the item, with a confirmation before deleting
- schema v2: edits and deletions copy the previous version into append-only history tables, and an edited card keeps its place
- new `danger` and `on_danger` colors for the deletion buttons

Specs: [item-editing](../specs/item-editing.md) (new), and changes to [item-storage](../specs/item-storage.md), [timeline-feed](../specs/timeline-feed.md) and [app-theming](../specs/app-theming.md).

The OpenSpec change `adaptive-layout` (branch `01bb-adaptable-layout`, 28/28 tasks, archived 2026-11-02 in `openspec/changes/archive/2026-11-02-adaptive-layout/`):
- the app runs on phones and tablets in any orientation, with four layouts chosen from the window size
- phone and tablet size sets, a content column, safe areas on every side, and the tab bar under the header in landscape
- a rotation keeps the section, draft, open dialog and focused field

Specs: [adaptive-layout](../specs/adaptive-layout.md). Decisions: [Adaptive layout](../decisions/adaptive-layout.md), [Tab bar stays in one slot](../decisions/tab-bar-single-slot.md).

The OpenSpec change `add-image-items` (branch `03-image-items`, 36/36 tasks, archived 2026-11-02 in `openspec/changes/archive/2026-11-02-add-image-items/`):
- "📷 Imagen" picks one photo with optional alternative text and caption, copied into app storage
- image cards show the photo whole, and the image dialog changes or deletes it

The OpenSpec change `event-items` (branch `04-event-items`, 28/28 tasks, archived 2026-11-06 in `openspec/changes/archive/2026-11-06-event-items/`):
- "📅 Evento" opens an event step: 1 to 10 photos picked several at a time, a title, a category with suggestions and an optional description
- event cards with a deep-blue accent bar, a category badge and a sideways row of square photo tiles; an event dialog to change photos and texts or delete it
- schema v4: event and ordered photo tables with their history twins

Specs: changes to [item-creation](../specs/item-creation.md), [item-editing](../specs/item-editing.md), [item-storage](../specs/item-storage.md), [timeline-feed](../specs/timeline-feed.md), [adaptive-layout](../specs/adaptive-layout.md) and [app-theming](../specs/app-theming.md). Decision: [Event items](../decisions/event-items.md).

## Next in Phase 1

- Locations for image and event items: the next change, `add-item-locations` (nullable location columns added to `image_items` and `event_items`).
- "Compartir" on text, image and event cards waits for Phase 4.
- The side menu ([app header](../components/app-header.md)) and search ([title search field](../components/title-search-field.md)).

## Workflow follow-ups

- Add Maestro flows with `assertScreenshot`, using the approved screenshots as references. See [Visual review](../development/visual-review.md).
- Choose one UI language and set up i18n. See [Known limitations](known-limitations.md).
