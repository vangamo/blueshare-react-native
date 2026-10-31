# Design

## Context

See `proposal.md` for why. Current state, as checked in the repo:

- Expo SDK 58 (`expo ~58.0.22`, `expo-router 58.0.29`, React Native 0.88.1, React 19.3), TypeScript strict, `experiments.typedRoutes` and `experiments.reactCompiler` on. npm (`package-lock.json`).
- `src/app/_layout.tsx` renders `ThemeProvider` (stock `DarkTheme`/`DefaultTheme`), `AnimatedSplashOverlay` and `AppTabs` (`NativeTabs` from `expo-router/native-tabs`, with Home and Explore).
- `src/constants/theme.ts` holds starter colors (`text`, `background`, `backgroundElement`, …), `Fonts` (with a web variant that imports `global.css`), `Spacing` (`half`…`six`), `BottomTabInset` and `MaxContentWidth`.
- Linting is already set up: `eslint` 9 and `eslint-config-expo` ~58, with a flat config in `eslint.config.js`. It runs through `npm run lint` / `npx expo lint`, which checks `src/`. The Expo config includes the React Compiler `react-hooks` rules (for example `react-hooks/set-state-in-effect`). Lint passes on the current code. There is no test runner yet (see D10).
- Testing facts (Expo v58 docs and installed packages): SDK 58's `jest-expo` needs Jest 30. Expo Router tests need `@testing-library/react-native` 14 or newer. `react-test-renderer` is deprecated, because it does not support React 19. `expo-router/testing-library` exports an async `renderRouter` and the checks `toHavePathname` and `toHaveSegments`. `react-native-safe-area-context` ships a Jest mock (`react-native-safe-area-context/jest/mock`). On this machine, `adb` is installed (snap) and so are ImageMagick and Python Pillow. There is no Android emulator, Android SDK, Java or Maestro.
- Facts about expo-router 58, from the installed package and the v58 docs:
  - React Navigation is bundled inside expo-router. `ThemeProvider`, `DefaultTheme` and `DarkTheme` are imported from `expo-router`. The navigation `Theme.colors` has `primary`, `background`, `card`, `text`, `border` and `notification`.
  - JavaScript tabs live at `expo-router/js-tabs`. The `Tabs` export from `expo-router` is marked `@deprecated` in the installed types, even though the docs page still shows it. The navigator accepts `tabBar?: (props: BottomTabBarProps) => ReactNode`, and `BottomTabBarProps` is exported from `expo-router/js-tabs`.
  - SDK 58: "JavaScript tabs, … headless tabs, and native tabs now show only screens declared in the layout". Every route needs a `Tabs.Screen`.
  - Headless tabs (`expo-router/ui`) are documented as **experimental**.
  - `expo-status-bar` accepts `style: 'auto' | 'inverted' | 'light' | 'dark'`. `expo-splash-screen` exposes `preventAutoHideAsync()` and `hideAsync()`.
  - Peer dependencies: expo-router lists `react-dom`, `react-native-web`, `expo-symbols` and `@expo/ui` as **optional** peers. `expo-glass-effect` is a direct dependency of expo-router, so it stays installed through expo-router. `expo`, `expo-image` and `expo-system-ui` list `react-native-web` as an optional peer. Nothing depends on `expo-web-browser` or `expo-device`.
  - Android: `expo-system-ui` is required, or `userInterfaceStyle` is ignored.

## Goals / Non-Goals

**Goals:**
- Build one shell that every future main screen plugs into without touching the header, footer or FAB.
- Put the theme in one module that later features (cards, creation box) can reuse.
- Keep the shell easy to replace piece by piece: header, tab bar and FAB are separate components.

**Non-Goals:**
- No end-to-end or automated screenshot tests (Maestro, Detox) in this change. Maestro needs Java 17+ and an emulator or a built app, which this machine does not have yet. It is a later change that uses the screenshots approved here (D11) as its references.
- No large snapshot tests (`toMatchSnapshot` of whole screens). The Expo docs advise against them for UI, and they break on every intended visual change.
- No navigation stack above the tabs yet (no `(tabs)` group). It gets added when the first screen opens on top of the tabs.
- No keyboard-avoidance tuning for the footer while the title field is focused, beyond what the platform does by default.

## Decisions

### D1. Tab navigator: JS tabs from `expo-router/js-tabs` with a custom `tabBar`

