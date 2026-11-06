# item-editing Specification

## Purpose

Lets the user change or delete a text item they shared, from an edit dialog opened with the "Editar" button of its Timeline card, with a confirmation before anything is deleted.

## Requirements

### Requirement: Editar opens the edit dialog
Pressing "Editar" on a text card, an image card or an event card SHALL open the edit dialog for that item over the Timeline, in its edit step, with the fields of the item's type. The rest of the screen SHALL stay visible, dimmed by the overlay color. While the dialog is open, nothing under it SHALL respond to touch or be reachable by a screen reader.

#### Scenario: Opening the dialog
- **WHEN** the user taps "Editar" on the card that reads "Hola abuela"
- **THEN** the edit dialog opens over the dimmed Timeline, with "Hola abuela" in its text area

#### Scenario: Opening the dialog of an image item
- **WHEN** the user taps "Editar" on an image card with the caption "Taller de pintura"
- **THEN** the edit dialog opens over the dimmed Timeline, showing the item's photo and "Taller de pintura" in the caption field

#### Scenario: Opening the dialog of an event item
- **WHEN** the user taps "Editar" on an event card titled "Tarde de juegos y café" with three photos
- **THEN** the edit dialog opens over the dimmed Timeline, showing the three photos as thumbnails and "Tarde de juegos y café" in the title field

#### Scenario: Content below is inactive
- **WHEN** the edit dialog is open and the user taps a footer tab or another card visible around it
- **THEN** nothing happens and the dialog stays open

### Requirement: Edit dialog appearance
The dialog SHALL be a box with the creation background, a 2-point solid primary-blue border, and the corner radius and padding of the current size set (16 points on phones). It SHALL span the current layout's content column, centered: on phones in portrait, the screen width minus 16 points on each side. It SHALL be placed near the top of the screen so it stays visible above the keyboard. Its title, "Editar elemento de texto:" for a text item, "Editar elemento de imagen:" for an image item or "Editar elemento de evento:" for an event item, SHALL be bold, in the main text color, at the size set's box title size (14 points on phones).

#### Scenario: Dialog style in both palettes
- **WHEN** the edit dialog is open in light or dark mode
- **THEN** it shows a solid primary-blue border on the active palette's creation background, and its title is bold main-color text

#### Scenario: Title of the image dialog
- **WHEN** the edit dialog is open for an image item
- **THEN** its title reads "Editar elemento de imagen:"

#### Scenario: Title of the event dialog
- **WHEN** the edit dialog is open for an event item
- **THEN** its title reads "Editar elemento de evento:"

#### Scenario: Keyboard open
- **WHEN** the user taps the text area and the keyboard opens, in any layout except phone landscape
- **THEN** the title, the text area, "Cancelar" and "Guardar" are still visible above the keyboard

#### Scenario: Keyboard open on a phone in landscape
- **WHEN** the user taps the text area in the phone landscape layout
- **THEN** the keyboard may show the system's full-screen editor over the dialog, and after it closes the dialog shows the typed text

#### Scenario: Dialog on a tablet
- **WHEN** the edit dialog is open in the tablet portrait layout
- **THEN** it is 500 points wide and centered horizontally

### Requirement: Edit step contents
The edit step SHALL show, from top to bottom: the title with a close button at its right; the text area; "Cancelar" on the left and "Guardar" on the right; a 1-point divider line; and a full-width "Borrar este texto" button.

#### Scenario: Layout of the edit step
- **WHEN** the edit dialog opens
- **THEN** it shows the title and the close button, the text area, "Cancelar" and "Guardar" side by side, a divider and "Borrar este texto" below them

### Requirement: Edit text area
The text area SHALL start with the item's current text and SHALL NOT open the keyboard by itself. It SHALL look and behave like the creation box text area: card background, a 2-point strong-ink border, a 10-point corner radius, 16-point main-color text, at least three lines tall, growing up to a maximum height and then scrolling inside, keeping line breaks. It SHALL accept at most the configured maximum text length.

#### Scenario: Multi-line text
- **WHEN** the dialog opens for an item whose text has three lines
- **THEN** the text area shows the three lines and the keyboard stays closed until the user taps it

