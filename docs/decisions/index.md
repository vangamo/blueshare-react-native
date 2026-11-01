# Decisions

The technical decisions taken in the `basic-app-layout` change (its `design.md`, D1 to D11, now in `openspec/changes/archive/2026-11-01-basic-app-layout/`). Each page gives the decision, why it was taken and the rejected alternatives. The decisions about tooling are in [Development](../development/index.md): mandatory lint (D9), the Jest setup (D10) and the screenshot review (D11).

* [JS tabs with a custom tab bar](js-tabs-custom-tab-bar.md) - D1: `expo-router/js-tabs` with a `tabBar` prop, instead of native or headless tabs.
* [Shell at the root layout](shell-at-root-layout.md) - D2: header, footer and FAB are rendered once around the navigator, not per screen.
* [No themed wrappers](no-themed-wrappers.md) - D3: components call `useTheme()` directly. There are no `ThemedText` or `ThemedView`.
* [Tokens in JSON](tokens-in-json.md) - D4: all colors and token sizes live in `design-system.json`, read by `theme.ts`.
* [Active tab contrast](active-tab-contrast.md) - D5: a darker active tab in light mode, and navy-on-blue in dark mode, to pass WCAG AA.
* [Splash hidden on first layout](splash-hidden-on-layout.md) - D6: keep the native splash until the shell's `onLayout`, with no animated overlay.
* [Title field state without effects](title-field-state.md) - D7: the displayed value is computed during render, and state changes only in focus and blur handlers.
* [Kept and removed dependencies](kept-dependencies.md) - D8: which packages were removed and why the others stay.
* [Mobile only, portrait, no web](mobile-only.md) - Android and iOS phones in portrait, running in Expo Go.
