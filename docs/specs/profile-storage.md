---
type: Specification
title: profile-storage
description: The user's own profile is kept in the local SQLite database with one stable UUID per installation, a trimmed name of up to 60 characters, an avatar photo copied into app storage, all-or-nothing saves and every earlier version kept.
tags: [spec, implemented, storage, sqlite, profile]
resource: ../../openspec/specs/profile-storage/spec.md
status: stable
generated:
  by: claude-code/claude-sonnet-5-5
  at: 2026-11-15T19:00:00Z
---

# profile-storage (implemented)

Full text: `openspec/specs/profile-storage/spec.md`. From the change `user-profile`, with schema step 5.

| Requirement | Summary | Implemented in |
| --- | --- | --- |
| One stable identity per installation | The first read creates the own profile with a random UUID v4, no name and no photo. It never changes and there is exactly one. | `loadProfile`, `people_one_me` |
| Profile content | A UUID, an optional name and an optional avatar (file, width, height), with created and updated times. | `Profile`, [Profile module](../architecture/profile-module.md) |
| Name rules | Trimmed, 1 to 60 characters when saved, otherwise rejected. | `normalizeProfileName`, `PROFILE_NAME_MAX_LENGTH` |
| Avatar photo rules | A photo with a file name and positive sizes, copied into app storage. An unusable one is rejected. | `checkAvatar`, `PhotoStore` |
| Saving is all or nothing | The history row and the update happen together, and a photo copy is removed if the save fails. | `updateProfile`, `SqliteProfileRepository` |
| Earlier versions are kept | Each save adds the previous version to `people_history`, numbered 1, 2, 3. Photo files are never removed. | [Items schema](../decisions/items-schema.md) |
| The profile persists | Same profile after a restart, and an upgrade from schema v4 keeps every item. | `migrations.ts`, device check in [Device testing](../development/device-testing.md) |
