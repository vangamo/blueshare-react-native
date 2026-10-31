---
type: Decision
title: Mobile only, portrait, no web
description: BlueShare targets Android and iOS phones in portrait, running in Expo Go, with no web build, web files or web config.
tags: [decision, platform, scope]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Mobile only, portrait, no web

**Decision:** Android and iOS only, in portrait (`app.json` `orientation: "portrait"`). There is:
- no `web` block in `app.json`
- no `web` npm script
- no `*.web.ts(x)` files, no `global.css` and no web font variants

The app must keep running in **Expo Go**, so it adds no native modules beyond those bundled in Expo Go.

**Why:**
- The product is a phone app for seniors and families.
- Web support doubled the code paths in the starter.
- Expo Go keeps the development loop fast, with no custom native build.

**Consequence:**
- Before adding a library with native code, check that Expo Go ships it. If it does not, the project moves to development builds and the [app-platform spec](../specs/app-platform.md) must change first.
- Landscape and tablet mocks in `sketches/` are out of scope.

See [Native config and EAS](../development/native-config-and-eas.md).
