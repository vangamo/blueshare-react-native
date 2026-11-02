# Tasks

Before writing code that touches an Expo or React Native API, check the v58 docs (https://docs.expo.dev/versions/v58.0.0/), as CLAUDE.md asks. The facts already checked, including the device spike, are in design.md (Context).

Each task that creates or changes TS/TSX code is done only when these pass:
- `npx expo lint --max-warnings 0`
- `npx tsc --noEmit`
- `npm test`

No new `eslint-disable`, `.only` or `.skip`. Tests go in `src/__tests__/unit/<area>/` or `src/__tests__/e2e/`, and shared helpers in `src/test-utils/`. Assert with `Sizes`, `Frames`, `Layout`, `TEST_INSETS` and `TEST_WINDOWS`, never literals.

**Phone portrait must not change.** Every existing test must keep passing without edits to its assertions. The only allowed exceptions are imports and renames: `Layout.x` moving to `Sizes.phone.x` or `Frames['phone-portrait'].x`, and `FooterTabBar` becoming `TabBar`.

Start a dated entry for this change in `docs/log.md` with the first task, and add a line to it in each group.

## 1. Layout model and test window

- [x] 1.1 In `src/constants/theme.ts`, add the `LayoutKind`, `SizeSet` and `Frame` types, the `Sizes` and `Frames` tables, and `layoutFor(width, height)` (design D1, D2). Move the varying values out of `Layout`, keeping the fixed ones, and rename `footerPaddingHorizontal` to `tabBarPaddingHorizontal`. Add `Layout.keyboardHideGraceMs` (400). Update every import of a moved key so the app still renders the same. Verify that `npx tsc --noEmit` and `npm test` pass with no changed assertion values.
- [x] 1.2 Extend `src/__tests__/unit/constants/theme-test.ts`:
  - `layoutFor` returns each of the four layouts for the four measured windows (411×866, 914×363, 800×1224, 1280×744)
  - a short side of 599 gives a phone layout and 600 a tablet one
  - a square window is portrait, and 500×744 is phone portrait
  - `Sizes.phone` holds today's phone values (42, 56, 15, 22.5, 70, 75…). This guards phone portrait against regressions.
  - every `Sizes.tablet` value is at least its phone value, and every control height is at least `Layout.touchTarget`

  Verify that `npm test` passes.
- [x] 1.3 Create `src/hooks/use-window-size.ts` (wraps `useWindowDimensions`) and `src/hooks/use-shell-layout.ts` (returns `{ kind, device, landscape, frame, sizes, columnWidth }`, with `columnWidth` from design D6, using the safe-area insets). In `src/test-utils/`:
  - mock `@/hooks/use-window-size` in `jest-setup.ts` with a `useSyncExternalStore` store
  - add `TEST_WINDOWS` and `setMockWindow()` to `test-values.ts`
  - reset the window to `TEST_WINDOWS.phonePortrait` in `afterEach`

  Add `src/__tests__/unit/hooks/use-shell-layout-test.tsx`: each test window gives the right layout, sizes and column width (including the cap at the frame's column and the side insets), and `act(() => setMockWindow(...))` re-renders a consumer. Verify that `npm test` passes and that no existing test changed.
- [x] 1.4 Update `docs/design-system/layout-sizes.md` (the `Sizes` and `Frames` tables, what stays in `Layout`, and where tablet values come from), `docs/design-system/theme-module.md` (the new exports and hooks) and `docs/development/testing.md` (`TEST_WINDOWS`, `setMockWindow`, the phone-portrait default and why: Jest's 750×1334 window is a tablet). Verify that the links resolve.

## 2. Shell frame

- [x] 2.1 Rename `src/components/footer-tab-bar.tsx` to `tab-bar.tsx` (`TabBar`), and its test to `tab-bar-test.tsx`. Make it read `useShellLayout()` (design D3, D5):
  - portrait: in the flow, top border, bottom inset
  - landscape: absolute at the top, bottom border, no bottom inset
  - tabs stretch only in phone portrait, and elsewhere have `frame.tabWidth` and are centered
  - `sizes.tabHeight` and `sizes.tabLabel`
  - side insets added to the padding

  Wire it in `src/app/_layout.tsx`, and set `screenOptions.sceneStyle.paddingTop` to the bar height in landscape. Extend the test for each layout: height, position, borders, tab widths and the scene padding matching `frame.tabBarHeight`. Verify that `npm test` passes and that the phone-portrait assertions are unchanged.
- [x] 2.2 Make `AppHeader` read the layout (design D2, D5):
  - `frame.headerHeight` plus the top inset
  - horizontal padding from `sizes.headerPaddingHorizontal` plus the side insets
  - menu button, glyph, avatar and emoji sizes from `sizes`
  - the title field at `sizes.fieldHeight` and `sizes.fieldFont`, at most `frame.titleMaxWidth` wide and centered

  Extend `app-header-test.tsx` for phone landscape and tablet portrait (heights, paddings with side insets, title max width, every control at least `Layout.touchTarget`). Verify that `npm test` passes.
- [x] 2.3 Make `CreateButton` read the layout (design D5): size and glyph from `sizes`; `right` = `sizes.fabRight` + the right inset; `bottom` above the tab bar in portrait, or above the bottom inset in landscape, using `frame.fabBottom`. Extend `create-button-test.tsx` with each layout's position and size. Verify that `npm test` passes.
- [x] 2.4 Update `docs/architecture/shell-layout.md` (the layout-dependent frame, the tab bar staying in the bottom slot and why, scene padding, insets) and `docs/components/app-header.md` and `create-button.md`. Rename `docs/components/footer-tab-bar.md` to `tab-bar.md` and fix every link to it: `docs/components/index.md`, `shell-layout.md`, `project-structure.md`, `coding-conventions.md`, `overview.md`, `docs/specs/app-shell.md`, `js-tabs-custom-tab-bar.md` and the `add-main-section` skill. Add a decision page `docs/decisions/tab-bar-single-slot.md` (design D3 with the spike result and the rejected alternatives), listed in `docs/decisions/index.md`. Verify that `grep -rn "footer-tab-bar\|FooterTabBar" docs .claude src CLAUDE.md` finds nothing and that the links resolve.

## 3. Title field and rotation

- [x] 3.1 Change the `keyboardDidHide` handling in `src/components/title-search-field.tsx` (design D4). On hide, remember the window size and start a `Layout.keyboardHideGraceMs` timer. `keyboardDidShow` cancels it. When the timer fires, blur only if the window size is unchanged. Clean up the timer and listeners on unmount. Extend `title-search-field-test.tsx` with fake timers:
  - a hide alone blurs after the grace period and restores "BlueShare" when empty
  - a hide then show within the grace period keeps focus
  - a hide followed by `setMockWindow(...)` does not blur
  - unmounting during the grace period does not throw

  Verify that `npm test` passes and that the existing blur scenarios still pass.
- [x] 3.2 Update `docs/components/title-search-field.md` (the grace period and why a rotation fires `keyboardDidHide`). Verify that the links resolve.

## 4. Content column and content sizes

- [x] 4.1 Make `TimelineFeed` use the layout (design D5, D6):
  - content padding from `sizes.contentPadding`, plus the side insets
  - in landscape, a bottom padding that adds the bottom inset
  - `contentContainerStyle` width = `columnWidth` + 2 × padding, centered

  Make `PlaceholderScreen` use the same padding and insets, and the placeholder font sizes. Extend `timeline-feed-test.tsx` and add a placeholder test for phone landscape and tablet portrait (widths, centering, paddings). Verify that `npm test` passes.
- [x] 4.2 Make `TextItemCard` use `sizes` (padding, radius, `itemGap`, text size and line height, action height and label), and extend `text-item-card-test.tsx` for a tablet layout. Verify that `npm test` passes and that the phone values are unchanged.
- [x] 4.3 Make `CreationBox`, `BoxButton`, `BoxTextArea` and `TypeSelect` use `sizes`:
  - padding, radius and gap; title size
  - control height and button label; input font
  - text area min and max height; option row height
  - the type list sheet `columnWidth` wide, centered, padded for all insets

  Extend their tests for a tablet layout and for the type list width in phone landscape. Verify that `npm test` passes.
- [x] 4.4 Make `EditTextDialog` use `sizes` and `columnWidth` (design D5, D6): the box `columnWidth` wide and centered, padding and radius from `sizes`, and the content padded for all four insets. Extend `edit-text-dialog-test.tsx` for phone landscape (width at most 550, centered) and tablet portrait (500). Verify that `npm test` passes.
- [x] 4.5 Update `docs/components/timeline-feed.md`, `text-item-card.md`, `creation-box.md`, `box-button.md`, `type-select.md`, `edit-text-dialog.md` and `placeholder-screen.md` (sizes from the layout, and the content column). Verify that the links resolve.

## 5. Rotation journeys

- [x] 5.1 Add `src/__tests__/e2e/rotation-test.tsx`. Through `renderRouter`, rotate with `act(() => setMockWindow(...))`:
  - open the creation box, pick Texto, type "Hola", rotate to phone landscape and back: the text is kept and the text input is the same host instance
  - with an edit dialog open and changed text, rotate: same dialog step and text
  - leave a draft, go to Circles, rotate, return: the draft is shown in the same step
  - on Circles, rotate: Circles stays active, and the tab bar has the top style in landscape and the bottom style in portrait
  - tablet portrait to tablet landscape keeps the tablet sizes (card text size unchanged)

  Verify that `npm test` passes.
- [x] 5.2 Extend `src/__tests__/e2e/navigation-test.tsx`: tab switching and Android back to Timeline in a landscape layout. Verify that `npm test` passes.

## 6. Platform configuration

- [x] 6.1 In `app.json`, set `"orientation": "default"` and add `"supportsTablet": true` to `ios` (design D7). Verify that `npx expo-doctor` reports no new issue and that `npx expo config --type public` shows both values.
- [x] 6.2 Replace `docs/decisions/mobile-only.md` with "Mobile only, no web", keeping no web and Expo Go only. State that the app now runs on phones and tablets in any orientation, and link a new `docs/decisions/adaptive-layout.md`: window-based layouts (D1), the size sets and frames (D2) and the full-screen editor (D9), with the rejected alternatives. Update `docs/decisions/index.md`, `docs/development/native-config-and-eas.md` (the new `app.json` values), `docs/product/design-sources.md` (the landscape and tablet mocks are now in scope, and the tablet landscape layout is derived from them) and `docs/development/accessibility.md` (44-point targets override the landscape mock). Verify that the links resolve.

## 7. Device checks

- [x] 7.1 With the `run-on-emulator` skill on the Medium Phone, repeat the spike's checks with the real code:
  - rotate with the feed scrolled, with the creation box open and the keyboard up (in both directions), with the full-screen editor open and closed with DONE, with the edit dialog open, with the title field focused, and with a draft pending while on Circles
  - focus never moves to the search field, the keyboard stays open, and texts are kept
  - the gesture bar never covers Cancelar or Crear
  - check `uiautomator dump` for focus after each rotation

  Fix any difference, or record it in the design's risks.
- [x] 7.2 Repeat 7.1 on the `Galaxy_Tab_A9_Plus` emulator (1920×1200, density 240) in both orientations. Also check that the cards are 500 points wide in portrait and 600 in landscape, and that the tabs are 150 points wide and centered.
- [x] 7.3 Check with TalkBack in phone landscape and tablet portrait: the tabs are announced with their selected state, every control keeps its label, and focus order goes header, tab bar, content in landscape.
- [x] 7.4 Add the tablet profile to `docs/development/device-testing.md` (its values, how to create the AVD by copying the phone's `config.ini` since `avdmanager` is missing, and the measured window sizes), the rotation commands (`settings put system accelerometer_rotation 0`, `user_rotation 0|1`) and the checks passed. Add the tablet AVD, the rotation commands and per-layout tap coordinates (or the `uiautomator` lookup) to the `run-on-emulator` skill. Verify that the commands in the skill run as written.

## 8. Visual review

- [x] 8.1 With the `visual-review` skill on the Medium Phone in portrait, capture the full existing set in light and dark and compare with the approved references. Every diff must be 0 differing pixels (phone portrait unchanged). Fix any regression before going on.
- [x] 8.2 Capture the new layouts in light and dark: Timeline with cards, the creation box text step, the edit dialog and Circles, in phone landscape, tablet portrait and tablet landscape. Compare them with `sketches/mobile-landscape.png` and `sketches/tablet-portrait.png`. Tune the tablet values the spec doesn't fix (text area heights, option rows) and record the final values in `docs/design-system/layout-sizes.md`. With the user's approval, add the new references to `src/__tests__/e2e/screenshots/` with a layout suffix.
- [x] 8.3 Update the `visual-review` skill and `docs/development/visual-review.md`: the new capture list per layout, per-layout masks for the status bar and Expo Go's "Tools" bubble, and the rule that phone-portrait references must stay identical. Verify that the skill's commands run as written.

## 9. Final integration check

- [x] 9.1 Run the final checks:
  - `npx expo lint --max-warnings 0`, `npx tsc --noEmit` and `npm test` pass
  - `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" src --include=*.tsx` finds nothing
  - there are no `ios/` or `android/` folders, and nothing under `sketches/` changed
  - `grep -rnE "eslint-disable|\.only\(|\.skip\(" src` finds nothing new
  - `openspec validate adaptive-layout --strict` passes
- [x] 9.2 Update `docs/product/known-limitations.md`:
  - iOS and iPad unverified
  - about 250 pt of content in phone landscape, less with keyboards that don't go full screen
  - Expo Go's dev bubble overlaps differently per layout

  Update `docs/product/roadmap.md` (adaptive layout delivered in Phase 1). Verify that the links resolve.

## Workflow follow-up

- After review, run `/opsx:archive adaptive-layout`. Its guidance updates:
  - `docs/specs/` (adaptive-layout new, plus app-platform, app-shell, timeline-feed, item-creation and item-editing)
  - the decision pages
  - `CLAUDE.md`: "Current state", the "portrait only" wording in the intro, and a "When to read what" row for layouts and sizes
  - the nested `src/*/CLAUDE.md` files if their rules changed