#### Scenario: Reaching the limit
- **WHEN** the text area holds 8192 characters and the user types or pastes more
- **THEN** the text stays at 8192 characters

### Requirement: Guardar is enabled only for a real change
"Guardar" SHALL be disabled, faded and announced as disabled while the text, with leading and trailing whitespace removed, is empty or equal to the item's current text. It SHALL be enabled as soon as the trimmed text is non-empty and differs from the current text.

#### Scenario: Unchanged text
- **WHEN** the dialog has just opened
- **THEN** "Guardar" is disabled

#### Scenario: Only whitespace added
- **WHEN** the item reads "Hola" and the user adds a space and a line break at the end
- **THEN** "Guardar" stays disabled

#### Scenario: Blank text
- **WHEN** the user deletes all the text
- **THEN** "Guardar" is disabled and tapping it does nothing

#### Scenario: Text changed
- **WHEN** the item reads "Hola" and the user changes it to "Hola, abuela"
- **THEN** "Guardar" is enabled

### Requirement: Guardar saves the new text
Pressing "Guardar" SHALL save the text, with leading and trailing whitespace removed, as the item's new text. The dialog and the keyboard SHALL close, and the item's card SHALL show the new text in the same position of the Timeline. "Guardar" SHALL NOT be pressable again while the save is in progress.

#### Scenario: Editing a text
- **WHEN** the second card reads "Mañana hay bingo", the user opens its dialog, changes the text to "  Mañana hay bingo a las 5.  " and taps "Guardar"
- **THEN** the dialog closes and the second card reads "Mañana hay bingo a las 5."

#### Scenario: Double tap
- **WHEN** the user taps "Guardar" twice quickly
- **THEN** the text is saved once

### Requirement: Failed save keeps the edit
If saving fails, the dialog SHALL stay open in its edit step with the edited text unchanged and SHALL show the message "⚠️ No se pudo guardar. Inténtalo de nuevo.", announced to screen readers. The card SHALL keep its previous text, and "Guardar" SHALL remain usable to try again.

#### Scenario: Storage error on save
- **WHEN** the user taps "Guardar" and the change cannot be saved
- **THEN** the dialog stays open with the edited text, the message is shown and announced, the card keeps its old text, and tapping "Guardar" again retries

### Requirement: Closing without changes
The close button and "Cancelar" SHALL close the dialog and the keyboard, discard any edit, and leave the item unchanged. In the edit step, the Android back button SHALL do the same. Tapping outside the dialog SHALL NOT close it. The next time the dialog opens, it SHALL start from the item's stored content.

#### Scenario: Cancelar after editing
- **WHEN** the user changes the text and taps "Cancelar"
- **THEN** the dialog closes and the card keeps its previous text

#### Scenario: Close button
- **WHEN** the user changes the text and taps the close button
- **THEN** the dialog closes and the card keeps its previous text

#### Scenario: Android back in the edit step
- **WHEN** the edit step is shown and the user presses the Android back button
- **THEN** the dialog closes, the item is unchanged, and the app stays on Timeline

#### Scenario: Tapping outside
- **WHEN** the user taps the dimmed area outside the dialog
- **THEN** the dialog stays open with the edited text

#### Scenario: Reopening after cancelling
- **WHEN** the user edits the text, cancels, and taps "Editar" on the same card again
- **THEN** the text area shows the stored text, not the discarded edit

#### Scenario: Cancelling a photo change
- **WHEN** the user picks another photo in an image item's dialog and taps "Cancelar"
- **THEN** the dialog closes and the card still shows the previous photo

#### Scenario: Cancelling photo changes of an event
- **WHEN** the user removes a photo and adds two others in an event item's dialog and taps "Cancelar"
- **THEN** the dialog closes and the card still shows its previous photos in their order

### Requirement: Borrar asks for confirmation
Pressing the deletion button ("Borrar este texto" for a text item, "Borrar esta imagen" for an image item, "Borrar este evento" for an event item) SHALL NOT delete anything. It SHALL replace the dialog's content with the confirmation step: the title "¿Borrar este texto?", "¿Borrar esta imagen?" or "¿Borrar este evento?", the message "Desaparecerá de tu línea de tiempo." in the main text color, the close button, and "No, volver" on the left and "Sí, borrar" on the right. The keyboard SHALL close.

