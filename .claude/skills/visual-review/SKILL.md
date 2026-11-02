---
name: visual-review
description: Capture BlueShare screenshots on the Android emulator and compare them with the approved references in src/__tests__/e2e/screenshots and with the sketches. Use after any visual change (components, tokens, layout), when asked to check the UI against the design, or to update the reference screenshots.
---

# Visual review

Background (why the review is structured, intentional differences): `docs/development/visual-review.md`.

## 1. Prepare

Get the app running with the `run-on-emulator` skill. Check that the device has the reference profile: `adb shell wm size` must print `1080x2400`, and `adb shell wm density` must print `420`. On any other profile, pixel comparisons with the references are meaningless: tell the user and only do the review against the sketches (step 4).

Then turn on demo mode, so the status bar is stable:

```bash
adb shell settings put global sysui_demo_allowed 1
adb shell am broadcast -a com.android.systemui.demo -e command enter
adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 1200
adb shell am broadcast -a com.android.systemui.demo -e command network -e mobile hide
```

**Phone portrait must not change.** The existing references in `src/__tests__/e2e/screenshots/` (no layout suffix) are phone portrait. This change keeps them: every comparison must give 0 differing pixels, apart from a blinking text cursor (a few hundred pixels in the `box-write` and `edit-changed` shots).

## 2. Capture the set (into the scratchpad, not the repo)

For `light` and `dark` (`adb shell cmd uimode night no|yes`, then wait about 3 s):
- `timeline-<mode>`, `circles-<mode>`, `events-<mode>`: tap each tab, wait about 2 s, run `adb exec-out screencap -p > <name>.png`.
- `title-focused-<mode>`: tap the title field, type `abuela`, capture, then press back. Clear the text before the second mode, because the field keeps its text on blur.

For the data-dependent shots, use the data in `docs/development/visual-review.md` (Capture notes): an empty database for the empty-state and light box shots, then the two cards "Hoy hemos jugado al parchis.\nManana hay bingo en el centro." (older) and "Hola a todos." (newer) for the cards, dark box and edit shots. Restart Expo Go after creating cards before capturing the dark box shots.

### Other layouts (phone landscape, tablet portrait, tablet landscape)

Rotate (`run-on-emulator` skill) and capture, in `light` and `dark`, with the two cards in the database: `timeline-cards-<layout>-<mode>`, `circles-<layout>-<mode>`, `box-write-<layout>-<mode>` (creation box text step; in phone landscape close the full-screen editor with DONE first) and `edit-open-<layout>-<mode>`, where `<layout>` is `phone-landscape`, `tablet-portrait` or `tablet-landscape`. Phone landscape runs on the Medium Phone and the tablet layouts on `Galaxy_Tab_A9_Plus`. These have no pixel references until the user approves them (step 5), so review them against `sketches/mobile-landscape.png` and `sketches/tablet-portrait.png` (step 4). Tablet landscape has no sketch: check that it combines the tablet sizes with the landscape structure.

## 3. Compare with the approved references

Mask the status bar and Expo Go's "Tools" bubble, which are not part of the app:

```bash
R=src/__tests__/e2e/screenshots
mask(){ magick "$1" -fill black -draw "rectangle 0,0 1079,80" -draw "rectangle 0,1650 220,2150" -draw "rectangle 930,1500 1079,1950" "$2"; }
mask $R/<name>.png ref.png; mask <name>.png new.png
compare -metric AE -fuzz 2% ref.png new.png diff.png   # prints differing pixels; 0 = identical
```

The second rectangle is Expo Go's gear bubble (it sits slightly differently from run to run) and the third its purple side bubble. Masks for the other layouts (px, status bar first): phone landscape 2400×1080: `0,0 2399,80`, gear `0,700 220,900`, side bubble `2250,560 2399,850`; tablet 1200×1920 (portrait) or 1920×1200 (landscape): `0,0 W,40`, gear `0,925 120,1650`. Check where the bubbles are in a screenshot before masking, since a stray tap can drag them.

For the focused-field shots, compare only the header crop (`-crop 1080x260+0+0`), because the keyboard varies.

- **0 px, and no change was intended:** done.
- **Differences:** read both images (and `diff.png`) and name what moved or changed color.

## 4. Review a new or changed UI against the sketches

Read the screenshot next to `sketches/mobile-portrait.png`, `header-mobile-portrait.png` and `footer-mobile-portrait.png`. Check:
- order and alignment
- heights in px against (points + inset) × 2.625
- borders, spacing and the position of the create button

Sample colors with `magick <shot>.png -format '%[pixel:p{X,Y}]' info:` and compare them with `src/constants/design-system.json`. Dark mode has no sketch: check the light structure with the dark palette.

## 5. Update the references (only after the user approves)

Show the user the new screenshots. Only after explicit approval, copy them over `src/__tests__/e2e/screenshots/<name>.png` and add a dated entry to `docs/log.md`.

## 6. Clean up

`adb shell am broadcast -a com.android.systemui.demo -e command exit`. Report the pixel counts and the differences found.