`src/app/_layout.tsx` renders `<Tabs tabBar={(props) => <FooterTabBar {...props} />} screenOptions={{ headerShown: false }}>` with `Tabs.Screen` for `index` (title "Timeline"), `circles` and `events`. The tab bar reads `state.index`, `state.routes` and `descriptors[key].options.title`, and switches tabs with the standard pattern: emit `tabPress`, and call `navigation.navigate(route.name)` if the tab is not focused and the event was not prevented.

Why: it is stable and not experimental. It handles the Android back button (`backBehavior` defaults to returning to the first tab) and lazy loading, and it themes scenes through `ThemeProvider`. It also renders our component in place of the bar, with no native tab look.

Alternatives:
- Headless `Tabs`/`TabList`/`TabTrigger`/`TabSlot` from `expo-router/ui`. It composes nicely (header, `TabSlot` and footer as siblings), but the v58 docs mark it experimental and leave out back behavior and screen options. **Fallback** if `tabBar` turns out to be unusable.
- `NativeTabs`: rejected, because the brief requires a custom-drawn bar.
- `Tabs` imported from `expo-router`: deprecated in the installed version.

### D2. Shell composition in the root layout

```
ThemeProvider (BlueShare navigation theme)
└─ View  flex:1, bg=backgroundMain, onLayout → hide splash
   ├─ StatusBar style="auto"
   ├─ AppHeader                         (fixed, height 70 + insets.top)
   ├─ Tabs (flex:1)                     (scenes + FooterTabBar, height 75 + insets.bottom)
   └─ CreateButton  position:absolute   (right 20, bottom = 75 + insets.bottom + 10)
```

The header sits outside the navigator, above it in the column, so it renders once and content can never scroll under it. The footer is the navigator's `tabBar`, which already sits below the scenes. The FAB is a sibling drawn last, so it floats over the content.

Alternative: a per-screen header through the `header` screen option. Rejected, because it would mount once per screen and could flicker when switching tabs.

Routes stay at the top level: `src/app/index.tsx` (Timeline, so the app opens there), `circles.tsx` and `events.tsx`. Each renders a shared `PlaceholderScreen` (a `ScrollView` with padding 16 on `backgroundMain`, plus a text). Expo Router provides the safe-area context at the root. If insets come back as 0 on a notched device, wrap the shell in `SafeAreaProvider`.

### D3. Components (outside `src/app/`)

| File | Role |
| --- | --- |
| `src/components/app-header.tsx` | Header row: menu button, `TitleSearchField`, avatar. Applies `insets.top`. |
| `src/components/title-search-field.tsx` | Title/search `TextInput` and its focus/blur logic (D7). |
| `src/components/footer-tab-bar.tsx` | `tabBar` implementation; takes `BottomTabBarProps`. Applies `insets.bottom`. |
| `src/components/create-button.tsx` | FAB. Takes its position from `Layout` constants and `insets.bottom`. |
| `src/components/placeholder-screen.tsx` | Scrollable placeholder body used by the three routes. |

`ThemedText` and `ThemedView` are **deleted**. Each new component reads `useTheme()` directly, and the text styles are too specific for those wrappers to help. Glyphs (`≡`, `+`, `👵`) are plain `Text`, with no icon library. Buttons are `Pressable` with an opacity change for press feedback, `accessibilityRole="button"` and the labels "Menu" and "Create". The avatar is a `View` with `accessible` and `accessibilityLabel="Profile"` and no press handler. The footer container is `accessibilityRole="tablist"`, and each tab has `accessibilityRole="tab"` and `accessibilityState={{ selected }}`.

### D4. Theme module (`src/constants/theme.ts`)

It exports:
- `Colors.light` / `Colors.dark`: the same keys in both, camelCase versions of the design-token names, plus a few roles taken from the HTML sketch. `ThemeColor = keyof typeof Colors.light`.
- `Spacing` `{ xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 }`, `Radius` `{ sm: 8, md: 12, lg: 16, xl: 18, pill: 9999 }`, `FontSize` `{ caption: 12, small: 14, body: 15, bodyLarge: 16, titleCard: 18, titleTablet: 20 }`, and `FontWeight` `{ regular: '400', medium: '600', bold: '700', extrabold: '800' }`.
- `Layout`: fixed shell sizes taken from the HTML: `headerHeight: 70`, `footerHeight: 75`, `touchTarget: 44`, `fieldHeight: 42`, `avatarSize: 42`, `fabSize: 56`, `fabOffsetRight: 20`, `fabOffsetBottom: 10`, `controlRadius: 10`. Where the HTML uses a value that is not a token (10-point radius, 10-point footer padding, 4-point tab margin), it lives here and not inline.
- `NavigationThemes.light` / `.dark`: `{ ...DefaultTheme | DarkTheme, colors: { …, primary: primaryBlue, background: backgroundMain, card: cardBg, text: textMain, border: borderColor, notification: primaryBlue } }`.

