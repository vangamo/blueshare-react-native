# Design

## Context

For the motivation, see `proposal.md` (Why). The requirements are in `specs/`: adaptive-layout (new), plus deltas for app-platform, app-shell, timeline-feed, item-creation and item-editing. Current state, as checked in the repo:

- **Config:** `app.json` has `orientation: "portrait"` and no `ios.supportsTablet` (it defaults to `false`).
- **Sizes:** `Layout` in `src/constants/theme.ts` is one fixed object from `sketches/mobile-portrait.html`. It mixes values that never change (`borderWidth`, `touchTarget`, `disabledOpacity`) with values that now depend on the layout (`headerHeight`, `footerHeight`, `fieldHeight`, `avatarSize`, `fabSize`, `fabOffsetBottom`, `cardTextLineHeight`, `optionRowHeight`). Components put token sizes (`FontSize.body`, `Spacing.lg`, `Radius.lg`) in `StyleSheet.create`. They are fixed when the module loads.
- **Shell:**
  - `src/app/_layout.tsx` renders `AppHeader`, then `<Tabs tabBar={(props) => <FooterTabBar {...props} />}>` from `expo-router/js-tabs`, then `CreateButton` (absolute, `bottom = footerHeight + insets.bottom + 10`).
  - The header and footer read only `insets.top` and `insets.bottom`.
  - `TitleSearchField` blurs itself on every `keyboardDidHide`.
- **Content:**
  - `TimelineFeed` is a `FlatList` with `padding: Spacing.lg` and the creation box as its header.
  - `EditTextDialog` and `TypeSelect` are transparent `Modal`s that span the screen minus fixed padding.
- **Tests:**
  - `jest-setup.ts` mocks the safe area (`TEST_INSETS`) and `@/hooks/use-color-scheme`.
  - The Jest preset reports a 750×1334 window (`@react-native/jest-preset/jest/mocks/NativeModules.js`). Under the new rule, that is a tablet.
- **Verified on the emulators (exploration spike, Expo Go 58, Android API 37):**
  - With `orientation: "default"`, Expo Go rotates the app. `useWindowDimensions()` reports 411×866 and 914×363 on the Medium Phone, and 800×1224 and 1280×744 on the Galaxy Tab A9+-like profile. The status and navigation bars are excluded.
  - Rotation doesn't remount providers or screens. The scroll offset, the creation box draft and an open edit dialog survive.
  - **`tabBarPosition: 'top' | 'bottom'` breaks focus.** The installed `BottomTabView` renders `[top ? bar : null, screens, bottom ? bar : null]`. When the bar moves, the screens' native view changes index, Android detaches it, and the focused field loses focus. Android then focuses the first `EditText` in the window, the search field. This happened on landscape → portrait in 4 of 4 runs, with or without the full-screen editor.
  - **The bar kept in the bottom slot, drawn at the top** (`position: 'absolute', top: 0` in landscape, `sceneStyle.paddingTop` on the screens) kept focus, keyboard and draft in every rotation on the phone and the tablet. Tab presses and Android back still worked.
  - **Each rotation fires `keyboardDidHide` once.** `TitleSearchField`'s listener then blurs the field. With the listener disabled, the field kept focus and keyboard both ways.
  - The Android full-screen editor appears on the phone in landscape, not on the tablet. Text typed in it reaches the field, and "DONE" closes it with the text and focus kept.
  - With no footer in landscape, the gesture bar covered the creation box's buttons.
- **Project rules that shape this design:**
  - React Compiler is on: no manual memoization, no setState in effects.
  - Colors come only from the JSON tokens.
  - Controls are at least 44 pt.
  - The app runs in Expo Go only.
  - Never edit `ios/`, `android/` or `sketches/`.

## Goals / Non-Goals

**Goals:**
- Phone portrait renders exactly as today. The existing tests and the approved screenshots don't change.
- One place decides the layout and holds every size that depends on it.
- No change of layout moves a native view that may hold focus.
- Every layout can be tested in Jest by setting a window size.

**Non-Goals:**
- Side navigation rails, two-pane layouts, or more cards per row on tablets.
- Following the user's system font scale beyond what React Native already does.
- Locking orientation per screen, or per device type.
- iOS-specific code, and verifying on iOS or iPad (no macOS available).
- Hiding the tab bar while the keyboard is open (an existing known limitation).

## Decisions

