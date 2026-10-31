---
type: Guide
title: Linting
description: Every TS/TSX change must pass npx expo lint --max-warnings 0 with the stock Expo flat config. No rules may be loosened, and new eslint-disable comments are not allowed.
tags: [lint, eslint, quality]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Linting

- Config: `eslint.config.js` = `eslint-config-expo/flat` + `ignores: ['dist/*']`. It includes the React Compiler `react-hooks` rules.
- Command: `npx expo lint --max-warnings 0`. It checks `src/`, including tests. Use `--no-cache` for the final run, because results are cached in `.expo/cache/eslint/`.
- **Mandatory:** zero errors and zero warnings, run at the end of **every** task that writes code, not only at the end of a change.
- **Never loosen `eslint.config.js`.** Adding Jest globals for test files is allowed if they are ever reported. It is not needed today.
- **No new `eslint-disable`.** If one truly cannot be avoided, use a single `eslint-disable-next-line <rule> -- <reason>`.
- Common trap: `react-hooks/set-state-in-effect`. Compute derived values during render instead. See [Title field state without effects](../decisions/title-field-state.md).

Part of the [Definition of done](definition-of-done.md).