Removed: `Fonts` (only the demo `code` style used it; the system font is the default), `BottomTabInset`, `MaxContentWidth`, the old `Spacing` keys, and the `@/global.css` import.

`useTheme()` and `useColorScheme()` stay as they are. Both re-render on a system scheme change, which gives live switching with no restart. Styles use `StyleSheet.create` for layout, and colors are passed in inline style arrays (`[styles.tab, { backgroundColor: theme.surfaceMuted }]`). React Compiler handles memoization, so there is no `useMemo` style factory.

### D5. Palettes

Light values come from `design_system.json`, with the HTML winning where they disagree. The dark palette uses the same slate/blue family. Ratios were computed with the WCAG 2.x formula.

| Role | Light | Dark | Used by |
| --- | --- | --- | --- |
| `primaryDark` (strong ink) | `#0f172a` | `#e2e8f0` | title-field border, avatar border |
| `primaryBlue` | `#0084ff` | `#4da3ff` | FAB fill, menu glyph and border, focused field border |
| `primaryBlueHover` | `#006fe6` | `#80bdff` | **active tab background** |
| `primaryBlueDeep` *(new)* | `#0058b8` | `#b3d7ff` | active tab border |
| `primaryShadow` *(new)* | `rgba(0,132,255,0.3)` | `rgba(77,163,255,0.3)` | tab and FAB shadow |
| `onPrimary` *(new; HTML white)* | `#ffffff` | `#0f172a` | active tab label, FAB `+` |
| `backgroundMain` | `#faf9f6` | `#0b1120` | content and scene background |
| `backgroundBody` | `#f1f5f9` | `#020617` | (token kept for later) |
| `cardBg` | `#ffffff` | `#0f172a` | header, footer, focused field, FAB ring |
| `surfaceMuted` *(new; HTML `#f8fafc`)* | `#f8fafc` | `#1e293b` | field at rest, inactive tabs |
| `avatarBg` *(new; HTML `#fdf6f0`)* | `#fdf6f0` | `#3a2e25` | avatar |
| `creationBg` | `#f0f7ff` | `#0c2340` | menu button background |
| `borderColor` | `#e2e8f0` | `#334155` | header/footer separators |
| `borderDark` | `#cbd5e1` | `#64748b` | inactive tab border |
| `textMain` | `#0f172a` | `#f1f5f9` | field text, placeholder screen text |
| `textSecondary` | `#334155` | `#cbd5e1` | inactive tab label |
| `textMuted` | `#475569` | `#94a3b8` | field placeholder "Buscar..." |
| `badgeBg` / `badgeText` | `#e0f2fe` / `#0369a1` | `#0c2a4a` / `#7dd3fc` | (tokens kept for feed cards) |

Choices:
- **Active tab in light mode uses `primaryBlueHover` (`#006fe6`) and not `#0084ff`** (decided with the user). White on `#0084ff` is 3.66:1, which fails AA for 14-point bold text. White on `#006fe6` is 4.75:1. Its border moves one step darker, to `primaryBlueDeep`, so the active tab still has a darker edge as in the sketch. The FAB keeps `#0084ff`: its `+` is 28-point bold, which counts as large text and only needs 3:1.
- **In dark mode, `onPrimary` is navy (`#0f172a`) and not white.** A blue light enough to stand out on dark backgrounds (`#4da3ff`, 6.80:1 against `cardBg`) cannot carry white text (2.9:1). Dark text on a light-blue fill gives 6.80:1 (FAB) and 9.05:1 (active tab on `#80bdff`). In dark mode, "hover" and "deep" go lighter, because emphasis on a dark background means more light.
- `primaryDark` swaps to a light slate in dark mode, because it is used as a strong border and ink color, not as a background.
- Checked pairs (light / dark): field text on rest background 17.06 / 13.35; placeholder on focused background 7.58 / 6.96; inactive tab label 9.90 / 9.85; active tab label 4.75 / 9.05; menu glyph on its background 3.39 / 6.01 (icon, needs ≥ 3); title border 17.06 / 11.87.
- The inactive-tab border in light mode (`#cbd5e1` on `#f8fafc`, 1.42:1) is decorative. The tab is identified by its label and background, so it is kept as in the sketch.

