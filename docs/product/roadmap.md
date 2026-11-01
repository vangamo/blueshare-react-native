---
type: Overview
title: Roadmap
description: BlueShare is built in four phases. Phase 1 (core layout and main feed) has delivered the app shell and text items, and image and event items are next.
tags: [product, roadmap, planning]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Core layout and main feed | Shell and text items done. Image and event items, Editar and Compartir not started. |
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

## Next in Phase 1

- Image and event items: their creation steps (Guardar with "📷 Imagen" or "📅 Evento" does nothing yet) and their cards, using the reserved tokens (`badgeBg`, `badgeText`, `backgroundBody`) and the `feed_cards` component notes in the [design tokens](../design-system/design-tokens.md). Each type gets its own table ([Items schema](../decisions/items-schema.md)).
- "Editar" on text cards, which adds update and soft-delete to the items repository. "Compartir" waits for Phase 4.
- The side menu ([app header](../components/app-header.md)) and search ([title search field](../components/title-search-field.md)).

## Workflow follow-ups

- Add Maestro flows with `assertScreenshot`, using the approved screenshots as references. See [Visual review](../development/visual-review.md).
- Choose one UI language and set up i18n. See [Known limitations](known-limitations.md).
