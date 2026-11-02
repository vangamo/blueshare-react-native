---
type: Component
title: Title search field
description: A TextInput that shows "BlueShare" centered at rest, turns into a left-aligned "Buscar..." search input on focus, and goes back to rest on blur.
tags: [component, header, search, text-input]
resource: ../../src/components/title-search-field.tsx
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# Title search field

`TitleSearchField({ style? })`, used inside the [app header](app-header.md).

## State logic

State is `query` (starts as `''`) and `focused`.
- **Displayed value:** while focused, `query`. At rest, `query` if it has non-blank text, otherwise `"BlueShare"`.
- **`onFocus`:** sets focused. If `query === 'BlueShare'`, it clears it, so the field opens empty with the placeholder.
- **`onBlur`:** clears focused. If `query` is blank, it resets it to `''`, so "BlueShare" shows again.
- **`onSubmitEditing`:** a no-op. Search is not wired up yet.

State changes only in event handlers, never in an effect, so the React Compiler `react-hooks/set-state-in-effect` lint rule never applies. Why: [Title field state without effects](../decisions/title-field-state.md).

**Android fix:** dismissing the keyboard (back button or the keyboard arrow) does not blur a `TextInput` on Android. The component subscribes to `Keyboard` `keyboardDidHide` and `keyboardDidShow` in a `useEffect`. On hide it remembers the window size and starts a `Layout.keyboardHideGraceMs` (400 ms) timer. `keyboardDidShow` cancels it. When the timer fires it calls `inputRef.current?.blur()` only if the window size is unchanged. The effect never sets state, and cleans up the timer and listeners on unmount.

**Why the grace period:** a rotation also fires `keyboardDidHide` once (device spike), which used to blur the field and drop focus and keyboard. A rotation hides and shows the keyboard again, and changes the window size, so either signal skips the blur. A real dismissal still blurs, 400 ms later.

## Styles

| | At rest | Focused |
| --- | --- | --- |
| Text align | center | left |
| Border (2 pt) | `primaryDark` | `primaryBlue` |
| Background | `surfaceMuted` | `cardBg` |

The rest: height `sizes.fieldHeight` (42 phone, 46 tablet), radius 12 (`Radius.md`), bold `textMain` text of `sizes.fieldFont` (16 or 17), `paddingVertical: 0` (so Android keeps the height), `placeholder="Buscar..."` in `textMuted`, `selectionColor=primaryBlue`, `returnKeyType="search"`, `accessibilityLabel="Search"`.

## Tests

`src/__tests__/unit/components/title-search-field-test.tsx` covers every title-field scenario in [app-shell](../specs/app-shell.md): the rest value, focus clearing "BlueShare", blur when empty or blank, blur with "abuela", focus with other text, submit, the style changes, and the keyboard hide grace period (blur after it, no blur after a show or a window change, unmount during it).
