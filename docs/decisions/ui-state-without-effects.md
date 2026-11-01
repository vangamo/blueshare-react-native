---
type: Decision
title: UI state without effects
description: The timeline is an external store read with useSyncExternalStore, and the creation box is a reducer above the tabs, so no effect ever calls setState.
tags: [decision, state, react-compiler, items]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# UI state without effects (add-text-items D5)

**Decision:** two pieces of state live above the tabs, in providers that `_layout.tsx` renders around the shell:
1. **Timeline store:** a plain object with `subscribe`, `getSnapshot` and `createText`, read through `useTimeline()` (`useSyncExternalStore`). The first subscribe runs the migrations, then loads the timeline. The snapshot is `loading`, `ready` or `error` plus the items.
2. **Creation box state:** a reducer in `CreationBoxProvider` (`closed`, `choose`, `write`, plus `openCount`), read through `useCreationBox()`.

`ItemsProvider` builds the module once with a lazy `useState` initializer.

**Why:**
- `useEffect` + `setState` is forbidden by the React Compiler lint rule ([Linting](../development/linting.md)).
- State above the tabs keeps the draft across tab switches and lets the `+` button read the box step.

**Rejected:**
- React 19 `use(promise)` with Suspense: covers the first load only.
- TanStack Query: a dependency for an offline app.
- The `expo-sqlite` change listener: not needed while the app is the only writer. Revisit when items arrive over Bluetooth.

See [Items provider](../components/items-provider.md) and [Creation box provider](../components/creation-box-provider.md).
