# Design

## Context

See `proposal.md` for why, and the delta specs for the exact sizes. Current state, as checked in the repo and the installed packages:

- `src/constants/theme.ts` exports one flat `Layout` object ("fixed shell sizes from sketches/mobile-portrait.html"): `headerHeight` 70, `footerHeight` 75, `fieldHeight` 42, `avatarSize` 42, `fabSize` 56, offsets, `touchTarget` 44, `borderWidth` 2, and so on. Components put these in `StyleSheet.create`. Unit tests assert against `Layout.*` and `TEST_INSETS`.
- `AppHeader`, `FooterTabBar` and `CreateButton` read `useSafeAreaInsets()` but only use `top` and `bottom`. `PlaceholderScreen` is a full-width `ScrollView` with 16 points of padding.
- `src/app/_layout.tsx` renders `AppHeader` above `Tabs` (from `expo-router/js-tabs`) with `tabBar={(props) => <FooterTabBar {...props} />}`, then `CreateButton`, which is absolutely positioned.
- The installed `BottomTabNavigationOptions` (`node_modules/expo-router/build/react-navigation/bottom-tabs/types.d.ts:204`) has `tabBarPosition?: 'bottom' | 'left' | 'right' | 'top'`. `BottomTabView.js` reads it from the **focused route's** options and renders `[top ? tabBar : null, <screens container>, bottom ? tabBar : null]` in a column. The screens container keeps the same child index in both positions, so moving the bar does not remount the scenes. Only the bar remounts.
- Jest: the React Native preset mocks `Dimensions` with a **750×1334** window (`@react-native/jest-preset/jest/mocks/NativeModules.js`). With the new rule, that window counts as a tablet, so tests must fake a phone window by default.
- `app.json` has `"orientation": "portrait"` and no `ios.supportsTablet`.
- Expo SDK 58 docs (`config/app`): `orientation` accepts `default`, `portrait` and `landscape`, and leaving it out means no lock. `ios.supportsTablet` defaults to `false` and is described for the *standalone* iOS app. The docs don't say whether Expo Go applies either key. `sdk/screen-orientation` (included in Expo Go) notes that on iOS 27 and later, apps can be resized whatever `requireFullScreen` says.
- Devices: the only AVD is `Medium_Phone_API_37.0` (411×914 points). No tablet profile, and there is no macOS for iOS checks.

## Goals / Non-Goals

**Goals:**
- One shell that picks its layout from a single pure function of the window size, so every component agrees on the layout and tests can drive it.
- Keep the phone portrait layout pixel-identical to today, so the approved screenshots stay valid.
- Give future sections (the feed first) a ready-made scroll container with the content column, so they never re-implement it.

**Non-Goals:**
- No new layout for screens inside sections (for example, a two-column feed on tablets). The column is the only content rule here.
- No orientation lock per screen, and no use of `expo-screen-orientation` unless D6's fallback is needed.
- No change to colors, palettes or contrast pairs: the new layouts reuse existing color roles.
- No keyboard tuning in landscape beyond the platform default (see Risks).

## Decisions

### D1. The layout is a pure function of the window size

`shellLayoutFor(width, height)` returns `'phonePortrait' | 'phoneLandscape' | 'tablet'`:

```
  min(width, height) >= 600  -->  'tablet'
  height < 500               -->  'phoneLandscape'
  otherwise                  -->  'phonePortrait'
```

A hook `useShellLayout()` (in `src/hooks/use-shell-layout.ts`) reads the window size through a thin `useWindowSize()` wrapper around React Native's `useWindowDimensions()`, and returns `{ layout, sizes }`, where `sizes = ShellSizes[layout]` (D2). Every shell component calls the hook. `useWindowDimensions` re-renders on rotation, split-screen resizes and fold changes, with no effect and no `setState` (React Compiler rule).

Why these thresholds:
- 600 on the shorter side is Android's `sw600dp` tablet boundary, and it puts every iPad and 7-inch-or-larger Android tablet in the tablet layout in both orientations (decision A from exploration: a tablet keeps its bottom footer in landscape).
- 500 for "short" sits between the tallest phone in landscape (about 430 points) and the shortest supported phone in portrait (iPhone SE, 667; small Android phones, about 640). An earlier idea of 600 would have put a 568-point-tall window in portrait into the top-tabs layout for no reason.
- Because "tablet" needs the shorter side to be at least 600, a tablet window is never shorter than 500, so the three cases never overlap.

