---
type: Overview
title: Roadmap
description: BlueShare is built in four phases. Phase 1 (core layout and main feed) has delivered the app shell, and the feed is next.
tags: [product, roadmap, planning]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T14:00:00Z
---

# Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Core layout and main feed | Shell done. Feed not started. |
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

## Next in Phase 1

- Feed cards (event, text, image) inside the Timeline section, using the reserved tokens (`badgeBg`, `badgeText`, `backgroundBody`) and the `feed_cards` component notes in the [design tokens](../design-system/design-tokens.md).
- The creation box opened by the [create button](../components/create-button.md).
- The side menu ([app header](../components/app-header.md)) and search ([title search field](../components/title-search-field.md)).

## Workflow follow-ups

- Add Maestro flows with `assertScreenshot`, using the approved screenshots as references. See [Visual review](../development/visual-review.md).
- Choose one UI language and set up i18n. See [Known limitations](known-limitations.md).
