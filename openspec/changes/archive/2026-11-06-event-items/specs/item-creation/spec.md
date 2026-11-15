# Spec Delta

## MODIFIED Requirements

### Requirement: Creation box appearance
The creation box SHALL have a 2-point dashed border in primary blue, the creation background color, a 16-point corner radius, 16 points of padding and 16 points of space below it. Its title ("Crear nuevo elemento:", "Crear nuevo elemento de texto:", "Crear nuevo elemento de imagen:" or "Crear nuevo elemento de evento:") SHALL be 14-point bold in the main text color.

#### Scenario: Box style in both palettes
- **WHEN** the creation box is open in light or dark mode
- **THEN** it shows a dashed primary-blue border on the creation background of the active palette, and its title is bold main-color text

#### Scenario: Title of the image step
- **WHEN** the image step is shown
- **THEN** the box title reads "Crear nuevo elemento de imagen:"

#### Scenario: Title of the event step
- **WHEN** the event step is shown
- **THEN** the box title reads "Crear nuevo elemento de evento:"

### Requirement: Cancelar discards the creation
Every step SHALL show a "Cancelar" button to the left of "Guardar" or "Crear". Pressing it SHALL close the creation box, discard the selected type, any typed text and any chosen photos, close the keyboard and show the create button again. The next time the box opens, it SHALL start at the choose step with nothing selected.

#### Scenario: Cancelling the text step
- **WHEN** the user has typed text in the text step and taps "Cancelar"
- **THEN** the box closes, no item is created, and the create button reappears

#### Scenario: Cancelling the image step
- **WHEN** the user has chosen a photo and typed a caption in the image step, and taps "Cancelar"
- **THEN** the box closes, no item is created, and the create button reappears

#### Scenario: Cancelling the event step
- **WHEN** the user has chosen three photos and typed a title in the event step, and taps "Cancelar"
- **THEN** the box closes, no item is created, no photo is copied, and the create button reappears

#### Scenario: Reopening after cancelling
- **WHEN** the user cancels and then taps the create button again
- **THEN** the box opens in its choose step showing "Selecciona una opción", and the earlier text and photos are gone

### Requirement: Draft survives tab switches
Switching to Circles or Events while the creation box is open SHALL hide the box without cancelling it. When the user returns to Timeline, the box SHALL show again in the same step, with the same selected type, the same text, in the image step the same photo, alternative text and caption, and in the event step the same photos in the same order, title, category and description. Returning SHALL NOT open the keyboard by itself. The draft SHALL be kept only while the app is running.

#### Scenario: Leaving and returning
- **WHEN** the user has typed "Mañana hay bingo" in the text step, switches to Circles, and then back to Timeline
- **THEN** the text step is shown with "Mañana hay bingo" in the text area, and the keyboard stays closed until the user taps the text area

#### Scenario: Leaving and returning with a photo
- **WHEN** the user has chosen a photo and typed the caption "En el parque" in the image step, switches to Events, and then back to Timeline
- **THEN** the image step is shown with the same photo preview and "En el parque" in the caption field

#### Scenario: Leaving and returning with an event draft
- **WHEN** the user has chosen two photos and typed the title "Viaje a Cádiz" and the category "Familia" in the event step, switches to Circles, and then back to Timeline
- **THEN** the event step is shown with the same two thumbnails in the same order, "Viaje a Cádiz" in the title field and "Familia" in the category field

#### Scenario: App restarted with a draft
- **WHEN** the app is closed completely while a draft is pending and launched again
- **THEN** Timeline shows with the creation box closed

## REMOVED Requirements

### Requirement: Guardar with Evento does nothing yet
**Reason**: "📅 Evento" now opens the event step.
**Migration**: See "Guardar with Evento opens the event step" below.

## ADDED Requirements

### Requirement: Guardar with Evento opens the event step
Pressing "Guardar" with "📅 Evento" selected SHALL replace the choose step with the event step in the same place. From top to bottom it SHALL show the title, an "Elegir fotos" button, the "Título" field, the "Categoría" field with its suggestions, the "Descripción" field, and "Cancelar" and "Crear". The keyboard SHALL NOT open by itself.

