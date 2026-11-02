# Design

## Context

See `proposal.md` for why, and the delta specs for the exact sizes. Current state, as checked in the repo (after the archived `basic-app-layout`, `add-text-items` and `edit-text-items` changes) and the installed packages:

- **Theme:** `src/constants/theme.ts` exports one flat `Layout` object. It holds the shell sizes from `sketches/mobile-portrait.html` (`headerHeight` 70, `footerHeight` 75, `fieldHeight` 42, `avatarSize` 42, `fabSize` 56, offsets, `touchTarget` 44, `borderWidth` 2…) and the item sizes added by the text-items changes (`creationGap`, `textAreaMinHeight`/`MaxHeight`, `cardTextLineHeight` 22.5, `hairlineWidth`, `optionRowHeight`, `disabledOpacity`). Components put these in `StyleSheet.create`. The palettes gained `card_shadow`, `divider`, `overlay`, `danger` and `on_danger`, none of which depends on the layout.
- **Shell:** `AppHeader`, `FooterTabBar` and `CreateButton` read `useSafeAreaInsets()` but only use `top` and `bottom`. `CreateButton` renders only when `useCreateAction()` says so: it is hidden on Timeline while the creation box is open.
- **Root layout:** `src/app/_layout.tsx` wraps the shell in `ItemsProvider` and `CreationBoxProvider`, renders `AppHeader` above `Tabs` (from `expo-router/js-tabs`) with `tabBar={(props) => <FooterTabBar {...props} />}`, then `CreateButton`.
- **Timeline:** `TimelineFeed` is a `FlatList` of `TextItemCard`.
  - Its `contentContainerStyle` has `Spacing.lg` padding.
  - `ListHeaderComponent` is `CreationBox`, which must keep the same component type so the text area never remounts.
  - It renders `EditTextDialog` while an item is being edited.
  - `PlaceholderScreen`, a full-width `ScrollView` with 16-pt padding, serves Circles and Events.
- **Cards and creation box:** `TextItemCard` has `Radius.lg` (16), `Spacing.lg` padding and space below, and 15-pt text with a 22.5-pt line height. `CreationBox` has `Radius.lg` and `Spacing.lg` padding and space below.
- **Edit dialog:** `EditTextDialog` is a transparent `Modal` → overlay `View` → `ScrollView`, with content padding `Spacing.lg` on the sides and `insets.top + Spacing.lg` on top. The box stretches to the full width. Its design (`edit-text-items` D6) fits title → Guardar above the keyboard on a 780-pt-tall screen, with no `KeyboardAvoidingView`.
- **Type list:** the `TypeSelect` list is a transparent `Modal` with a centered sheet and `Spacing.xxl` padding. The sheet stretches to the full width.
- **Tab bar position:** the installed `BottomTabNavigationOptions` (`node_modules/expo-router/build/react-navigation/bottom-tabs/types.d.ts:204`) has `tabBarPosition?: 'bottom' | 'left' | 'right' | 'top'`. `BottomTabView.js` reads it from the **focused route's** options and renders `[top ? tabBar : null, <screens container>, bottom ? tabBar : null]` in a column. The screens container keeps the same child index in both positions, so moving the bar does not remount the scenes (or the feed's creation box draft). Only the bar remounts.
- **Jest:**
  - The React Native preset mocks `Dimensions` with a **750×1334** window (`@react-native/jest-preset/jest/mocks/NativeModules.js`). With the new rule, that window counts as a tablet.
  - `src/test-utils/jest-setup.ts` already mocks the color scheme and the item adapters (in-memory `node:sqlite`), and its `afterEach` resets the scheme and calls `jest.restoreAllMocks()`.
- **App config:** `app.json` has `"orientation": "portrait"`, the `expo-sqlite` plugin, and no `ios.supportsTablet`.
- **Expo SDK 58 docs:**
  - `config/app`: `orientation` accepts `default`, `portrait` and `landscape`, and leaving it out means no lock. `ios.supportsTablet` defaults to `false` and is described for the *standalone* iOS app. The docs don't say whether Expo Go applies either key.
  - `sdk/screen-orientation` (included in Expo Go) notes that on iOS 27 and later, apps can be resized whatever `requireFullScreen` says.