#### Scenario: Asking before deleting
- **WHEN** the user taps "Borrar este texto"
- **THEN** the dialog shows "¿Borrar este texto?", "Desaparecerá de tu línea de tiempo.", "No, volver" and "Sí, borrar", and the card is still on the Timeline

#### Scenario: Asking before deleting an image
- **WHEN** the user taps "Borrar esta imagen"
- **THEN** the dialog shows "¿Borrar esta imagen?", "Desaparecerá de tu línea de tiempo.", "No, volver" and "Sí, borrar", and the card is still on the Timeline

#### Scenario: Asking before deleting an event
- **WHEN** the user taps "Borrar este evento"
- **THEN** the dialog shows "¿Borrar este evento?", "Desaparecerá de tu línea de tiempo.", "No, volver" and "Sí, borrar", and the card is still on the Timeline

### Requirement: Going back from the confirmation
"No, volver" and the Android back button SHALL return from the confirmation step to the edit step, with every field holding the same content as before, including unsaved edits, a newly picked photo, and photos added or removed in an event's dialog. The close button SHALL close the dialog without changes.

#### Scenario: No, volver keeps the edit
- **WHEN** the user has changed the text, taps "Borrar este texto" and then "No, volver"
- **THEN** the edit step is shown with the changed text, and nothing is deleted

#### Scenario: No, volver keeps an event's photo changes
- **WHEN** the user has removed one of three photos in an event's dialog, taps "Borrar este evento" and then "No, volver"
- **THEN** the edit step shows the two remaining photos, and nothing is deleted

#### Scenario: Android back in the confirmation step
- **WHEN** the confirmation step is shown and the user presses the Android back button
- **THEN** the edit step is shown again and nothing is deleted

#### Scenario: Close button in the confirmation step
- **WHEN** the confirmation step is shown and the user taps the close button
- **THEN** the dialog closes and the item stays on the Timeline unchanged

### Requirement: Sí, borrar deletes the item
Pressing "Sí, borrar" SHALL delete the item, close the dialog and remove its card from the Timeline right away. Unsaved edits are discarded. "Sí, borrar" SHALL NOT be pressable again while the deletion is in progress. When the deleted item was the only one, the Timeline SHALL show its empty message.

#### Scenario: Deleting a text
- **WHEN** the Timeline shows "Dos" and "Uno", and the user deletes "Dos" with "Borrar este texto" and "Sí, borrar"
- **THEN** the dialog closes and the Timeline shows only "Uno"

#### Scenario: Deleting the last item
- **WHEN** the Timeline has one item and the user deletes it
- **THEN** the Timeline shows "Sin publicaciones todavía. Pulsa en el botón + para crear una."

### Requirement: Failed deletion keeps the item
If the deletion fails, the dialog SHALL stay in its confirmation step and show the message "⚠️ No se pudo borrar. Inténtalo de nuevo.", announced to screen readers. The card SHALL stay on the Timeline, and "Sí, borrar" SHALL remain usable to try again.

#### Scenario: Storage error on delete
- **WHEN** the user taps "Sí, borrar" and the item cannot be deleted
- **THEN** the confirmation step stays with the message shown and announced, the card is still on the Timeline, and tapping "Sí, borrar" again retries

### Requirement: Edit dialog buttons
Paired buttons ("Cancelar" with "Guardar", "No, volver" with "Sí, borrar") SHALL share the dialog width equally, 10 points apart, with the first one on the left. Every dialog button SHALL be at least 44 points tall with a 10-point corner radius and a 15-point bold label. "Guardar" SHALL use the primary style, and "Cancelar" and "No, volver" the secondary style, as in the creation box. The deletion button SHALL span the full width.

#### Scenario: Sizes and order
- **WHEN** the edit step is shown
- **THEN** "Cancelar" is on the left and "Guardar" on the right, each half the width minus the gap and at least 44 points tall, and "Borrar este texto" spans the full width below them

