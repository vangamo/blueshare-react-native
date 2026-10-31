# Tasks

Before writing Expo/Expo Router code, check the v58 docs (https://docs.expo.dev/versions/v58.0.0/) as CLAUDE.md asks. The facts already checked are listed in design.md (Context).

Linting is mandatory (design D9). A task that creates or changes TS/TSX code is done only when `npx expo lint --max-warnings 0` passes, with no new `eslint-disable` comments.

## 1. Remove the starter demo and web support

- [ ] 1.1 Delete `src/app/explore.tsx` and the demo components `src/components/animated-icon.tsx`, `animated-icon.web.tsx`, `animated-icon.module.css`, `hint-row.tsx`, `web-badge.tsx`, `external-link.tsx`, `app-tabs.tsx`, `app-tabs.web.tsx` and `ui/collapsible.tsx`. Verify with `ls src/components src/app`.
- [ ] 1.2 Delete the web-only files `src/global.css` and `src/hooks/use-color-scheme.web.ts`, and remove the `@/global.css` import and the `web` entry of `Fonts` from `src/constants/theme.ts` (task 3.1 rewrites the rest of the file). Verify that `find src -name "*.web.*" -o -name "*.css"` prints nothing.
- [ ] 1.3 Delete the demo images `assets/images/expo-badge.png`, `expo-badge-white.png`, `expo-logo.png`, `logo-glow.png`, `react-logo*.png`, `tutorial-web.png` and the `assets/images/tabIcons/` folder. Keep `icon.png`, `android-icon-*.png`, `splash-icon.png`, `favicon.png` (still used by `app.json` until 1.5) and `assets/expo.icon/`. Verify that every image path in `app.json` still exists.
- [ ] 1.4 Delete `scripts/reset-project.js` (and `scripts/` if empty) and remove the `reset-project` and `web` scripts from `package.json`, keeping the `lint` script. Verify with `npm run` that neither is listed and that `lint` still is.
- [ ] 1.5 Remove the `web` block from `app.json`, then delete `assets/images/favicon.png`, which is now unused. Verify `app.json` is valid JSON and still has `orientation: "portrait"`, `userInterfaceStyle: "automatic"`, the `expo-router` and `expo-splash-screen` plugins, and both experiments.
- [ ] 1.6 Update `README.md`: remove the "Get a fresh project" section (including `npm run reset-project`) and any web mentions. Make "Get started" say to run on Android or iOS through Expo Go, an emulator or a development build. Verify with `grep -niE "reset-project|web" README.md`, which must find nothing about running on web or resetting the project.
- [ ] 1.7 Temporarily reduce `src/app/index.tsx` and `src/app/_layout.tsx` to a minimal, compiling state (no imports of deleted files) so the next steps can be checked. Verify with `grep -rnE "animated-icon|hint-row|web-badge|external-link|app-tabs|collapsible|global.css|expo-logo|react-logo|tutorial-web|tabIcons" src`, which must print nothing, and that `npx expo lint --max-warnings 0` passes.

## 2. Remove unused packages

- [ ] 2.1 For each of `react-native-web`, `react-dom`, `expo-web-browser`, `expo-symbols`, `expo-glass-effect`, `@expo/ui` and `expo-device`, confirm that `grep -rn "<pkg>" src app.json` finds nothing and that `npm ls <pkg>` shows no kept package needing it as a required peer (design D8 lists the peer findings). Note any package that must stay, and why.
- [ ] 2.2 Uninstall the confirmed packages with `npm uninstall <pkgs…>`. Keep `expo-system-ui`, `expo-status-bar`, `expo-constants`, `expo-linking`, `expo-font`, `expo-image`, `react-native-reanimated`, `react-native-worklets` and `react-native-gesture-handler` (design D8). Verify that `package.json` no longer lists them and that `npm ls` reports no missing or invalid peers.
- [ ] 2.3 Run `npx expo-doctor` and `npx expo install --check`, and fix any issue they report about the removals. Verify that both pass.

## 3. Theme module

- [ ] 3.1 Rewrite `src/constants/theme.ts` as in design D4/D5: `Colors.light`/`Colors.dark` with the exact keys and values from the D5 table, `ThemeColor`, `Spacing`, `Radius`, `FontSize`, `FontWeight`, `Layout`, and `NavigationThemes` built from `DefaultTheme`/`DarkTheme` imported from `expo-router`. No `Fonts`, `BottomTabInset`, `MaxContentWidth`, `Platform` or `global.css` import. Verify with `npx expo lint --max-warnings 0` and `npx tsc --noEmit` (ignore typed-route `Href` errors until 4.6) and confirm that both palettes have identical keys (TypeScript `satisfies Record<keyof typeof light, string>` on `dark`).
- [ ] 3.2 Keep `src/hooks/use-color-scheme.ts` and `src/hooks/use-theme.ts`, adjusted to the new `Colors` (`useTheme()` returns `Colors[scheme === 'dark' ? 'dark' : 'light']`). Verify that `use-theme.ts` typechecks and that `npx expo lint --max-warnings 0` passes.
- [ ] 3.3 Delete `src/components/themed-text.tsx` and `themed-view.tsx` (design D3). Verify that `grep -rn "themed-" src` prints nothing and that `npx expo lint --max-warnings 0` passes.
- [ ] 3.4 Re-check every contrast ratio listed in design D5 against the final `theme.ts` values (for example with a small node script that applies the WCAG formula) and confirm each text pair is ≥ 4.5:1 and each icon or boundary pair is ≥ 3:1, as the `app-theming` spec requires. Record the results in the PR description.

## 4. Root layout, routes and placeholder screens

- [ ] 4.1 Create `src/components/placeholder-screen.tsx`: a `ScrollView` filling its parent, with background `backgroundMain`, content padding `Spacing.lg` and a `textMain` text naming the section (for example "Timeline"). Colors come only from `useTheme()`. Verify it typechecks and that `npx expo lint --max-warnings 0` passes.
- [ ] 4.2 Write `src/app/index.tsx` (Timeline), `src/app/circles.tsx` and `src/app/events.tsx`, each rendering `PlaceholderScreen` with its section name. Verify that the three files exist and that `explore.tsx` does not.
- [ ] 4.3 Rewrite `src/app/_layout.tsx` (design D2/D6): module-level `SplashScreen.preventAutoHideAsync()`; `ThemeProvider` with `NavigationThemes[scheme]`; root `View` (`flex: 1`, `backgroundMain`, `onLayout` → `SplashScreen.hideAsync()`); `<StatusBar style="auto" />`; `Tabs` from `expo-router/js-tabs` with `screenOptions={{ headerShown: false }}` and `Tabs.Screen` for `index` (title "Timeline"), `circles` ("Circles") and `events` ("Events"). Use the default tab bar for now. Verify in Expo Go that the app starts on Timeline, the splash hides, and all three screens are reachable.
- [ ] 4.4 Confirm in Expo Go that the old `/explore` deep link (`npx uri-scheme open blueshare://explore --android`, or `adb shell am start -a android.intent.action.VIEW -d "blueshare://explore"`) does not show starter content.
- [ ] 4.5 Switch the device between light and dark mode with the app open and confirm that the placeholder background, scene background and status bar icons switch with no restart and no white flash between tabs.
- [ ] 4.6 Start the dev server once so typed routes regenerate, then verify that `npx tsc --noEmit` and `npx expo lint --max-warnings 0` pass.

## 5. Footer tab bar

- [ ] 5.1 Create `src/components/footer-tab-bar.tsx`, which takes `BottomTabBarProps` from `expo-router/js-tabs` (design D1/D3): height `Layout.footerHeight + insets.bottom`, `paddingBottom: insets.bottom`, horizontal padding 10, `cardBg` background and a 2-point `borderColor` top border; three equal `Pressable` tabs (flex 1, height 44, horizontal margin 4, radius 10, 2-point border, 14-point bold label from `options.title`); inactive style `surfaceMuted`/`borderDark`/`textSecondary`; active style `primaryBlueHover`/`primaryBlueDeep`/`onPrimary` with `boxShadow` using `primaryShadow`; `tabPress` event then `navigation.navigate` when not focused; `accessibilityRole` "tablist"/"tab" and `accessibilityState.selected`; press feedback. Verify it typechecks and that `npx expo lint --max-warnings 0` passes.
- [ ] 5.2 Pass it as `tabBar={(props) => <FooterTabBar {...props} />}` in `_layout.tsx`. Verify in Expo Go that the custom bar replaces the default one, tapping each tab switches the section and moves the active style, tapping the active tab does nothing harmful, and Android back from Circles returns to Timeline. If `tabBar` does not work, switch to the headless `expo-router/ui` fallback (design D1) and note it in the PR.
- [ ] 5.3 On a device or emulator with a gesture bar, verify that the tabs sit above the gesture area, and with a screen reader (TalkBack) that each tab is announced as a tab with its selected state.

## 6. Header

- [ ] 6.1 Create `src/components/title-search-field.tsx` with the state logic and styles from design D7 (42 tall, 2-point border, radius 12, 16-point bold, `textMain` text, `placeholder="Buscar..."`, `accessibilityLabel="Search"`, no-op submit). Verify it typechecks and that `npx expo lint --max-warnings 0` passes.
- [ ] 6.2 Create `src/components/app-header.tsx`: height `Layout.headerHeight + insets.top`, `paddingTop: insets.top`, horizontal padding 16, `cardBg` background, 2-point `borderColor` bottom border, one row with: menu `Pressable` (at least 44×44, `≡` in `primaryBlue`, `creationBg` background, 2-point `primaryBlue` border, radius 10, `accessibilityLabel="Menu"`, no-op press); `TitleSearchField` (flex 1, horizontal margin 12); avatar `View` (42×42, round, 2-point `primaryDark` border, `avatarBg`, `👵` at size 20, `accessible` with `accessibilityLabel="Profile"`). Verify it typechecks and that `npx expo lint --max-warnings 0` passes.
- [ ] 6.3 Render `AppHeader` above `Tabs` in the root `View` of `_layout.tsx`. Verify in Expo Go that the header stays fixed and no content scrolls under it (temporarily make a placeholder taller than the screen, or add enough text to scroll, then revert), and that nothing is covered by the status bar or notch.
- [ ] 6.4 Verify the title field scenarios from the `app-shell` spec on device: rest state "BlueShare" centered; tap → empty, placeholder "Buscar...", blue border, card background, left-aligned typing; blur when empty or only spaces → "BlueShare" again; blur with "abuela" → text kept; submit → nothing happens. Also check that pressing the menu button and tapping the avatar do nothing and raise no errors.

## 7. Floating create button

- [ ] 7.1 Create `src/components/create-button.tsx`: absolute `Pressable`, 56×56, round, `primaryBlue` background, 3-point `cardBg` border, `boxShadow` using `primaryShadow`, centered `+` in `onPrimary` at 28-point bold (Android: `includeFontPadding: false` so it centers), `right: Layout.fabOffsetRight`, `bottom: Layout.footerHeight + insets.bottom + Layout.fabOffsetBottom`, `accessibilityRole="button"`, `accessibilityLabel="Create"`, no-op press with feedback. Verify it typechecks and that `npx expo lint --max-warnings 0` passes.
- [ ] 7.2 Render it as the last child of the root `View` in `_layout.tsx`. Verify on device that it floats 10 points above the footer and 20 from the right edge on all three tabs, stays above scrolling content, does not re-mount when switching tabs, and is announced as "Create".

## 8. Final checks

- [ ] 8.1 Run `npx expo lint --no-cache --max-warnings 0` over the whole project and fix every reported problem without loosening `eslint.config.js`. Verify that it exits with code 0 (no errors, no warnings).
- [ ] 8.2 Verify that `npx tsc --noEmit` and `npx expo-doctor` both pass.
- [ ] 8.3 Search for leftovers: `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx` must find no colors in components (only `src/constants/theme.ts` may have them), the grep from 1.7 plus `grep -rnE "BottomTabInset|MaxContentWidth|Fonts\b" src` must find nothing, and `grep -rnE "react-native-web|react-dom|expo-web-browser|expo-symbols|expo-glass-effect|@expo/ui|expo-device" src app.json package.json` must find nothing. `grep -rn "eslint-disable" src` must find no comment without a reason.
- [ ] 8.4 Device checklist on Android (Expo Go): compare the screen with `sketches/mobile-portrait.png` without the cards (header, footer, FAB placement, sizes, colors; the active tab is a deliberately darker blue); switch light and dark mode with the app open on each tab, and confirm the whole shell re-themes with no restart and the current tab and title text are kept; check that rotating the device keeps portrait. Repeat a quick smoke test on iOS if a device or simulator is available. Record the results in the PR description.

## Workflow follow-up

- Archive the change with `/opsx:archive` after review, so the `app-shell`, `app-theming` and `app-platform` specs land in `openspec/specs/`.
- Decide what to do with the root `proposal.md` brief (delete it, or keep it as reference) once the change is archived.