#### Scenario: Going to the event step
- **WHEN** the user selects "📅 Evento" and taps "Guardar"
- **THEN** the box shows "Crear nuevo elemento de evento:", the "Elegir fotos" button, the three empty fields, the category suggestions, "Cancelar", and "Crear" disabled, with the keyboard closed

### Requirement: Choosing event photos
Pressing the photo button of the event step SHALL open the system photo picker, offering only images and letting the user pick several at once, without asking for any permission first. The picked photos SHALL be added after any photos already chosen, in the order the picker returns them. Once at least one photo is chosen, the button SHALL read "Añadir fotos". Closing the picker without picking SHALL change nothing.

#### Scenario: Picking three photos
- **WHEN** the user taps "Elegir fotos" and picks three photos
- **THEN** the event step shows three thumbnails, and the button reads "Añadir fotos"

#### Scenario: Adding more photos
- **WHEN** two photos are chosen and the user taps "Añadir fotos" and picks one more
- **THEN** the event step shows three thumbnails, the new one last

#### Scenario: Closing the picker
- **WHEN** two photos are chosen, the user taps "Añadir fotos" and closes the picker without picking
- **THEN** the same two thumbnails are shown and the fields are unchanged

### Requirement: Event photo limit
An event SHALL hold at most the configured maximum number of photos, 10 by default. The picker SHALL let the user pick at most the number of photos still allowed. If more photos arrive, only the first ones up to the limit SHALL be kept. While the limit is reached, the photo button SHALL be disabled and the step SHALL show "Un evento puede tener hasta 10 fotos.", announced to screen readers.

#### Scenario: Reaching the limit
- **WHEN** eight photos are chosen and the user adds four more
- **THEN** the step shows ten thumbnails, the first two of the new photos are kept, the photo button is disabled, and "Un evento puede tener hasta 10 fotos." is shown and announced

#### Scenario: Below the limit again
- **WHEN** ten photos are chosen and the user removes one
- **THEN** the photo button is enabled again and the limit message is no longer shown

### Requirement: Event photo thumbnails
The chosen photos SHALL be shown above the photo button as square thumbnails, cropped to fill their square, in rows that fill the box width, in their order. Screen readers SHALL announce each thumbnail as an image named "Foto N de M", where N is its position and M the number of chosen photos.

#### Scenario: Thumbnails in order
- **WHEN** the user has chosen a portrait photo and then a landscape photo
- **THEN** both are shown as squares of the same size, the portrait first, announced as "Foto 1 de 2" and "Foto 2 de 2"

### Requirement: Removing an event photo
Each thumbnail SHALL have a remove button showing "✕" at its top right corner, at least 44 by 44 points, announced as a button named "Quitar foto N". Pressing it SHALL remove that photo from the draft and keep the others in their order. No confirmation SHALL be asked, since nothing is stored until "Crear".

#### Scenario: Removing the middle photo
- **WHEN** three photos A, B and C are chosen and the user taps "Quitar foto 2"
- **THEN** the step shows A and C, announced as "Foto 1 de 2" and "Foto 2 de 2"

#### Scenario: Removing the only photo
- **WHEN** one photo is chosen and the user removes it
- **THEN** no thumbnail is shown, the button reads "Elegir fotos", and "Crear" is disabled

### Requirement: Event photo picker failure
If the photo picker cannot be opened or returns an error, the event step SHALL stay as it was and SHALL show the message "⚠️ No se pudo abrir la galería. Inténtalo de nuevo.", announced to screen readers. Pressing the photo button again SHALL retry.

#### Scenario: Picker error in the event step
- **WHEN** the user taps "Elegir fotos" and the picker fails to open
- **THEN** the message is shown and announced, the step is unchanged, and tapping "Elegir fotos" again opens the picker

### Requirement: Event title field
The event step SHALL show a single-line "Título" field with the visible label "Título" above it, styled like the image step's caption field. It SHALL accept at most the configured maximum event title length, 120 characters by default. It SHALL be required.

#### Scenario: Reaching the title limit
- **WHEN** the title field holds 120 characters and the user types or pastes more
- **THEN** the text stays at 120 characters