### D1. Layout from the window size, in one pure function

```
layoutFor(width, height):
  orientation = width > height ? 'landscape' : 'portrait'
  device      = min(width, height) >= 600 ? 'tablet' : 'phone'
  -> 'phone-portrait' | 'phone-landscape' | 'tablet-portrait' | 'tablet-landscape'
```

- `layoutFor` lives in `src/constants/theme.ts`, next to the tables it indexes.
- **`src/hooks/use-window-size.ts`** wraps `useWindowDimensions()`. The only reason it exists is so Jest can mock one module, the same pattern as `use-color-scheme`.
- **`src/hooks/use-shell-layout.ts`** returns `{ kind, device, landscape, frame, sizes }`, computed during render. There's no context and no memoization: it's a cheap lookup, and React Compiler forbids manual memoization anyway.
- **Window, not screen:** split screen and freeform windows get the layout that fits the window.

Alternatives considered:
- **`expo-device` `deviceType`.** It's wrong in split screen, needs one more dependency, and says nothing about orientation.
- **`expo-screen-orientation` listeners.** These are not needed, since the window size already changes on rotation, and they would duplicate the source of truth.
- **A `LayoutProvider` context.** It isn't needed: `useWindowDimensions` already re-renders its users when the window changes.

### D2. Two size sets plus four frames, replacing the variable part of `Layout`

`theme.ts` gets:
- `Sizes: Record<'phone' | 'tablet', SizeSet>`: component and font sizes. They depend only on the device size.
- `Frames: Record<LayoutKind, Frame>`: header and tab bar heights, tab bar position, tab width, title field max width, content column width and create button bottom offset. They depend on the full layout.

`Layout` keeps only the values that never vary: border widths, `touchTarget` (the 44-pt minimum), `controlRadius`, `creationGap`, `hairlineWidth`, `disabledOpacity`, `tabMarginHorizontal` and `footerPaddingHorizontal` (renamed `tabBarPaddingHorizontal`).

| `Sizes` key | phone | tablet | used by |
| --- | --- | --- | --- |
| `contentPadding` | 16 | 20 | feed, placeholder screens |
| `headerPaddingHorizontal` | 16 | 24 | header |
| `menuButton` / `menuGlyph` | 44 / 18 | 48 / 20 | header |
| `fieldHeight` / `fieldFont` | 42 / 16 | 46 / 17 | title field |
| `avatar` / `avatarEmoji` | 42 / 20 | 46 / 22 | header |
| `tabHeight` / `tabLabel` | 44 / 14 | 48 / 15 | tab bar |
| `fab` / `fabFont` / `fabRight` | 56 / 28 / 20 | 60 / 30 / 28 | create button |
| `cardPadding` / `cardRadius` / `itemGap` | 16 / 16 / 16 | 20 / 18 / 20 | card, creation box, dialog |
| `cardText` / `cardLineHeight` | 15 / 22.5 | 16 / 24 | card |
| `actionHeight` / `actionLabel` | 44 / 14 | 48 / 15 | card actions |
| `boxTitle` / `inputFont` | 14 / 16 | 15 / 17 | box, dialog, select, text area |
| `controlHeight` / `buttonLabel` | 44 / 15 | 48 / 16 | select, box and dialog buttons |
| `optionRow` | 56 | 60 | type list |
| `textAreaMin` / `textAreaMax` | 96 / 200 | 104 / 240 | text areas |
| `placeholderTitle` / `placeholderBody` | 18 / 15 | 20 / 16 | placeholder screens |

The phone column holds today's values, so phone portrait stays identical. The tablet values come from `tablet-portrait.html`, rounded to 44+ targets. `textAreaMin/Max` and `optionRow` on tablet are scaled to the larger font. They are not in the spec, and the visual review tunes them.

| `Frames` | header | tab bar | position | tab width | title max | column | FAB bottom |
| --- | --- | --- | --- | --- | --- | --- | --- |
| phone-portrait | 70 | 75 | bottom | stretch | none | none | 10 above bar |
| phone-landscape | 56 | 56 | top | 120 | 300 | 550 | 16 above inset |
| tablet-portrait | 75 | 80 | bottom | 150 | 350 | 500 | 16 above bar |
| tablet-landscape | 75 | 64 | top | 150 | 400 | 600 | 16 above inset |

