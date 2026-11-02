---
type: Reference
title: Known limitations
description: Accepted gaps, unverified platforms and open questions in the current BlueShare build.
tags: [limitations, open-questions, tech-debt]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T21:00:00Z
---

# Known limitations

- **Controls that do nothing yet:** the menu button, the avatar, search submit, the `+` button on Circles and Events, "Guardar" with "📅 Evento", and "Compartir" on text and image cards. The specs require this until their features land.
- **Keyboard on Android:** with the title field focused, the keyboard covers the footer and the `+` button. Nothing is pushed up. This is accepted for the skeleton, and hiding the bar while the keyboard is open is a follow-up.
- **iOS not verified on a device:** the checks so far ran on Android only, see [Device testing](../development/device-testing.md).
- **Mixed UI languages:** the creation box, cards and timeline messages are Spanish, with accessibility labels equal to the visible text, while the tab labels and the shell's accessibility labels ("Create", "Menu", "Search") are English (as the brief asks). One app language and i18n are still to be decided. See [Spanish copy and labels](../decisions/spanish-copy-labels.md).
- **Drafts are not saved:** a pending creation box draft survives tab switches but not an app restart (as the spec states).
- **Text length counts UTF-16 code units:** an emoji can count as 2 of the 8192 characters. See [Text limit](../decisions/text-limit.md).
- **Tests need Node 22.13 or later** for the built-in `node:sqlite` (`engines.node` in `package.json`).
- **No device-level automated tests:** no Maestro or Detox yet. Jest covers behavior, and the [visual review](../development/visual-review.md) covers rendering.
- **`eslint` listed twice in `package.json`:** `dependencies` has `^10.14.0` and `devDependencies` has `^9.0.0`. The installed version is 9.39.5. Clean this up, using [Dependencies](../development/dependencies.md) as a guide.
- **No navigation stack above the tabs:** add a `(tabs)` group when the first screen has to open on top of the tabs. See [Routing](../architecture/routing.md).
- **The edit history is write-only:** `items_history` and `text_items_history` keep every earlier version and deletion, but no screen reads them yet (no undo, no "Editado" mark). When sharing arrives in Phase 4, check the history for deleted items so an edit received from a contact does not bring one back. See [Items schema](../decisions/items-schema.md).
- **Editing covers text and image items:** event items will bring their own history table and edit step.
- **Photo files are never removed:** edits and deletions keep every photo copy because history points to them, so storage only grows. Photos are kept at original quality with no resizing. Cleanup and resizing wait for Phase 4 (see [Items schema](../decisions/items-schema.md)).
- **iOS and iPad unverified:** the adaptive layouts (`orientation: "default"`, `supportsTablet: true`) were checked in Jest and on Android emulators (a phone and a tablet), with TalkBack by the user. Whether iOS fires `keyboardDidShow` after a rotation is unknown, so the title field also compares the window size ([Title search field](../components/title-search-field.md)).
- **Little content in phone landscape:** with the header and the tab bar on top, about 250 points of content remain, less with keyboards that do not go full screen (some Samsung keyboards). Android's full-screen editor is accepted on phones in landscape.
- **Expo Go's dev bubble overlaps differently per layout:** the "Tools" bubble covers other areas in each layout, which matters for screenshots and taps ([Visual review](../development/visual-review.md)).
