# item-creation Specification

## Purpose

Lets the user create new timeline items from an inline creation box at the top of the Timeline, choosing the item type first. Text items are created in this version. Event and image items are listed but not yet active.

## Requirements

### Requirement: Creation box opens at the top of the Timeline
When the create button is pressed on Timeline, the app SHALL show the creation box as the first element of the Timeline feed, above every item, in its choose step with no type selected. If the feed is scrolled down, it SHALL scroll to the top so the box is visible.

#### Scenario: Opening the box
- **WHEN** the user taps the create button on Timeline
- **THEN** the creation box appears above the first timeline item, showing "Crear nuevo elemento:", the type select with "Selecciona una opción", and the "Cancelar" and "Guardar" buttons

#### Scenario: Opening while scrolled down
- **WHEN** the user has scrolled the Timeline down and taps the create button
- **THEN** the feed scrolls to the top and the creation box is fully visible below the header

#### Scenario: Opening while scrolled down in landscape
- **WHEN** the user has scrolled the Timeline down in a landscape layout and taps the create button
- **THEN** the feed scrolls to the top and the creation box starts fully visible below the tab bar, not under it

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

### Requirement: Type select shows the chosen type
The choose step SHALL show a type select field that fills the box width, at least 44 points tall, with a 2-point strong-ink border, a 10-point corner radius, the card background and 16-point semibold main-color text. It SHALL read "Selecciona una opción" until a type is chosen, then the chosen option, followed by a down-pointing chevron.

#### Scenario: Initial value
- **WHEN** the creation box opens
- **THEN** the type select reads "Selecciona una opción"

#### Scenario: After choosing
- **WHEN** the user has chosen "📝 Texto"
- **THEN** the type select reads "📝 Texto"

### Requirement: Choosing a type
Tapping the type select SHALL open a list with the options "📅 Evento", "📝 Texto" and "📷 Imagen", in that order, each at least 44 points tall. "Selecciona una opción" SHALL NOT be in the list and SHALL NOT be choosable. Tapping an option SHALL close the list and make that option the selected type.

#### Scenario: Options in the list
- **WHEN** the user taps the type select
- **THEN** a list opens with exactly "📅 Evento", "📝 Texto" and "📷 Imagen", in that order

#### Scenario: Picking an option
- **WHEN** the list is open and the user taps "📷 Imagen"
- **THEN** the list closes and the type select reads "📷 Imagen"

### Requirement: Dismissing the type list
Closing the type list without picking an option, by tapping outside it or pressing the Android back button, SHALL close only the list and keep the previous selection. The creation box SHALL stay open.

#### Scenario: Tapping outside the list
- **WHEN** the type list is open with "📝 Texto" already selected and the user taps outside the list
- **THEN** the list closes, the type select still reads "📝 Texto" and the creation box stays open

#### Scenario: Android back with the list open
- **WHEN** the type list is open and the user presses the Android back button
- **THEN** only the list closes, and the creation box stays open in its choose step

### Requirement: Type select accessibility
The type select SHALL be announced as a button labeled "Crear nuevo elemento", with the current selection or "Selecciona una opción" as its value. Each option in the list SHALL be announced with its visible text and whether it is selected.

#### Scenario: Screen reader on the select
- **WHEN** a screen reader focuses the type select after "📝 Texto" was chosen
- **THEN** it announces a button named "Crear nuevo elemento" with the value "📝 Texto"

### Requirement: Guardar is enabled only after choosing a type
In the choose step, "Guardar" SHALL be disabled while no type is selected: it looks faded, is announced as disabled, and tapping it does nothing. Choosing any of the three types SHALL enable it.

#### Scenario: Nothing chosen
- **WHEN** the creation box has just opened
- **THEN** "Guardar" looks faded, is announced as disabled, and tapping it does nothing

#### Scenario: A type is chosen
- **WHEN** the user chooses "📅 Evento", "📝 Texto" or "📷 Imagen"
- **THEN** "Guardar" shows its enabled style and is announced as enabled

### Requirement: Guardar with Texto opens the text step
Pressing "Guardar" with "📝 Texto" selected SHALL replace the choose step with the text step in the same place. The text area SHALL receive focus and the keyboard SHALL open, ready to type.

