---
type: Decision
title: Local SQLite storage
description: Items live in one expo-sqlite database on the phone, because it runs in Expo Go and gives queries, transactions and migrations.
tags: [decision, storage, sqlite, items]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Local SQLite storage (add-text-items D1)

**Decision:** keep items in one SQLite file, `blueshare.db`, opened once per app session with `expo-sqlite`.

**Why:**
- It is bundled in Expo Go, with the same API on Android and iOS.
- It gives real queries (order, filter out deleted items, join per-type tables), transactions and versioned migrations, which sharing will need.

**Rejected:**
- `AsyncStorage` or `expo-sqlite/kv-store`: the whole timeline as one blob, rewritten on every save, with no queries.
- A JSON file: the same problem, plus hand-made atomic writes.
- Drizzle ORM: an extra dependency and Babel plugin. The repository port already hides SQL, so it can still be adopted inside the adapter later.
- A remote backend: the product has no server.

See [Items module](../architecture/items-module.md).