Alternatives:
- `expo-device` `deviceType`: rejected. It is static, so it gets split screen and foldables wrong, and it adds a package.
- Orientation APIs (`expo-screen-orientation` listeners): rejected. Orientation alone can't tell a phone in landscape from a tablet in landscape, which is the case that matters here.
- `Dimensions.addEventListener` plus state: rejected. It is the effect-and-setState pattern the React Compiler rules forbid.

### D2. Per-layout shell sizes next to the shared `Layout`

`theme.ts` keeps `Layout` for values every layout shares (`touchTarget`, `borderWidth`, `fabBorderWidth`, `controlRadius`, `tabMarginHorizontal`, `footerPaddingHorizontal`) and adds `ShellSizes: Record<ShellLayout, ShellSize>`. Spacing, radius and font values come from the existing tokens where one matches.

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
| tabs | equal width, 44 tall, label 14 | label width + 2×16, 44 tall, gap 12, label 14 | 150×48, gap 16, radius 12, label 15 |
| `fabSize` / `fabFontSize` | 56 / 28 | 48 / 24 | 60 / 30 |
| `fabOffsetRight` / `fabOffsetBottom` | 20 / 10 above footer | 20 / 15 above safe bottom | 28 / 15 above footer |
| `contentPadding` / `contentMaxWidth` | 16 / 550 | 16 / 550 | 24 / 500 |

Styling pattern: structure (flex direction, alignment, border widths that never change) stays in `StyleSheet.create`. Values that depend on the layout are passed inline from `sizes`, the same way colors come inline from `useTheme()`. Nothing is hard-coded in components.

Where the mocks and accessibility disagree (D8), the table follows accessibility.

Alternatives:
- Put the sizes in `design-system.json` (it already has `height_landscape` and `height_tablet` under `components`): rejected for now. The JSON holds colors and generic tokens, and the shell sizes already live in `theme.ts` (design D4 of `basic-app-layout`). Moving them is a separate refactor.
- One `Layout` object with suffixed keys (`headerHeightTablet` and so on): rejected. Every component would branch on the layout itself.

### D3. One tab bar, moved with `tabBarPosition`

`_layout.tsx` calls `useShellLayout()` and passes `screenOptions={{ headerShown: false, tabBarPosition: sizes.tabPosition }}`. Since the header sits above the navigator, a `top` bar renders directly under the header, which is the mock's layout. The bar component reads `useShellLayout()` too and draws itself as the footer (phone portrait, tablet) or the row under the header (phone landscape): top border vs bottom border, bottom inset vs none, and stretched vs centered tabs.

The component is renamed `FooterTabBar` → `SectionTabBar` (`src/components/section-tab-bar.tsx`), with its test file renamed to match, because it is no longer always a footer. The tab-press logic (emit `tabPress`, then `navigateToTab`) stays as it is.

Alternatives:
- A separate top tab row outside the navigator, wired to the router: rejected. It duplicates the tab-press and selection logic, and keeping two bars in sync is error-prone.
- Headless tabs (`expo-router/ui`): still experimental, as in `basic-app-layout` D1.

### D4. `SectionScrollView`: the content column in one place

New `src/components/section-scroll-view.tsx`: a full-width `ScrollView` with background `backgroundMain`, content padding `sizes.contentPadding` plus the left and right safe-area insets, and children wrapped in a `View` with `width: '100%'`, `maxWidth: sizes.contentMaxWidth` and `alignSelf: 'center'`. `PlaceholderScreen` renders through it. The feed will reuse it.

Because the `ScrollView` stays full width, swiping in the empty space beside the column still scrolls, as the spec asks.

Alternative: put the max width on each screen. Rejected, because every new section would have to remember it.

### D5. Side safe-area insets

- Header and tab row: `paddingLeft` = padding + `insets.left`, and `paddingRight` = padding + `insets.right`.
- Footer: the same, on top of its horizontal padding.
- Create button: `right` = offset + `insets.right`. In phone landscape, `bottom` = 15 + `insets.bottom`. Otherwise it is the bar height + `insets.bottom` + offset, as today.
- Content: D4 adds the side insets to the padding.

`TEST_INSETS` gets non-zero `left` and `right` values only in the tests that check them, so existing assertions keep working.

### D6. App config: unlock orientation, support iPad

`app.json`: `"orientation": "default"` and `"ios": { "supportsTablet": true, ... }`. The docs don't say whether Expo Go applies `orientation`, so the first implementation task checks rotation in Expo Go on the emulator before any layout work.

