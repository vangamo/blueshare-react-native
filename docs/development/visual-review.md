---
type: Reference
title: Visual review
description: Why visual changes are reviewed with structured screenshot comparisons, where the approved references live, and which differences from the sketches are intentional.
tags: [screenshots, visual, review, design]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Visual review

**How to run:** the `visual-review` project skill (`.claude/skills/visual-review/SKILL.md`) covers capture, masking, pixel comparison, the review against the sketches, and updating the references.

## Why a structured review

The sketches are an HTML mock (380×780, browser fonts and emoji), so a pixel diff against them always fails. New UI is reviewed for structure, sizes in px against points × 2.625, and colors sampled against the tokens. **Unchanged** UI is checked by a pixel diff against the approved references, after masking the status bar and Expo Go's "Tools" bubble.

## Approved references

`src/__tests__/e2e/screenshots/`: `timeline`, `circles`, `events` and `title-focused`, each in `-light` and `-dark` (taken on an Android emulator with the reference device profile from [Device testing](device-testing.md): 1080×2400, density 420). The user approved them, and they change only with new approval. They are also the future references for Maestro `assertScreenshot` flows. Metro does not bundle them.

## Intentional differences from the sketches

- no feed cards yet
- the active tab is `#006fe6` ([Active tab contrast](../decisions/active-tab-contrast.md))
- platform fonts and emoji
- the device is 411 points wide while the mock is 360, so elements look smaller relative to the screen

Dark mode has no sketch: it must match the light structure with the [dark palette](../design-system/color-palettes.md).

Device setup: [Device testing](device-testing.md).