Shadows use React Native's `boxShadow` style (for example `0 3px 8px ${theme.primaryShadow}`), which works on Android and iOS under the New Architecture. The HTML's FAB shadow (0.35 alpha) and tab shadow (0.3) share one token at 0.3. The difference is not visible.

### D6. Navigation theme, status bar and splash

- `ThemeProvider value={NavigationThemes[scheme]}` sets scene and container backgrounds to `backgroundMain`, so no white flashes in dark mode. The root `View` also uses `backgroundMain`.
- `<StatusBar style="auto" />` from `expo-status-bar`: dark icons in light mode, light icons in dark mode. On Android (edge-to-edge) the header paints behind the status bar, and its top padding equals `insets.top`.
- Splash: keep `SplashScreen.preventAutoHideAsync()` at module scope in `_layout.tsx`, and call `SplashScreen.hideAsync()` from the root `View`'s `onLayout` (the first time the shell lays out). This is the scaffold's pattern without the animated overlay. It is explicit, and it gives one clear place to wait for future async work (fonts, session).
  - Alternative: drop `preventAutoHideAsync` and rely on automatic hiding. Rejected, because it is less explicit about when the shell is ready.

### D7. Title/search field state

State: `query: string` (initially `''`) and `focused: boolean`.
- Displayed `value`: when focused, `query`; when not focused, `query.trim() ? query : 'BlueShare'`.
- `onFocus`: set `focused`. If `query === 'BlueShare'`, set `query = ''`. (At rest an empty `query` already shows the name, so focusing shows an empty field.)
- `onBlur`: clear `focused`. If `query.trim() === ''`, set `query = ''`, which shows "BlueShare" again.
- `textAlign` is `'center'` at rest and `'left'` when focused. Border is `primaryDark` → `primaryBlue`, background `surfaceMuted` → `cardBg`. `placeholder="Buscar..."` with `placeholderTextColor=textMuted`, `returnKeyType="search"`, `onSubmitEditing` a no-op, `selectionColor=primaryBlue`, `accessibilityLabel="Search"`. Android: `paddingVertical: 0` so the 42-point height holds.

### D8. Dependency and file cleanup

Remove, after checking that nothing in `src/`, `app.json` or the config imports each one (`grep -rn "<pkg>" src app.json`) and that no kept package needs it as a required peer (`npm ls <pkg>`): `react-native-web`, `react-dom`, `expo-web-browser`, `expo-symbols`, `expo-glass-effect`, `@expo/ui`, `expo-device`. Use `npm uninstall`. The CLAUDE.md rule to use `npx expo install` is about adding packages.

Kept, even though nothing in `src/` imports them after the cleanup:
- `expo-system-ui` and `expo-status-bar` (required).
- `expo-constants`, `expo-linking` and `expo-font` (required peers of expo-router or expo).
- `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler` and `expo-image`. They are navigation and animation infrastructure that ships in Expo Go, and the Phase 1 feed (image posts, carousels) is expected to use them. Removing and re-adding them would only churn the lockfile.

### D9. Linting is mandatory

Every TS/TSX file this change creates or edits SHALL pass `npx expo lint --max-warnings 0` (zero errors and zero warnings), using the existing `eslint.config.js` with no rules loosened. Lint runs at the end of every task that writes code, not only at the end, so each problem is fixed in the group that caused it.

- No `eslint-disable` comments in new code. If one cannot be avoided, it covers a single line (`eslint-disable-next-line <rule>`) and gives its reason on the same line.
- This affects D7: the title field changes its state only in the `onFocus`/`onBlur` handlers and works out the displayed value during render. It uses no `useEffect`, so `react-hooks/set-state-in-effect` never applies.
- The final run uses `--no-cache`, because `expo lint` caches results in `.expo/cache/eslint/`.
- The existing disable comment in `src/hooks/use-color-scheme.web.ts` goes away with that file (task 1.2). That is expected.

