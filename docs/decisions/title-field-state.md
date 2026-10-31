---
type: Decision
title: Title field state without effects
description: The title field computes its displayed value during render and changes state only in onFocus and onBlur, which keeps the React Compiler lint rules happy.
tags: [decision, state, react-compiler, lint]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Title field state without effects (D7)

**Decision:** keep `query` and `focused`, and compute `value` during render:

```ts
const value = focused ? query : query.trim() ? query : 'BlueShare';
```

Change state only in the `onFocus` and `onBlur` handlers.

**Why:**
- Syncing state in a `useEffect` would trip `react-hooks/set-state-in-effect` (React Compiler rules in `eslint-config-expo`), and [lint is mandatory](../development/linting.md).
- Computing during render is also simpler and has no extra renders.

**Allowed effect:** a `useEffect` that only **subscribes** (the Android `keyboardDidHide` → `blur()` fix) is fine, because it never calls `setState`.

See [Title search field](../components/title-search-field.md).
