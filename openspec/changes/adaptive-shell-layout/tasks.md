# Tasks

Before writing Expo or React Native code, check the v58 docs (https://docs.expo.dev/versions/v58.0.0/) as CLAUDE.md asks. The facts already checked are listed in design.md (Context).

Every code task is done only when the definition of done holds: `npx expo lint --max-warnings 0` passes with no new `eslint-disable`, `npx tsc --noEmit` passes, and `npm test` passes with no `.only` or `.skip`. Each group writes the tests for its own code. Tests assert against `ShellSizes`, `Layout`, `Colors` and `TEST_INSETS`, never literals.

The phone portrait layout must not change. The existing unit tests and the approved portrait screenshots are the guard.

## 1. Platform config, rotation check and tablet device

- [ ] 1.1 In `app.json`, set `"orientation": "default"` and add `"supportsTablet": true` to the `ios` block (design D6). Verify that `app.json` is valid JSON, still has no `web` block, and that `npx expo-doctor` passes.
- [ ] 1.2 Start the app in Expo Go on the Medium Phone emulator (skill `run-on-emulator`) and rotate it with `adb shell settings put system accelerometer_rotation 0` and `adb shell settings put system user_rotation 1`, then `0`. Verify that the app turns to landscape and back (the old portrait shell stretched sideways is expected at this point). If it stays in portrait, stop: update proposal.md and design.md for the D6 fallback (`expo-screen-orientation`) and ask the user before continuing.
- [ ] 1.3 Create an AVD with Android Studio's Medium Tablet profile (2560×1600 px, density 320), Android API 37, and install Expo Go in it (design D10). Verify with `adb shell wm size` and `adb shell wm density`, and that the app loads in it. Record the tablet profile and the adb rotation commands in `.claude/skills/run-on-emulator/SKILL.md`, `.claude/skills/visual-review/SKILL.md` and `docs/development/device-testing.md`, and add a `docs/log.md` entry.

## 2. Layout selection and per-layout sizes

- [ ] 2.1 In `src/constants/theme.ts`, add the `ShellLayout` type (`'phonePortrait' | 'phoneLandscape' | 'tablet'`) and `ShellSizes`, with the values from the design D2 table, using `Spacing`, `FontSize` and `Radius` tokens where one matches. Keep the shared values in `Layout`, and move the layout-specific keys out of it. Update every component and test that read a moved key to read `ShellSizes.phonePortrait` for now, so the app renders exactly as before. In `src/__tests__/unit/constants/theme-test.ts`, assert that `ShellSizes.phonePortrait` holds today's values (header 70, footer 75, field 42, avatar 42, create button 56 at 20/10, content padding 16), and that every layout's controls are at least `Layout.touchTarget`. Verify with lint, typecheck and `npm test`.
- [ ] 2.2 Add `src/hooks/use-window-size.ts` (a thin wrapper around `useWindowDimensions` that returns `{ width, height }`). In `src/test-utils/test-values.ts`, add `PHONE_PORTRAIT_WINDOW`, `PHONE_LANDSCAPE_WINDOW`, `TABLET_PORTRAIT_WINDOW`, `TABLET_LANDSCAPE_WINDOW`, `setMockWindow()` and `getMockWindow()`. Mock the hook in `src/test-utils/jest-setup.ts` and reset it to the phone portrait window in `afterEach` (design D7). Verify that `npm test` still passes with no changes to existing assertions.
- [ ] 2.3 Add `src/hooks/use-shell-layout.ts` with the pure `shellLayoutFor(width, height)` and the `useShellLayout()` hook returning `{ layout, sizes }` (design D1). Write `src/__tests__/unit/hooks/use-shell-layout-test.tsx`: the five spec windows (phone upright, phone sideways, tablet portrait, tablet landscape, 400×1280 split screen), the boundaries (shorter side 599 vs 600, height 499 vs 500), and the hook switching layout when `setMockWindow` changes and the component re-renders. Verify with lint, typecheck and `npm test`.

## 3. Content column

- [ ] 3.1 Add `src/components/section-scroll-view.tsx` (design D4): a full-width `ScrollView` with background `backgroundMain`, content padding `sizes.contentPadding` plus the left and right insets, and children in a centered column capped at `sizes.contentMaxWidth`. Make `PlaceholderScreen` render through it. Write `src/__tests__/unit/components/section-scroll-view-test.tsx` covering the max width, centering and padding in each layout, and the side insets added to the padding (spec "Content column"). Verify with lint, typecheck and `npm test`.

## 4. Header

- [ ] 4.1 Make `AppHeader` read `useShellLayout()`: height `sizes.headerHeight + insets.top`, horizontal padding plus `insets.left` and `insets.right`, menu glyph size, and avatar and emoji sizes. In phone landscape and tablet, wrap the title field so it is capped at `sizes.titleMaxWidth` and centered between the menu button and the avatar. In phone portrait it still fills the space (specs "Header layout" and "Header in the phone landscape and tablet layouts"). Extend `src/__tests__/unit/components/app-header-test.tsx` with checks for each layout and for the side insets. Verify with lint, typecheck and `npm test`.
- [ ] 4.2 Make `TitleSearchField` take its height and font size from `sizes` (spec "Title field shows the app name at rest"), keeping the focus and blur behavior. Extend `src/__tests__/unit/components/title-search-field-test.tsx` with the tablet size (46 points, 17-point text). Verify with lint, typecheck and `npm test`.

## 5. Section tab bar

- [ ] 5.1 Rename `src/components/footer-tab-bar.tsx` to `section-tab-bar.tsx` and `FooterTabBar` to `SectionTabBar`, and rename its test file to match, with `git mv` (design D3). Verify that `grep -rn "FooterTabBar\|footer-tab-bar" src` finds nothing and that `npm test` passes.
- [ ] 5.2 Make `SectionTabBar` draw itself from `useShellLayout()`: phone portrait exactly as today; tablet footer with 150×48 tabs centered with 16 between them, 12 radius and 15-point labels (spec "Tablet footer"); phone landscape 56-point row with a bottom border, no bottom inset, and tabs sized to their label plus 16 on each side, 44 tall, centered with 12 between them (spec "Tab row under the header on short windows"). The side insets apply in every layout. Extend the test file with sizes, borders and insets for each layout, roles and selected state in each layout, and touch targets of at least 44×44 for the landscape tabs. Verify with lint, typecheck and `npm test`.
- [ ] 5.3 In `src/app/_layout.tsx`, call `useShellLayout()` and pass `tabBarPosition: sizes.tabPosition` in `screenOptions` (design D3). Add to `src/__tests__/e2e/navigation-test.tsx`: in phone landscape, the tab list is rendered before the section content (tree order) and there is no footer at the bottom; in tablet landscape, the tab list is the footer (after the content); tab switching works from the row under the header. Verify with lint, typecheck and `npm test`.

## 6. Create button

- [ ] 6.1 Make `CreateButton` read `useShellLayout()`: size and `+` font size from `sizes`, and `right` = offset + `insets.right`. For `bottom`: phone landscape uses 15 + `insets.bottom`, and the other layouts use the bar height + `insets.bottom` + offset (specs "Floating create button" and "Create button in the phone landscape and tablet layouts", design D5). Extend `src/__tests__/unit/components/create-button-test.tsx` with checks for each layout and the right inset. Verify with lint, typecheck and `npm test`.

## 7. Layout switching and integration checks

- [ ] 7.1 Add an e2e test to `src/__tests__/e2e/navigation-test.tsx` for "Layout changes keep the app state": open Circles, type "abuela" in the title field, switch the mock window to phone landscape and re-render. Then check that Circles is shown, its tab is selected in the row under the header, and the field still holds "abuela". Switch back to portrait and check the same. Verify that `npm test` passes.
- [ ] 7.2 Run the full definition of done: `npx expo lint --no-cache --max-warnings 0`, `npx tsc --noEmit`, `npm test`, `npx expo-doctor`, the color grep (`grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx` finds nothing), `grep -rnE "\.(only|skip)\(" src` finds nothing, and no new `eslint-disable`. Verify that each passes.
- [ ] 7.3 Device behavior checklist in Expo Go. Phone: rotate on each tab in both directions, with the title text kept and nothing reloading; content scrolls only below the tab row; the side cutout and nav buttons don't cover any control (in both landscape directions); font scale 1.3 (`adb shell settings put system font_scale 1.3`) keeps the tab row usable; the keyboard behavior with the title field focused in landscape. Tablet: portrait and landscape both show the tablet layout with a bottom footer; split screen at a narrow width shows the phone portrait layout. Do a quick iOS smoke test if a device or simulator is available. Record the results in the PR description, and note every accepted gap for `docs/product/known-limitations.md`.
- [ ] 7.4 Run the `visual-review` skill. First check that the existing phone portrait references still match (no visual change in portrait). Then capture the new set from design D10 (phone landscape, tablet portrait and tablet landscape, light and dark, plus the focused title field in landscape). Compare it with `sketches/mobile-landscape.png` and `sketches/tablet-portrait.png`; the intentional differences are listed in design D8 and D9. Fix the differences, and save the references in `src/__tests__/e2e/screenshots/` only after the user approves them.

## Workflow follow-up

- Archive `basic-app-layout` **before** this change. Its delta still ADDs "Android and iOS in portrait only", and archiving it after this change would bring that requirement back into `openspec/specs/app-platform/spec.md`.
- Then run `/opsx:archive adaptive-shell-layout`. Its archive guidance updates the context, which for this change means:
  - mark `docs/decisions/mobile-only.md` as superseded for orientation and tablets
  - add decision pages for D1 (layout from window size), D3 (one tab bar moved with `tabBarPosition`), D8 (accessibility over the landscape mock) and D9 (tablet landscape reuses the tablet layout)
  - update `docs/architecture/shell-layout.md`
  - rename the component page to `section-tab-bar.md` and add `section-scroll-view.md`
  - update `docs/design-system/layout-sizes.md` and `theme-module.md` (per-layout sizes passed inline)
  - update `docs/development/testing.md` (`setMockWindow`), `docs/product/design-sources.md` (the landscape and tablet mocks are now in scope) and the known limitations
  - update CLAUDE.md (the "portrait only" line and "Current state"), `src/components/CLAUDE.md`, and the `add-main-section` skill (new sections render through `SectionScrollView`)