**How components use them:**
- Static structure (flex, alignment, border widths) stays in `StyleSheet.create`.
- Values from `sizes` and `frame` are passed inline, the same way colors come from `useTheme()`.
- The `Spacing`, `Radius` and `FontSize` scales stay for values that don't vary by device.

Alternatives considered:
- **One scale factor** (tablet = phone × 1.1): the mock's values aren't proportional (field 42 → 46, tab label 14 → 15, padding 16 → 20, radius 16 → 18), and rounding would produce sizes nobody designed.
- **Two `StyleSheet`s per component, picked at render:** this doubles every style block and drifts easily.
- **Using the platform font scale:** it is a user setting, not a device-size setting.

### D3. The tab bar never leaves the navigator's bottom slot

- `<Tabs>` keeps the default `tabBarPosition` (`'bottom'`), so the bar always renders after the screens.
- The bar, renamed from `FooterTabBar` to `TabBar` (`src/components/tab-bar.tsx`), reads the layout:
  - **portrait:** in the flow, with a top border and `paddingBottom: insets.bottom`
  - **landscape:** `position: 'absolute', top: 0, left: 0, right: 0`, with a bottom border and no bottom inset
- The root layout sets `screenOptions.sceneStyle.paddingTop = frame.tabBarHeight` in landscape, and 0 otherwise. Screens then start below the bar, and nothing scrolls under it (app-shell "Shell stays fixed").
- Moving the bar changes only styles. No native view changes its index, so focus survives a rotation. The spike confirmed this.
- **Tabs:**
  - In phone portrait they keep `flex: 1`.
  - Elsewhere they get `width: frame.tabWidth`, with the row `justifyContent: 'center'`.
  - Horizontal padding is `tabBarPaddingHorizontal` plus the left and right insets.

Alternatives considered:
- **`tabBarPosition` switching between `'top'` and `'bottom'`:** rejected after the spike. Focus jumps to the search field on landscape → portrait.
- **Two always-mounted slots outside the navigator** (`tabBar={() => null}`, with the bar in the root layout): it also kept focus in the spike. But the bar would lose `BottomTabBarProps` (`state`, `emitter`, `navigateToTab`) and need its own route matching. That works against the reasons for [JS tabs with a custom tab bar](../../../docs/decisions/js-tabs-custom-tab-bar.md).
- **Headless `expo-router/ui` tabs:** still experimental in SDK 58, as recorded in that decision.

### D4. The title field ignores the keyboard hide caused by a rotation

Today `keyboardDidHide` blurs the field at once. The new rule is to blur only if the keyboard stays hidden:
- On `keyboardDidHide`, the field remembers the current window size and starts a short timer (`Layout.keyboardHideGraceMs`, 400 ms).
- `keyboardDidShow` cancels the timer. A rotation hides the keyboard and shows it again.
- When the timer fires, the field blurs only if the window size is still the one it remembered. This second check covers platforms that don't fire `keyboardDidShow` again after a rotation.
- The effect cleans up the timer and listeners. The blur is an imperative call, so there is no setState in the effect.
- A real dismissal (Back, keyboard arrow) still blurs, 400 ms later. The rest state ("BlueShare", centered) then returns as today.

Alternatives considered:
- **Removing the listener:** Android keeps the field focused after Back, and the spec needs the rest state back (app-shell "Title field restores the app name on blur").
- **Ignoring hides for a fixed time after any window change:** `keyboardDidHide` can arrive before the size change, so the order isn't reliable.

### D5. Safe areas on all sides

- **Header:** `paddingLeft` and `paddingRight` = `sizes.headerPaddingHorizontal` + `insets.left` / `insets.right`.
- **Tab bar:** the same, with `tabBarPaddingHorizontal`.
- **Create button:**
  - `right = sizes.fabRight + insets.right`
  - portrait: `bottom = frame.tabBarHeight + insets.bottom + frame.fabBottom`
  - landscape: `bottom = insets.bottom + frame.fabBottom`
- **Feed and placeholder screens:** the content gets the side insets. In landscape it also gets `paddingBottom: contentPadding + insets.bottom`, because no bar sits below. This fixes the gesture bar covering Crear.
- **Edit dialog and type list** (`Modal`s with translucent system bars): they pad for all four insets, not only the top one.

### D6. Content column by explicit width

