---
type: Reference
title: Known limitations
description: Accepted gaps, unverified platforms and open questions in the current BlueShare build.
tags: [limitations, open-questions, tech-debt]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Known limitations

- **Controls that do nothing yet:** the menu button, the avatar, search submit and the `+` button. The spec requires this until their features land.
- **Keyboard on Android:** with the title field focused, the keyboard covers the footer and the `+` button. Nothing is pushed up. This is accepted for the skeleton, and hiding the bar while the keyboard is open is a follow-up.
- **iOS not verified on a device:** there is no iOS simulator on the development machine (Linux). Only Android was checked, see [Device testing](../development/device-testing.md).
- **Mixed UI languages:** the search placeholder is Spanish ("Buscar...") while tab and accessibility labels are English (as the brief asks). One app language and i18n are still to be decided.
- **No device-level automated tests:** no Maestro or Detox yet. Jest covers behavior, and the [visual review](../development/visual-review.md) covers rendering.
- **`eslint` listed twice in `package.json`:** `dependencies` has `^10.14.0` and `devDependencies` has `^9.0.0`. The installed version is 9.39.5. Clean this up, using [Dependencies](../development/dependencies.md) as a guide.
- **No navigation stack above the tabs:** add a `(tabs)` group when the first screen has to open on top of the tabs. See [Routing](../architecture/routing.md).