- **Devices:** the only AVD is `Medium_Phone_API_37.0` (411×914 points). There's no tablet profile and no macOS. `src/__tests__/e2e/screenshots/` holds 26 approved phone portrait references: the shell, cards, the creation box and the edit dialog.

## Goals / Non-Goals

**Goals:**
- Pick the layout with one pure function of the window size, so every component agrees on the layout and tests can drive it.
- Keep the phone portrait layout pixel-identical to today, so all 26 approved screenshots stay valid.
- Put the content column in one hook that the Timeline feed, the placeholders and future sections (image and event items) all use.

**Non-Goals:**
- No multi-column feed on tablets. One centered column is the only content rule.
- No smaller item sizes in phone landscape. The landscape mock's 14-pt card text and tighter padding are not adopted, so phone landscape uses the phone sizes (D8).
- No tablet sizes for the card action buttons, the type select, the text area, the box buttons or the empty and error messages. The tablet mock draws them at the phone sizes, or doesn't draw them at all.
- No orientation lock per screen, and no `expo-screen-orientation` unless D6's fallback is needed.
- No change to colors, palettes or contrast pairs.
- No keyboard handling beyond the platform default and the edit dialog's existing scroll view (see Risks).

## Decisions

### D1. The layout is a pure function of the window size

`screenLayoutFor(width, height)` returns `'phonePortrait' | 'phoneLandscape' | 'tablet'`:

```
  min(width, height) >= 600  -->  'tablet'
  height < 500               -->  'phoneLandscape'
  otherwise                  -->  'phonePortrait'
```

A hook `useScreenLayout()` (in `src/hooks/use-screen-layout.ts`) reads the window size through a thin `useWindowSize()` wrapper around React Native's `useWindowDimensions()`. It returns `{ layout, sizes, window }`, where `sizes = LayoutSizes[layout]` (D2). Every component that depends on the layout calls it. `useWindowDimensions` re-renders on rotation, split-screen resizes and fold changes, with no effect and no `setState` (React Compiler rule).

Why these thresholds:
- 600 on the shorter side is Android's `sw600dp` tablet boundary. It puts every iPad and every Android tablet of 7 inches or more in the tablet layout, in both orientations (exploration decision A: a tablet keeps its bottom footer in landscape).
- 500 for "short" sits between the tallest phone in landscape (about 430 points) and the shortest supported phone in portrait (iPhone SE at 667, small Android phones at about 640). A threshold of 600 would have put a 568-point-tall portrait window into the top-tabs layout.
- A tablet window's shorter side is at least 600, so it is never shorter than 500, and the three cases never overlap.

Alternatives:
- `expo-device` `deviceType`: rejected. It is static, so it gets split screen and foldables wrong, and it adds a package.
- Orientation listeners (`expo-screen-orientation`): rejected. Orientation alone can't tell a phone in landscape from a tablet in landscape.
- `Dimensions.addEventListener` plus state: rejected. It is the effect-and-setState pattern the React Compiler rules forbid.

### D2. Per-layout sizes next to the shared `Layout`

`theme.ts` keeps `Layout` for the values every layout shares: `touchTarget`, `borderWidth`, `fabBorderWidth`, `controlRadius`, `tabMarginHorizontal`, `footerPaddingHorizontal`, and the item values that don't change (`creationGap`, text area heights, `hairlineWidth`, `optionRowHeight`, `disabledOpacity`). It adds `LayoutSizes: Record<ScreenLayout, LayoutSize>`. Spacing, radius and font values come from the existing tokens where one matches. `Layout.cardTextLineHeight` moves into `LayoutSizes`.

