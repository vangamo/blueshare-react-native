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

- **Touch targets ≥ 44×44 pt** (`Layout.touchTarget`) for every interactive control. The only exception is the 42-point title field on phones, which is much wider. These 44 points also override the landscape mock where it draws smaller controls.
- **Roles and labels:** buttons use `accessibilityRole="button"` with a clear `accessibilityLabel` ("Menu", "Create"). Tabs use a `tablist` container, and each tab has `role="tab"` and `accessibilityState={{ selected }}`. Text inputs get a label ("Search"). The avatar is a button labelled "Profile" (its circle is hidden from screen readers; the profile dialog's preview is an `image` named "Foto de perfil" or "Sin foto de perfil"). A display-only element that carries meaning is `accessible` with a label.
- **Contrast (WCAG 2.x):** text ≥ 4.5:1, large text ≥ 3:1, icons and the only boundary of a control ≥ 3:1, in **both** light and dark. New pairs go into `theme-test.ts`, which uses the `contrastRatio` helper in `src/test-utils/contrast.ts`. See [Color palettes](../design-system/color-palettes.md).
- **Readable type:** bold labels (14 pt and up) and 16-point bold for the title field. Avoid thin weights.
- **Device check:** run TalkBack on Android for any new control. The accessibility tree can be dumped with `adb shell uiautomator dump`. See [Device testing](device-testing.md).
- **Dialogs** (the edit dialogs and the [profile dialog](../components/profile-dialog.md)): a `Modal` whose box has `accessibilityViewIsModal`, so nothing behind it is reachable. Failure and validation messages are alerts in a polite live region, and iOS also gets an explicit announcement. Fields have a label equal to their visible text, and the profile name field carries its hint as `accessibilityHint`.
