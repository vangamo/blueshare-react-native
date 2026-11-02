# Tasks

Before writing Expo or React Native code, check the v58 docs (https://docs.expo.dev/versions/v58.0.0/) as CLAUDE.md asks. The facts already checked are listed in design.md (Context).

Every code task is done only when the definition of done holds: `npx expo lint --max-warnings 0` passes with no new `eslint-disable`, `npx tsc --noEmit` passes, and `npm test` passes with no `.only` or `.skip`. Each group writes the tests for its own code. Tests assert against `LayoutSizes`, `Layout`, `Colors` and `TEST_INSETS`, never literals.

The phone portrait layout must not change. The existing unit tests and the 26 approved portrait screenshots are the guard.

## 1. Platform config, rotation check and tablet device

- [ ] 1.1 In `app.json`, set `"orientation": "default"` and add `"supportsTablet": true` to the `ios` block (design D6). Verify that `app.json` is valid JSON, still has no `web` block, still lists the `expo-sqlite` plugin, and that `npx expo-doctor` passes.
- [ ] 1.2 Start the app in Expo Go on the Medium Phone emulator (skill `run-on-emulator`), then rotate it with `adb shell settings put system accelerometer_rotation 0` and `adb shell settings put system user_rotation 1`, then `0`. Verify that the app turns to landscape and back (the current portrait UI stretched sideways is expected at this point). If it stays in portrait, stop: update proposal.md and design.md for the D6 fallback (`expo-screen-orientation`) and ask the user before continuing.
- [ ] 1.3 Create an AVD with Android Studio's Medium Tablet profile (2560×1600 px, density 320), Android API 37, and install Expo Go in it (design D10). Verify with `adb shell wm size` and `adb shell wm density`, and check that the app loads in it. Record the tablet profile and the adb rotation commands in `.claude/skills/run-on-emulator/SKILL.md`, `.claude/skills/visual-review/SKILL.md` and `docs/development/device-testing.md`, and add an entry to `docs/log.md`.

## 2. Layout selection and per-layout sizes

- [ ] 2.1 In `src/constants/theme.ts`, add the `ScreenLayout` type (`'phonePortrait' | 'phoneLandscape' | 'tablet'`) and `LayoutSizes` with the values from the design D2 table, using `Spacing`, `FontSize` and `Radius` tokens where one matches.
  - Keep the shared values in `Layout`, including the item values that don't change. Move the layout-specific keys (shell sizes and `cardTextLineHeight`) out of it.
  - Update every component and test that read a moved key so it reads `LayoutSizes.phonePortrait` for now, and the app renders exactly as before.
  - In `src/__tests__/unit/constants/theme-test.ts`, assert that `LayoutSizes.phonePortrait` holds today's values: header 70, footer 75, field 42, avatar 42, create button 56 at 20/10, content padding 16, card 16/16/16 with 15-pt text on a 22.5 line, box 16/16 and dialog radius 16. Also assert that every layout's control sizes are at least `Layout.touchTarget`.

  Verify with lint, typecheck and `npm test`.
- [ ] 2.2 Add `src/hooks/use-window-size.ts`, a thin wrapper around `useWindowDimensions` that returns `{ width, height }`. In `src/test-utils/test-values.ts`, add `PHONE_PORTRAIT_WINDOW`, `PHONE_LANDSCAPE_WINDOW`, `TABLET_PORTRAIT_WINDOW`, `TABLET_LANDSCAPE_WINDOW`, `setMockWindow()` and `getMockWindow()`. Mock the hook in `src/test-utils/jest-setup.ts`, and reset it to the phone portrait window in the existing `afterEach`, next to the scheme reset and `jest.restoreAllMocks()` (design D7). Verify that `npm test` still passes with no changes to existing assertions.
- [ ] 2.3 Add `src/hooks/use-screen-layout.ts` with the pure `screenLayoutFor(width, height)` and the `useScreenLayout()` hook returning `{ layout, sizes, window }` (design D1). Write `src/__tests__/unit/hooks/use-screen-layout-test.tsx` covering:
  - the five spec windows: phone upright, phone sideways, tablet portrait, tablet landscape, and 400×1280 split screen
  - the boundaries: shorter side 599 vs 600, height 499 vs 500
  - the hook switching layout when `setMockWindow` changes and the component re-renders

  Verify with lint, typecheck and `npm test`.

## 3. Content column and overlays

- [ ] 3.1 Add `src/hooks/use-content-column.ts` (design D4), which returns the `contentContainerStyle` padding: vertical `sizes.contentPadding`, and on each side the larger of (padding + that side's inset) and half of (window width − `sizes.contentMaxWidth`). Write `src/__tests__/unit/hooks/use-content-column-test.tsx` for each layout's window, with and without side insets. Verify with lint, typecheck and `npm test`.
- [ ] 3.2 Apply `useContentColumn()` to `PlaceholderScreen` (a `ScrollView`) and `TimelineFeed` (a `FlatList`, keeping its stable `ListHeaderComponent`, empty message, scroll-to-top and back-button logic). Add `src/__tests__/unit/components/placeholder-screen-test.tsx`, and extend `timeline-feed-test.tsx`: in each layout, the content padding matches the column, so the creation box, the cards and the messages are capped and centered (specs "Content column", "Items newest first" and "Main sections as tabs"). Verify with lint, typecheck and `npm test`.
- [ ] 3.3 In `EditTextDialog`, cap the box to `sizes.contentMaxWidth` and center it, add the side insets to its scroll padding, and use `sizes.dialogRadius`. In `TypeSelect`, cap the list sheet to `sizes.contentMaxWidth` and center it (design D4). Extend `edit-text-dialog-test.tsx` and `type-select-test.tsx` with checks for the max width and centering in each layout, and the dialog radius and side insets (spec "Edit dialog appearance"). Verify with lint, typecheck and `npm test`.

## 4. Tablet sizes for cards and the creation box

- [ ] 4.1 Make `TextItemCard` read `cardRadius`, `cardPadding`, `cardGap`, `cardTextSize` and `cardTextLineHeight` from `useScreenLayout()`. Make `CreationBox` read `boxRadius` and `boxGap` (specs "Text card appearance" and "Creation box appearance"). Extend `text-item-card-test.tsx` and `creation-box-test.tsx`: the phone values in phone portrait and phone landscape, and the tablet values (18 radius, 20 padding and gap, 16-pt text on a 24-pt line, box 18/20) in tablet portrait and landscape. Verify with lint, typecheck and `npm test`.

## 5. Header

- [ ] 5.1 Make `AppHeader` read `useScreenLayout()`: height `sizes.headerHeight + insets.top`, horizontal padding plus `insets.left` and `insets.right`, the menu glyph size, and the avatar and emoji sizes. In phone landscape and tablet, wrap the title field so it is capped at `sizes.titleMaxWidth` and centered between the menu button and the avatar. In phone portrait it still fills the space (specs "Header layout" and "Header in the phone landscape and tablet layouts"). Extend `app-header-test.tsx` with each layout and the side insets. Verify with lint, typecheck and `npm test`.
- [ ] 5.2 Make `TitleSearchField` take its height and font size from `sizes` (spec "Title field shows the app name at rest"), keeping the focus, blur and keyboard-hide behavior. Extend `title-search-field-test.tsx` with the tablet size (46 points, 17-point text). Verify with lint, typecheck and `npm test`.

## 6. Section tab bar

- [ ] 6.1 Rename `src/components/footer-tab-bar.tsx` to `section-tab-bar.tsx` and `FooterTabBar` to `SectionTabBar`, and rename the test file to match, using `git mv` (design D3). Verify that `grep -rn "FooterTabBar\|footer-tab-bar" src` finds nothing and that `npm test` passes.
- [ ] 6.2 Make `SectionTabBar` draw itself from `useScreenLayout()`:
  - phone portrait exactly as today
  - tablet: a footer with 150×48 tabs, centered with 16 between them, 12 radius and 15-point labels (spec "Tablet footer")
  - phone landscape: a 56-point row with a bottom border and no bottom inset, with tabs as wide as their label plus 16 on each side, 44 tall, centered with 12 between them (spec "Tab row under the header on short windows")
  - side insets in every layout

  Extend the test file with each layout's sizes, borders and insets, the roles and selected state in each layout, and touch targets of at least 44×44 for the landscape tabs. Verify with lint, typecheck and `npm test`.
- [ ] 6.3 In `src/app/_layout.tsx`, call `useScreenLayout()` and pass `tabBarPosition: sizes.tabPosition` in `screenOptions`, keeping the `ItemsProvider` and `CreationBoxProvider` wrappers (design D3). Add to `src/__tests__/e2e/navigation-test.tsx`:
  - in phone landscape, the tab list renders before the section content (tree order) and there is no footer at the bottom
  - in tablet landscape, the tab list is the footer, after the content
  - tab switching works from the row under the header

  Verify with lint, typecheck and `npm test`.

## 7. Create button

- [ ] 7.1 Make `CreateButton` read `useScreenLayout()` for its size and `+` font size, with `right` = offset + `insets.right`. For `bottom`, phone landscape uses 15 + `insets.bottom`, and the other layouts use the bar height + `insets.bottom` + offset. Keep the `useCreateAction()` visibility and actions unchanged (specs "Floating create button" and "Create button in the phone landscape and tablet layouts", design D5). Extend `create-button-test.tsx` with each layout's size and position, the right inset, and the button hidden while the creation box is open in phone landscape and tablet. Verify with lint, typecheck and `npm test`.

## 8. Layout switching and integration checks

- [ ] 8.1 Add e2e tests for "Layout changes keep the app state" (design D7). Each switches the mock window to phone landscape, re-renders, checks, then switches back to portrait and checks again:
  - on Circles with "abuela" typed in the title field: the section, the selected tab in the row under the header, and the field text
  - on Timeline with the creation box in its text step holding "Mañana hay bingo": the box, the text, and the create button still hidden
  - with the edit dialog open on an unsaved edit: the dialog, its step, the edited text, and the card keeping its stored text

  Verify that `npm test` passes.
- [ ] 8.2 Run the full definition of done and verify that each check passes:
  - `npx expo lint --no-cache --max-warnings 0`
  - `npx tsc --noEmit`
  - `npm test`
  - `npx expo-doctor`
  - `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx` finds no colors
  - `grep -rnE "\.(only|skip)\(" src` finds nothing
  - no new `eslint-disable`
- [ ] 8.3 Device behavior checklist in Expo Go.

  Phone:
  - rotate on each tab in both directions: the title text is kept and nothing reloads
  - content scrolls only below the tab row
  - neither the side cutout nor the nav buttons cover a control, in either landscape direction
  - font scale 1.3 (`adb shell settings put system font_scale 1.3`) keeps the tab row usable
  - in landscape, the creation box text step with the keyboard open still lets you reach "Crear"
  - in landscape, the edit dialog with the keyboard open lets you scroll to Guardar (spec "Keyboard open in phone landscape"; if it doesn't, update the design per its Risks entry before fixing)
  - rotating with a creation box draft, and with the edit dialog open, keeps both

  Tablet:
  - portrait and landscape both show the tablet layout with a bottom footer, tablet-sized cards, and a capped, centered dialog and type list
  - split screen at a narrow width shows the phone portrait layout

  Do a quick iOS smoke test if a device or simulator is available. Record the results in the PR description, and note each accepted gap for `docs/product/known-limitations.md`.
- [ ] 8.4 Run the `visual-review` skill.
  - First check that all 26 existing phone portrait references still match (no visual change in portrait).
  - Then capture the new set from design D10: `timeline-cards`, `box-write` and `edit-open` in phone landscape, tablet portrait and tablet landscape, plus `title-focused-landscape`, all in light and dark.
  - Compare them with `sketches/mobile-landscape.png` and `sketches/tablet-portrait.png`. The intentional differences are listed in design D8 and D9.
  - Fix the differences. Save the references in `src/__tests__/e2e/screenshots/` only after the user approves them.

## Workflow follow-up

- `openspec/changes/basic-app-layout/` is still in the repo, identical to the archived `openspec/changes/archive/2026-11-01-basic-app-layout/`. Remove it in its own commit, outside this change. Archiving it again would add "Android and iOS in portrait only" back to `openspec/specs/app-platform/spec.md`.
- Run `/opsx:archive adaptive-shell-layout`. Its archive guidance updates the context, which for this change means:
  - mark `docs/decisions/mobile-only.md` as superseded for orientation and tablets
  - add decision pages for D1 (layout from the window size), D3 (one tab bar moved with `tabBarPosition`), D4 (content column as scroll padding), D8 (accessibility over the landscape mock) and D9 (tablet landscape reuses the tablet layout)
  - update `docs/architecture/shell-layout.md`
  - rename `docs/components/footer-tab-bar.md` to `section-tab-bar.md`
  - update the `timeline-feed`, `text-item-card`, `creation-box`, `edit-text-dialog`, `type-select`, `create-button`, `app-header` and `placeholder-screen` component pages
  - update `docs/design-system/layout-sizes.md` and `theme-module.md` (per-layout sizes passed inline)
  - update `docs/development/testing.md` (`setMockWindow`) and `docs/product/design-sources.md` (the landscape and tablet mocks are now in scope)
  - update the known limitations and the `docs/specs/` pages for `app-shell`, `app-platform`, `timeline-feed`, `item-creation` and `item-editing`
  - update CLAUDE.md (the "portrait only" line and "Current state"), `src/components/CLAUDE.md`, and the `add-main-section` skill (new sections use `useContentColumn()`)
