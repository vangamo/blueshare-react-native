# Proposal

## Why

BlueShare is locked to phones in portrait, but older adults often use tablets, and many people hold a phone sideways to read or show photos to family. `sketches/` already has a phone-landscape mock and a tablet-portrait mock. The shell and the first real content are now built: the Timeline feed with text cards, the creation box and the edit dialog. So this is the moment to make the frame and that content adapt, before image and event items add more screens that would each need it.

## What Changes

- **BREAKING** Unlock the orientation: the app follows the device rotation on phones and tablets (`app.json` `orientation` no longer `"portrait"`), and the store iOS build supports iPad screen sizes. Web stays out of scope, and the app keeps running in Expo Go.
- The app picks one of three layouts from the current **window size** (not the device model), and switches live when the window changes (rotation, split screen, foldables):
  - **Phone portrait** (today's app, unchanged): header 70, footer tab bar 75, create button 56.
  - **Phone landscape** (short window, after `sketches/mobile-landscape.html`): compact 55-point header, the three tabs move to a row right under the header, there is no footer, and a 48-point create button sits in the bottom-right corner.
  - **Tablet** (large window, after `sketches/tablet-portrait.html`), used in **both** portrait and landscape: 75-point header, 80-point footer with three fixed-width centered tabs, 60-point create button. Tablet landscape has no mock; it reuses the tablet layout because a landscape tablet still has plenty of height, and the navigation stays where users learned it.
- In the phone-landscape and tablet layouts, the title/search field no longer fills the header: it is capped in width and centered.
- Section content sits in a **centered column with a maximum width** in every layout: the Timeline feed (creation box, cards and messages) and the Circles and Events placeholders. Text and cards never stretch across a wide screen.
- The **edit dialog** is capped to the same column width and centered. In phone landscape, where it can't fit above the keyboard, its controls are reached by scrolling.
- In the **tablet layout, text cards, the creation box and the edit dialog are drawn larger**, after the tablet mock: card text 16 points (instead of 15), more padding, and rounder corners. In phone landscape they keep the phone sizes rather than the smaller ones in the landscape mock.
- The app respects the **left and right safe-area insets** (camera cutouts and the Android 3-button bar move to the sides in landscape).
- Accessibility beats the mocks: every control keeps a touch target of at least 44×44 points, even where the landscape mock draws smaller tabs and buttons.
- Changing layout keeps the current section, the text in the title field, an open creation box with its draft, and an open edit dialog with its edit.
- Tests cover each layout by faking the window size. New approved device screenshots are taken for phone landscape and tablet (portrait and landscape), in light and dark, with cards, the creation box and the edit dialog.

## Capabilities

### New Capabilities

<!-- None: the adaptive behavior belongs to the existing capabilities below. -->

### Modified Capabilities

- `app-shell`: adds how the layout is chosen from the window size, the tab row under the header on short windows, the tablet footer, the content column, and keeping state across layout changes. Changes the header, title field, avatar, footer and create button requirements so their sizes and positions depend on the layout, and the safe-area requirement so it covers the left and right insets.
- `app-platform`: replaces "Android and iOS in portrait only" with phones and tablets in any orientation, still without a web target.
- `timeline-feed`: the feed scrolls between the header and the tabs inside the content column, instead of "between the header and the footer with 16 points of padding". Text cards get tablet sizes.
- `item-creation`: the creation box gets the tablet corner radius and spacing.
- `item-editing`: the edit dialog is capped to the content column width, centered, clear of the side insets, with the tablet corner radius, and in phone landscape it scrolls to reach the controls that don't fit above the keyboard.

## Impact

- **Code**:
  - `src/app/_layout.tsx` picks the tab bar position from the layout.
  - `src/components/app-header.tsx`, `title-search-field.tsx` and `create-button.tsx` read their sizes from the layout. `create-button.tsx` keeps its per-section visibility from `useCreateAction`.
  - `footer-tab-bar.tsx` becomes a tab bar that draws either as the bottom footer or as the row under the header.
  - `placeholder-screen.tsx` and `timeline-feed.tsx` (a `FlatList`) apply the content column.
  - `text-item-card.tsx`, `creation-box.tsx` and `edit-text-dialog.tsx` read the tablet sizes, and the edit dialog and the type list in `type-select.tsx` are capped to the column width.
  - New hooks in `src/hooks/` return the active layout, its sizes and the content-column padding. `src/constants/theme.ts` gains per-layout sizes next to the shared `Layout` values.
- **Config**: `app.json` (`orientation`, `ios.supportsTablet`).
- **Tests**:
  - `src/test-utils/` gains a faked window size (the Jest default of 750×1334 would count as a tablet).
  - Unit tests for each affected component in each layout.
  - e2e tests for a layout change that keeps the section, the title text, the creation box draft and the edit dialog.
- **Device checks**: a tablet emulator profile is added next to the Medium Phone one. The 26 approved phone portrait screenshots must still match. New reference screenshots go in `src/__tests__/e2e/screenshots/`, approved by the user.
- **Docs**: the "Mobile only, portrait" decision is superseded for orientation and tablets. The shell layout, component pages, design-system sizes, device testing, visual review and known limitations are updated after archive.
- **Dependencies**: none added. The layout comes from React Native's window size, so Expo Go keeps working.