| Key | phonePortrait | phoneLandscape | tablet |
|---|---|---|---|
| `headerHeight` | 70 | 55 | 75 |
| `headerPaddingHorizontal` | 16 (`Spacing.lg`) | 16 | 24 (`Spacing.xxl`) |
| `titleMaxWidth` | none (fills) | 300 | 350 |
| `fieldHeight` / `fieldFontSize` | 42 / 16 | 42 / 16 | 46 / 17 |
| `avatarSize` / `avatarEmojiSize` | 42 / 20 | 42 / 20 | 46 / 22 |
| `menuGlyphSize` | 18 (`FontSize.titleCard`) | 18 | 20 (`FontSize.titleTablet`) |
| `tabPosition` | bottom | top | bottom |
| `barHeight` (footer or tab row) | 75 | 56 | 80 |
| tabs | equal width, 44 tall, label 14 | label + 2×16 wide, 44 tall, gap 12, label 14 | 150×48, gap 16, radius 12, label 15 |
| `fabSize` / `fabFontSize` | 56 / 28 | 48 / 24 | 60 / 30 |
| `fabOffsetRight` / `fabOffsetBottom` | 20 / 10 above footer | 20 / 15 above safe bottom | 28 / 15 above footer |
| `contentPadding` / `contentMaxWidth` | 16 / 550 | 16 / 550 | 24 / 500 |
| `cardRadius` / `cardPadding` / `cardGap` | 16 / 16 / 16 | 16 / 16 / 16 | 18 (`Radius.xl`) / 20 (`Spacing.xl`) / 20 |
| `cardTextSize` / `cardTextLineHeight` | 15 / 22.5 | 15 / 22.5 | 16 (`FontSize.bodyLarge`) / 24 |
| `boxRadius` / `boxGap` (creation box) | 16 / 16 | 16 / 16 | 18 / 20 |
| `dialogRadius` (edit dialog) | 16 | 16 | 18 |

Styling pattern: structure (flex direction, alignment, border widths that never change) stays in `StyleSheet.create`. Values that depend on the layout are passed inline from `sizes`, the same way colors come inline from `useTheme()`. Nothing is hard-coded in components. Where the mocks and accessibility disagree (D8), the table follows accessibility.

Alternatives:
- Put the sizes in `design-system.json`, which already has `height_landscape` and `height_tablet` under `components`: rejected for now. The JSON holds colors and generic tokens, and the shell sizes already live in `theme.ts`. Moving them is a separate refactor.
- One `Layout` object with suffixed keys (`headerHeightTablet`…): rejected, because every component would branch on the layout itself.

### D3. One tab bar, moved with `tabBarPosition`

`_layout.tsx` calls `useScreenLayout()` and passes `screenOptions={{ headerShown: false, tabBarPosition: sizes.tabPosition }}`. The header sits above the navigator, so a `top` bar renders directly under it, as in the mock. The bar component reads `useScreenLayout()` too and draws itself as either the footer (phone portrait, tablet) or the row under the header (phone landscape). The two differ in border side (top vs bottom), bottom inset (yes vs no) and tab sizing (stretched vs centered).

The component is renamed `FooterTabBar` → `SectionTabBar` (`src/components/section-tab-bar.tsx`), and its test file with it, because it is no longer always a footer. The tab-press logic (emit `tabPress`, then `navigateToTab`) stays as it is.

Alternatives:
- A separate top tab row outside the navigator, wired to the router: rejected. It duplicates the tab-press and selection logic, and keeping two bars in sync is error-prone.
- Headless tabs (`expo-router/ui`): still experimental.

### D4. `useContentColumn()`: the column as scroll padding

The feed is a `FlatList`, and it must stay one: its header has to keep a stable component type, and the list has no upper bound. Wrapping its content in a centered `View` isn't possible without wrapping every row, the header and the empty message separately. So the column is produced by **padding** instead.

`useContentColumn()` (in `src/hooks/use-content-column.ts`) returns a style for `contentContainerStyle`:

```
paddingTop    = paddingBottom = sizes.contentPadding
paddingLeft   = max(sizes.contentPadding + insets.left,  (window.width - sizes.contentMaxWidth) / 2)
paddingRight  = max(sizes.contentPadding + insets.right, (window.width - sizes.contentMaxWidth) / 2)
```

