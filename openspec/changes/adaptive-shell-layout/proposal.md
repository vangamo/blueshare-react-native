# Proposal

## Why

BlueShare is locked to phones in portrait, but older adults often use tablets, and many people hold a phone sideways to read or show photos to family. `sketches/` already has a phone-landscape mock and a tablet-portrait mock, and the shell (header, tabs, create button) is finished, so this is the moment to make the frame adapt before the feed is built on top of it.

## What Changes

- **BREAKING** Unlock the orientation: the app follows the device rotation on phones and tablets (`app.json` `orientation` no longer `"portrait"`), and the store iOS build supports iPad screen sizes. Web stays out of scope, and the app keeps running in Expo Go.
- The shell picks one of three layouts from the current **window size** (not the device model), and switches live when the window changes (rotation, split screen, foldables):
  - **Phone portrait** (today's shell, unchanged): header 70, footer tab bar 75, create button 56.
  - **Phone landscape** (short window, after `sketches/mobile-landscape.html`): compact 55-point header, the three tabs move to a row right under the header, there is no footer, and a 48-point create button sits in the bottom-right corner.
  - **Tablet** (large window, after `sketches/tablet-portrait.html`), used in **both** portrait and landscape: 75-point header, 80-point footer with three fixed-width centered tabs, 60-point create button. Tablet landscape has no mock; it reuses the tablet layout because a landscape tablet still has plenty of height, and the navigation stays where users learned it.
- In the phone-landscape and tablet layouts, the title/search field no longer fills the header: it is capped in width and centered.
- Section content sits in a **centered column with a maximum width** in every layout, so text and future feed cards never stretch across a wide screen.
- The shell respects the **left and right safe-area insets** (camera cutouts and the Android 3-button bar move to the sides in landscape).
- Accessibility beats the mocks: every control keeps a touch target of at least 44×44 points, even where the landscape mock draws smaller tabs and buttons.
- Changing layout keeps the current section and any text typed in the title field.
- Tests cover each layout by faking the window size. New approved device screenshots are taken for phone landscape and tablet (portrait and landscape), in light and dark.

## Capabilities

### New Capabilities

<!-- None: the adaptive behavior belongs to the existing shell and platform capabilities. -->

### Modified Capabilities

- `app-shell`: adds how the layout is chosen from the window size, the tab row under the header on short windows, the content column and keeping state across layout changes. Changes the header, title field, avatar, footer and create button requirements so their sizes and positions depend on the layout, and the safe-area requirement so it covers the left and right insets.
- `app-platform`: replaces "Android and iOS in portrait only" with phones and tablets in any orientation, still without a web target.

## Impact

- **Code**: `src/app/_layout.tsx` (picks the tab bar position from the layout); `src/components/app-header.tsx`, `title-search-field.tsx`, `create-button.tsx`, `placeholder-screen.tsx`; `footer-tab-bar.tsx` becomes a tab bar that draws either as the bottom footer or as the row under the header. New hook in `src/hooks/` that returns the active layout and its sizes. `src/constants/theme.ts` gains per-layout shell sizes next to the shared `Layout` values.
- **Config**: `app.json` (`orientation`, `ios.supportsTablet`).
- **Tests**: `src/test-utils/` gains a faked window size (the Jest default of 750×1334 would count as a tablet); unit tests for each component in each layout; e2e test for a layout change keeping the section and the title text.
- **Device checks**: a tablet emulator profile is added next to the Medium Phone one. New reference screenshots in `src/__tests__/e2e/screenshots/`, approved by the user.
- **Docs**: the "Mobile only, portrait" decision is superseded for orientation and tablets; shell layout, component pages, design-system sizes, device testing, visual review and known limitations are updated after archive.
- **Dependencies**: none added. The layout comes from React Native's window size, so Expo Go keeps working.
