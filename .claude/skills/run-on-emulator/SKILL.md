---
name: run-on-emulator
description: Launch BlueShare on the local Android emulator in Expo Go and drive it with adb (tap, type, switch light/dark, deep links, accessibility dump). Use when asked to run, start, open or try the app, to check a change on a device, or before taking screenshots.
---

# Run BlueShare on the Android emulator

Requirements and the reference device profile are in `docs/development/device-testing.md`.

## 1. Boot the emulator

`ANDROID_HOME` must point to the Android SDK. If it is empty, stop and ask the user to set it.

```bash
"$ANDROID_HOME/emulator/emulator" -list-avds
```

- Pick an AVD with the reference profile (Medium Phone, 1080×2400, density 420), which is required for screenshot comparisons. To check an AVD: `grep -E 'hw.lcd.(width|height|density)|hw.device.name' ~/.android/avd/<AVD_NAME>.avd/config.ini`.
- If several match, or none do, ask the user which one to use.
- If an emulator is already running (`adb devices` lists one), reuse it and skip the boot.

Start it with `run_in_background`:

```bash
"$ANDROID_HOME/emulator/emulator" -avd <AVD_NAME> -no-snapshot-save -no-boot-anim
```

Wait for the boot. Use `$ANDROID_HOME/platform-tools/adb` if `adb` is not on the `PATH`.

```bash
adb wait-for-device
for i in $(seq 1 180); do [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = 1 ] && echo BOOTED && break; sleep 2; done
adb shell wm size; adb shell wm density   # 1080x2400 / 420 for the reference profile
```

Qt warnings in the emulator log (`qRegisterMetaType`, `device offline` while booting) are harmless.

## 2. Start Metro and open Expo Go

Start `npx expo start --port 8081` with `run_in_background`, then:

```bash
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent
```

Wait for `Android Bundled` in the Metro output before you interact.

## 3. Drive the app

| Action | Command |
| --- | --- |
| Light / dark | `adb shell cmd uimode night no` / `yes` |
| Tap a tab (1080×2400) | `adb shell input tap 197 2242` (Timeline), `540 2242` (Circles), `882 2242` (Events) |
| Focus the title field and type | `adb shell input tap 540 153` then `adb shell input text abuela` |
| Dismiss the keyboard | `adb shell input keyevent KEYCODE_BACK` |
| Deep link | `adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081/--/circles" host.exp.exponent` |
| Screenshot | `adb exec-out screencap -p > <file>.png` (write through shell redirection: it works even when adb is sandboxed) |
| Accessibility tree | `adb shell uiautomator dump && adb shell cat /sdcard/window_dump.xml` |

`blueshare://` links do not resolve inside Expo Go. Use the `exp://…/--/<path>` form.

Coordinates belong to the current layout. If the UI changes, take a screenshot and read it before tapping.

## 4. Finish

Report what you checked and what you saw. Tell the user whether the emulator and Metro are still running, and stop them if they are no longer needed.