The content area is as wide as the window (the tabs sit above or below it, never beside it), so this centers a column of at most `contentMaxWidth`. It works the same for `ScrollView` (`PlaceholderScreen`) and `FlatList` (`TimelineFeed`). Because the padding is inside the scroll content, swiping beside the column still scrolls. Future sections call the same hook.

**Overlays use the same cap.**
- **`EditTextDialog`:** the scroll content padding becomes `Spacing.lg` plus the side insets. The box gets `width: '100%'`, `maxWidth: sizes.contentMaxWidth` and `alignSelf: 'center'`, and its radius is `sizes.dialogRadius`.
- **`TypeSelect` list:** the sheet gets the same `maxWidth` and centering. The sheet's width isn't in any spec, so this changes only the design.

Alternatives:
- A `SectionScrollView` wrapper component with a centered inner `View` (the earlier plan): rejected now that the feed is a `FlatList`.
- `columnWrapperStyle`: only applies to multi-column lists.

### D5. Side safe-area insets

- **Header and tab row:** `paddingLeft` = padding + `insets.left`, and `paddingRight` = padding + `insets.right`.
- **Footer:** the same, on top of its horizontal padding.
- **Create button:** `right` = offset + `insets.right`. In phone landscape, `bottom` = 15 + `insets.bottom`. Otherwise `bottom` = bar height + `insets.bottom` + offset, as today. Its visibility logic (`useCreateAction`) is untouched.
- **Content:** D4 includes the side insets.
- **Edit dialog:** the side insets are added to its padding (D4). The type list's `Spacing.xxl` padding already clears them on current devices, and the device check confirms it.

`TEST_INSETS` stays as it is. The tests that check side insets override `left` and `right` locally, so existing assertions keep working.

### D6. App config: unlock orientation, support iPad

`app.json`: `"orientation": "default"` and `"ios": { "supportsTablet": true, ... }`. The docs don't say whether Expo Go applies `orientation`, so the first implementation task checks rotation in Expo Go on the emulator before any layout work.

Fallback, only if Expo Go keeps the app in portrait: call `ScreenOrientation.unlockAsync()` once at startup, from `expo-screen-orientation`. That package ships in Expo Go and would be installed with `npx expo install`. Since it adds a dependency, the proposal and this design are updated first.

### D7. Tests drive the window size

Following the existing color-scheme pattern:
- **Test windows:** `src/test-utils/test-values.ts` adds `PHONE_PORTRAIT_WINDOW` (411×914), `PHONE_LANDSCAPE_WINDOW` (914×411), `TABLET_PORTRAIT_WINDOW` (800×1280), `TABLET_LANDSCAPE_WINDOW` (1280×800), and `setMockWindow()` / `getMockWindow()`.
- **Mock:** `jest-setup.ts` mocks `@/hooks/use-window-size` to return `getMockWindow()`. Its existing `afterEach` also resets the window to phone portrait. Tests no longer depend on the preset's 750×1334 window.
- **`screenLayoutFor`:** table-driven unit tests at the boundaries (599/600 on the shorter side, 499/500 height, and the split-screen case). `useContentColumn` gets tests for the padding formula in each layout, with and without side insets.
- **Component tests:** each affected component test (header, title field, tab bar, create button, placeholder, timeline feed, text card, creation box, edit dialog, type select) runs its size and position checks in each layout. They assert against `LayoutSizes[layout]`, `Layout` and `TEST_INSETS`, never literals.
- **e2e:** `src/__tests__/e2e/` switches the window from portrait to landscape and back. It checks the section, selected tab, tab position and title text (on Circles with "abuela"), then the creation box draft in its text step (with the create button still hidden), then the edit dialog with an unsaved edit.

### D8. Accessibility over the landscape mock

`mobile-landscape.html` draws:
- tabs about 25 points tall, a menu button about 30 points, and a 36-point field and avatar
- 13 to 14-point labels
- 14-point card text with 14 points of padding

