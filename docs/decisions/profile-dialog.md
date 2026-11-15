---
type: Decision
title: Profile dialog and module
description: The profile is an RN Modal owned by AppHeader, not a route, and its storage is a separate src/profile module that shares the items database, migrations and ports.
tags: [decision, profile, dialog, modal, hexagonal]
status: stable
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-15T19:00:00Z
---

# Profile dialog and module

From the `user-profile` change (`design.md` D1 and D2, now in `openspec/changes/archive/2026-11-15-user-profile/`).

## Decision

- **A `Modal` dialog owned by `AppHeader`,** opened from a local `profileOpen` state, with a counter `key` so every open starts from the saved profile. No screen underneath changes, so "return to the last screen" needs no code, the tab's scroll and the creation box draft stay untouched, Android back is the frame's `onRequestClose`, and a rotation keeps the dialog because the header never remounts. Opening dismisses the keyboard first.
- **A separate `src/profile/` module** with the same hexagonal rules as `src/items/`. It reuses the items ports (`StoredPhoto`, `PickedPhoto`, `Clock`, `IdGenerator`, `PhotoStore`, `SqlDatabase`), and `items/` never imports `profile/`.
- **One migration list:** schema step 5 (`people`, `people_history`) is appended to the items `MIGRATIONS`, because the file has one `user_version`. `ItemsProvider` builds both modules from one adapter set and one shared `prepare` promise, so the stores never race to migrate.

## Rejected

- A Stack above a `(tabs)` group: native back and a deep link, but it restructures `src/app/` and touches [Tab bar stays in one slot](tab-bar-single-slot.md) for no visible gain.
- A hidden tab route: it needs manual return logic or `backBehavior="history"`.
- An in-shell overlay without `Modal`: it keeps the header tappable (a need the user dropped) and needs manual back and screen-reader handling.
- Profile inside `src/items/`: a profile is not an item, and the timeline types would gain meaningless cases.
- Moving the database and adapters to `src/storage/` first: cleaner, but a refactor of every items import. A follow-up.
- A `ProfileProvider` with its own adapters: a second connection in the app and a different database in Jest.

See [Profile module](../architecture/profile-module.md), [Profile dialog](../components/profile-dialog.md) and [Shared edit dialog frame](shared-edit-dialog-frame.md).
