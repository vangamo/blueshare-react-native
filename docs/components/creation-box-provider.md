---
type: Component
title: Creation box provider
description: Holds the creation box state above the tabs (closed, choose, write, image, event, plus openCount) with a reducer, so the draft survives tab switches and the + button can hide.
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
  | { step: 'image'; photo: PickedPhoto | null; altText: string; caption: string;
      saving: boolean; error: 'save' | 'picker' | null }
  | { step: 'event'; photos: EventPhotoDraft[]; title: string; category: string;
      description: string; saving: boolean; error: 'save' | 'picker' | null }
openCount: number   goes up on every open; the feed scrolls to the top when it changes
```

| Action | Effect |
| --- | --- |
| `open` | closed → choose(null), `openCount + 1` |
| `chooseType` | choose → choose(type) |
| `confirmType` | choose(text) → write(''), choose(image) → image(no photo, empty texts), choose(event) → event(no photos, empty fields). With no type nothing changes. |
| `setText` | write → new text, `failed` cleared |
| `photoPicked` | image → new photo (the picker's cache URI, copied only on Crear), texts kept, `error` cleared |
| `setAltText` / `setCaption` | image → new text, `error` cleared |
| `photosAdded` | event → the drafts appended at the end, keeping only the first `EVENT_MAX_PHOTOS` (`appendPhotos`), `error` cleared |
| `photoRemoved` | event → the draft with that `key` removed, the others kept in order, `error` cleared |
| `setTitle` / `setCategory` / `setDescription` | event → new text, `error` cleared |
| `pickerFailed` | image or event → `error: 'picker'` |
| `saveStarted` / `saveFailed` | `saving` on / `saving` off and `failed` on (write), `error: 'save'` (image and event) |
| `close` | any → closed (Cancelar, the back button or a successful Crear) |

An action for another step returns the same state object. `EventPhotoDraft` (`{ key, kind: 'picked' | 'stored', photo }`) comes from [`event-photo-grid.tsx`](event-fields.md); in the event step every draft is `picked`, keyed by a counter so the same gallery photo picked twice gets two thumbnails. The limit message and the disabled photo button are derived during render from `photos.length`, so no extra flag is needed. The reducer is exported as `creationBoxReducer` with `initialCreationBoxState`.

Because the state lives above the tabs, switching tabs keeps the draft, and [the create button](create-button.md) can read `box.step`. The draft lives in memory only, so it is gone after an app restart.

## Tests

`src/__tests__/unit/components/creation-box-provider-test.ts` covers every transition (including the event step: appending in order, truncating at the limit, removing, the text actions clearing the error and the save actions), `close` from every step, `openCount`, and actions that don't apply.
