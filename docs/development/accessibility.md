---
type: Convention
title: Accessibility
description: BlueShare's audience includes seniors: 44-point touch targets, explicit roles and labels, and WCAG AA contrast in both palettes are required.
tags: [accessibility, a11y, wcag]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Accessibility

Accessibility is a product requirement. See [Product overview](../product/overview.md).

- **Touch targets ≥ 44×44 pt** (`Layout.touchTarget`) for every interactive control. The only exception is the 42-point title field, which is much wider.
- **Roles and labels:** buttons use `accessibilityRole="button"` with a clear `accessibilityLabel` ("Menu", "Create"). Tabs use a `tablist` container, and each tab has `role="tab"` and `accessibilityState={{ selected }}`. Text inputs get a label ("Search"). A display-only element that carries meaning is `accessible` with a label ("Profile").
- **Contrast (WCAG 2.x):** text ≥ 4.5:1, large text ≥ 3:1, icons and the only boundary of a control ≥ 3:1, in **both** light and dark. New pairs go into `theme-test.ts`, which uses the `contrastRatio` helper in `src/test-utils/contrast.ts`. See [Color palettes](../design-system/color-palettes.md).
- **Readable type:** bold labels (14 pt and up) and 16-point bold for the title field. Avoid thin weights.
- **Device check:** run TalkBack on Android for any new control. The accessibility tree can be dumped with `adb shell uiautomator dump`. See [Device testing](device-testing.md).
