---
type: Reference
title: Visual review
description: Why visual changes are reviewed with structured screenshot comparisons, where the approved references live, and which differences from the sketches are intentional.
tags: [screenshots, visual, review, design]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-02T12:00:00Z
---

# Visual review

**How to run:** the `visual-review` project skill (`.claude/skills/visual-review/SKILL.md`) covers capture, masking, pixel comparison, the review against the sketches, and updating the references.

## Why a structured review

The sketches are an HTML mock (380×780, browser fonts and emoji), so a pixel diff against them always fails. New UI is reviewed for structure, sizes in px against points × 2.625, and colors sampled against the tokens. **Unchanged** UI is checked by a pixel diff against the approved references, after masking the status bar and Expo Go's "Tools" bubble.

## Approved references

`src/__tests__/e2e/screenshots/`: `timeline` (empty timeline), `circles`, `events`, `title-focused`, and for the creation box and feed `box-choose` (placeholder, Guardar disabled), `box-list` (type list open), `box-texto` (Texto chosen), `box-write` (text step with two lines, keyboard closed) and `timeline-cards` (two text cards), and for the edit dialog `edit-open` ("Hola a todos." unchanged, Guardar disabled), `edit-changed` (" Nos vemos el domingo." added, keyboard closed), `edit-confirm` (deletion confirmation) and `timeline-edited` (the edited card in its place), each in `-light` and `-dark` (taken on an Android emulator with the reference device profile from [Device testing](device-testing.md): 1080×2400, density 420). The user approved them, and they change only with new approval. They are also the future references for Maestro `assertScreenshot` flows. Metro does not bundle them.

## Image item references

Added with the image items (`add-image-items`), approved by the user, phone portrait (Medium Phone, 1080×2400, density 420), in `-light` and `-dark` (16 images). They were taken in Expo Go with demo mode on, from an empty database with test photos (a 4:3 landscape photo, a tall 1:4 one, and a 4:3.37 photo of a drawing):

- `image-card-wide`: a landscape photo with caption "La isla de las tempestades", filling the box
- `image-card-tall`: a tall photo with the caption "Foto alta con pie", capped at 5:4 and centered on the backdrop
- `image-card-plain`: a landscape photo with no caption (no gap before the actions)
- `image-card-missing`: "⚠️ Imagen no disponible" in the photo area, with the caption and actions kept (taken by pointing `uriFor` at a missing folder, reverted afterwards)
- `box-image-empty` and `box-image-photo`: the creation box image step without and with a photo
- `edit-image-open` and `edit-image-confirm`: the image dialog and its deletion confirmation

They change only with new approval. Phone landscape, tablet and the keyboard-open states have no image references yet.

## Layouts and references

The references above are **phone portrait**. The adaptive layout adds phone landscape, tablet portrait and tablet landscape. Phone portrait must stay pixel-identical (apart from a blinking cursor), and that is checked with every visual change. The new layouts are reviewed against `sketches/mobile-landscape.png` and `sketches/tablet-portrait.png`: tablet landscape has no sketch and combines the tablet sizes with the landscape structure. Their references, approved by the user, are `timeline-cards`, `circles`, `box-write` and `edit-open`, each as `<shot>-<layout>-<mode>.png` with `<layout>` = `phone-landscape` (Medium Phone), `tablet-portrait` or `tablet-landscape` (Galaxy Tab A9+, 1200×1920 and 1920×1200 px at density 240), in light and dark: 24 images. The tablet ones were taken with `-gpu swiftshader_indirect`. They change only with new approval.

Masks: the status bar, Expo Go's gear bubble and its purple side bubble are masked in every layout, with rectangles that depend on the layout (see the skill).

Known quirk: the approved `timeline-cards-light.png` has the first card's bottom border 1 px lower than `timeline-edited-light.png` shows for the same card, and a fresh capture matches the latter. It gives about 3,300 differing pixels and is not a regression.

## Intentional differences from the sketches

- the creation box adds a Cancelar button next to Guardar and Crear (the sketches show only the main button)
- Guardar and Crear use `#006fe6` instead of the mock's `#0084ff`, for contrast
- text cards show Editar as well as Compartir
- the type select is a custom field with a `▾` glyph, and its list is a sheet over a dimmed backdrop, not a native dropdown
- the active tab is `#006fe6` ([Active tab contrast](../decisions/active-tab-contrast.md))
- platform fonts and emoji
- the device is 411 points wide while the mock is 360, so elements look smaller relative to the screen

Dark mode has no sketch: it must match the light structure with the [dark palette](../design-system/color-palettes.md).

Device setup: [Device testing](device-testing.md).

## Capture notes

- The empty-timeline shots need an empty database. It lives inside Expo Go's data, so clear it with `adb shell pm clear host.exp.exponent`. After that, Expo Go shows its developer menu on first launch: close it before capturing, or taps land in the menu (they can open other apps or move the "Tools" bubble out of the masked area).
- Capture the creation box and cards after the empty-state shots, because creating items makes the timeline non-empty.
- Type ASCII only with `adb shell input text`: it can't send accented characters.