Fallback, only if Expo Go keeps the app in portrait: call `ScreenOrientation.unlockAsync()` once at startup from `expo-screen-orientation`. It ships in Expo Go and would be installed with `npx expo install`. That adds a dependency, so the proposal and this design get updated first.

### D7. Tests drive the window size

Following the existing color-scheme pattern:
- `src/test-utils/test-values.ts` adds `PHONE_PORTRAIT_WINDOW` (411×914), `PHONE_LANDSCAPE_WINDOW` (914×411), `TABLET_PORTRAIT_WINDOW` (800×1280), `TABLET_LANDSCAPE_WINDOW` (1280×800), and `setMockWindow()` / `getMockWindow()`.
- `jest-setup.ts` mocks `@/hooks/use-window-size` to return `getMockWindow()`, and resets it to the phone portrait window after each test. Tests no longer depend on the preset's 750×1334 window.
- `shellLayoutFor` gets table-driven unit tests at the boundaries (599/600 on the shorter side, 499/500 height, and the split-screen case).
- Each shell component test runs its size and position checks in each layout, asserting against `ShellSizes[layout]` and `TEST_INSETS`, never literals.
- An e2e test switches the window from portrait to landscape on Circles with "abuela" typed, re-renders, and checks the section, the selected tab, the tab position and the field text.

### D8. Accessibility over the landscape mock

`mobile-landscape.html` draws tabs about 25 points tall, a menu button about 30 points, a 36-point field and avatar, and 13 to 14-point labels. The shell keeps:
- 44-point tabs and menu button
- a 48-point create button
- the 42-point field and avatar
- phone text sizes (field 16, labels 14)

This follows the precedence rule in `docs/product/design-sources.md` (accessibility beats the sketches). The cost is a 56-point tab row instead of 40.

### D9. Tablet landscape reuses the tablet layout

There's no mock for tablet landscape. A landscape tablet still has about 730 to 780 points of height, so there's no reason to move the tabs. Keeping the footer means rotating a tablet only changes the width, and the navigation stays where users learned it. Rejected alternative: the phone-landscape structure at tablet sizes, with the tabs on top in every landscape window.

### D10. Device checks and screenshots

- Add an AVD with Android Studio's **Medium Tablet** profile (2560×1600 px, density 320, so 1280×800 points in landscape), Android API 37, with Expo Go installed. The `run-on-emulator` and `visual-review` skills and `docs/development/device-testing.md` record it as the tablet reference profile.
- Rotate with adb, without touching the emulator UI: `adb shell settings put system accelerometer_rotation 0`, then `adb shell settings put system user_rotation 1` (landscape) or `0` (portrait).
- New references in `src/__tests__/e2e/screenshots/`, light and dark: `timeline-landscape-*` (Medium Phone), `timeline-tablet-portrait-*` and `timeline-tablet-landscape-*` (Medium Tablet), plus `title-focused-landscape-*`. The existing phone portrait references must still match, which proves the phone portrait layout didn't change. New references are kept only after the user approves them.

## Risks / Trade-offs

- [Expo Go may ignore `orientation: "default"`] → Checked first, in task 1. Fallback in D6.
- [Large system font in the landscape tab row] → The tabs size to their labels and the row is centered. At a large font scale, the labels could crowd a 640-point-wide window. The device check runs at font scale 1.3, and anything that doesn't fit goes to known limitations.
- [Keyboard in phone landscape] → Android may show its full-screen text entry for the title field, and on iOS the keyboard covers most of the window. That is the platform default, and it gets listed in known limitations next to the existing keyboard note.
- [Rotation recreating the activity] → Expo Go handles configuration changes without recreating the activity, so JS state survives. The "Layout changes keep the app state" scenario is checked on the emulator, not only in Jest.
- [The tab bar remounts when its position changes] → The bar holds no state. Scenes, header and create button don't remount (Context). There may be a brief visual jump during the rotation animation, which is acceptable.
- [iPad and iOS stay unverified] → No macOS on this machine. `supportsTablet` is set and the layout logic is the same as on Android tablets. Listed in known limitations, as iOS already is.
- [Content column width on large tablets] → 500 points (from the mock) leaves wide margins on a 1280-point window. The value is one token (`ShellSizes.tablet.contentMaxWidth`). Changing it means updating the spec through `/opsx:update`.

## Migration Plan

No data or API migration. The change ships as one PR. Rollback: set `orientation` back to `"portrait"` in `app.json`. The layout code then always sees a portrait window and falls back to the phone portrait layout on phones (tablets would still get the tablet layout).
