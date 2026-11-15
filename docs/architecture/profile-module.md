---
type: Reference
title: Profile module
description: How the user's own profile (a stable UUID, a name and an avatar photo) is stored and read. A hexagonal module in src/profile that shares the items module's SQLite database, migrations and photo store, with a people table and a history table.
tags: [profile, architecture, sqlite, hexagonal, persistence]
resource: ../../src/profile/
status: stable
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-15T12:00:00Z
---

# Profile module

The profile is the user's own identity on the phone: a UUID created once, a name and an avatar photo. Requirements: the [profile-storage](../specs/profile-storage.md) and [user-profile](../specs/user-profile.md) specs (change `user-profile`, archived 2026-11-15). Decision: [Profile dialog and module](../decisions/profile-dialog.md). Local rules: [`src/profile/CLAUDE.md`](../../src/profile/CLAUDE.md).

## Layout and dependency rule

```
src/profile/
  domain/           Profile, AvatarInput, normalizeProfileName, checkAvatar,
                    withProfileChanges, InvalidProfileError, ProfileNotFoundError,
                    ProfileRepository (port)
  application/      loadProfile, updateProfile, the profile store, profile-module.ts
  infrastructure/   sqlite-profile-repository.ts
```

- `domain/` ← `application/` ← `infrastructure/`, like [Items module](items-module.md). The domain imports no React, Expo or SQL (it reads `PROFILE_NAME_MAX_LENGTH` from `src/constants/limits.ts`).
- It reuses the items module's `StoredPhoto`, `PickedPhoto`, `photoExtension`, the `Clock`, `IdGenerator` and `PhotoStore` ports, `importPhotos` / `removePhotos` and the `SqlDatabase` port. `items/` never imports `profile/`.

## Ports

| Port | Methods |
| --- | --- |
| `ProfileRepository` (domain) | `findMe()`, `createMe(profile)`, `updateMe(profile)` (throws `ProfileNotFoundError` with no own row) |

## Rules

- **Name:** trimmed, 1 to 60 UTF-16 code units. The limit is a domain rule, not a SQL `CHECK`.
- **Avatar:** a picked photo needs a positive, finite size and is copied as `<uuid>.<ext>` into `<documents>/images/`. Old avatar files are never removed because history points to them.
- **Identity:** the first `loadProfile` creates the own profile with a new UUID, no name and no photo. A partial unique index allows one `is_me = 1` row.
- **History:** `updateMe` copies the live row into `people_history` with the next counter, then updates, in one transaction.

## Schema v5

The tables are step 5 of the shared `MIGRATIONS` list (the database file has one `user_version`): `people (id, is_me, display_name, avatar_file, avatar_width, avatar_height, created_at, updated_at)` with the unique index `people_one_me`, and `people_history (person_id, counter, ...)`. The `people` table is shaped for the contacts of Phase 2 and the profiles received in Phase 4.

## Application layer and the store

- `loadProfile(deps)()` returns the stored own profile, or creates it (new UUID from `ids`, no name, no photo).
- `updateProfile(deps)(current, { name, avatar })` normalizes the name, checks a picked photo, returns `current` when nothing changes, copies a picked photo as `<id>.<ext>` (`copy_failed` on error), then stores; a failed store removes the new copy.
- `createProfileStore` mirrors the timeline store: `getSnapshot()` is `{ status: 'loading' | 'ready' | 'error', profile }`, `subscribe()` starts the load (`prepare()`, then `loadProfile()`), and `update(input)` waits for the load and replaces the profile (an unchanged save keeps the snapshot).
- `ItemsProvider` builds this module next to the items module from the same adapters with one shared migration, and `useProfile()` ([Items provider](../components/items-provider.md)) reads it.

Related: [Items module](items-module.md), [Project structure](project-structure.md).
