---
type: Overview
title: Product overview
description: BlueShare is an accessible intergenerational social feed for Android and iOS that connects older adults with young people.
tags: [product, audience, accessibility]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Product overview

BlueShare is a React Native (Expo) mobile app that connects **older adults and young people**. Users share events, short texts and photos with their loved ones and close circles in a simple social feed.

## Audience and principles

- The audience includes seniors, so the UI must be **high-contrast, easy to read and easy to tap**: WCAG AA contrast and touch targets of at least 44×44 points. See [Accessibility](../development/accessibility.md).
- Platform-agnostic components that look the same on Android and iOS. Phones only, in portrait. See [Mobile only, portrait, no web](../decisions/mobile-only.md).

## Planned features

- **Fixed header:** menu button, a title that doubles as a search field, and a profile avatar. Built: [App header](../components/app-header.md).
- **Fixed footer navigation:** text tabs for Timeline, Circles and Events. Built: [Footer tab bar](../components/footer-tab-bar.md).
- **Floating create button (`+`):** opens an inline creation menu (Evento, Texto, Imagen). The button is built, the menu is not: [Create button](../components/create-button.md).
- **Mixed feed:** event cards (photo carousel, title, category badge, Edit and Share actions), text cards and image cards with captions. Not built yet.

## Current state

Only the app shell exists. The three sections show placeholder content. See [Roadmap](roadmap.md) and [Known limitations](known-limitations.md).
