# Spec Delta

## MODIFIED Requirements

### Requirement: Text contrast
In both palettes, every text and background pair the app draws (the shell, the creation box with its text and image steps, the type list, the edit dialogs, the timeline cards with their captions and missing-photo message, and the timeline messages) SHALL have a contrast ratio of at least 4.5:1. Text of 24 points or larger, or bold text of 18.66 points or larger, SHALL have at least 3:1. Labels of disabled buttons are exempt, as WCAG allows for inactive controls.

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

### Requirement: Contrast of icons and control boundaries
In both palettes, the menu glyph, the create button's `+`, the type select's chevron, the edit dialog's close glyph, and borders that are the only visual boundary of an interactive control (menu button, title field, type select, text areas, the caption field, the photo button, the deletion buttons) SHALL contrast at least 3:1 with their adjacent background.

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

### Requirement: All shell colors come from the theme
Every color in the shell, the placeholder screens, the creation box, the edit dialogs and the timeline SHALL come from the active palette, so changing a palette value changes every place that uses it. Components SHALL NOT use fixed color values. The palettes SHALL include a danger color and an on-danger color for deletion controls, and an image backdrop color for the area around photos that do not fill their box.

#### Scenario: Palette change propagates
- **WHEN** a developer changes the primary blue value in the light palette
- **THEN** the create button, menu button, focused title border, creation box border and edit dialog border all show the new value with no other code change

#### Scenario: Danger color propagates
- **WHEN** a developer changes the danger value in a palette
- **THEN** the "Borrar este texto" and "Borrar esta imagen" borders and labels and the "Sí, borrar" background all show the new value with no other code change

#### Scenario: Backdrop follows the palette
- **WHEN** a tall photo is shown on a card in light mode and then in dark mode
- **THEN** the area beside the photo uses the image backdrop color of the active palette
