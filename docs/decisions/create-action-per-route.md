---
type: Decision
title: Create action per route
description: The + button gets its visibility and action from useCreateAction(), a small map from the current route and the creation box state.
tags: [decision, navigation, create-button]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T16:55:28Z
---

# Create action per route (add-text-items D6)

**Decision:** `useCreateAction()` returns `{ visible, onPress }` from `usePathname()` and the creation box state. On `/` it opens the box, and the button is not rendered while the box is open (which also removes it from the accessibility tree). On `/circles` and `/events` it does nothing yet.

**Why:** three routes fit in a small map, and it needs no effects.

**Rejected:** each screen registering its action in a context on focus. More decoupled, but it needs a focus effect that sets state (forbidden) and creates ordering problems between screens.

See [Create button](../components/create-button.md).