#### Scenario: Going to the text step
- **WHEN** the user selects "📝 Texto" and taps "Guardar"
- **THEN** the box shows "Crear nuevo elemento de texto:", an empty text area with focus and the keyboard open, and the "Cancelar" and "Crear" buttons

### Requirement: Text step input
The text step SHALL show a multi-line text area that fills the box width, with a 2-point strong-ink border, a 10-point corner radius, the card background and 16-point main-color text. It SHALL be at least three lines tall, grow with the text up to a maximum height, and then scroll inside. It SHALL accept line breaks.

#### Scenario: Typing several lines
- **WHEN** the user types a text with line breaks that is longer than the maximum height
- **THEN** the text area keeps its maximum height, scrolls inside, and the line breaks are kept

### Requirement: Text length limit
The text area SHALL accept at most the configured maximum text length, which is 8192 characters by default. Further typing or pasting SHALL NOT add characters beyond the limit.

#### Scenario: Reaching the limit
- **WHEN** the text area holds 8192 characters and the user types or pastes more
- **THEN** the text stays at 8192 characters

### Requirement: Crear is enabled only with some text
"Crear" SHALL be disabled, faded and announced as disabled while the text area is empty or holds only whitespace. It SHALL be enabled as soon as the text has a non-whitespace character.

#### Scenario: Only spaces and line breaks
- **WHEN** the text area holds only spaces and line breaks
- **THEN** "Crear" is disabled and tapping it does nothing

#### Scenario: Some text
- **WHEN** the user types "Hola"
- **THEN** "Crear" is enabled

### Requirement: Crear saves the text item
Pressing "Crear" SHALL save the text, with leading and trailing whitespace removed, as a new text item. The item SHALL appear as the first card of the Timeline. The creation box SHALL close, the keyboard SHALL close and the create button SHALL show again. "Crear" SHALL NOT be pressable again while the save is in progress.

#### Scenario: Creating a text
- **WHEN** the user types "  Hoy hemos jugado al parchís.  " and taps "Crear"
- **THEN** the box closes, the keyboard closes, the create button reappears, and the first card of the Timeline reads "Hoy hemos jugado al parchís."

#### Scenario: Double tap
- **WHEN** the user taps "Crear" twice quickly
- **THEN** exactly one new text item is created

### Requirement: Failed save keeps the text
If saving fails, the creation box SHALL stay open in its text step with the typed text unchanged and SHALL show the message "⚠️ No se pudo guardar. Inténtalo de nuevo.", announced to screen readers. "Crear" SHALL remain usable to try again.

#### Scenario: Storage error
- **WHEN** the user taps "Crear" and the item cannot be saved
- **THEN** the box stays open with the same text, the error message is shown and announced, no new card appears, and tapping "Crear" again retries

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

### Requirement: Android back button cancels the visible box
While the creation box is on screen (Timeline shown and box open, with no type list open), pressing the Android back button SHALL behave exactly like "Cancelar". When the box is not on screen, the back button SHALL keep its usual behavior.

#### Scenario: Back while typing
- **WHEN** the text step is on screen with typed text and the user presses the Android back button
- **THEN** the box closes, the text is discarded, the app stays open on Timeline, and the create button reappears

#### Scenario: Back with no box
- **WHEN** the creation box is closed, Timeline is shown and the user presses the Android back button
- **THEN** the app behaves as before this change and leaves the app

#### Scenario: Back from another tab while a draft is pending
- **WHEN** the box is open on Timeline, the user switches to Events and presses the Android back button
- **THEN** the app returns to Timeline as usual, and the box is shown with its draft, not cancelled

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

### Requirement: Creation box buttons
The two buttons at the bottom of each step SHALL share the box width equally, with 10 points between them, and be at least 44 points tall with a 10-point corner radius and 15-point bold labels. "Guardar" and "Crear" SHALL use the primary button style: the active-tab blue background and the on-primary label color. "Cancelar" SHALL use the secondary style: the muted surface background, a 2-point dark border and the main text color. Each SHALL be announced as a button whose label is its visible text.

#### Scenario: Sizes and order
- **WHEN** any step of the box is shown
- **THEN** "Cancelar" is on the left and the main button on the right, each half the width minus the gap, each at least 44 points tall

#### Scenario: Screen reader labels
- **WHEN** a screen reader focuses the buttons of the text step or the image step
- **THEN** they are announced as buttons named "Cancelar" and "Crear"

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