- `useShellLayout` computes `columnWidth`: `min(window width − side insets − 2 × contentPadding, frame.column)`. In phone portrait it is the window width − side insets − 2 × contentPadding.
- **Feed:** `contentContainerStyle` gets `width: columnWidth + 2 × contentPadding` and `alignSelf: 'center'`. Cards and the creation box keep filling it, so they need no change.
- **Edit dialog box and type list sheet:** `width: columnWidth`, centered.
- An explicit width, rather than `maxWidth` with percentages, makes the Jest assertions exact, and behaves the same inside `ScrollView` content containers.

### D7. App configuration

- `app.json`: `"orientation": "default"` and `"ios": { "supportsTablet": true, ... }`.
- `requireFullScreen` stays `false` (the default), so iPad Split View works. The window-size rule already handles narrow windows.
- No config plugin and no native folder.
- `npx expo-doctor` must stay clean.

### D8. Tests

- **Window mock:**
  - `jest-setup.ts` mocks `@/hooks/use-window-size` with a tiny store (`useSyncExternalStore`).
  - `test-values.ts` gets `TEST_WINDOWS` (the four measured sizes above) and `setMockWindow(size)`.
  - The default is `TEST_WINDOWS.phonePortrait`, reset in `afterEach`. Existing tests therefore keep running in phone portrait unchanged.
- **Unit:**
  - `layoutFor`: each layout, the 599/600 threshold, the square window, split screen.
  - `Sizes.phone`: equal to today's values. This is a regression guard for phone portrait.
  - Every changed component in at least one landscape and one tablet layout, asserting against `Sizes`, `Frames`, `TEST_INSETS` and `TEST_WINDOWS`, never literals.
- **Rotation journey (e2e):** through `renderRouter`:
  - open the creation box, type, then `act(() => setMockWindow(phoneLandscape))` and back
  - assert the box still shows the text, and the text input is the **same host instance** (no remount), which is the Jest proxy for "focus kept"
  - the same for an open edit dialog and a pending draft on Circles
  - the tab bar switches between the bottom and top styles, while the scene padding matches the frame
- **Title field:** with fake timers, a hide then show within the grace period keeps focus; a hide alone blurs after the grace period; a hide followed by a window change does not blur.
- **Device and visual review:**
  - Rotation checks on both emulators, repeating the spike's scenarios.
  - The phone-portrait references must stay pixel-identical.
  - New references for the three new layouts, approved by the user.

### D9. The Android full-screen editor stays on

`disableFullscreenUI` is not set. On phones in landscape, the system editor gives seniors a large typing area, and the spike showed that it syncs text and keeps focus. Tablets don't use it.

## Risks / Trade-offs

- [The absolute top bar and `sceneStyle.paddingTop` must stay in sync; a mismatch hides content under the bar] → Both read `frame.tabBarHeight`. A unit test checks the scene padding against the frame, and the visual review checks the first card's top edge.
- [The 400 ms grace period delays the title field's return to "BlueShare" after Back] → It's short and invisible while the keyboard animates out. The timing and the `keyboardDidShow` assumption are verified on the device, with the window-size check as the fallback.
- [Phone landscape leaves about 250 pt for content, less with a keyboard that doesn't go full screen, such as some Samsung keyboards] → This was the user's accepted trade-off for the two-bar layout. Record it in known limitations.
- [Upstream changes in `BottomTabView`'s child order could reintroduce the focus jump] → The rotation journey test catches a remount, and the decision page records why the bar must not move between slots.
- [iOS and iPad are untested] → Record in known limitations. Nothing in the design is Android-specific, except the full-screen editor note.
- [Tablet sizes not in the mock (text area, option rows) may look off] → They are tuned in the visual review, with the user's approval before new references are saved.
- [Expo Go's "Tools" bubble and the dev menu cover different areas in each layout] → The `visual-review` skill gets masks per layout.

## Migration Plan

- No data changes.
- Order: tokens and the layout model, then the shell, then content, then config. With the orientation still locked, every intermediate step leaves phone portrait unchanged and shippable.
- `app.json`'s orientation changes last, together with the device checks.
- **Rollback:** set `orientation` back to `"portrait"`. The adaptive code then always resolves to phone portrait on phones, and only tablets keep the new layouts. A full revert of the change is also safe.

## Open Questions

- Does iOS fire `keyboardDidShow` after a rotation? D4's window-size check covers either answer, so this only matters once an iOS check is possible.
