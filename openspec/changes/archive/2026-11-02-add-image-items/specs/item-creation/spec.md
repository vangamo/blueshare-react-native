# Spec Delta

## MODIFIED Requirements

### Requirement: Creation box appearance
The creation box SHALL have a 2-point dashed border in primary blue, the creation background color, a 16-point corner radius, 16 points of padding and 16 points of space below it. Its title ("Crear nuevo elemento:", "Crear nuevo elemento de texto:" or "Crear nuevo elemento de imagen:") SHALL be 14-point bold in the main text color.

#### Scenario: Box style in both palettes
- **WHEN** the creation box is open in light or dark mode
- **THEN** it shows a dashed primary-blue border on the creation background of the active palette, and its title is bold main-color text

#### Scenario: Title of the image step
- **WHEN** the image step is shown
- **THEN** the box title reads "Crear nuevo elemento de imagen:"

### Requirement: Cancelar discards the creation
Every step SHALL show a "Cancelar" button to the left of "Guardar" or "Crear". Pressing it SHALL close the creation box, discard the selected type, any typed text and any chosen photo, close the keyboard and show the create button again. The next time the box opens, it SHALL start at the choose step with nothing selected.

#### Scenario: Cancelling the text step
- **WHEN** the user has typed text in the text step and taps "Cancelar"
- **THEN** the box closes, no item is created, and the create button reappears

#### Scenario: Cancelling the image step
- **WHEN** the user has chosen a photo and typed a caption in the image step, and taps "Cancelar"
- **THEN** the box closes, no item is created, and the create button reappears

#### Scenario: Reopening after cancelling
- **WHEN** the user cancels and then taps the create button again
- **THEN** the box opens in its choose step showing "Selecciona una opción", and the earlier text and photo are gone

### Requirement: Draft survives tab switches
Switching to Circles or Events while the creation box is open SHALL hide the box without cancelling it. When the user returns to Timeline, the box SHALL show again in the same step, with the same selected type, the same text, and in the image step the same photo, alternative text and caption. Returning SHALL NOT open the keyboard by itself. The draft SHALL be kept only while the app is running.

#### Scenario: Leaving and returning
- **WHEN** the user has typed "Mañana hay bingo" in the text step, switches to Circles, and then back to Timeline
- **THEN** the text step is shown with "Mañana hay bingo" in the text area, and the keyboard stays closed until the user taps the text area

#### Scenario: Leaving and returning with a photo
- **WHEN** the user has chosen a photo and typed the caption "En el parque" in the image step, switches to Events, and then back to Timeline
- **THEN** the image step is shown with the same photo preview and "En el parque" in the caption field

#### Scenario: App restarted with a draft
- **WHEN** the app is closed completely while a draft is pending and launched again
- **THEN** Timeline shows with the creation box closed

### Requirement: Creation box buttons
The two buttons at the bottom of each step SHALL share the box width equally, with 10 points between them, and be at least 44 points tall with a 10-point corner radius and 15-point bold labels. "Guardar" and "Crear" SHALL use the primary button style: the active-tab blue background and the on-primary label color. "Cancelar" SHALL use the secondary style: the muted surface background, a 2-point dark border and the main text color. Each SHALL be announced as a button whose label is its visible text.

#### Scenario: Sizes and order
- **WHEN** any step of the box is shown
- **THEN** "Cancelar" is on the left and the main button on the right, each half the width minus the gap, each at least 44 points tall

#### Scenario: Screen reader labels
- **WHEN** a screen reader focuses the buttons of the text step or the image step
- **THEN** they are announced as buttons named "Cancelar" and "Crear"

## REMOVED Requirements

### Requirement: Guardar with Evento or Imagen does nothing yet
**Reason**: "📷 Imagen" now opens the image step. Only "📅 Evento" still has no effect.
**Migration**: See "Guardar with Evento does nothing yet" and "Guardar with Imagen opens the image step" below.

## ADDED Requirements

### Requirement: Guardar with Evento does nothing yet
Pressing "Guardar" with "📅 Evento" selected SHALL have no effect yet: the box stays in its choose step with the same selection, and no error occurs.

#### Scenario: Guardar with Evento
- **WHEN** the user selects "📅 Evento" and taps "Guardar"
- **THEN** the box stays in its choose step, the select still reads "📅 Evento", and nothing else happens

### Requirement: Guardar with Imagen opens the image step
Pressing "Guardar" with "📷 Imagen" selected SHALL replace the choose step with the image step in the same place. From top to bottom it SHALL show the title, an "Elegir foto" button, the "Texto alternativo" field with its hint, the "Pie de foto" field, and "Cancelar" and "Crear". The keyboard SHALL NOT open by itself.

#### Scenario: Going to the image step
- **WHEN** the user selects "📷 Imagen" and taps "Guardar"
- **THEN** the box shows "Crear nuevo elemento de imagen:", the "Elegir foto" button, both empty fields, "Cancelar", and "Crear" disabled, with the keyboard closed

### Requirement: Choosing a photo
Pressing "Elegir foto" SHALL open the system photo picker, offering only images and letting the user pick one. The app SHALL NOT ask for any permission first. Picking a photo SHALL return to the image step with that photo's preview shown above the button, and the button SHALL then read "Cambiar foto". Closing the picker without picking SHALL leave the image step as it was, keeping any photo chosen before.

