---
type: Component
title: Items provider
description: Creates the items module once per app session and shares its timeline store with useTimeline(). Takes optional adapters so tests can inject a failing database.
tags: [component, provider, items, state]
resource: ../../src/components/items-provider.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:30:00Z
---

# Items provider

`ItemsProvider({ adapters?, children })`, rendered by the root layout around the shell (see [Shell layout](../architecture/shell-layout.md)).

## Behavior

- Creates the module with a lazy initializer: `useState(() => createItemsModule(adapters ?? createAppAdapters()))`. No effect is involved, and the module lives for the whole session.
- `adapters` is dependency injection: the app uses the default (expo-sqlite, expo-crypto, `Date.now`), and tests pass a `FailingSqlDatabase` to check error states. In Jest the default is already swapped for an in-memory `node:sqlite` database.
- In development React may run the initializer twice. That opens a second connection to the same file and keeps one module, which is harmless.

## `useTimeline()` (`src/hooks/use-timeline.ts`)

- Reads the store with `useSyncExternalStore(store.subscribe, store.getSnapshot)`.
- Returns `{ status, items, createText }`. `status` is `'loading'`, `'ready'` or `'error'`. `createText(raw)` resolves with the new item, or rejects when it can't be saved.
- Throws when used outside the provider.
- Re-exports the `ItemType` and `TimelineItem` types, so UI code doesn't import from `src/items/`.

The store contract is in [Items module](../architecture/items-module.md).

## Tests

`src/__tests__/unit/hooks/use-timeline-test.tsx`: the status goes from `loading` to `ready` with no items, created items show newest first, and the hook throws without a provider.