Alternative: lint only once at the end (the earlier plan). Rejected, because problems would build up across groups and force rework late.

### D10. Unit tests with Jest and React Native Testing Library

**Setup:**
- Dev dependencies: `jest-expo`, `jest`, `@types/jest` and `@testing-library/react-native`. Install them with `npx expo install <pkgs> -- --dev` (or `--dev` if the CLI accepts it directly), so Expo picks the SDK 58 versions: Jest 30 and RNTL ≥ 14.
- `package.json`:
  - Jest config: `"preset": "jest-expo"`, plus a `moduleNameMapper` for the tsconfig aliases (`^@/assets/(.*)$` → `<rootDir>/assets/$1` first, then `^@/(.*)$` → `<rootDir>/src/$1`), unless the preset already resolves them. Add the npm `transformIgnorePatterns` variant from the Expo unit-testing guide only if a dependency fails to transform.
  - Scripts: `"test": "jest"` (one run, used by every task check) and `"test:watch": "jest --watchAll"`.
- `tsconfig.json`: `"types": ["jest"]`, as the Expo guide says.
- Location: `src/**/__tests__/<name>-test.ts(x)`. That is the file pattern `jest-expo` picks up. Tests sit inside `src/` so `expo lint` (D9) checks them too, but never inside `src/app/`, where every file is a route. If lint reports the Jest globals as undefined, add a test-file block with Jest globals to `eslint.config.js`. Declaring globals does not loosen any rule.
- Shared helpers in `src/test-utils/`:
  - safe-area insets from the library's Jest mock, with known values (for example top 24, bottom 20)
  - a way to force the color scheme by mocking `@/hooks/use-color-scheme` to return `'light'` or `'dark'`

**What is tested** (each row lands in the task group that builds the code):

| Test file | Checks (spec) |
| --- | --- |
| `src/constants/__tests__/theme-test.ts` | Both palettes have identical keys. Every D5 pair meets its WCAG ratio in light and dark: text ≥ 4.5, icons and boundaries ≥ 3 (app-theming: contrast). `NavigationThemes` uses `backgroundMain`, `cardBg`, `textMain` and `borderColor`. |
| `src/hooks/__tests__/use-theme-test.tsx` | `useTheme()` returns the light or dark palette for the forced scheme, and re-renders with the other palette when the scheme changes (app-theming: live switching). |
| `src/__tests__/navigation-test.tsx` | `renderRouter('./src/app')` opens on `/` with the Timeline placeholder. The `/circles` and `/events` deep links show their sections. `/explore` shows no starter content (app-shell: tabs; app-platform: no demo). |
| `src/components/__tests__/footer-tab-bar-test.tsx` | Through `renderRouter`: three tabs, in order. Timeline is selected at start. Pressing Events → `toHavePathname('/events')` and Events selected. Pressing it again keeps `/events`. Tabs are at least 44 tall. Active and inactive tabs use the right colors (app-shell: footer, active tab, switching). |
| `src/components/__tests__/title-search-field-test.tsx` | Rest value "BlueShare". Focus empties it. Blur when empty or only spaces restores it. Blur with "abuela" keeps it. Focus with other text keeps it. Submit does nothing. Alignment, border and background change between rest and focus (app-shell: title field). |
| `src/components/__tests__/app-header-test.tsx` | Buttons "Menu" (at least 44×44, pressing it neither navigates nor throws), "Profile" label with no press handler, header height = 70 + top inset, dark-scheme colors (app-shell: header, menu, avatar). |
| `src/components/__tests__/create-button-test.tsx` | Button "Create", 56×56, `right` 20, `bottom` = 75 + bottom inset + 10, pressing it does nothing (app-shell: create button). |

Tests check behavior and the spec numbers with RNTL queries (`getByRole`, `getByLabelText`, `toHaveStyle`), not snapshots. The `toHaveStyle` checks use values from `Colors` and `Layout`, so changing a palette value does not break a test.

**The bar:** `npm test` passes, with no `.only` or `.skip` left in the code. Test files also pass D9 lint.

Jest cannot see real rendering (shadows, safe areas on a real device, the keyboard, fonts, emoji). D11 covers those.

### D11. Screenshot review against the sketches

The sketches come from an HTML mock: a 380×780 frame with a phone border, browser fonts and browser emoji. A pixel diff against them would always fail, so the comparison is a structured review, not a pass/fail diff.