### Requirement: Event category field
The event step SHALL show a single-line "Categoría" field with the visible label "Categoría" above it, styled like the title field. It SHALL accept at most the configured maximum category length, 24 characters by default. It SHALL be required.

#### Scenario: Reaching the category limit
- **WHEN** the category field holds 24 characters and the user types or pastes more
- **THEN** the text stays at 24 characters

### Requirement: Category suggestions
Below the category field, the event step SHALL show the suggestions "Familia", "Amigos", "Trabajo" and "Encuentro" as buttons at least 44 points tall, wrapping onto more lines when they do not fit. Pressing one SHALL replace the category field's content with that word, without opening the keyboard. Each SHALL be announced as a button named by its text.

#### Scenario: Choosing a suggestion
- **WHEN** the category field reads "Amig" and the user taps "Familia"
- **THEN** the category field reads "Familia" and the keyboard does not open

### Requirement: Event description field
The event step SHALL show a multi-line "Descripción" field with the visible label "Descripción" above it, looking like the text step's text area. It SHALL accept at most the configured maximum event description length, 2000 characters by default. It SHALL be optional.

#### Scenario: Reaching the description limit
- **WHEN** the description field holds 2000 characters and the user types or pastes more
- **THEN** the text stays at 2000 characters

### Requirement: Crear is enabled only with photos, a title and a category
In the event step, "Crear" SHALL be enabled only while at least one photo is chosen and the title and the category each hold something other than whitespace. Otherwise it SHALL be disabled, faded and announced as disabled. The description SHALL NOT affect it.

#### Scenario: Photos and title but no category
- **WHEN** the user has chosen a photo and typed a title, and the category is empty
- **THEN** "Crear" is disabled and tapping it does nothing

#### Scenario: Whitespace title
- **WHEN** the user has chosen a photo, typed "   " as the title and "Familia" as the category
- **THEN** "Crear" is disabled

#### Scenario: Everything required present
- **WHEN** the user has chosen a photo, typed a title and chosen a category, and the description is empty
- **THEN** "Crear" is enabled

### Requirement: Crear saves the event item
Pressing "Crear" in the event step SHALL save a new event item with the chosen photos in their order, and with the title, category and description with leading and trailing whitespace removed. The item SHALL appear as the first card of the Timeline. The creation box and the keyboard SHALL close, and the create button SHALL show again. "Crear" SHALL NOT be pressable again while the save is in progress.

#### Scenario: Creating an event item
- **WHEN** the user picks two photos, types "  Tarde de juegos y café  " as the title, taps "Encuentro" and taps "Crear"
- **THEN** the box closes, the create button reappears, and the first card of the Timeline is an event titled "Tarde de juegos y café" with the category "Encuentro" and two photos

#### Scenario: Double tap
- **WHEN** the user taps "Crear" twice quickly in the event step
- **THEN** exactly one new event item is created

### Requirement: Failed event save keeps the draft
If saving the event item fails, the creation box SHALL stay open in its event step with the same photos, title, category and description, and SHALL show the message "⚠️ No se pudo guardar. Inténtalo de nuevo.", announced to screen readers. No new card SHALL appear, and "Crear" SHALL remain usable to try again.

#### Scenario: Storage error on an event
- **WHEN** the user taps "Crear" in the event step and the item cannot be saved
- **THEN** the box stays open with the same photos and fields, the error message is shown and announced, no new card appears, and tapping "Crear" again retries

### Requirement: Event step accessibility
In the event step, the photo button SHALL be announced as a button named by its visible text ("Elegir fotos" or "Añadir fotos") and be at least 44 points tall. The fields SHALL be announced as text fields named "Título", "Categoría" and "Descripción".

#### Scenario: Screen reader in the event step
- **WHEN** a screen reader moves through the event step with one photo chosen
- **THEN** it announces the image "Foto 1 de 1", the button "Quitar foto 1", the button "Añadir fotos", the text field "Título", the text field "Categoría", the buttons "Familia", "Amigos", "Trabajo" and "Encuentro", the text field "Descripción", and the buttons "Cancelar" and "Crear"
