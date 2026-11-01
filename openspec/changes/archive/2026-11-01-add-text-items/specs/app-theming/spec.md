# Spec Delta

## MODIFIED Requirements

### Requirement: Light palette matches the design tokens
In light mode, the app SHALL use the colors from `sketches/design_system.json`. Where those tokens and `sketches/mobile-portrait.html` disagree, the HTML SHALL win; for example, the footer top border uses the border color `#e2e8f0`. The exceptions are the active footer tab and the main buttons of the creation box ("Guardar" and "Crear"), which follow the contrast requirement below.

#### Scenario: Light mode colors
- **WHEN** the device is in light mode
- **THEN** the header and footer backgrounds are `#ffffff`, the content background is `#faf9f6`, the header bottom border and footer top border are `#e2e8f0`, and the create button is `#0084ff`

#### Scenario: Creation box main button in light mode
- **WHEN** the device is in light mode and "Guardar" or "Crear" is enabled
- **THEN** the button background is the active-tab blue `#006fe6` instead of the mock's `#0084ff`, with a white label

### Requirement: Text contrast
In both palettes, every text and background pair the app draws (the shell, the creation box, the type list, the timeline cards and the timeline messages) SHALL have a contrast ratio of at least 4.5:1. Text of 24 points or larger, or bold text of 18.66 points or larger, SHALL have at least 3:1. Labels of disabled buttons are exempt, as WCAG allows for inactive controls.

#### Scenario: Active tab label in light mode
- **WHEN** the device is in light mode and a footer tab is active
- **THEN** its label contrasts at least 4.5:1 with the tab background

#### Scenario: Dark mode text
- **WHEN** the device is in dark mode
- **THEN** every text and background pair in the shell, the creation box and the timeline has a contrast ratio of at least 4.5:1

#### Scenario: Creation box main button label
- **WHEN** "Guardar" or "Crear" is enabled, in either mode
- **THEN** its 15-point bold label contrasts at least 4.5:1 with the button background

#### Scenario: Card text
- **WHEN** a text card is shown in either mode
- **THEN** its text and its action labels contrast at least 4.5:1 with their backgrounds

### Requirement: Contrast of icons and control boundaries
In both palettes, the menu glyph, the create button's `+`, the type select's chevron, and borders that are the only visual boundary of an interactive control (menu button, title field, type select, text area) SHALL contrast at least 3:1 with their adjacent background.

#### Scenario: Menu glyph
- **WHEN** the menu button is shown in either mode
- **THEN** the `≡` glyph contrasts at least 3:1 with the menu button background

#### Scenario: Text area border
- **WHEN** the text step of the creation box is shown in either mode
- **THEN** the text area border contrasts at least 3:1 with the text area background

### Requirement: All shell colors come from the theme
Every color in the shell, the placeholder screens, the creation box and the timeline SHALL come from the active palette, so changing a palette value changes every place that uses it. Components SHALL NOT use fixed color values.

#### Scenario: Palette change propagates
- **WHEN** a developer changes the primary blue value in the light palette
- **THEN** the create button, menu button, focused title border and creation box border all show the new value with no other code change
