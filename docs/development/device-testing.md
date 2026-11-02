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

## Tablet profile

For tablet layouts there is a second AVD, **Galaxy_Tab_A9_Plus** (display name "Galaxy Tab A9+ like"):
- 1920×1200 px, density 240 (1.5 px per point), Android API 37 (`google_apis_playstore`), `hw.device.name=galaxy_tab_a9_plus_like`, 4 GB of RAM.
- Its native orientation is landscape. Window sizes the app sees (system bars excluded): **800×1224** points in portrait and **1280×744** in landscape, so it uses the tablet portrait and tablet landscape layouts.
- `avdmanager` is not installed on this machine, so the AVD was made by copying the phone AVD's `config.ini` into `~/.android/avd/Galaxy_Tab_A9_Plus.avd/` and changing `hw.lcd.width`, `hw.lcd.height`, `hw.lcd.density`, `hw.device.name`, `skin.name` and `AvdId`, with a matching `Galaxy_Tab_A9_Plus.ini` next to the folder (`path`, `path.rel`, `target`). The AVD names that `emulator -list-avds` prints are the `.ini` names (the phone one is `Medium_Phone_API_37.0`).
- If the emulator dies with `amdgpu: The CS has cancelled because the context is lost`, start it again with `-gpu swiftshader_indirect`.
- Screenshot references exist only for the phone profile. Use the tablet for behavior checks and for the review against the sketches.

## Rotation

```bash
adb shell settings put system accelerometer_rotation 0   # stop auto-rotate
adb shell settings put system user_rotation 0|1          # 0 = natural orientation, 1 = rotated 90°
```

On the phone `0` is portrait and `1` landscape. On the tablet, whose natural orientation is landscape, it is the other way round. Expo Go rotates the app because `app.json` has `orientation: "default"`.

Inside Expo Go, deep links use `exp://127.0.0.1:8081/--/<path>`. `blueshare://` does not resolve.

## Checks already passed (Android, Expo Go)

- **Startup:** cold start shows the native splash and then Timeline.
- **Navigation:** tab switching works, tapping the active tab is a no-op, and Android back returns to Timeline. `/explore` shows "Unmatched Route".
- **Theme:** light ↔ dark switches live on each tab, keeping the tab and the title text, with no white flash.
- **Layout:** content scrolls only between header and footer.
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

### Adaptive layout and rotation (change `adaptive-layout`)

Checked on the Medium Phone and on the Galaxy Tab A9+ emulator, Expo Go 58, with the real code:
- **Phone landscape (914×363):** tab bar under the header, 120-point tabs centered, a 550-point content column, the title field centered and at most 300 points wide, the creation box fully visible below the tab bar when it opens, and the edit dialog a centered 550-point column. With the feed scrolled, a rotation in either direction kept the same first card.
- **Focus and keyboard (phone):** typing "Hola" in the creation box with the keyboard up, then rotating to landscape and back, kept the text, the focus on the text area (`uiautomator` `focused=true`) and the keyboard (`mInputShown=true`), and the search field never got focus. In landscape Android's full-screen editor appeared, and its DONE key closed it keeping the text and the focus.
- **Other scenarios (phone):** an edit dialog with changed text, the title field focused (keeps focus through both rotations and blurs on Back), and a draft left while on Circles (still in the same step on return) all survived rotation.
- **Tablet portrait (800×1224) and landscape (1280×744):** cards are 500 and 600 points wide, centered; the tabs are 150 points wide, centered, at the bottom in portrait and under the header in landscape; the title field is at most 350 and 400 points; the create button is 60 points. Typing in the creation box, the edit dialog, the title field and a draft on Circles all survived rotation in both directions.
- **TalkBack:** the user checked phone landscape and tablet portrait by ear and found it correct, although the accessibility tree lists the tab bar after the content in landscape (the bar stays in the navigator's bottom slot).
- **Not checked:** iOS.

Screenshot comparison: [Visual review](visual-review.md).
