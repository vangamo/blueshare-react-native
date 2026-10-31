---
type: Guide
title: Visual review
description: Visual changes are checked by capturing emulator screenshots with adb and comparing them with the approved set in src/__tests__/e2e/screenshots and with the sketches.
tags: [screenshots, visual, review, design]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Visual review

The sketches are an HTML mock (380×780, browser fonts and emoji), so a pixel diff against them always fails. The review is **structured**: structure, sizes and sampled colors.

## Approved reference set

`src/__tests__/e2e/screenshots/`: `timeline`, `circles`, `events` and `title-focused`, each in `-light` and `-dark` (1080×2400 from `Medium_Phone_API_37.0`). The user approved them. They are the references for future Maestro `assertScreenshot` flows. Metro does not bundle them.

## Capture

```bash
adb shell settings put global sysui_demo_allowed 1
adb shell am broadcast -a com.android.systemui.demo -e command enter
adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 1200
adb shell am broadcast -a com.android.systemui.demo -e command network -e mobile hide
adb shell cmd uimode night no            # or yes for dark
adb exec-out screencap -p > shot.png     # shell redirection (adb is a snap)
adb shell am broadcast -a com.android.systemui.demo -e command exit   # when done
```

## Compare with the approved set

Mask the status bar and Expo Go's floating "Tools" bubble, which are not part of the app, then count the differing pixels:

```bash
mask(){ convert "$1" -fill black -draw "rectangle 0,0 1079,80" -draw "rectangle 30,1740 190,1980" "$2"; }
compare -metric AE -fuzz 2% ref-masked.png new-masked.png diff.png   # 0 = identical
```

On 2026-11-01, after the move to JSON tokens, all six tab screenshots matched with 0 differing pixels.

## Compare with the sketches (new UI)

Read the screenshot next to `sketches/mobile-portrait.png`, `header-…` and `footer-…`, and check:
- order and alignment
- heights in px against (70 or 75 + inset) × 2.625
- border widths and colors, tab spacing, FAB position

Sample colors with `magick shot.png -format '%[pixel:p{X,Y}]' info:` and compare with `Colors`. Dark mode has no sketch: it must match the light structure with the dark palette.

**Intentional differences:**
- no feed cards yet
- the active tab is `#006fe6` ([Active tab contrast](../decisions/active-tab-contrast.md))
- platform fonts and emoji
- the device is 411 points wide while the mock is 360

When a UI change is approved, retake the affected screenshots and replace them in `src/__tests__/e2e/screenshots/`.
