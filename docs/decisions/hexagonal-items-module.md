---
type: Decision
title: Hexagonal items module
description: Items code lives in src/items with domain, application and infrastructure layers, and the UI reaches it only through a provider and hooks.
tags: [decision, architecture, hexagonal, items]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Hexagonal items module (add-text-items D3)

**Decision:** a module folder `src/items/` with `domain/` (no React, Expo or SQL), `application/` (use cases, the timeline store, the composition root) and `infrastructure/` (SQL port, migrations, repository, Expo driver). Dependencies point inward. UI code uses only `ItemsProvider` and the hooks. The ports hold only what this change uses; update and delete arrive with "Editar".

**Why:**
- The domain and use cases are tested without React or Expo, and `Clock` and `IdGenerator` ports make them deterministic.
- The UI is not tied to the storage.
- Contacts and sharing will be sibling modules, so it is a folder per module, not a top-level `src/domain/`.

**Rejected:**
- Hooks calling `expo-sqlite` straight from components: fast, but untestable in Jest.
- Classes with a DI container: too heavy for this size.

Rules: [`src/items/CLAUDE.md`](../../src/items/CLAUDE.md). Details: [Items module](../architecture/items-module.md).
