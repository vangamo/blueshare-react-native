# Device review notes

Material for the PR description (tasks 5.4, 8.5 and 8.6).

**Device:** Android emulator `Medium_Phone_API_37.0` (Android API 37), Expo Go, 1080×2400 px, density 420 (2.625 px per point), gesture navigation. Screenshots taken in system UI demo mode (clock 12:00, mobile icon hidden).

## Behavior checks (Android, Expo Go)

| Check | Result |
| --- | --- |
| Cold start | Native splash, then the shell on Timeline. No animated overlay. |
| Tab switching | Each tab shows its section and gets the active style. Tapping the active tab does nothing. |
| Android back from Circles | Returns to Timeline. |
| `/explore` deep link (`exp://…/--/explore`) | Expo Router's "Unmatched Route" page. No starter content. `blueshare://` does not resolve inside Expo Go, which is expected. |
| Light ↔ dark with the app open, on each tab | The shell re-themes right away. The current tab and the title text ("abuela") are kept. Status bar icons switch. No white flash between tabs in dark mode. |
| Scrolling | Long content is clipped at the header border and above the footer. The "+" button floats over the content. |
| Title field | Rest state "BlueShare" centered. Focus → empty, "Buscar...", blue border, card background, left-aligned. Dismissing the keyboard with only blank text → "BlueShare". With "abuela" → text kept, rest style. Submit → nothing happens. |
| Menu and avatar taps | Nothing happens. No errors in the Metro log. |
| Keyboard open | The keyboard covers the footer and "+" button. Nothing is pushed up. The header field stays visible. Accepted for this skeleton (design: Risks). |
| Rotation (forced landscape) | The app stays in portrait. |
| Accessibility tree (`uiautomator`) | Menu and Create are Buttons with their labels. Search is an EditText. Profile is labeled. Each tab carries its label and `selected` state. |
| TalkBack | Tabs and buttons get focus and speech. The user listened and confirmed that each tab is announced as a tab with its selected state (task 5.4). |
| iOS | Not checked: no iOS device or simulator on this Linux machine. |

### Fix found during the device check

On Android, dismissing the keyboard (back button or the keyboard arrow) did not blur the `TextInput`, so the title field kept its focused style. That breaks the "Leaving the field empty/with text" scenarios. `TitleSearchField` now blurs itself on `keyboardDidHide`.

## Screenshot review (task 8.5)

Screenshots: `src/__tests__/e2e/screenshots/{timeline,circles,events,title-focused}-{light,dark}.png`, all 1080×2400.

**Approved by the user.**

**Structure (against `sketches/mobile-portrait.png`, `header-…` and `footer-…`):** the same header order (menu, centered title field, avatar), a footer with three equal tabs, and the "+" at the bottom right above the footer.

**Sizes (measured in px ÷ 2.625):**

| Element | Expected | Measured |
| --- | --- | --- |
| Header height | 70 + top inset | ≈ 94.5 pt (inset ≈ 24.5) |
| Footer height | 75 + bottom inset | 99.0 pt (inset 24) |
| Header and footer borders | 2 pt (5.25 px) | 4 solid px + anti-aliased edge |
| Header side padding | 16 pt | 42 px = 16 pt |
| Menu button | ≥ 44×44 | 116 px = 44.2 pt |
| Title field height | 42 pt | 111 px = 42.3 pt |
| Avatar | 42×42 | 110 px = 41.9 pt |
| Tab height | 44 pt | 116 px = 44.2 pt |
| Gap between tabs | 8 pt (4 + 4) | 21 px = 8 pt |
| "+" button | 56×56, 20 from right, 10 above footer | 147 px = 56 pt, 19.8 pt, 9.9 pt |

**Colors:** 17 sampled points per scheme (header, borders, content, menu, field, avatar, footer, active and inactive tabs, "+" fill and ring), plus the focused field's border and background, all match `Colors.light` / `Colors.dark` exactly. The footer background near the active tab is 1–2 levels off because of the tab's shadow glow.

**Open differences:** none, apart from the intentional ones:
- no feed cards yet
- the active tab is `#006fe6` instead of `#0084ff` (contrast)
- platform fonts and emoji instead of browser ones
- the sketch is a 360-point-wide mock while the device is 411 points wide, so elements look smaller relative to the screen at the same point sizes

## Deviations from the plan

- **Tab bar API:** in expo-router 58, `BottomTabBarProps` has `emitter` and `navigateToTab(routeKey)` instead of `navigation`. `FooterTabBar` emits `tabPress` and calls `navigateToTab`, which matches the default bar.
- **`react-dom` stays installed:** expo-router depends on `@radix-ui/react-tabs`, `react-presence`, `react-primitive`, `react-roving-focus` and `react-collection`, which all list `react-dom` as a required peer. Design D8 and task 8.3 now record that it stays.