### Requirement: Deletion button styles
"Borrar este texto", "Borrar esta imagen" and "Borrar este evento" SHALL use the muted surface background, a 2-point danger border and a danger-colored label. "Sí, borrar" SHALL use the danger background and the on-danger label color.

#### Scenario: Deletion buttons stand out
- **WHEN** the edit step or the confirmation step is shown in either mode
- **THEN** the deletion button has a danger border and label, and "Sí, borrar" has a danger background, each at least 44 points tall

### Requirement: Close button
The close button SHALL show "✕" in the main text color, with a touch target of at least 44×44 points, and SHALL be announced as a button named "Cerrar".

#### Scenario: Close button size and label
- **WHEN** the dialog is shown in either step
- **THEN** the close button is at least 44×44 points and a screen reader announces it as a button named "Cerrar"

### Requirement: Edit dialog accessibility
Every control in the dialog SHALL be announced as a button or field named by its visible text. The text item's text area SHALL be named "Editar elemento de texto". When the dialog opens or changes step, the screen reader focus SHALL stay inside the dialog.

#### Scenario: Screen reader names
- **WHEN** a screen reader moves through the edit step
- **THEN** it announces "Cerrar", the text field "Editar elemento de texto", and the buttons "Cancelar", "Guardar" and "Borrar este texto"

#### Scenario: Screen reader names in the image dialog
- **WHEN** a screen reader moves through the edit step of an image item
- **THEN** it announces "Cerrar", the photo as an image, the button "Cambiar foto", the text field "Texto alternativo" with its hint, the text field "Pie de foto", and the buttons "Cancelar", "Guardar" and "Borrar esta imagen"

#### Scenario: Screen reader names in the event dialog
- **WHEN** a screen reader moves through the edit step of an event item with two photos
- **THEN** it announces "Cerrar", the images "Foto 1 de 2" and "Foto 2 de 2" each followed by its button "Quitar foto 1" or "Quitar foto 2", the button "Añadir fotos", the text fields "Título" and "Categoría", the four category suggestion buttons, the text field "Descripción", and the buttons "Cancelar", "Guardar" and "Borrar este evento"

#### Scenario: Confirmation step names
- **WHEN** a screen reader moves through the confirmation step
- **THEN** it reads "¿Borrar este texto?", "Desaparecerá de tu línea de tiempo.", and the buttons "Cerrar", "No, volver" and "Sí, borrar"

### Requirement: Image edit step contents
For an image item, the edit step SHALL show, from top to bottom: the title with the close button at its right; the photo preview; a "Cambiar foto" button; the "Texto alternativo" field with its label and hint; the "Pie de foto" field with its label; "Cancelar" on the left and "Guardar" on the right; a 1-point divider line; and a full-width "Borrar esta imagen" button.

#### Scenario: Layout of the image edit step
- **WHEN** the edit dialog opens for an image item
- **THEN** it shows the title and the close button, the photo, "Cambiar foto", both fields, "Cancelar" and "Guardar" side by side, a divider and "Borrar esta imagen" below them

### Requirement: Image edit fields start from the stored item
The image dialog SHALL start with the item's stored photo, alternative text and caption, and SHALL NOT open the keyboard by itself. Its fields SHALL look and behave like those of the creation box's image step, with the same length limits, and the preview SHALL follow the same sizing rules.

#### Scenario: Prefilled fields
- **WHEN** the dialog opens for an image item with the alternative text "Cuatro personas pintando" and an empty caption
- **THEN** the photo is shown, the alternative text field holds "Cuatro personas pintando", the caption field is empty, and the keyboard is closed

### Requirement: Changing the photo of an image item
Pressing "Cambiar foto" in the dialog SHALL open the system photo picker, offering only images. Picking a photo SHALL show it in the dialog's preview, keeping the other fields. Closing the picker without picking SHALL leave the dialog as it was. If the picker fails, the dialog SHALL show "⚠️ No se pudo abrir la galería. Inténtalo de nuevo.", announced to screen readers. The card SHALL NOT change until "Guardar" is pressed.

