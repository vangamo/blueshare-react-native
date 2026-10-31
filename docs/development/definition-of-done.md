---
type: Guide
title: Definition of done
description: A task is done only when lint passes with zero warnings, the typecheck and the tests pass, and any visual change has been checked on a device.
tags: [workflow, quality, checklist]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Definition of done

Before you call any code task finished:

1. `npx expo lint --max-warnings 0` passes, with no new `eslint-disable`. See [Linting](linting.md).
2. `npx tsc --noEmit` passes. If `Href` errors appear after route changes, run `npx expo start` once to regenerate the typed routes.
3. `npm test` passes, with no `.only` or `.skip` left. New behavior comes with tests. See [Testing](testing.md).
4. No hard-coded colors in components (`grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx` finds nothing). See [Theme module](../design-system/theme-module.md).
5. After a dependency change, `npx expo-doctor` and `npx expo install --check` pass.
6. After a **visual change**, run the `visual-review` skill: emulator, light and dark, compared with the approved screenshots. See [Visual review](visual-review.md).
7. If the change touches specified behavior, update the OpenSpec artifacts first. See [OpenSpec workflow](openspec-workflow.md).

Report failures and skipped checks honestly.
