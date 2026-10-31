# app-theming Specification

## Purpose

Defines BlueShare's visual theme: the light and dark color palettes built from the design tokens, how the app follows the system color scheme, and the contrast guarantees the palettes must meet for an audience that includes older adults.

## Requirements

### Requirement: Light palette matches the design tokens
In light mode, the app SHALL use the colors from `sketches/design_system.json`. Where those tokens and `sketches/mobile-portrait.html` disagree, the HTML SHALL win; for example, the footer top border uses the border color `#e2e8f0`. The one exception is the active footer tab, which follows the contrast requirement below.

#### Scenario: Light mode colors
- **WHEN** the device is in light mode
- **THEN** the header and footer backgrounds are `#ffffff`, the content background is `#faf9f6`, the header bottom border and footer top border are `#e2e8f0`, and the create button is `#0084ff`

### Requirement: Dark palette
The app SHALL provide a dark palette with the same set of color roles as the light palette. The primary blue SHALL stay recognizably blue, and backgrounds SHALL be dark.

#### Scenario: Dark mode colors
- **WHEN** the device is in dark mode
- **THEN** the header, footer and content areas use dark backgrounds, text is light, and the create button, menu button and active tab stay blue

### Requirement: Text contrast
In both palettes, every text and background pair used in the shell (title field text and placeholder, tab labels, placeholder screen text) SHALL have a contrast ratio of at least 4.5:1. Text of 24 points or larger, or bold text of 18.66 points or larger, SHALL have at least 3:1.

#### Scenario: Active tab label in light mode
- **WHEN** the device is in light mode and a footer tab is active
- **THEN** its label contrasts at least 4.5:1 with the tab background

#### Scenario: Dark mode text
- **WHEN** the device is in dark mode
- **THEN** every text and background pair in the shell has a contrast ratio of at least 4.5:1

### Requirement: Contrast of icons and control boundaries
In both palettes, the menu glyph, the create button's `+`, and borders that are the only visual boundary of an interactive control (menu button, title field) SHALL contrast at least 3:1 with their adjacent background.

#### Scenario: Menu glyph
- **WHEN** the menu button is shown in either mode
- **THEN** the `≡` glyph contrasts at least 3:1 with the menu button background

### Requirement: Follows the system color scheme live
The app SHALL follow the device's light or dark setting. When the user changes it while the app is open, the header, footer, create button, content areas and status bar SHALL switch to the matching palette right away, with no restart, keeping the current section and the title field's text.

#### Scenario: Switching to dark while the app is open
- **WHEN** the app shows Circles in light mode and the user switches the system to dark mode
- **THEN** the whole shell and the Circles content switch to the dark palette, and Circles stays the current section

#### Scenario: Launch in dark mode
- **WHEN** the device is already in dark mode when the app starts
- **THEN** the first screen shown uses the dark palette

### Requirement: Screen backgrounds match the theme
Every screen and navigation container background SHALL use the active palette's content background. No default white or black navigation background SHALL show, including during tab switches.

#### Scenario: No mismatched background during a tab switch
- **WHEN** the user switches tabs in dark mode
- **THEN** no white flash or white background is visible behind the content

### Requirement: Status bar follows the scheme
The status bar icons and text SHALL be dark in light mode and light in dark mode, so they stay readable against the header.

#### Scenario: Dark mode status bar
- **WHEN** the device is in dark mode
- **THEN** the status bar icons are light and readable against the dark header

### Requirement: All shell colors come from the theme
Every color in the shell and placeholder screens SHALL come from the active palette, so changing a palette value changes every place that uses it. Components SHALL NOT use fixed color values.

#### Scenario: Palette change propagates
- **WHEN** a developer changes the primary blue value in the light palette
- **THEN** the create button, menu button and focused title border all show the new value with no other code change
