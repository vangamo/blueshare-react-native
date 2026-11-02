# Proposal

## Why

BlueShare is locked to portrait and draws one phone layout everywhere. A senior who turns the phone sideways, or a family that hands over a tablet, gets a stretched phone screen with small text and full-width cards. The design already has landscape and tablet mocks (`sketches/mobile-landscape.*`, `sketches/tablet-portrait.*`). The shell and the text items are done, so the frame should adapt now, before image and event items add more screens to adapt.

## What Changes

- **BREAKING (platform spec):** the app is no longer portrait-only. It runs on Android and iOS phones and tablets, in any orientation (`app.json` `orientation: "default"`, `ios.supportsTablet: true`). It still runs in Expo Go, with no new dependencies. This replaces the decision [Mobile only, portrait, no web](../../../docs/decisions/mobile-only.md) for orientation. There is still no web.
- **Four layouts, chosen from the window size**, not the device model, and updated live on rotation or split screen:
  - landscape when the window is wider than tall
  - tablet when the window's shorter side is at least 600 points

  ```
                   portrait                         landscape
  phone    header 70, tab bar 75 (bottom)    header 56, tab bar 56 (top)
           full-width content                 content column max 550
  tablet   header 75, tab bar 80 (bottom)    header 75, tab bar 64 (top)
           content column max 500             content column max 600
  ```

  Phone portrait stays exactly as it is today. Phone landscape follows `mobile-landscape.html` and tablet portrait follows `tablet-portrait.html`, wherever the mocks allow 44-point touch targets. Tablet landscape is new: it combines the tablet sizes with the landscape structure (tabs on top).
- **Two size sets: phone and tablet.** Component sizes and fonts depend only on the device size, never on the orientation. The tablet set enlarges the shell, cards, creation box, type list and edit dialog (for example card text 15 → 16, title field 42 → 46, create button 56 → 60). The header and tab bar heights, the tab bar position and the content column width are part of the layout.
- **Tab bar:** at the bottom in portrait and under the header in landscape. Its three tabs stretch only on phone portrait. In the other layouts they have a fixed width and are centered.
- **Content column:** the feed, the cards, the creation box, the type list and the edit dialog are centered with a maximum width, so lines stay readable on wide screens.
- **Safe areas on every side:** bars, the create button and the feed respect the left and right safe areas (camera cutout, side navigation bar). In landscape, with no bar below, the feed respects the bottom one too.
- **Rotation keeps the user's place:** the section, the scroll position, the creation box draft, the open edit dialog, the focused text field and its keyboard all survive a rotation. A device test showed that moving the tab bar the usual way (`tabBarPosition`) makes the focused field lose focus to the search field. The design avoids that.
- **Title field fix:** a rotation no longer counts as "keyboard dismissed", which today blurs the search field.
- **Landscape keyboard on phones:** Android's full-screen text editor is accepted. Text typed there goes into the field, and closing it keeps the text and the focus.

## Capabilities

### New Capabilities

- `adaptive-layout`: how the app picks one of the four layouts from the window size, the phone and tablet size sets, each layout's frame (bar heights, tab bar position and tab widths, create button position, content column width), the safe areas in landscape, what a rotation must keep, and the landscape keyboard on phones.

### Modified Capabilities

- `app-platform`: "Android and iOS in portrait only" becomes phones and tablets in any orientation.
- `app-shell`: the fixed shell sizes and positions (header 70, footer 75 at the bottom, create button 10 points above the footer, header with top inset only, footer tabs stretched) now depend on the layout. The title field keeps its focus and text when the device rotates.
- `timeline-feed`: the feed scrolls between the header and the tab bar wherever the bar is, inside the centered content column.
- `item-creation`: when the creation box opens while the feed is scrolled down, it must be fully visible below the header and the top tab bar.
- `item-editing`: the dialog spans the content column instead of the screen width, and on phones in landscape the full-screen keyboard may cover it while typing.

## Impact

- **Config:** `app.json` (`orientation`, `ios.supportsTablet`). No packages added.
- **Code:**
  - `src/constants/theme.ts`: the size sets, the four frames and the layout rule.
  - New hooks: one for the window size (mockable in tests) and one for the current layout.
  - `src/app/_layout.tsx` (scene padding for the top tab bar), the header, the tab bar (renamed from `FooterTabBar`), the create button, the title field, the timeline feed, the text card, the creation box, the type select, the box buttons, the text area, the edit dialog and the placeholder screen read their sizes from the layout.
- **Tests:**
  - Jest's default window (750×1334) would count as a tablet, so tests default to a phone window and can switch layouts.
  - New unit tests for the layout rule and for each component in each layout.
  - A journey test rotates mid-task.
  - The existing tests and the phone-portrait reference screenshots must not change.
- **Device checks:** rotation on the phone emulator and on a new tablet emulator (Galaxy Tab A9+-like, 1920×1200 at 240 dpi, already created on the dev machine), TalkBack in landscape, light and dark. New reference screenshots for the three new layouts.
- **Docs and skills:**
  - Decisions: replace `mobile-only` and add decision pages.
  - Pages to update: design sources, layout sizes, shell layout, components, device testing, visual review, known limitations, roadmap and the log.
  - Skills to update: `run-on-emulator` and `visual-review` (tablet profile, rotation commands).
- **Not changed:** storage, routes and deep links, colors and tokens, item behavior, iOS-specific code. iOS and iPad stay unverified on a device (no macOS).