- **Device:** an Android phone with USB debugging and Expo Go, reached through `adb`. Run `adb shell wm size` and `adb shell wm density` to get the scale (px per point = density / 160). Use the same device for all screenshots.
- **Stable screenshots:** turn on Android system UI demo mode before capturing (`adb shell settings put global sysui_demo_allowed 1`, then `adb shell am broadcast -a com.android.systemui.demo -e command enter`, and fix the clock with `-e command clock -e hhmm 1200`). Turn it off afterwards with `-e command exit`. Close any Expo Go dev menu or toast first.
- **Capture:** `adb exec-out screencap -p > openspec/changes/basic-app-layout/screenshots/<name>.png`. Set the scheme with `adb shell cmd uimode night yes|no`. Screenshot set:
  - `timeline-light`, `circles-light`, `events-light`
  - `timeline-dark`, `circles-dark`, `events-dark`
  - `title-focused-light`, `title-focused-dark` (keyboard open, some text typed)
- **Review:** Claude reads each screenshot next to `sketches/mobile-portrait.png`, `header-mobile-portrait.png` and `footer-mobile-portrait.png`, and checks:
  - header order and alignment
  - header and footer heights in px against (70 or 75 + inset) × scale
  - border widths and colors
  - tab sizes and spacing
  - active tab color (intentionally `#006fe6` in light mode)
  - FAB size and position
  - background colors
- **Measurement:** check exact colors and sizes by sampling pixels with ImageMagick (`magick shot.png -format '%[pixel:p{X,Y}]' info:`) or Pillow, comparing against `Colors`. For dark mode there is no sketch: check that the structure matches the light screenshot and that the colors match the D5 dark palette.
- **Loop:** list the differences, fix them, retake the affected screenshots, and repeat until the only differences left are the intentional ones (cards not built yet, darker active tab, platform fonts and emoji). The user approves the final set, and the review notes go in the PR.
- **Afterwards:** the approved screenshots are the references a later Maestro `assertScreenshot` change will use.

## Risks / Trade-offs

- [`tabBar` is in the installed types but not on the v58 tabs docs page] → Check it in the first shell task (render the bar and switch tabs). If it does not work, switch to headless `expo-router/ui` (D1 fallback) without changing any spec.
- [Typed routes are stale after removing `/explore` and adding `/circles` and `/events`, so `tsc` reports `Href` errors] → Start the dev server once (`npx expo start`, which regenerates `.expo/types`) before `npx tsc --noEmit`.
- [The keyboard may push the footer and FAB up on Android while the title field is focused] → Acceptable for this skeleton. Note what happens during the device check. Hiding the bar while the keyboard is open is a follow-up.
- [`boxShadow` rendering differs slightly between Android and iOS] → Purely visual. Compare with the sketch on Android, which is the reference device.
- [Jest cannot see real rendering: shadows, device safe areas, keyboard, fonts] → The D11 screenshot review on a device covers these, and the device checks for keyboard and TalkBack stay in the tasks.
- [The test tooling needs exact versions on SDK 58 (Jest 30, RNTL ≥ 14), and `renderRouter` with the real `src/app` may need native-module mocks (splash screen, safe area)] → Install through `npx expo install` and let `expo-doctor` check the versions. Add mocks in `src/test-utils/` as they are needed, never by changing app code just for tests.
- [Screenshots vary with the device and its status bar] → Use one device for all screenshots, turn on demo mode, and compare with the sketches through a review instead of a pixel diff.
- [`adb` comes from a snap, so file access may be confined] → The PNG is written by shell redirection (`adb exec-out … > file`), not by adb itself.
- [The title field is 42 points tall, under the 44-point target] → Recorded as an exception in the `app-shell` spec. The field is wide, and the height comes from the design.
- [Deleting `ThemedText`/`ThemedView` means the next feature needs its own text styles] → The tokens are in `theme.ts`, so a text component can be added when cards need one.

## Migration Plan

All the work happens on the `01-layout` branch. There is no data or user migration. To roll back, revert the branch commits. Removed packages come back with `npx expo install <pkg>`. To drop the test setup, remove the four dev dependencies, the Jest config and scripts, and the `__tests__` folders.

## Open Questions

- The UI mixes languages: the placeholder is "Buscar..." (Spanish), while tab and accessibility labels are in English, as the brief says. Choosing one app language and setting up i18n can wait until there is real copy. It does not change this structure.
