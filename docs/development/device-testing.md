---
type: Guide
title: Device testing
description: How to boot the Android emulator on the development machine, open BlueShare in Expo Go through adb, and which behavior checks were run.
tags: [device, android, emulator, expo-go, adb]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Device testing

## Development machine (Linux)

- Android SDK: `/home/vangamo/Apps/Android-SDK` (`ANDROID_HOME` is not set by default, so pass it explicitly).
- AVD: `Medium_Phone_API_37.0` (API 37, 1080×2400, density 420 = 2.625 px per point, gesture navigation), with Expo Go (`host.exp.exponent`) installed.
- `adb` is installed (snap). ImageMagick and Pillow are available. There is no iOS simulator, no Java and no Maestro.

## Run the app on the emulator

```bash
ANDROID_HOME=/home/vangamo/Apps/Android-SDK \
  /home/vangamo/Apps/Android-SDK/emulator/emulator -avd Medium_Phone_API_37.0 -no-snapshot-save -no-boot-anim &   # background
adb shell getprop sys.boot_completed      # wait until it prints 1
npx expo start --port 8081 &               # background
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent
```

Useful commands:
- `adb shell cmd uimode night yes|no`: switch dark or light mode.
- `adb shell input tap X Y` and `adb shell input text abuela`: interact (pixel coordinates). The tab centers at 1080 wide, y≈2242: Timeline x≈197, Circles x≈540, Events x≈882. The title field is at about (540, 153).
- `exp://127.0.0.1:8081/--/circles`: deep link inside Expo Go.
- `adb shell uiautomator dump`: the accessibility tree.

## Checks already passed (Android, Expo Go)

- **Startup:** cold start shows the native splash and then Timeline.
- **Navigation:** tab switching works, tapping the active tab is a no-op, and Android back returns to Timeline. `/explore` shows "Unmatched Route".
- **Theme:** light ↔ dark switches live on each tab, keeping the tab and the title text, with no white flash.
- **Layout:** content scrolls only between header and footer. Rotation stays portrait.
- **Title field:** all its scenarios pass. Menu and avatar taps do nothing.
- **Accessibility:** TalkBack announces the tabs with their selected state.
- **Accepted:** the keyboard covers the footer, see [Known limitations](../product/known-limitations.md).

Screenshot capture and comparison: [Visual review](visual-review.md).