#### Scenario: Picking a new photo
- **WHEN** the user taps "Cambiar foto" and picks another photo
- **THEN** the dialog shows the new photo, the fields keep their content, and the card still shows the old photo

#### Scenario: Picker error in the dialog
- **WHEN** the user taps "Cambiar foto" and the picker fails to open
- **THEN** the dialog stays as it was and shows the message, announced to screen readers

### Requirement: Guardar for an image item is enabled only for a real change
For an image item, "Guardar" SHALL be enabled only while at least one of these differs from the stored item: the photo (a new one was picked), the alternative text with leading and trailing whitespace removed, or the caption with leading and trailing whitespace removed. Clearing a field that had content SHALL count as a change. Otherwise it SHALL be disabled, faded and announced as disabled.

#### Scenario: Unchanged
- **WHEN** the image dialog has just opened
- **THEN** "Guardar" is disabled

#### Scenario: Only whitespace added
- **WHEN** the caption reads "Taller" and the user adds spaces at its end
- **THEN** "Guardar" stays disabled

#### Scenario: Caption cleared
- **WHEN** the caption reads "Taller" and the user deletes it
- **THEN** "Guardar" is enabled

#### Scenario: New photo picked
- **WHEN** the user picks a new photo and changes nothing else
- **THEN** "Guardar" is enabled

### Requirement: Guardar saves the image item
Pressing "Guardar" in the image dialog SHALL save the photo, the trimmed alternative text and the trimmed caption as the item's new content. The dialog and the keyboard SHALL close, and the item's card SHALL show the new content in the same position of the Timeline. "Guardar" SHALL NOT be pressable again while the save is in progress.

#### Scenario: Editing the caption and the photo
- **WHEN** the second card is an image item, the user opens its dialog, picks another photo, changes the caption to "  Taller de cerámica  " and taps "Guardar"
- **THEN** the dialog closes and the second card shows the new photo with the caption "Taller de cerámica"

#### Scenario: Double tap
- **WHEN** the user taps "Guardar" twice quickly in the image dialog
- **THEN** the change is saved once

### Requirement: Failed image save keeps the edit
If saving the image item fails, the dialog SHALL stay open in its edit step with the picked photo and the edited fields unchanged, and SHALL show the message "⚠️ No se pudo guardar. Inténtalo de nuevo.", announced to screen readers. The card SHALL keep its previous content, and "Guardar" SHALL remain usable to try again.

#### Scenario: Storage error on an image save
- **WHEN** the user taps "Guardar" in the image dialog and the change cannot be saved
- **THEN** the dialog stays open with the same photo and fields, the message is shown and announced, the card keeps its old content, and tapping "Guardar" again retries

### Requirement: Image dialog scrolls inside
When the image dialog is taller than the space between the top and bottom of the screen, its content SHALL scroll inside the dialog, so that every control can be reached in every layout, including phone landscape, with or without the keyboard open.

#### Scenario: Phone landscape
- **WHEN** the image dialog is open in the phone landscape layout
- **THEN** the user can scroll inside the dialog to reach "Guardar" and "Borrar esta imagen"

### Requirement: Event edit step contents
For an event item, the edit step SHALL show, from top to bottom: the title with the close button at its right; the photo thumbnails; an "Añadir fotos" button; the "Título" field; the "Categoría" field with its suggestions; the "Descripción" field; "Cancelar" on the left and "Guardar" on the right; a 1-point divider line; and a full-width "Borrar este evento" button.

#### Scenario: Layout of the event edit step
- **WHEN** the edit dialog opens for an event item
- **THEN** it shows the title and the close button, the thumbnails, "Añadir fotos", the three fields with the suggestions, "Cancelar" and "Guardar" side by side, a divider and "Borrar este evento" below them

### Requirement: Event edit fields start from the stored item
The event dialog SHALL start with the item's stored photos in their order, title, category and description, and SHALL NOT open the keyboard by itself. Its thumbnails, fields, suggestions, length limits and photo limit SHALL look and behave like those of the creation box's event step.

#### Scenario: Prefilled fields
- **WHEN** the dialog opens for an event item with two photos, the title "Viaje a Cádiz", the category "Familia" and no description
- **THEN** two thumbnails are shown in the stored order, the title and category fields hold "Viaje a Cádiz" and "Familia", the description field is empty, and the keyboard is closed