The app keeps:
- 44-point tabs and menu button
- a 48-point create button
- the 42-point field and avatar
- the phone text sizes: field 16, labels 14, card text 15

This follows the precedence rule in `docs/product/design-sources.md`: accessibility beats the sketches. The cost is a 56-point tab row instead of 40, and fewer lines of text visible at once.

### D9. Tablet landscape reuses the tablet layout

There's no mock for tablet landscape. A landscape tablet still has about 730 to 780 points of height, so there's no reason to move the tabs. Keeping the footer means rotating a tablet only changes the width, and the navigation stays where users learned it. Rejected alternative: the phone-landscape structure at tablet sizes, with the tabs on top in every landscape window.

### D10. Device checks and screenshots

- **Tablet emulator:** add an AVD with Android Studio's **Medium Tablet** profile (2560×1600 px, density 320, so 1280×800 points in landscape), Android API 37, with Expo Go installed. The `run-on-emulator` and `visual-review` skills and `docs/development/device-testing.md` record it as the tablet reference profile.
- **Rotation with adb:** run `adb shell settings put system accelerometer_rotation 0`, then `adb shell settings put system user_rotation 1` for landscape or `0` for portrait.
- **Portrait guard:** all 26 existing phone portrait references must still match. That proves phone portrait didn't change.
- **New references** in `src/__tests__/e2e/screenshots/`, light and dark, named `<state>-<layout>-<scheme>.png`, where `<layout>` is `landscape`, `tablet-portrait` or `tablet-landscape`:
  - `timeline-cards`, `box-write` and `edit-open` in each of the three new layouts (18 files)
  - `title-focused-landscape` (2 files)

  They are kept only after the user approves them.

## Risks / Trade-offs

- [Expo Go may ignore `orientation: "default"`] → Checked first, in task 1.2. Fallback in D6.
- [Keyboard in phone landscape] → With a 411-pt window, the keyboard leaves about 160 to 220 points.
  - Creation box: the `FlatList` scrolls, so "Crear" can be reached.
  - Edit dialog: the title through Guardar is about 240 points, so it can't all fit. The spec now allows scrolling there, and the dialog's `ScrollView` provides it.
  - Android may instead show its full-screen text entry for these multiline fields, which makes the question moot.
  - Both are checked on the emulator (task 7.3). If the dialog's scroll view doesn't shrink above the keyboard inside the translucent Modal, add `KeyboardAvoidingView` for phone landscape only, through an update to this design.
- [Large system font in the landscape tab row] → The tabs size to their labels and the row is centered, but at a large font scale the labels could crowd a 640-point-wide window. The device check runs at font scale 1.3, and anything that doesn't fit goes into known limitations.
- [Rotation recreating the activity] → Expo Go handles configuration changes without recreating the activity, so JS state survives: the title text, the creation box draft in `CreationBoxProvider`, and the dialog state in `TimelineFeed`. The "Layout changes keep the app state" scenarios are also checked on the emulator, not only in Jest.
- [The tab bar remounts when its position changes] → The bar holds no state. The scenes (with the feed and the creation box), the header and the create button don't remount (Context). There may be a brief visual jump during the rotation animation, which is acceptable.
- [Card height changes on rotation] → Tablet cards look the same in both orientations, but phone cards get wider in landscape and rewrap. The scroll position is not kept exactly across a layout change, and the spec doesn't promise it.
- [iPad and iOS stay unverified] → There's no macOS on this machine. `supportsTablet` is set, and the layout logic is the same as on Android tablets. Listed in known limitations, as iOS already is.
- [Column width on large tablets] → The mock's 500 points leaves wide margins on a 1280-point window. It is one value (`LayoutSizes.tablet.contentMaxWidth`), and changing it means updating the spec through `/opsx:update`.

## Migration Plan

There's no data or API migration: storage is untouched, and the change ships as one PR. To roll back, set `orientation` back to `"portrait"` in `app.json`. Phones then always see a portrait window and get the phone portrait layout. Tablets would still get the tablet layout.
