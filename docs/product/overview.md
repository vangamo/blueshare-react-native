---
type: Overview
title: Product overview
description: BlueShare is an accessible intergenerational social feed for Android and iOS that connects older adults with young people.
tags: [product, audience, accessibility]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Product overview

BlueShare is a React Native (Expo) mobile app that connects **older adults and young people**. Users share events, short texts and photos with their loved ones and close circles in a simple social feed.

## Audience and principles

- The audience includes seniors, so the UI must be **high-contrast, easy to read and easy to tap**: WCAG AA contrast and touch targets of at least 44×44 points. See [Accessibility](../development/accessibility.md).
- Platform-agnostic components that look the same on Android and iOS. Phones and tablets, in any orientation. See [Mobile only, no web](../decisions/mobile-only.md) and [Adaptive layout](../decisions/adaptive-layout.md).

## Planned features

- **Fixed header:** menu button, a title that doubles as a search field, and a profile avatar. Built: [App header](../components/app-header.md).
- **Fixed tab navigation:** text tabs for Timeline, Circles and Events, at the bottom in portrait and under the header in landscape. Built: [Tab bar](../components/tab-bar.md).
- **Floating create button (`+`):** opens an inline creation menu (Evento, Texto, Imagen). On Timeline it opens the [creation box](../components/creation-box.md). Only Texto creates an item so far: [Create button](../components/create-button.md).
- **Mixed feed:** event cards (photo carousel, title, category badge, Edit and Share actions), text cards and image cards with captions. Text cards are built ([Text item card](../components/text-item-card.md), with an [edit dialog](../components/edit-text-dialog.md)); event and image cards are not.

## Current state

The app shell and text items exist. Timeline lists text items saved on the phone, newest first, and "Editar" lets the user change or delete a text. Circles and Events show placeholder content. See [Roadmap](roadmap.md) and [Known limitations](known-limitations.md).
