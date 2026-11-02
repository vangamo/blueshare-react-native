---
type: Reference
title: Device testing
description: What a machine needs to run BlueShare on an Android emulator, the reference device profile for screenshots, and the device checks already passed.
tags: [device, android, emulator, expo-go, adb]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T17:30:00Z
---

# Device testing

**How to run:** the `run-on-emulator` project skill (`.claude/skills/run-on-emulator/SKILL.md`) has the boot, Metro, Expo Go and adb steps.

## Requirements

- The Android SDK, with `ANDROID_HOME` pointing to it. The emulator is `$ANDROID_HOME/emulator/emulator`. `adb` comes from `$ANDROID_HOME/platform-tools`, or from the `PATH`.
- An Android Virtual Device (AVD) with the reference device profile below. List them with `$ANDROID_HOME/emulator/emulator -list-avds`.
- Expo Go (`host.exp.exponent`) installed in that emulator.
- ImageMagick (`convert`, `compare`, `magick`) for the [visual review](visual-review.md).
- iOS checks need macOS with Xcode's simulator. None have been run yet.

## Reference device profile

The approved screenshots were taken on Android Studio's **Medium Phone** profile:
- 1080×2400 px, density 420 (2.625 px per point, 411 points wide)
- Android API 37, gesture navigation

Screenshot comparisons are only valid on this profile. Check it with `adb shell wm size` and `adb shell wm density`. Other AVDs are fine for behavior checks.

Inside Expo Go, deep links use `exp://127.0.0.1:8081/--/<path>`. `blueshare://` does not resolve.

## Checks already passed (Android, Expo Go)

- **Startup:** cold start shows the native splash and then Timeline.
- **Navigation:** tab switching works, tapping the active tab is a no-op, and Android back returns to Timeline. `/explore` shows "Unmatched Route".
- **Theme:** light ↔ dark switches live on each tab, keeping the tab and the title text, with no white flash.
- **Layout:** content scrolls only between header and footer. Rotation stays portrait.
- **Title field:** all its scenarios pass. Menu and avatar taps do nothing.
- **Accessibility:** TalkBack announces the tabs with their selected state.
- **Accepted:** the keyboard covers the footer, see [Known limitations](../product/known-limitations.md).

### Items and the creation box (change `add-text-items`)

- **SQLite:** in `__DEV__` the app logs `[items] SQLite 3.53.3` (Expo Go 58 on Android). Jest's `node:sqlite` (Node 24.21) bundles 3.53.4.
- **Creation flow:** `+` opens the box at the top and hides; the type list opens and picks; Guardar with Texto opens the text step with the keyboard; Crear saves, closes the keyboard and puts the card first.
- **Persistence:** items survive a force-stop of Expo Go in the same order ("Dos" above "Uno"). Creating with airplane mode on saves too.
- **Back button:** with the type list open it closes only the list; with the keyboard up the first press closes the keyboard; with the box open it closes the box and the app stays; with the box closed it leaves the app; on Events with a draft it returns to Timeline with the draft.
- **Keyboard:** entering the text step opens it; returning from another tab does not; typing keeps focus; with a 10-line text the area stops at its maximum height and scrolls, and Crear stays above the keyboard and works on the first tap.
- **Scroll to top:** opening the box while scrolled down scrolls the feed to the top.
- **Accessibility tree** (`uiautomator dump`): the select reads "Crear nuevo elemento, <value>"; disabled Guardar and Crear are `enabled=false`; options are radio buttons with `checked`; card actions are buttons named "Editar" and "Compartir"; `+` is not in the tree while the box is open. The user checked the same points by ear with TalkBack.
- **adb timing:** `adb shell input text` delivers keys asynchronously. A tap right after it can land while Crear is still disabled, which only closes the keyboard. Wait about 0.5 s after typing before tapping.

Screenshot comparison: [Visual review](visual-review.md).
