---
type: Decision
title: Shell at the root layout
description: The header, footer and create button render once in the root layout around the navigator, so they never re-mount or flicker.
tags: [decision, layout, shell]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Shell at the root layout (D2)

**Decision:** `AppHeader` sits above `Tabs` in the root `View`. The footer is the navigator's `tabBar`. `CreateButton` is an absolutely positioned sibling drawn last. See [Shell layout](../architecture/shell-layout.md).

**Why:**
- Each piece mounts once.
- Content can never scroll under the header.
- Switching tabs changes only the content area, which is a spec requirement.
- Header, tab bar and FAB stay separate components that can be replaced one at a time.

**Rejected:**
- A per-screen header through the `header` screen option: it mounts once per screen and can flicker when switching tabs.

**Consequence:** a screen that needs its own header, or none, will need a stack or group above the tabs (not built yet).
