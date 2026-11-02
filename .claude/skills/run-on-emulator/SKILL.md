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
- For tablet layouts use `Galaxy_Tab_A9_Plus` (1920×1200, density 240, native orientation landscape, no screenshot references). The names `-list-avds` prints are the `.ini` names, for example `Medium_Phone_API_37.0`.
- If several match, or none do, ask the user which one to use.
- Run one emulator at a time: with two running, `adb` needs `-s <serial>`.
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

If the emulator dies with `amdgpu: The CS has cancelled because the context is lost`, start it again with `-gpu swiftshader_indirect`. Start it with `nohup setsid … < /dev/null & disown` if the tool kills background children.

Qt warnings in the emulator log (`qRegisterMetaType`, `device offline` while booting) are harmless.

## 2. Start Metro and open Expo Go

Start `npx expo start --port 8081` with `run_in_background`, then:

```bash
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent
```

If Metro already runs on 8081 for this project (`curl -s localhost:8081/status` prints `packager-status:running`), reuse it. After `adb shell pm clear host.exp.exponent`, Expo Go shows its developer menu on first launch: close it with Continue.

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

### Rotation and finding controls by label

Layouts change with the window, so tap by label, not by coordinates:

```bash
adb shell settings put system accelerometer_rotation 0
adb shell settings put system user_rotation 0   # or 1; which one is portrait depends on the AVD
```

```python
# tap.py <label>: finds a node by content-desc or text in `uiautomator dump` and taps its center
import re, subprocess, sys, xml.etree.ElementTree as ET
subprocess.run(['adb', 'shell', 'uiautomator', 'dump', '/sdcard/w.xml'], capture_output=True)
root = ET.fromstring(subprocess.run(['adb', 'exec-out', 'cat', '/sdcard/w.xml'], capture_output=True, text=True).stdout)
for n in root.iter('node'):
    d = n.get('content-desc') or ''
    if sys.argv[1] in (d, n.get('text')) or d.startswith(sys.argv[1] + ','):
        l, t, r, b = map(int, re.findall(r'\d+', n.get('bounds')))
        subprocess.run(['adb', 'shell', 'input', 'tap', str((l + r) // 2), str((t + b) // 2)])
        break
```

- Useful labels: `Create`, `Timeline`, `Circles`, `Events`, `Search`, `Crear nuevo elemento`, `📝 Texto`, `Guardar`, `Crear`, `Cancelar`, `Editar`, `Cerrar`. Focus after a rotation: look for the `EditText` node with `focused="true"`. The keyboard: `adb shell dumpsys input_method | grep mInputShown`.
- In phone landscape Android shows a full-screen editor. Its DONE key is not in the `uiautomator` tree: tap it by position (about 2263, 228 on the Medium Phone) or screenshot first.
- Expo Go's "Tools" bubble can be dragged by a stray tap. Drag it back with `adb shell input swipe <x> <y> <x2> <y2> 600`.
- TalkBack is installed. Turn it on with `adb shell settings put secure enabled_accessibility_services com.google.android.marvin.talkback/com.google.android.marvin.talkback.TalkBackService`, and **off with `adb shell settings delete secure enabled_accessibility_services`** (an empty value is rejected). While it runs, taps need a double tap and it shows a notification-permission dialog that blocks the app. Its spoken order cannot be read from adb, so listening is a manual check.

Coordinates belong to the current layout. If the UI changes, take a screenshot and read it before tapping.

## 4. Finish

Report what you checked and what you saw. Tell the user whether the emulator and Metro are still running, and stop them if they are no longer needed.
