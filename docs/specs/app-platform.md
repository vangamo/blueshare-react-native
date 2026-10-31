---
type: Specification
title: app-platform
description: Android and iOS phones in portrait only, running in Expo Go with no extra native modules, native splash until first render, and no Expo starter content.
tags: [spec, implemented, platform]
resource: ../../openspec/specs/app-platform/spec.md
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# app-platform (implemented)

Full text: `openspec/specs/app-platform/spec.md`.

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| Android and iOS in portrait only | Rotating keeps portrait. No web script and no web config. | `app.json`, `package.json`, [Mobile only](../decisions/mobile-only.md) |
| Runs in Expo Go | Loads on Timeline in Expo Go with no native-module errors. No development build needed. | dependency rules, [Dependencies](../development/dependencies.md) |
| Native splash screen until first render | Native splash, then the shell directly with no animated logo. Never stuck. | [Splash hidden on first layout](../decisions/splash-hidden-on-layout.md) |
| No starter demo content | No Welcome or Explore screens, demo images, reset script or Expo doc links. A `/explore` deep link shows no starter content. | starter removed, e2e test |

Device results (Android emulator, API 37): [Device testing](../development/device-testing.md). iOS has not been checked on a device.