#### Scenario: Picking a photo
- **WHEN** the user taps "Elegir foto" and picks a photo
- **THEN** the image step shows the photo's preview, and the button reads "Cambiar foto"

#### Scenario: Closing the picker
- **WHEN** a photo is already chosen, the user taps "Cambiar foto" and closes the picker without picking
- **THEN** the same photo is still shown, and the alternative text and caption are unchanged

#### Scenario: Replacing the photo
- **WHEN** a photo is chosen, the user taps "Cambiar foto" and picks another photo
- **THEN** the preview shows the new photo, and the typed alternative text and caption are kept

### Requirement: Photo picker failure
If the photo picker cannot be opened or returns an error, the image step SHALL stay as it was and SHALL show the message "⚠️ No se pudo abrir la galería. Inténtalo de nuevo.", announced to screen readers. Pressing the photo button again SHALL retry.

#### Scenario: Picker error
- **WHEN** the user taps "Elegir foto" and the picker fails to open
- **THEN** the message is shown and announced, the step is unchanged, and tapping "Elegir foto" again opens the picker

### Requirement: Photo preview
The preview SHALL show the whole photo, never cropped, spanning the box width at its natural proportions, up to the same maximum height as an image card in the current layout. A taller photo SHALL be centered on the image backdrop color. Screen readers SHALL announce the preview as an image named "Foto elegida".

#### Scenario: Portrait photo
- **WHEN** the user picks a photo taller than the maximum height at the box width
- **THEN** the preview is as tall as the maximum height and shows the whole photo, centered, with the backdrop color on both sides

### Requirement: Alternative text field
The image step SHALL show a multi-line "Texto alternativo" field below the photo button, with the visible label "Texto alternativo" above it and the hint "Describe la foto para quien no pueda verla." below the label. It SHALL look like the text step's text area and accept at most the configured maximum alternative text length, 1000 characters by default. It SHALL be optional.

#### Scenario: Reaching the limit
- **WHEN** the field holds 1000 characters and the user types or pastes more
- **THEN** the text stays at 1000 characters

### Requirement: Caption field
The image step SHALL show a single-line "Pie de foto" field below the alternative text field, with the visible label "Pie de foto" above it. It SHALL be at least 44 points tall, with a 2-point strong-ink border, a 10-point corner radius, the card background and 16-point main-color text. It SHALL accept at most the configured maximum caption length, 500 characters by default. It SHALL be optional.

#### Scenario: Reaching the limit
- **WHEN** the field holds 500 characters and the user types or pastes more
- **THEN** the text stays at 500 characters

### Requirement: Crear is enabled only with a photo
In the image step, "Crear" SHALL be disabled, faded and announced as disabled while no photo is chosen. It SHALL be enabled as soon as a photo is chosen, whatever the alternative text and caption hold.

#### Scenario: No photo yet
- **WHEN** the image step has just opened and the user types an alternative text
- **THEN** "Crear" is still disabled and tapping it does nothing

#### Scenario: Photo chosen with empty fields
- **WHEN** the user picks a photo and leaves both fields empty
- **THEN** "Crear" is enabled

### Requirement: Crear saves the image item
Pressing "Crear" in the image step SHALL save a new image item with the chosen photo, and with the alternative text and caption with leading and trailing whitespace removed. The item SHALL appear as the first card of the Timeline. The creation box and the keyboard SHALL close, and the create button SHALL show again. "Crear" SHALL NOT be pressable again while the save is in progress.

#### Scenario: Creating an image item
- **WHEN** the user picks a photo, types "  Taller de pintura  " as the caption and taps "Crear"
- **THEN** the box closes, the create button reappears, and the first card of the Timeline shows the photo with the caption "Taller de pintura"

#### Scenario: Double tap
- **WHEN** the user taps "Crear" twice quickly in the image step
- **THEN** exactly one new image item is created

### Requirement: Failed image save keeps the draft
If saving the image item fails, the creation box SHALL stay open in its image step with the same photo, alternative text and caption, and SHALL show the message "⚠️ No se pudo guardar. Inténtalo de nuevo.", announced to screen readers. No new card SHALL appear, and "Crear" SHALL remain usable to try again.

#### Scenario: Storage error
- **WHEN** the user taps "Crear" in the image step and the item cannot be saved
- **THEN** the box stays open with the same photo and fields, the error message is shown and announced, no new card appears, and tapping "Crear" again retries

### Requirement: Image step accessibility
In the image step, the photo button SHALL be announced as a button named by its visible text ("Elegir foto" or "Cambiar foto") and be at least 44 points tall. The fields SHALL be announced as text fields named "Texto alternativo" and "Pie de foto", and the alternative text field SHALL also announce its hint.

#### Scenario: Screen reader in the image step
- **WHEN** a screen reader moves through the image step with no photo chosen
- **THEN** it announces the button "Elegir foto", the text field "Texto alternativo" with the hint "Describe la foto para quien no pueda verla.", the text field "Pie de foto", and the buttons "Cancelar" and "Crear" (disabled)
