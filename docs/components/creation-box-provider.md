---
type: Component
title: Creation box provider
description: Holds the creation box state above the tabs (closed, choose, write, plus openCount) with a reducer, so the draft survives tab switches and the + button can hide.
tags: [component, provider, state, creation-box]
resource: ../../src/components/creation-box-provider.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:30:00Z
---

# Creation box provider

`CreationBoxProvider({ children })`, rendered by the root layout inside `ItemsProvider` (see [Shell layout](../architecture/shell-layout.md)). Components read it with `useCreationBox()` (`src/hooks/use-creation-box.ts`), which returns `{ box, openCount, dispatch }` and throws outside the provider.

## State

```
box =
  | { step: 'closed' }
  | { step: 'choose'; type: ItemType | null }
  | { step: 'write'; text: string; saving: boolean; failed: boolean }
openCount: number   goes up on every open; the feed scrolls to the top when it changes
```

| Action | Effect |
| --- | --- |
| `open` | closed → choose(null), `openCount + 1` |
| `chooseType` | choose → choose(type) |
| `confirmType` | choose(text) → write(''). With `event`, `image` or no type nothing changes. |
| `setText` | write → new text, `failed` cleared |
| `saveStarted` / `saveFailed` | `saving` on / `saving` off and `failed` on |
| `close` | any → closed (Cancelar, the back button or a successful Crear) |

An action for another step returns the same state object. The reducer is exported as `creationBoxReducer` with `initialCreationBoxState`.

Because the state lives above the tabs, switching tabs keeps the draft, and [the create button](create-button.md) can read `box.step`. The draft lives in memory only, so it is gone after an app restart.

## Tests

`src/__tests__/unit/components/creation-box-provider-test.ts` covers every transition, `close` from every step, `openCount`, and actions that don't apply.
