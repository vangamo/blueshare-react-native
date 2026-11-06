# app-theming Specification

## Purpose

Defines BlueShare's visual theme: the light and dark color palettes built from the design tokens, how the app follows the system color scheme, and the contrast guarantees the palettes must meet for an audience that includes older adults.

## Requirements

### Requirement: Light palette matches the design tokens
In light mode, the app SHALL use the colors from `sketches/design_system.json`. Where those tokens and `sketches/mobile-portrait.html` disagree, the HTML SHALL win; for example, the footer top border uses the border color `#e2e8f0`. The exceptions are the active footer tab and the main buttons of the creation box and the edit dialog ("Guardar" and "Crear"), which follow the contrast requirement below.

#### Scenario: Light mode colors
- **WHEN** the device is in light mode
- **THEN** the header and footer backgrounds are `#ffffff`, the content background is `#faf9f6`, the header bottom border and footer top border are `#e2e8f0`, and the create button is `#0084ff`

#### Scenario: Creation box main button in light mode
- **WHEN** the device is in light mode and "Guardar" or "Crear" is enabled
- **THEN** the button background is the active-tab blue `#006fe6` instead of the mock's `#0084ff`, with a white label

#### Scenario: Edit dialog main button in light mode
- **WHEN** the device is in light mode and the edit dialog's "Guardar" is enabled
- **THEN** the button background is the active-tab blue `#006fe6`, with a white label

### Requirement: Dark palette
The app SHALL provide a dark palette with the same set of color roles as the light palette. The primary blue SHALL stay recognizably blue, and backgrounds SHALL be dark.

#### Scenario: Dark mode colors
- **WHEN** the device is in dark mode
- **THEN** the header, footer and content areas use dark backgrounds, text is light, and the create button, menu button and active tab stay blue

### Requirement: Text contrast
In both palettes, every text and background pair the app draws (the shell, the creation box with its text, image and event steps, the type list, the edit dialogs, the timeline cards with their captions, event titles, category badges, descriptions and missing-photo messages, and the timeline messages) SHALL have a contrast ratio of at least 4.5:1. Text of 24 points or larger, or bold text of 18.66 points or larger, SHALL have at least 3:1. Labels of disabled buttons are exempt, as WCAG allows for inactive controls.

#### Scenario: Active tab label in light mode
- **WHEN** the device is in light mode and a footer tab is active
- **THEN** its label contrasts at least 4.5:1 with the tab background

#### Scenario: Dark mode text
- **WHEN** the device is in dark mode
- **THEN** every text and background pair in the shell, the creation box, the edit dialog and the timeline has a contrast ratio of at least 4.5:1

#### Scenario: Creation box main button label
- **WHEN** "Guardar" or "Crear" is enabled, in either mode
- **THEN** its 15-point bold label contrasts at least 4.5:1 with the button background

#### Scenario: Card text
- **WHEN** a text card is shown in either mode
- **THEN** its text and its action labels contrast at least 4.5:1 with their backgrounds

#### Scenario: Deletion buttons
- **WHEN** "Borrar este texto" or "Sí, borrar" is shown, in either mode
- **THEN** the danger label of "Borrar este texto" contrasts at least 4.5:1 with the muted surface, and the on-danger label of "Sí, borrar" contrasts at least 4.5:1 with the danger background

#### Scenario: Image caption and messages
- **WHEN** an image card is shown in either mode
- **THEN** its caption contrasts at least 4.5:1 with the card background, and "⚠️ Imagen no disponible" contrasts at least 4.5:1 with the image backdrop

#### Scenario: Image step labels and hint
- **WHEN** the image step or the image dialog is shown in either mode
- **THEN** the field labels and the alternative text hint contrast at least 4.5:1 with the creation background

#### Scenario: Event card texts
- **WHEN** an event card is shown in either mode
- **THEN** its title and description contrast at least 4.5:1 with the card background, and the category label contrasts at least 4.5:1 with the badge background

#### Scenario: Event step labels and messages
- **WHEN** the event step or the event dialog is shown in either mode
- **THEN** the field labels and the photo limit message contrast at least 4.5:1 with the creation background, and the category suggestion labels contrast at least 4.5:1 with their button background

### Requirement: Contrast of icons and control boundaries
In both palettes, the menu glyph, the create button's `+`, the type select's chevron, the edit dialog's close glyph, the `✕` of the photo remove buttons, and borders that are the only visual boundary of an interactive control (menu button, title field, type select, text areas, the caption, event title and category fields, the photo buttons, the photo remove buttons, the category suggestions, the deletion buttons) SHALL contrast at least 3:1 with their adjacent background.

#### Scenario: Menu glyph
- **WHEN** the menu button is shown in either mode
- **THEN** the `≡` glyph contrasts at least 3:1 with the menu button background

#### Scenario: Text area border
- **WHEN** the text step of the creation box is shown in either mode
- **THEN** the text area border contrasts at least 3:1 with the text area background

#### Scenario: Edit dialog close glyph
- **WHEN** the edit dialog is shown in either mode
- **THEN** the `✕` glyph contrasts at least 3:1 with the dialog background

#### Scenario: Caption field border
- **WHEN** the image step is shown in either mode
- **THEN** the caption field border contrasts at least 3:1 with the field background

#### Scenario: Photo remove button
- **WHEN** a thumbnail with its remove button is shown in the event step or dialog, in either mode
- **THEN** the `✕` glyph contrasts at least 3:1 with the remove button background, and the button's border contrasts at least 3:1 with the button background

#### Scenario: Category suggestion border
- **WHEN** the category suggestions are shown in either mode
- **THEN** each suggestion's border contrasts at least 3:1 with the creation background

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
Every color in the shell, the placeholder screens, the creation box, the edit dialogs and the timeline SHALL come from the active palette, so changing a palette value changes every place that uses it. Components SHALL NOT use fixed color values. The palettes SHALL include a danger color and an on-danger color for deletion controls, an image backdrop color for the area around photos that do not fill their box, and a badge background and a badge text color for category badges.

#### Scenario: Palette change propagates
- **WHEN** a developer changes the primary blue value in the light palette
- **THEN** the create button, menu button, focused title border, creation box border and edit dialog border all show the new value with no other code change

#### Scenario: Deep blue change propagates
- **WHEN** a developer changes the deep primary blue value in a palette
- **THEN** the active tab border and the event card accent bar both show the new value with no other code change

#### Scenario: Danger color propagates
- **WHEN** a developer changes the danger value in a palette
- **THEN** the "Borrar este texto", "Borrar esta imagen" and "Borrar este evento" borders and labels and the "Sí, borrar" background all show the new value with no other code change

#### Scenario: Backdrop follows the palette
- **WHEN** a tall photo is shown on a card in light mode and then in dark mode
- **THEN** the area beside the photo uses the image backdrop color of the active palette

#### Scenario: Badge follows the palette
- **WHEN** an event card is shown in light mode and then in dark mode
- **THEN** its category badge uses the badge background and badge text colors of the active palette