### Requirement: Changing the photos of an event item
In the event dialog, the user SHALL be able to remove any photo with its "Quitar foto N" button and add photos with "Añadir fotos", which opens the system photo picker with multiple selection and adds the picked photos at the end, up to the photo limit. Closing the picker without picking SHALL change nothing. If the picker fails, the dialog SHALL show "⚠️ No se pudo abrir la galería. Inténtalo de nuevo.", announced to screen readers. The card SHALL NOT change until "Guardar" is pressed.

#### Scenario: Removing and adding photos
- **WHEN** an event has photos A, B and C, and the user removes B and adds D
- **THEN** the dialog shows A, C and D in that order, and the card still shows A, B and C

#### Scenario: Removing every photo
- **WHEN** the user removes every photo of an event in the dialog
- **THEN** no thumbnail is shown, the button reads "Elegir fotos", and "Guardar" is disabled

#### Scenario: Picker error in the event dialog
- **WHEN** the user taps "Añadir fotos" and the picker fails to open
- **THEN** the dialog stays as it was and shows the message, announced to screen readers

### Requirement: Guardar for an event item is enabled only for a valid real change
For an event item, "Guardar" SHALL be enabled only while the dialog holds at least one photo, a title and a category that are not only whitespace, and at least one of these differs from the stored item: the photos or their order, or the title, category or description with leading and trailing whitespace removed. Clearing the description SHALL count as a change. Otherwise it SHALL be disabled, faded and announced as disabled.

#### Scenario: Unchanged
- **WHEN** the event dialog has just opened
- **THEN** "Guardar" is disabled

#### Scenario: Only whitespace added
- **WHEN** the title reads "Viaje a Cádiz" and the user adds spaces at its end
- **THEN** "Guardar" stays disabled

#### Scenario: Photo removed
- **WHEN** an event has three photos and the user removes one and changes nothing else
- **THEN** "Guardar" is enabled

#### Scenario: Title cleared
- **WHEN** the user deletes the whole title
- **THEN** "Guardar" is disabled

#### Scenario: Description cleared
- **WHEN** the description reads "Lo pasamos genial" and the user deletes it
- **THEN** "Guardar" is enabled

### Requirement: Guardar saves the event item
Pressing "Guardar" in the event dialog SHALL save the photos in their order and the trimmed title, category and description as the item's new content. The dialog and the keyboard SHALL close, and the item's card SHALL show the new content in the same position of the Timeline. "Guardar" SHALL NOT be pressable again while the save is in progress.

#### Scenario: Editing the title and the photos
- **WHEN** the second card is an event, the user opens its dialog, removes its first photo, changes the title to "  Viaje a Cádiz y Jerez  " and taps "Guardar"
- **THEN** the dialog closes and the second card shows the title "Viaje a Cádiz y Jerez" and the remaining photos

#### Scenario: Double tap
- **WHEN** the user taps "Guardar" twice quickly in the event dialog
- **THEN** the change is saved once

### Requirement: Failed event save keeps the edit
If saving the event item fails, the dialog SHALL stay open in its edit step with the photos and the edited fields unchanged, and SHALL show the message "⚠️ No se pudo guardar. Inténtalo de nuevo.", announced to screen readers. The card SHALL keep its previous content, and "Guardar" SHALL remain usable to try again.

#### Scenario: Storage error on an event save
- **WHEN** the user taps "Guardar" in the event dialog and the change cannot be saved
- **THEN** the dialog stays open with the same photos and fields, the message is shown and announced, the card keeps its old content, and tapping "Guardar" again retries

### Requirement: Event dialog scrolls inside
When the event dialog is taller than the space between the top and bottom of the screen, its content SHALL scroll inside the dialog, so that every control can be reached in every layout, including phone landscape, with or without the keyboard open.

#### Scenario: Event dialog in phone landscape
- **WHEN** the event dialog with ten photos is open in the phone landscape layout
- **THEN** the user can scroll inside the dialog to reach "Guardar" and "Borrar este evento"
